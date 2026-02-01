import express from "express";
import Medicine from "../models/Medicine.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { sendTelegram } from "../utils/telegram.js";

const router = express.Router();

/* ================================================= */
/* 🚚 DELIVERY — BIR NECHTA DORI (BATCH) */
/* ================================================= */
router.post("/delivery", auth, allowRoles("delivery"), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Dorilar ro‘yxati noto‘g‘ri",
      });
    }

    let telegramMessage = `🚚 <b>OMBORGA DORI KELDI</b>\n\n`;

    for (const item of items) {
      const { medicineId, quantity } = item;

      if (!medicineId || !quantity || quantity <= 0) continue;

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) continue;

      // ➕ OMBORGA QO‘SHISH
      medicine.quantity += Number(quantity);
      medicine.lastDeliveredBy = req.user.id;
      medicine.lastDeliveredAt = new Date();
      await medicine.save();

      // 🧾 DELIVERY LOG
      await DeliveryLog.create({
        medicine: medicine._id,
        quantity: Number(quantity),
        deliveredBy: req.user.id,
      });

      // 🧩 TELEGRAMGA QO‘SHIB BORISH
      telegramMessage +=
        `💊 <b>${medicine.name}</b>\n` +
        `➕ Qo‘shildi: <b>${quantity}</b> dona\n` +
        `📦 Hozir omborda: <b>${medicine.quantity}</b> dona\n\n`;
    }

    telegramMessage += `🕒 ${new Date().toLocaleString()}`;

    // 📩 TELEGRAMGA FAQAT 1 MARTA
    await sendTelegram(telegramMessage);

    res.json({
      message: "Dorilar muvaffaqiyatli omborga qo‘shildi",
    });
  } catch (e) {
    console.error("DELIVERY ERROR:", e);
    res.status(500).json({
      message: "Delivery xatoligi",
    });
  }
});

/* ================================================= */
/* 🚚 DELIVERY — DORI RO‘YXATI (TANLASH UCHUN) */
/* ================================================= */
router.get("/for-delivery", auth, allowRoles("delivery"), async (_req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (e) {
    console.error("FOR DELIVERY ERROR:", e);
    res.status(500).json({
      message: "Dorilarni olishda xatolik",
    });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — DORI ISHLATISH */
/* ================================================= */
router.post("/use/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Miqdor noto‘g‘ri",
      });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        message: "Dori topilmadi",
      });
    }

    if (medicine.quantity < quantity) {
      return res.status(400).json({
        message: "Dori yetarli emas",
      });
    }

    medicine.quantity -= Number(quantity);
    await medicine.save();

    res.json({
      message: "Dori ishlatildi",
      medicine,
    });
  } catch (e) {
    console.error("USE ERROR:", e);
    res.status(500).json({
      message: "Dori ishlatishda xatolik",
    });
  }
});

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA DORILARNI KO‘RISH */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  try {
    const meds = await Medicine.find().sort({ updatedAt: -1 });
    res.json(meds);
  } catch (e) {
    res.status(500).json({
      message: "Dorilarni olishda xatolik",
    });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — KAM QOLGAN DORILAR */
/* ================================================= */
router.get("/alerts", auth, allowRoles("manager"), async (_req, res) => {
  try {
    const alerts = await Medicine.find({
      $expr: { $lte: ["$quantity", "$minLevel"] },
    }).sort({ quantity: 1 });

    res.json(alerts);
  } catch (e) {
    res.status(500).json({
      message: "Ogohlantirishlarni olishda xatolik",
    });
  }
});

export default router;
