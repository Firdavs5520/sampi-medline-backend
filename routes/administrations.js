import express from "express";
import mongoose from "mongoose";
import Administration from "../models/Administration.js";
import AdministrationOrder from "../models/AdministrationOrder.js";
import Medicine from "../models/Medicine.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ NURSE — BULK ORDER (ATOMIC, 1 BEMOR = 1 CHEK) */
/* ================================================= */
router.post("/bulk", auth, allowRoles("nurse", "lor"), async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { patientName, items } = req.body;

    if (!patientName || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Noto‘g‘ri ma’lumot" });
    }

    const performedBy = {
      user: req.user.id,
      role: req.user.role,
    };

    session.startTransaction();

    let total = 0;
    const logs = [];

    for (const i of items) {
      const price = Number(i.price);
      const qty = Number(i.quantity || 1);

      if (isNaN(price) || isNaN(qty)) {
        throw new Error("Narx yoki miqdor noto‘g‘ri");
      }

      total += price * qty;

      // 🔒 LOR dori ishlata olmaydi
      if (req.user.role === "lor" && i.type === "medicine") {
        throw new Error("LOR dori ishlata olmaydi");
      }

      // 🔥 OMBOR TEKSHIRUV
      if (i.type === "medicine") {
        const updated = await Medicine.findOneAndUpdate(
          { _id: i._id, quantity: { $gte: qty } },
          { $inc: { quantity: -qty } },
          { session, new: true },
        );

        if (!updated) {
          throw new Error(`Omborda yetarli emas: ${i.name}`);
        }
      }

      logs.push({
        patientName,
        type: i.type,
        name: i.name,
        quantity: qty,
        price,
        performedBy,
        date: new Date(),
      });
    }

    await Administration.insertMany(logs, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      total,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      message: error.message || "Xatolik",
    });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — LOGS */
/* ================================================= */
router.get("/logs", auth, allowRoles("manager"), async (_req, res) => {
  try {
    const logs = await Administration.find()
      .populate("nurseId", "name role")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json(logs);
  } catch {
    res.status(500).json({
      message: "Ombor harakatini olishda xatolik",
    });
  }
});

/* ================================================= */
/* 🧾 PUBLIC — CHEK (AUTH YO‘Q) */
/* ================================================= */
router.get("/public/orders/:id", async (req, res) => {
  try {
    const order = await AdministrationOrder.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({ message: "Chek topilmadi" });
    }

    res.json(order);
  } catch (error) {
    console.error("PUBLIC ORDER ERROR:", error);
    res.status(500).json({ message: "Chekni olishda xatolik" });
  }
});

export default router;
