import express from "express";
import Service from "../models/Service.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA XIZMATLAR (KO‘RISH) */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  try {
    const services = await Service.find({ isActive: { $ne: false } })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(services);
  } catch (e) {
    res.status(500).json({ message: "Xizmatlarni olishda xatolik" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — XIZMAT QO‘SHISH */
/* ================================================= */
router.post("/", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "Maʼlumotlar yetarli emas" });
    }

    const service = await Service.create({
      name: name.trim(),
      price: Number(price),
      isActive: true,
    });

    res.status(201).json(service);
  } catch (e) {
    console.error("CREATE SERVICE ERROR:", e);
    res.status(500).json({ message: "Xizmat qo‘shilmadi" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — XIZMAT TAHRIRLASH */
/* ================================================= */
router.put("/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, price } = req.body;

    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(price != null && { price: Number(price) }),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json(updated);
  } catch (e) {
    console.error("UPDATE SERVICE ERROR:", e);
    res.status(500).json({ message: "Xizmat tahrirlanmadi" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — XIZMAT O‘CHIRISH (SOFT DELETE) */
/* ================================================= */
router.delete("/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json({ success: true });
  } catch (e) {
    console.error("DELETE SERVICE ERROR:", e);
    res.status(500).json({ message: "Xizmat o‘chirilmadi" });
  }
});

export default router;
