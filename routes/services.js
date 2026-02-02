import express from "express";
import Service from "../models/Service.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA XIZMATLAR */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 }).lean(); // ⚡ juda muhim

    res.json(services);
  } catch (error) {
    console.error("SERVICES GET ERROR:", error);
    res.status(500).json({
      message: "Xizmatlarni olishda xatolik",
    });
  }
});

export default router;
