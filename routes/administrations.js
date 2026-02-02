import express from "express";
import Administration from "../models/Administration.js";
import AdministrationOrder from "../models/AdministrationOrder.js";
import Medicine from "../models/Medicine.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👩‍⚕️ NURSE — BULK ORDER (1 BEMOR = 1 CHEK) */
/* ================================================= */
router.post("/bulk", auth, allowRoles("nurse"), async (req, res) => {
  try {
    const { patientName, items } = req.body;

    if (!patientName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Noto‘g‘ri ma’lumot" });
    }

    const nurseId = req.user.id;

    /* ===================== */
    /* 1️⃣ ITEMS + JAMI */
    /* ===================== */
    let total = 0;

    const orderItems = items.map((i) => {
      const qty = i.type === "medicine" ? Number(i.quantity || 1) : 1;
      total += Number(i.price) * qty;

      return {
        type: i.type,
        name: i.name,
        quantity: qty,
        price: Number(i.price),
        medicineId: i.type === "medicine" ? i._id : null,
        serviceId: i.type === "service" ? i.serviceId : null,
      };
    });

    /* ===================== */
    /* 2️⃣ ORDER (CHEK) */
    /* ===================== */
    const order = await AdministrationOrder.create({
      patientName,
      nurseId,
      items: orderItems,
      total,
      date: new Date(),
    });

    /* ===================== */
    /* 3️⃣ LOG + OMBOR */
    /* ===================== */
    const logs = [];
    const medicineOps = [];

    for (const i of orderItems) {
      logs.push({
        patientName,
        type: i.type,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        nurseId,
        date: new Date(),
      });

      if (i.type === "medicine" && i.medicineId) {
        medicineOps.push({
          updateOne: {
            filter: { _id: i.medicineId },
            update: { $inc: { quantity: -i.quantity } },
          },
        });
      }
    }

    await Promise.all([
      Administration.insertMany(logs),
      medicineOps.length ? Medicine.bulkWrite(medicineOps) : Promise.resolve(),
    ]);

    res.status(201).json({
      success: true,
      orderId: order._id,
      total,
    });
  } catch (error) {
    console.error("ADMINISTRATION BULK ERROR:", error);
    res.status(500).json({
      message: "Bulk order saqlashda xatolik",
    });
  }
});

/* ================================================= */
/* 🧾 PUBLIC — CHEK UCHUN ORDER (AUTH YO‘Q) */
/* ================================================= */
router.get("/public/orders/:id", async (req, res) => {
  try {
    const order = await AdministrationOrder.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({ message: "Chek topilmadi" });
    }

    res.json(order);
  } catch (error) {
    console.error("PUBLIC ORDER ERROR:", error);
    res.status(500).json({
      message: "Chekni olishda xatolik",
    });
  }
});

/* ================================================= */
/* 👨‍💼 MANAGER — LOGS (ESKI ISHLAYVERADI) */
/* ================================================= */
router.get("/logs", auth, allowRoles("manager"), async (_req, res) => {
  try {
    const logs = await Administration.find()
      .populate("nurseId", "name role")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Ombor harakatini olishda xatolik",
    });
  }
});

export default router;
