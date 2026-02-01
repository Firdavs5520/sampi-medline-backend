import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// ROUTES
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

// 🔥 CORS — RENDER + LOCAL + FUTURE DEPLOY UCHUN
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local frontend
      "https://sampi-medline.vercel.app", // agar frontend deploy qilinsa
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 🔥 PRE-FLIGHT (OPTIONS) — PENDING MUAMMOSINI HAL QILADI
app.options("*", cors());

// JSON BODY
app.use(express.json());

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
app.use("/api/medicines", medicineRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);

/* ===================== */
/* ERROR HANDLER (OPTIONAL, LEKIN FOYDALI) */
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
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
