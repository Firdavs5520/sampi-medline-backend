import express from "express";
import Medicine from "../models/Medicine.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* 🚚 DELIVERY — DORI QO‘SHISH */
/* ===================== */
router.post(
  "/delivery",
  authMiddleware,
  allowRoles("delivery"),
  async (req, res) => {
    try {
      const { name, category, unit, price, quantity, minLevel = 5 } = req.body;

      if (!name || !category || !unit || !price || !quantity) {
        return res.status(400).json({
          message: "Barcha maydonlar majburiy",
        });
      }

      let medicine = await Medicine.findOne({ name });

      if (medicine) {
        // ➕ BOR doriga qo‘shamiz
        medicine.quantity += quantity;
        medicine.price = price;
        medicine.minLevel = minLevel;
        medicine.lastDeliveredBy = req.user.id;
        medicine.lastDeliveredAt = new Date();
        await medicine.save();
      } else {
        // 🆕 YANGI dori
        medicine = await Medicine.create({
          name,
          category,
          unit,
          price,
          quantity,
          minLevel,
          lastDeliveredBy: req.user.id,
          lastDeliveredAt: new Date(),
        });
      }

      res.status(201).json({
        message: "Dori omborga qo‘shildi",
        medicine,
      });
    } catch (error) {
      console.error(error);
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
          message: "Ishlatiladigan miqdor noto‘g‘ri",
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
          message: "Dori omborda yetarli emas",
        });
      }

      medicine.quantity -= quantity;
      await medicine.save();

      res.json({
        message: "Dori ishlatildi",
        medicine,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Dori ishlatishda xatolik",
      });
    }
  },
);

/* ===================== */
/* 👨‍💼 MANAGER — OMBORNI KO‘RISH */
/* ===================== */
router.get("/", authMiddleware, allowRoles("manager"), async (_req, res) => {
  try {
    const medicines = await Medicine.find()
      .populate("lastDeliveredBy", "name role")
      .sort({ updatedAt: -1 });

    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Dorilarni olishda xatolik",
    });
  }
});

/* ===================== */
/* 👨‍💼 MANAGER — TUGAGAN / KAM QOLGAN */
/* ===================== */
router.get(
  "/alerts",
  authMiddleware,
  allowRoles("manager"),
  async (_req, res) => {
    try {
      const alerts = await Medicine.find({
        status: { $in: ["low", "out"] },
      });

      res.json(alerts);
    } catch (error) {
      res.status(500).json({
        message: "Alertlarni olishda xatolik",
      });
    }
  },
);

export default router;
