import express from "express";
import Administration from "../models/Administration.js";
import Medicine from "../models/Medicine.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ NURSE — BITTA DORI / XIZMAT QO‘SHISH (ESKI) */
/* ================================================= */
router.post("/", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { patientName, type, name, quantity, price } = req.body;

    if (!patientName || !type || !name || price == null) {
      return res.status(400).json({
        message: "Majburiy maydonlar yetishmayapti",
      });
    }

    if (!["medicine", "service"].includes(type)) {
      return res.status(400).json({
        message: "Type noto‘g‘ri",
      });
    }

    const admin = await Administration.create({
      patientName,
      type,
      name,
      quantity: type === "medicine" ? Number(quantity || 1) : 1,
      price: Number(price),
      nurseId: req.user.id,
      date: new Date(),
    });

    res.status(201).json(admin);
  } catch (error) {
    console.error("ADMINISTRATION CREATE ERROR:", error);
    res.status(500).json({
      message: "Administration saqlashda xatolik",
    });
  }
});

/* ================================================= */
/* 👩‍⚕️ NURSE — BULK (KO‘P DORI / XIZMATNI BIR YO‘LA) */
/* ================================================= */
router.post("/bulk", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { patientName, items } = req.body;

    if (!patientName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "patientName yoki items noto‘g‘ri",
      });
    }

    const administrations = [];
    const medicineOps = [];

    for (const i of items) {
      if (!i.type || !i.name || i.price == null) {
        return res.status(400).json({
          message: "Items ichida noto‘g‘ri ma’lumot bor",
        });
      }

      const qty = i.type === "medicine" ? Number(i.quantity || 1) : 1;

      administrations.push({
        patientName,
        type: i.type,
        name: i.name,
        quantity: qty,
        price: Number(i.price),
        nurseId: req.user.id,
        date: new Date(),
      });

      /* 🔻 OMBORDAN AYIRISH (AGAR DORI BO‘LSA) */
      if (i.type === "medicine" && i._id) {
        medicineOps.push({
          updateOne: {
            filter: { _id: i._id },
            update: { $inc: { quantity: -qty } },
          },
        });
      }
    }

    /* ⚡ HAMMASINI BIR YO‘LA */
    await Promise.all([
      Administration.insertMany(administrations),
      medicineOps.length ? Medicine.bulkWrite(medicineOps) : Promise.resolve(),
    ]);

    res.status(201).json({
      success: true,
      count: administrations.length,
    });
  } catch (error) {
    console.error("ADMINISTRATION BULK ERROR:", error);
    res.status(500).json({
      message: "Bulk saqlashda xatolik",
    });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — OMBOR HARAKATI (LOG) */
/* ================================================= */
router.get("/logs", auth, allowRoles("manager"), async (_req, res) => {
  try {
    const logs = await Administration.find()
      .populate("nurseId", "name role")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(); // ⚡ tezroq

    res.json(logs);
  } catch (error) {
    console.error("ADMINISTRATION LOG ERROR:", error);
    res.status(500).json({
      message: "Ombor harakatini olishda xatolik",
    });
  }
});

export default router;
