import express from "express";
import Medicine from "../models/Medicine.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { addToTelegramBatch } from "../utils/telegramBatch.js";

const router = express.Router();

/* ================================================= */
/* 🚚 DELIVERY — BULK (Juda tez) */
/* ================================================= */
router.post("/delivery", auth, allowRoles("delivery"), async (req, res) => {
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

    const ops = [];
    const logs = [];
    const telegramMsgs = [];

    for (const { medicineId, quantity } of items) {
      const qty = Number(quantity);
      if (!medicineId || qty <= 0) continue;

      ops.push({
        updateOne: {
          filter: { _id: medicineId },
          update: {
            $inc: { quantity: qty },
            $set: {
              lastDeliveredBy: req.user.id,
              lastDeliveredAt: new Date(),
            },
          },
        },
      });

      logs.push({
        medicine: medicineId,
        quantity: qty,
        deliveredBy: req.user.id,
      });
    }

    if (!ops.length) {
      return res.status(400).json({ message: "Yaroqli delivery topilmadi" });
    }

    /* ⚡ BIR YO‘LA */
    const result = await Medicine.bulkWrite(ops);

    await DeliveryLog.insertMany(logs);

    /* 📩 TELEGRAM */
    for (const log of logs) {
      telegramMsgs.push(
        `💊 <b>Medicine ID:</b> ${log.medicine}\n` +
          `➕ Qo‘shildi: <b>${log.quantity}</b> dona`,
      );
    }
    telegramMsgs.forEach(addToTelegramBatch);

    res.json({
      message: "Dorilar muvaffaqiyatli omborga qo‘shildi",
      modified: result.modifiedCount,
    });
  } catch (e) {
    console.error("DELIVERY ERROR:", e);
    res.status(500).json({ message: "Delivery xatoligi" });
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
  } catch (e) {
    res.status(500).json({ message: "Dorilarni olishda xatolik" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — DORI ISHLATISH (ATOMIC) */
/* ================================================= */
router.post("/use/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const qty = Number(req.body.quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Miqdor noto‘g‘ri" });
    }

    const updated = await Medicine.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: qty } },
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
  } catch (e) {
    res.status(500).json({ message: "Dori ishlatishda xatolik" });
  }
});

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA DORILAR */
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
