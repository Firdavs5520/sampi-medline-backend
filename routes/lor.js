import express from "express";
import { auth, allowRoles } from "../middleware/auth.js";
import Usage from "../models/Usage.js";
import Service from "../models/Service.js";

const router = express.Router();

/* ================================================= */
/* 🩺 LOR — XIZMAT ISHLATISH */
/* ================================================= */
router.post(
  "/use-service",
  auth, // ✅ TO‘G‘RILANDI
  allowRoles("lor"),
  async (req, res) => {
    try {
      const { patientName, serviceId } = req.body;

      if (!patientName || !serviceId) {
        return res.status(400).json({ message: "Ma’lumot yetarli emas" });
      }

      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Xizmat topilmadi" });
      }

      const price = service.price;

      const usage = await Usage.create({
        patientName,
        items: [
          {
            type: "Service",
            item: service._id,
            quantity: 1,
            priceAtTime: price,
            total: price,
          },
        ],
        totalAmount: price,
        usedBy: {
          role: "lor",
          user: req.user.id,
        },
      });

      res.status(201).json(usage);
    } catch (e) {
      console.error("LOR USE SERVICE ERROR:", e);
      res.status(500).json({ message: "Xatolik yuz berdi" });
    }
  },
);

/* ================================================= */
/* 🧾 LOR — CHEKLAR RO‘YXATI */
/* ================================================= */
router.get(
  "/checks",
  auth, // ✅ TO‘G‘RILANDI
  allowRoles("lor"),
  async (req, res) => {
    try {
      const list = await Usage.find({
        "usedBy.role": "lor",
        "usedBy.user": req.user.id,
      })
        .sort({ createdAt: -1 })
        .lean();

      res.json(list);
    } catch (e) {
      console.error("LOR CHECKS ERROR:", e);
      res.status(500).json({ message: "Cheklarni olishda xatolik" });
    }
  },
);

export default router;
