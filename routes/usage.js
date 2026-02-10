import express from "express";
import Usage from "../models/Usage.js";
import Service from "../models/Service.js";
import Medicine from "../models/Medicine.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ 🩺 — ISHLATISH (NURSE / LOR) */
/* ================================================= */
router.post("/", auth, async (req, res) => {
  try {
    const { patientName, type, itemId, quantity = 1 } = req.body;
    const role = req.user.role;

    if (!["nurse", "lor"].includes(role)) {
      return res.status(403).json({ message: "Ruxsat yo‘q" });
    }

    if (!patientName || !type || !itemId) {
      return res.status(400).json({ message: "Ma’lumot yetarli emas" });
    }

    // 🔒 LOR dori ishlata olmaydi
    if (role === "lor" && type === "medicine") {
      return res.status(403).json({ message: "LOR dori ishlata olmaydi" });
    }

    let item;
    if (type === "service") {
      item = await Service.findById(itemId);
    } else if (type === "medicine") {
      item = await Medicine.findById(itemId);
    }

    if (!item || item.isActive === false) {
      return res.status(404).json({ message: "Topilmadi" });
    }

    const price = item.price || item.variants?.[0]?.price;
    const total = price * quantity;

    const usage = await Usage.create({
      patientName: patientName.trim(),
      type,
      item: item._id,
      quantity,
      price,
      total,
      usedBy: {
        role,
        user: req.user._id,
      },
    });

    res.status(201).json(usage);
  } catch (e) {
    console.error("USAGE ERROR:", e);
    res.status(500).json({ message: "Xatolik yuz berdi" });
  }
});

export default router;
