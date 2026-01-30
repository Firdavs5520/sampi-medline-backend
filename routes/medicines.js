import express from "express";
import Medicine from "../models/Medicine.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* CREATE */
/* ===================== */
router.post("/", auth, async (req, res) => {
  try {
    const med = await Medicine.create(req.body);
    res.json(med);
  } catch (err) {
    res.status(500).json({ message: "Dori qo‘shishda xatolik" });
  }
});

/* ===================== */
/* READ */
/* ===================== */
router.get("/", auth, async (req, res) => {
  try {
    const meds = await Medicine.find().sort({ createdAt: -1 });
    res.json(meds);
  } catch (err) {
    res.status(500).json({ message: "Dorilarni olishda xatolik" });
  }
});

/* ===================== */
/* UPDATE (EDIT) */
/* ===================== */
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, price } = req.body;

    const med = await Medicine.findById(req.params.id);
    if (!med) {
      return res.status(404).json({ message: "Dori topilmadi" });
    }

    med.name = name ?? med.name;
    med.price = price ?? med.price;

    await med.save();

    res.json(med);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tahrirlashda xatolik" });
  }
});

/* ===================== */
/* DELETE */
/* ===================== */
router.delete("/:id", auth, async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);

    if (!med) {
      return res.status(404).json({ message: "Dori topilmadi" });
    }

    await med.deleteOne();
    res.json({ message: "Dori o‘chirildi" });
  } catch (err) {
    res.status(500).json({ message: "O‘chirishda xatolik" });
  }
});

export default router;
