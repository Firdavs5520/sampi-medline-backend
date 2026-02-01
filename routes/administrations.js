import express from "express";
import Administration from "../models/Administration.js";
import Medicine from "../models/Medicine.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ NURSE — MEDICINE / SERVICE ISHLATISH */
/* ================================================= */
router.post("/", authMiddleware, allowRoles("nurse"), async (req, res) => {
  try {
    const {
      patientName,
      type,
      medicineId,
      serviceId,
      name,
      quantity = 1,
      price,
    } = req.body;

    if (!patientName || !type || !name || !price) {
      return res.status(400).json({
        message: "Majburiy maydon yetishmayapti",
      });
    }

    /* ===================== */
    /* MEDICINE */
    /* ===================== */
    if (type === "medicine") {
      if (!medicineId) {
        return res.status(400).json({
          message: "Medicine ID majburiy",
        });
      }

      const medicine = await Medicine.findById(medicineId);
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

      // 🔻 OMBORNI KAMAYTIRAMIZ
      medicine.quantity -= quantity;
      await medicine.save();

      const admin = await Administration.create({
        patientName,
        type: "medicine",
        medicine: medicine._id,
        name: medicine.name,
        quantity,
        price,
        nurse: req.user.id,
      });

      return res.status(201).json(admin);
    }

    /* ===================== */
    /* SERVICE */
    /* ===================== */
    if (type === "service") {
      const admin = await Administration.create({
        patientName,
        type: "service",
        service: serviceId || null,
        name,
        quantity: 1,
        price,
        nurse: req.user.id,
      });

      return res.status(201).json(admin);
    }

    return res.status(400).json({
      message: "Type noto‘g‘ri",
    });
  } catch (error) {
    console.error("ADMIN CREATE ERROR:", error);
    res.status(500).json({
      message: "Administration yaratishda xatolik",
    });
  }
});

export default router;
