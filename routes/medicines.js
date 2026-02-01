import express from "express";
import Medicine from "../models/Medicine.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* 🚚 DELIVERY — OMBORGA QO‘SHISH */
router.post("/delivery", auth, allowRoles("delivery"), async (req, res) => {
  const { name, category, unit, price, quantity, minLevel = 5 } = req.body;

  let medicine = await Medicine.findOne({ name });

  if (medicine) {
    medicine.quantity += Number(quantity);
    medicine.price = Number(price);
    medicine.minLevel = minLevel;
    medicine.lastDeliveredBy = req.user.id;
    medicine.lastDeliveredAt = new Date();
    await medicine.save();
  } else {
    medicine = await Medicine.create({
      name,
      category,
      unit,
      price: Number(price),
      quantity: Number(quantity),
      minLevel,
      lastDeliveredBy: req.user.id,
      lastDeliveredAt: new Date(),
    });
  }

  res.json({ message: "Dori qo‘shildi", medicine });
});

/* 👩‍⚕️ NURSE — DORI ISHLATISH */
router.post("/use/:id", auth, allowRoles("nurse"), async (req, res) => {
  const { quantity } = req.body;

  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    return res.status(404).json({ message: "Dori topilmadi" });
  }

  if (medicine.quantity < quantity) {
    return res.status(400).json({ message: "Dori yetarli emas" });
  }

  medicine.quantity -= Number(quantity);
  await medicine.save();

  res.json({ message: "Dori ishlatildi", medicine });
});

/* 👩‍⚕️ + 👨‍💼 — KO‘RISH */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  const meds = await Medicine.find().sort({ updatedAt: -1 });
  res.json(meds);
});

/* 👨‍💼 MANAGER — ALERT */
router.get("/alerts", auth, allowRoles("manager"), async (_req, res) => {
  const alerts = await Medicine.find({
    $expr: { $lte: ["$quantity", "$minLevel"] },
  });

  res.json(alerts);
});

export default router;
