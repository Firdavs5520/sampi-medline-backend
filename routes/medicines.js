import express from "express";
import mongoose from "mongoose";
import Medicine from "../models/Medicine.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { addToTelegramBatch } from "../utils/telegramBatch.js";

const router = express.Router();

/* ================================================= */
/* 🚚 DELIVERY — BULK (ATOMIC QILINDI) */
/* ================================================= */
router.post("/delivery", auth, allowRoles("delivery"), async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let items = [];

    if (Array.isArray(req.body.items)) {
      items = req.body.items;
    } else if (req.body.medicineId && req.body.quantity) {
      items = [
        { medicineId: req.body.medicineId, quantity: req.body.quantity },
      ];
    } else {
      return res
        .status(400)
        .json({ message: "Delivery maʼlumotlari noto‘g‘ri" });
    }

    session.startTransaction();

    const logs = [];
    const telegramMsgs = [];

    for (const { medicineId, quantity } of items) {
      const qty = Number(quantity);
      if (!medicineId || qty <= 0) continue;

      await Medicine.updateOne(
        { _id: medicineId },
        {
          $inc: { quantity: qty },
          $set: {
            lastDeliveredBy: req.user.id,
            lastDeliveredAt: new Date(),
          },
        },
        { session },
      );

      logs.push({
        medicine: medicineId,
        quantity: qty,
        deliveredBy: req.user.id,
      });

      telegramMsgs.push(
        `💊 <b>Medicine ID:</b> ${medicineId}\n` +
          `➕ Qo‘shildi: <b>${qty}</b> dona`,
      );
    }

    if (!logs.length) {
      throw new Error("Yaroqli delivery topilmadi");
    }

    await DeliveryLog.insertMany(logs, { session });

    await session.commitTransaction();
    session.endSession();

    telegramMsgs.forEach(addToTelegramBatch);

    res.json({
      message: "Dorilar muvaffaqiyatli omborga qo‘shildi",
      modified: logs.length,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    console.error("DELIVERY ERROR:", e);
    res.status(500).json({ message: e.message || "Delivery xatoligi" });
  }
});

/* ================================================= */
/* 🚚 DELIVERY — DORI RO‘YXATI */
/* ================================================= */
router.get("/for-delivery", auth, allowRoles("delivery"), async (_req, res) => {
  try {
    const medicines = await Medicine.find()
      .select("name quantity minLevel")
      .sort({ name: 1 })
      .lean();

    res.json(medicines);
  } catch {
    res.status(500).json({ message: "Dorilarni olishda xatolik" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — DORI ISHLATISH (YANADA XAVFSIZ) */
/* ================================================= */
router.post("/use/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const qty = Number(req.body.quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Miqdor noto‘g‘ri" });
    }

    const updated = await Medicine.findOneAndUpdate(
      {
        _id: req.params.id,
        quantity: { $gte: qty },
      },
      { $inc: { quantity: -qty } },
      { new: true },
    );

    if (!updated) {
      return res
        .status(400)
        .json({ message: "Dori yetarli emas yoki topilmadi" });
    }

    res.json({
      message: "Dori ishlatildi",
      medicine: updated,
    });
  } catch {
    res.status(500).json({ message: "Dori ishlatishda xatolik" });
  }
});

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA DORILAR (KO‘RISH) */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  const meds = await Medicine.find().sort({ updatedAt: -1 }).lean();
  res.json(meds);
});

/* ================================================= */
/* 👨‍💼 MANAGER — KAM QOLGAN DORILAR */
/* ================================================= */
router.get("/alerts", auth, allowRoles("manager"), async (_req, res) => {
  const alerts = await Medicine.find({
    $expr: { $lte: ["$quantity", "$minLevel"] },
  })
    .sort({ quantity: 1 })
    .lean();

  res.json(alerts);
});

export default router;
