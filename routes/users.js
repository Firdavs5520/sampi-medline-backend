import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* MANAGER — LOR USER CREATE */
router.post("/lor", authMiddleware, allowRoles("manager"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Ma'lumot yetarli emas" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User mavjud" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "lor",
      isActive: true,
    });

    res.status(201).json({
      message: "LOR yaratildi",
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server xatoligi" });
  }
});

export default router;
