import express from "express";
import Service from "../models/Service.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ + 👨‍💼 — BARCHA XIZMATLAR */
/* ================================================= */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  try {
    const services = await Service.find({ isActive: { $ne: false } })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(services);
  } catch {
    res.status(500).json({ message: "Xizmatlarni olishda xatolik" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — CREATE SERVICE (VARIANTLI) */
/* ================================================= */
router.post("/", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, variants } = req.body;

    if (!name || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        message: "Xizmat nomi yoki variantlar noto‘g‘ri",
      });
    }

    const cleanVariants = variants.map((v) => ({
      label: String(v.label).trim(),
      count: Number(v.count || 1),
      price: Number(v.price),
    }));

    if (cleanVariants.some((v) => !v.price || v.price <= 0)) {
      return res.status(400).json({
        message: "Variant narxlari noto‘g‘ri",
      });
    }

    const service = await Service.create({
      name: name.trim(),
      variants: cleanVariants,
      isActive: true,
    });

    res.status(201).json(service);
  } catch (e) {
    console.error("CREATE SERVICE ERROR:", e);
    res.status(500).json({ message: "Xizmat qo‘shilmadi" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — UPDATE SERVICE */
/* ================================================= */
router.put("/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, variants } = req.body;

    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(Array.isArray(variants) && {
          variants: variants.map((v) => ({
            label: String(v.label).trim(),
            count: Number(v.count || 1),
            price: Number(v.price),
          })),
        }),
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
/* 👩‍⚕️ NURSE — DELETE SERVICE (SOFT) */
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
