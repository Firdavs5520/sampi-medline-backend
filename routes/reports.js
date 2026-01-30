import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", auth, async (_, res) => {
  const all = await Administration.find();
  res.json({ total: all.length });
});

export default router;
