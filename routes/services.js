import express from "express";
import Service from "../models/Service.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* CREATE SERVICE (nurse) */
router.post("/", auth, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.json(service);
  } catch (e) {
    res.status(500).json({ message: "Xizmat qo‘shishda xato" });
  }
});

/* GET ALL SERVICES */
router.get("/", auth, async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

export default router;
