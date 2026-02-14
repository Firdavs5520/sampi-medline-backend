import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* MANAGER — LOR CREATE */
router.post("/lor", auth, allowRoles("manager"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Ma'lumot to‘liq emas" });
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
    });

    res.status(201).json({
      message: "LOR yaratildi",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xatolik" });
  }
});

export default router;
