import express from "express";
import Administration from "../models/Administration.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ NURSE — DORI / XIZMAT QO‘SHISH */
/* ================================================= */
router.post("/", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { patientName, type, name, quantity, price } = req.body;

    /* 🔒 VALIDATION */
    if (!patientName || !type || !name || !price) {
      return res.status(400).json({
        message: "Majburiy maydonlar yetishmayapti",
      });
    }

    if (!["medicine", "service"].includes(type)) {
      return res.status(400).json({
        message: "Type noto‘g‘ri",
      });
    }

    const admin = await Administration.create({
      patientName,
      type,
      name,
      quantity: type === "medicine" ? Number(quantity || 1) : 1,
      price: Number(price),
      nurseId: req.user.id, // 🔥 MUHIM
      date: new Date(),
    });

    res.status(201).json(admin);
  } catch (error) {
    console.error("ADMINISTRATION CREATE ERROR:", error);
    res.status(500).json({
      message: "Administration saqlashda xatolik",
    });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — OMBOR HARAKATI (LOG) */
/* ================================================= */
router.get("/logs", auth, allowRoles("manager"), async (_req, res) => {
  try {
    const logs = await Administration.find()
      .populate("nurseId", "name role")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(logs);
  } catch (error) {
    console.error("ADMINISTRATION LOG ERROR:", error);
    res.status(500).json({
      message: "Ombor harakatini olishda xatolik",
    });
  }
});

export default router;
