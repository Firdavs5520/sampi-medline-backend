import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* REGISTER (FAQAT ADMIN / KEYIN O‘CHIRISH MUMKIN) */
/* ===================== */
/*
  ❗ Tavsiya:
  - Production’da bu route’ni o‘chirasan
  - Yoki faqat admin orqali ochasan
*/
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Barcha maydonlar majburiy",
      });
    }

    // 🔒 FAqat ruxsat etilgan rollar
    if (!["delivery", "manager", "nurse"].includes(role)) {
      return res.status(400).json({
        message: "Role noto‘g‘ri",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        message: "Bu email allaqachon mavjud",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User yaratildi",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server xatoligi",
    });
  }
});

/* ===================== */
/* LOGIN */
/* ===================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email va parol majburiy",
      });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        message: "Email yoki parol noto‘g‘ri",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Email yoki parol noto‘g‘ri",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
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
    console.error(error);
    res.status(500).json({
      message: "Server xatoligi",
    });
  }
});

/* ===================== */
/* SEED (TEST USERS) */
/* ===================== */
/*
  ❗ Faqat development uchun
  ❗ Production’da o‘chir
*/
router.get("/seed", async (_req, res) => {
  try {
    await User.deleteMany();

    const users = await User.create([
      {
        name: "Delivery",
        email: "delivery@mail.com",
        password: await bcrypt.hash("1234", 10),
        role: "delivery",
      },
      {
        name: "Nurse",
        email: "nurse@mail.com",
        password: await bcrypt.hash("1234", 10),
        role: "nurse",
      },
      {
        name: "Manager",
        email: "manager@mail.com",
        password: await bcrypt.hash("1234", 10),
        role: "manager",
      },
    ]);

    res.json({
      message: "Test userlar yaratildi",
      users: users.map((u) => ({
        email: u.email,
        role: u.role,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Seed xatolik",
    });
  }
});

export default router;
