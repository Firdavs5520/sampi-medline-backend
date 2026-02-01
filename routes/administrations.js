import express from "express";
import Administration from "../models/Administration.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* 👩‍⚕️ NURSE — SAQLASH */
/* ===================== */
router.post("/", authMiddleware, allowRoles("nurse"), async (req, res) => {
  try {
    const { patientName, type, name, quantity, price } = req.body;

    if (!patientName || !type || !name || !price) {
      return res.status(400).json({
        message: "Majburiy maydonlar yetishmayapti",
      });
    }

    const admin = await Administration.create({
      patientName,
      type,
      name,
      quantity: type === "medicine" ? quantity || 1 : 1,
      price,
      nurseId: req.user.id,
      date: new Date(),
    });

    res.status(201).json(admin);
  } catch (error) {
    console.error("ADMINISTRATION ERROR:", error);
    res.status(500).json({
      message: "Administration saqlashda xatolik",
    });
  }
});

export default router;
