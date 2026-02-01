import express from "express";
import Service from "../models/Service.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* 👩‍⚕️ + 👨‍💼 */
router.get("/", auth, allowRoles("nurse", "manager"), async (_req, res) => {
  const services = await Service.find().sort({ createdAt: -1 });
  res.json(services);
});

export default router;
