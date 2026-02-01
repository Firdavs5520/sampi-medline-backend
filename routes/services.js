import express from "express";
import Service from "../models/Service.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* 👩‍⚕️ NURSE — CREATE SERVICE */
/* ===================== */
router.post("/", authMiddleware, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, variants = [], basePrice = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Xizmat nomi majburiy",
      });
    }

    const exists = await Service.findOne({ name });
    if (exists) {
      return res.status(409).json({
        message: "Bu xizmat allaqachon mavjud",
      });
    }

    const service = await Service.create({
      name,
      variants,
      basePrice,
    });

    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Xizmat qo‘shishda xatolik",
    });
  }
});

/* ===================== */
/* 👩‍⚕️ NURSE — UPDATE SERVICE */
/* ===================== */
router.put("/:id", authMiddleware, allowRoles("nurse"), async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({
        message: "Xizmat topilmadi",
      });
    }

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Xizmatni tahrirlashda xatolik",
    });
  }
});

/* ===================== */
/* 👨‍💼 MANAGER & 👩‍⚕️ NURSE — GET SERVICES */
/* ===================== */
router.get(
  "/",
  authMiddleware,
  allowRoles("manager", "nurse"),
  async (_req, res) => {
    try {
      const services = await Service.find({ isActive: true }).sort({
        createdAt: -1,
      });

      res.json(services);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Xizmatlarni olishda xatolik",
      });
    }
  },
);

/* ===================== */
/* 👩‍⚕️ NURSE — SOFT DELETE */
/* ===================== */
router.delete("/:id", authMiddleware, allowRoles("nurse"), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        message: "Xizmat topilmadi",
      });
    }

    service.isActive = false;
    await service.save();

    res.json({
      message: "Xizmat o‘chirildi (soft)",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Xizmatni o‘chirishda xatolik",
    });
  }
});

export default router;
