import express from "express";
import mongoose from "mongoose";
import Medicine from "../models/Medicine.js";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { addToTelegramBatch } from "../utils/telegramBatch.js";

const router = express.Router();

router.get(
  "/",
  auth,
  allowRoles("nurse", "manager", "delivery"),
  async (_req, res) => {
    try {
      const meds = await Medicine.find().sort({ updatedAt: -1 }).lean();
      res.json(meds);
    } catch {
      res.status(500).json({ message: "Dorilarni olishda xatolik" });
    }
  },
);

/* ================================================= */
/* 👩‍⚕️ NURSE — YANGI DORI QO‘SHISH */
/* ================================================= */

router.post("/", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, price, unit, minLevel } = req.body;

    // ❗ quantity bu yerda MAJBURIY EMAS
    if (!name || price == null) {
      return res.status(400).json({
        message: "Dori nomi va narxi majburiy",
      });
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      price: Number(price),
      quantity: 0, // ✅ har doim 0 dan boshlanadi
      unit: unit || "dona",
      minLevel: Number(minLevel ?? 5),
    });

    res.status(201).json(medicine);
  } catch (e) {
    // 🔴 duplicate name
    if (e.code === 11000) {
      return res.status(400).json({
        message: "Bu nomdagi dori allaqachon mavjud",
      });
    }

    console.error("CREATE MEDICINE ERROR:", e);
    res.status(500).json({ message: "Dori qo‘shilmadi." });
  }
});
/* ================================================= */
/* 👩‍⚕️ NURSE — DORI TAHRIRLASH */
/* ================================================= */
router.put("/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { name, price, quantity, unit, minLevel } = req.body;

    const updated = await Medicine.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(price != null && { price: Number(price) }),
        ...(quantity != null && { quantity: Number(quantity) }),
        ...(unit && { unit }),
        ...(minLevel != null && { minLevel: Number(minLevel) }),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Dori topilmadi" });
    }

    res.json(updated);
  } catch (e) {
    console.error("UPDATE MEDICINE ERROR:", e);
    res
      .status(500)
      .json({ message: "Dori tahrirlanmadi. Qandaydir xatolik yuz berdi." });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — DORI O‘CHIRISH */
/* ================================================= */
router.delete("/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const deleted = await Medicine.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Dori topilmadi" });
    }

    res.json({ message: "Dori o‘chirildi" });
  } catch (e) {
    console.error("DELETE MEDICINE ERROR:", e);
    res.status(500).json({ message: "Dori o‘chirilmadi" });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — DORI ISHLATISH (OMBORDAN AYIRISH) */
/* ================================================= */
router.post("/use/:id", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const qty = Number(req.body.quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Miqdor noto‘g‘ri" });
    }

    const updated = await Medicine.findOneAndUpdate(
      { _id: req.params.id, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true },
    );

    if (!updated) {
      return res.status(400).json({
        message: "Dori yetarli emas yoki topilmadi",
      });
    }

    res.json({
      message: "Dori ishlatildi",
      medicine: updated,
    });
  } catch {
    res.status(500).json({ message: "Dori ishlatishda xatolik" });
  }
});

/* ================================================= */
/* 🚚 DELIVERY — OMBORGA QO‘SHISH (BULK) */
/* ================================================= */
router.post("/delivery", auth, allowRoles("delivery"), async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const items = Array.isArray(req.body.items)
      ? req.body.items
      : req.body.medicineId && req.body.quantity
        ? [{ medicineId: req.body.medicineId, quantity: req.body.quantity }]
        : [];

    if (!items.length) {
      return res.status(400).json({
        message: "Delivery maʼlumotlari noto‘g‘ri",
      });
    }

    session.startTransaction();

    const logs = [];
    const telegramMsgs = [];

    for (const { medicineId, quantity } of items) {
      const qty = Number(quantity);
      if (!medicineId || qty <= 0) continue;

      await Medicine.updateOne(
        { _id: medicineId },
        {
          $inc: { quantity: qty },
          $set: {
            lastDeliveredBy: req.user.id,
            lastDeliveredAt: new Date(),
          },
        },
        { session },
      );

      logs.push({
        medicine: medicineId,
        quantity: qty,
        deliveredBy: req.user.id,
      });

      telegramMsgs.push(
        `💊 <b>Medicine ID:</b> ${medicineId}\n➕ Qo‘shildi: <b>${qty}</b> dona`,
      );
    }

    if (!logs.length) {
      throw new Error("Yaroqli delivery topilmadi");
    }

    await DeliveryLog.insertMany(logs, { session });

    await session.commitTransaction();
    session.endSession();

    telegramMsgs.forEach(addToTelegramBatch);

    res.json({
      message: "Dorilar omborga qo‘shildi",
      modified: logs.length,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    console.error("DELIVERY ERROR:", e);
    res.status(500).json({ message: e.message || "Delivery xatoligi" });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — KAM QOLGAN DORILAR */
/* ================================================= */
router.get("/alerts", auth, allowRoles("manager"), async (_req, res) => {
  try {
    const alerts = await Medicine.find({
      $expr: { $lte: ["$quantity", "$minLevel"] },
    })
      .sort({ quantity: 1 })
      .lean();

    res.json(alerts);
  } catch {
    res.status(500).json({ message: "Alertlarni olishda xatolik" });
  }
});

router.get("/for-delivery", auth, allowRoles("delivery"), async (_req, res) => {
  try {
    const medicines = await Medicine.find()
      .select("name quantity minLevel")
      .sort({ name: 1 })
      .lean();

    res.json(medicines);
  } catch (e) {
    console.error("FOR DELIVERY ERROR:", e);
    res.status(500).json({
      message: "Dorilarni olishda xatolik",
    });
  }
});

export default router;
