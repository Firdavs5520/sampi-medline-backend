import express from "express";
import Administration from "../models/Administration.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* 👩‍⚕️ NURSE */
router.post("/", auth, allowRoles("nurse"), async (req, res) => {
  const admin = await Administration.create({
    ...req.body,
    nurseId: req.user.id,
  });

  res.json(admin);
});

export default router;
