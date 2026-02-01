import express from "express";
import DeliveryLog from "../models/DeliveryLog.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* 👨‍💼 MANAGER — DELIVERY TARIXI */
router.get("/", auth, allowRoles("manager"), async (_req, res) => {
  const logs = await DeliveryLog.find()
    .populate("medicine", "name")
    .populate("deliveredBy", "name")
    .sort({ createdAt: -1 });

  res.json(logs);
});

export default router;
