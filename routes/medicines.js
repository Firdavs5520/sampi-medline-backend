import express from "express";
import Medicine from "../models/Medicine.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { sendTelegram } from "../utils/telegram.js";

const router = express.Router();

/* ================================================= */
/* 🚚 DELIVERY — FAQAT BOR DORIGA MIQDOR QO‘SHADI */
/* ================================================= */
router.post("/delivery", auth, allowRoles("delivery"), async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;

    if (!medicineId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Dori va miqdor majburiy",
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        message: "Dori topilmadi",
      });
    }

    // ➕ OMBORGA QO‘SHISH
    medicine.quantity += Number(quantity);
    medicine.lastDeliveredBy = req.user.id;
    medicine.lastDeliveredAt = new Date();
    await medicine.save();

    await sendTelegram(`
🚚 <b>OMBORGA DORI KELDI</b>

💊 <b>${medicine.name}</b>
➕ Qo‘shildi: <b>${quantity}</b> dona
📦 Hozir omborda: <b>${medicine.quantity}</b> dona

🕒 ${new Date().toLocaleString()}
`);

    // 🧾 DELIVERY LOG (ENG MUHIM QATOR)
    await DeliveryLog.create({
      medicine: medicine._id,
      quantity: Number(quantity),
      deliveredBy: req.user.id,
    });

    res.json({
      message: "Dori omborga qo‘shildi",
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
/* 👩‍⚕️ + 👨‍💼 — KO‘RISH */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  const meds = await Medicine.find().sort({ updatedAt: -1 });
  res.json(meds);
});

/* ================================================= */
/* 👨‍💼 MANAGER — KAM QOLGAN DORILAR */
/* ================================================= */
router.get("/alerts", auth, allowRoles("manager"), async (_req, res) => {
  const alerts = await Medicine.find({
    $expr: { $lte: ["$quantity", "$minLevel"] },
  }).sort({ quantity: 1 });

  res.json(alerts);
});

export default router;
