import express from "express";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👨‍💼 MANAGER — DELIVERY TARIXI */
/* ================================================= */
router.get("/", auth, allowRoles("manager"), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);

    const logs = await DeliveryLog.find()
      .populate("medicine", "name")
      .populate("deliveredBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(); // ⚡ juda muhim

    res.json(logs);
  } catch (error) {
    console.error("DELIVERY LOGS ERROR:", error);
    res.status(500).json({
      message: "Delivery tarixini olishda xatolik",
    });
  }
});

export default router;
