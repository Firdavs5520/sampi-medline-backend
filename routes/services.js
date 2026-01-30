import express from "express";
import Service from "../models/Service.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* GET ALL SERVICES */
/* ===================== */
router.get("/", auth, async (req, res) => {
  try {
    const services = await Service.find({ active: true }).sort({ name: 1 });
    res.json(services);
  } catch (e) {
    res.status(500).json({ message: "Xizmatlarni olishda xato" });
  }
});

/* ===================== */
/* CREATE SERVICE */
/* ===================== */
router.post("/", auth, async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Maʼlumot yetarli emas" });
    }

    const service = await Service.create({
      name: name.trim(),
      price: Number(price),
    });

    res.status(201).json(service);
  } catch (e) {
    res.status(500).json({ message: "Xizmat qo‘shishda xato" });
  }
});

/* ===================== */
/* UPDATE SERVICE */
/* ===================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, price } = req.body;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, price },
      { new: true },
    );

    if (!service) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json(service);
  } catch (e) {
    res.status(500).json({ message: "Xizmatni yangilashda xato" });
  }
});

/* ===================== */
/* DELETE (SOFT DELETE) */
/* ===================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    );

    if (!service) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json({ message: "Xizmat o‘chirildi" });
  } catch (e) {
    res.status(500).json({ message: "O‘chirishda xato" });
  }
});

export default router;
