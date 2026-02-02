import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ================================================= */
/* 🔐 LOGIN */
/* ================================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email yoki parol kiritilmadi" });
    }

    /* ⚡ faqat kerakli fieldlar */
    const user = await User.findOne({ email })
      .select("_id name email password role")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "Email yoki parol noto‘g‘ri" });
    }

    /* ⚡ async compare (bloklamaydi) */
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Email yoki parol noto‘g‘ri" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login xatoligi" });
  }
});

export default router;
