import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ===================== */
/* CREATE USER (REGISTER) */
/* ===================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Barcha maydonlar majburiy" });
    }

    if (!["nurse", "manager"].includes(role)) {
      return res.status(400).json({ message: "Role noto‘g‘ri" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Bu email allaqachon mavjud" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User muvaffaqiyatli yaratildi",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server xatoligi" });
  }
});

/* ===================== */
/* LOGIN */
/* ===================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email va parol majburiy" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email yoki parol noto‘g‘ri" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email yoki parol noto‘g‘ri" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }, // 🔐 token muddati
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server xatoligi" });
  }
});

/* ===================== */
/* SEED (TEST USERS) */
/* ===================== */
router.get("/seed", async (_req, res) => {
  try {
    await User.deleteMany();

    const users = await User.create([
      {
        name: "Nurse",
        email: "nurse@mail.com",
        password: bcrypt.hashSync("1234", 10),
        role: "nurse",
      },
      {
        name: "Manager",
        email: "manager@mail.com",
        password: bcrypt.hashSync("1234", 10),
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Seed xatolik" });
  }
});

export default router;
