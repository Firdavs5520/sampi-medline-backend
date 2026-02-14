import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

/* ===================== */
/* MODELS */
/* ===================== */
import User from "./models/User.js";

/* ===================== */
/* ROUTES */
/* ===================== */
import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import serviceRoutes from "./routes/services.js";
import administrationRoutes from "./routes/administrations.js";
import reportRoutes from "./routes/reports.js";
import deliveryLogRoutes from "./routes/deliveryLogs.js";
import lorRoutes from "./routes/lor.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();

/* ===================== */
/* CORS */
/* ===================== */
app.use(
  cors({
    origin: ["http://localhost:5173", "https://sampi-medline.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ===================== */
/* BODY PARSER */
/* ===================== */
app.use(express.json({ limit: "1mb" }));

/* ===================== */
/* HEALTH CHECK */
/* ===================== */
app.get("/", (_req, res) => {
  res.send("Sampi Medline API is running 🚀");
});

/* ===================== */
/* ROUTES */
/* ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/delivery-logs", deliveryLogRoutes);
app.use("/api/lor", lorRoutes);

/* ===================== */
/* 404 HANDLER */
/* ===================== */
app.use((_req, res) => {
  res.status(404).json({ message: "Route topilmadi" });
});

/* ===================== */
/* ERROR HANDLER */
/* ===================== */
app.use((err, _req, res, _next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Server xatoligi" });
});

/* ===================== */
/* DB + SERVER */
/* ===================== */
const PORT = process.env.PORT || 10000;

mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    /* ===================== */
    /* DEFAULT LOR SEED */
    /* ===================== */
    const lorExists = await User.findOne({ email: "lor@mail.com" });

    if (!lorExists) {
      const hashedPassword = await bcrypt.hash("1234", 10);

      await User.create({
        name: "LOR",
        email: "lor@mail.com",
        password: hashedPassword,
        role: "lor",
        isActive: true,
      });

      console.log("🩺 Default LOR user created");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
