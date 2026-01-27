import express from "express";
import Medicine from "../models/Medicine.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const med = await Medicine.create(req.body);
  res.json(med);
});

router.get("/", auth, async (req, res) => {
  const meds = await Medicine.find();
  res.json(meds);
});

export default router;
