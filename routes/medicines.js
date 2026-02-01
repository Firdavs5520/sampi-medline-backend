import express from "express";
import Medicine from "../models/Medicine.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* 🚚 DELIVERY — FAQAT BOR DORIGA QO‘SHISH */
/* ===================== */
router.post(
  "/delivery",
  authMiddleware,
  allowRoles("delivery"),
  async (req, res) => {
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
          message: "Bunday dori omborda mavjud emas",
        });
      }

      // ➕ FAQAT MIQDOR QO‘SHAMIZ
      medicine.quantity += Number(quantity);
      medicine.lastDeliveredBy = req.user.id;
      medicine.lastDeliveredAt = new Date();

      await medicine.save();

      res.json({
        message: "Dori omborga qo‘shildi",
        medicine,
      });
    } catch (error) {
      console.error("DELIVERY ERROR:", error);
      res.status(500).json({
        message: "Delivery qo‘shishda xatolik",
      });
    }
  },
);

/* ===================== */
/* 👩‍⚕️ NURSE — DORI ISHLATISH */
/* ===================== */
router.post(
  "/use/:id",
  authMiddleware,
  allowRoles("nurse"),
  async (req, res) => {
    try {
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          message: "Miqdor noto‘g‘ri",
        });
      }

      const medicine = await Medicine.findById(req.params.id);

      if (!medicine) {
        return res.status(404).json({ message: "Dori topilmadi" });
      }

      if (medicine.quantity < quantity) {
        return res.status(400).json({ message: "Dori yetarli emas" });
      }

      medicine.quantity -= Number(quantity);
      await medicine.save();

      res.json({ message: "Dori ishlatildi", medicine });
    } catch (e) {
      console.error("USE ERROR:", e);
      res.status(500).json({ message: "Dori ishlatishda xatolik" });
    }
  },
);

/* ===================== */
/* 👩‍⚕️ + 👨‍💼 — KO‘RISH */
/* ===================== */
router.get(
  "/",
  authMiddleware,
  allowRoles("nurse", "manager"),
  async (_req, res) => {
    const meds = await Medicine.find().sort({ updatedAt: -1 });
    res.json(meds);
  },
);

/* ===================== */
/* 👨‍💼 MANAGER — ALERT */
/* ===================== */
router.get(
  "/alerts",
  authMiddleware,
  allowRoles("manager"),
  async (_req, res) => {
    const alerts = await Medicine.find({
      $expr: { $lte: ["$quantity", "$minLevel"] },
    });

    res.json(alerts);
  },
);

/* ===================== */
/* 🚚 DELIVERY — DORI RO‘YXATI */
/* ===================== */
router.get(
  "/for-delivery",
  authMiddleware,
  allowRoles("delivery"),
  async (_req, res) => {
    try {
      const medicines = await Medicine.find().sort({ name: 1 });
      res.json(medicines);
    } catch (e) {
      console.error("FOR DELIVERY ERROR:", e);
      res.status(500).json({
        message: "Dorilarni olishda xatolik",
      });
    }
  },
);

export default router;
