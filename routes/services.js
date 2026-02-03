import express from "express";
import Service from "../models/Service.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA XIZMATLAR (KO‘RISH) */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    res.json(services);
  } catch (e) {
    res.status(500).json({ message: "Xizmatlarni olishda xatolik" });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — CREATE */
/* ================================================= */
router.post("/", auth, allowRoles("manager"), async (req, res) => {
  try {
    const { name, variants } = req.body;

    if (!name || !Array.isArray(variants) || !variants.length) {
      return res.status(400).json({
        message: "Xizmat nomi yoki variantlar noto‘g‘ri",
      });
    }

    const service = await Service.create({
      name: name.trim(),
      variants: variants.map((v) => ({
        label: String(v.label).trim(),
        price: Number(v.price),
      })),
    });

    res.status(201).json(service);
  } catch (e) {
    res.status(500).json({ message: "Xizmat qo‘shishda xatolik" });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — UPDATE */
/* ================================================= */
router.put("/:id", auth, allowRoles("manager"), async (req, res) => {
  try {
    const { name, variants, isActive } = req.body;

    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(Array.isArray(variants) && {
          variants: variants.map((v) => ({
            label: String(v.label).trim(),
            price: Number(v.price),
          })),
        }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Xizmatni yangilashda xatolik" });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — SOFT DELETE */
/* ================================================= */
router.delete("/:id", auth, allowRoles("manager"), async (req, res) => {
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
    res.status(500).json({ message: "Xizmatni o‘chirishda xatolik" });
  }
});

export default router;
