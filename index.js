import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import serviceRoutes from "./routes/services.js";
import administrationRoutes from "./routes/administrations.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();

/* ===================== */
/* MIDDLEWARE */
/* ===================== */
app.use(
  cors({
    origin: "*", // production’da frontend domain yoz
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

/* ===================== */
/* HEALTH CHECK */
/* ===================== */
app.get("/", (_req, res) => {
  res.status(200).send("Sampi Medline API is running 🚀");
});

/* ===================== */
/* ROUTES */
/* ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);

/* ===================== */
/* 404 HANDLER */
/* ===================== */
app.use((_req, res) => {
  res.status(404).json({
    message: "Route topilmadi",
  });
});

/* ===================== */
/* GLOBAL ERROR HANDLER */
/* ===================== */
app.use((err, _req, res, _next) => {
  console.error("🔥 SERVER ERROR:", err);
  res.status(500).json({
    message: "Ichki server xatoligi",
  });
});

/* ===================== */
/* DB + SERVER */
/* ===================== */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
