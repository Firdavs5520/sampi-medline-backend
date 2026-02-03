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
    /* 1️⃣ ITEMS + JAMI */
    /* ===================== */
    let total = 0;

    const orderItems = items.map((i) => {
      const qty = i.type === "medicine" ? Number(i.quantity || 1) : 1;
      total += Number(i.price) * qty;

      return {
        type: i.type,
        name: i.name,
        quantity: qty,
        price: Number(i.price),
        medicineId: i.type === "medicine" ? i._id : null,
        serviceId: i.type === "service" ? i.serviceId : null,
      };
    });

    /* ===================== */
    /* 2️⃣ OMBOR TEKSHIRISH + AYIRISH */
    /* ===================== */
    for (const i of orderItems) {
      if (i.type !== "medicine") continue;

      const med = await Medicine.findOne(
        {
          _id: i.medicineId,
          quantity: { $gte: i.quantity },
        },
        null,
        { session },
      );

      if (!med) {
        throw new Error(`Omborda yetarli emas: ${i.name}`);
      }

      await Medicine.updateOne(
        { _id: i.medicineId },
        { $inc: { quantity: -i.quantity } },
        { session },
      );
    }

    /* ===================== */
    /* 3️⃣ ORDER (CHEK) */
    /* ===================== */
    const [order] = await AdministrationOrder.create(
      [
        {
          patientName,
          nurseId,
          items: orderItems,
          total,
          date: new Date(),
        },
      ],
      { session },
    );

    /* ===================== */
    /* 4️⃣ LOGS */
    /* ===================== */
    const logs = orderItems.map((i) => ({
      patientName,
      type: i.type,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      nurseId,
      date: new Date(),
    }));

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
/* 🧾 PUBLIC — CHEK UCHUN ORDER (AUTH YO‘Q) */
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

export default router;
