import express from "express";
import mongoose from "mongoose";
import Usage from "../models/Usage.js";
import Service from "../models/Service.js";
import Medicine from "../models/Medicine.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { patientName, items } = req.body;
    const role = req.user.role;

    if (!["nurse", "lor"].includes(role)) throw new Error("Ruxsat yo‘q");

    if (!patientName || typeof patientName !== "string")
      throw new Error("Bemor nomi noto‘g‘ri");

    if (!Array.isArray(items) || items.length === 0)
      throw new Error("Itemlar yo‘q");

    if (items.length > 50) throw new Error("Itemlar soni juda ko‘p");

    /* ========================= */
    /* 🔥 DUPLICATE MERGE */
    /* ========================= */

    const mergedMap = new Map();

    for (const i of items) {
      if (!i.type || !i.itemId || !i.quantity)
        throw new Error("Item noto‘g‘ri");

      if (i.quantity <= 0 || i.quantity > 1000)
        throw new Error("Miqdor noto‘g‘ri");

      const key = `${i.type}_${i.itemId}`;

      if (mergedMap.has(key)) {
        mergedMap.get(key).quantity += i.quantity;
      } else {
        mergedMap.set(key, {
          type: i.type,
          itemId: i.itemId,
          quantity: i.quantity,
        });
      }
    }

    const mergedItems = Array.from(mergedMap.values());

    /* ========================= */
    /* 🔍 TEKSHIRISH */
    /* ========================= */

    for (const i of mergedItems) {
      if (role === "lor" && i.type === "Medicine")
        throw new Error("LOR dori ishlata olmaydi");

      if (i.type === "Medicine") {
        const med = await Medicine.findById(i.itemId).session(session);
        if (!med) throw new Error("Dori topilmadi");

        if (med.quantity < i.quantity)
          throw new Error(`Dori yetarli emas: ${med.name}`);
      }

      if (i.type === "Service") {
        const srv = await Service.findById(i.itemId).session(session);
        if (!srv) throw new Error("Service topilmadi");
      }
    }

    /* ========================= */
    /* 💊 KAMAYTIRISH + HISOB */
    /* ========================= */

    const processed = [];
    let totalAmount = 0;

    for (const i of mergedItems) {
      let price;

      if (i.type === "Medicine") {
        const updated = await Medicine.findByIdAndUpdate(
          i.itemId,
          { $inc: { quantity: -i.quantity } },
          { new: true, session },
        );
        price = updated.price;
      } else {
        const srv = await Service.findById(i.itemId).session(session);
        price = srv.price;
      }

      const total = price * i.quantity;
      totalAmount += total;

      processed.push({
        type: i.type,
        item: i.itemId,
        quantity: i.quantity,
        priceAtTime: price,
        total,
      });
    }

    /* ========================= */
    /* 🧾 CHEK YARATISH */
    /* ========================= */

    const [usage] = await Usage.create(
      [
        {
          patientName: patientName.trim(),
          items: processed,
          totalAmount,
          usedBy: {
            role,
            user: req.user._id,
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(usage);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: e.message });
  }
});

export default router;
