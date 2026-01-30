import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* CREATE */
/* ===================== */
router.post("/", auth, async (req, res) => {
  try {
    const { patientName, type, itemName, quantity, pricePerUnit } = req.body;

    if (!patientName || !type || !itemName || !pricePerUnit) {
      return res.status(400).json({ message: "Maʼlumot yetarli emas" });
    }

    const record = await Administration.create({
      patientName,
      type,
      itemName,
      quantity: quantity || 1,
      pricePerUnit,
    });

    res.status(201).json(record);
  } catch (e) {
    res.status(500).json({ message: "Saqlashda xato" });
  }
});

export default router;
