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
router.post("/bulk", auth, allowRoles("nurse"), async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { patientName, items } = req.body;

    if (!patientName || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Noto‘g‘ri ma’lumot" });
    }

    const nurseId = req.user.id;

    session.startTransaction();

    /* ===================== */
    /* 1️⃣ JAMI HISOB */
    /* ===================== */
    let total = 0;
    for (const i of items) {
      total += i.price * (i.quantity || 1);
    }

    /* ===================== */
    /* 2️⃣ ORDER (CHEK) */
    /* ===================== */
    const [order] = await AdministrationOrder.create(
      [
        {
          patientName,
          nurseId,
          items: items.map((i) => ({
            type: i.type,
            name: i.name,
            quantity: i.type === "medicine" ? Number(i.quantity || 1) : 1,
            price: Number(i.price),
            medicineId: i.type === "medicine" ? i._id : null,
            serviceId: i.type === "service" ? i.serviceId : null,
          })),
          total,
          date: new Date(),
        },
      ],
      { session },
    );

    /* ===================== */
    /* 3️⃣ LOG + OMBOR */
    /* ===================== */
    const logs = [];

    for (const i of items) {
      const qty = i.type === "medicine" ? Number(i.quantity || 1) : 1;

      // LOG
      logs.push({
        patientName,
        type: i.type,
        name: i.name,
        quantity: qty,
        price: Number(i.price),
        nurseId,
        date: new Date(),
      });

      // OMBOR (HAVFSIZ TEKSHIRISH)
      if (i.type === "medicine" && i._id) {
        const updated = await Medicine.findOneAndUpdate(
          { _id: i._id, quantity: { $gte: qty } },
          { $inc: { quantity: -qty } },
          { session },
        );

        if (!updated) {
          throw new Error(`Omborda yetarli emas: ${i.name}`);
        }
      }
    }

    await Administration.insertMany(logs, { session });

    /* ===================== */
    /* ✅ COMMIT */
    /* ===================== */
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      orderId: order._id,
      total,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("ADMINISTRATION BULK ERROR:", error.message);

    res.status(400).json({
      message: error.message || "Bulk order saqlashda xatolik",
    });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — LOGS (ESKI ISHLAYVERADI) */
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

export default router;
