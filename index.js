import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// ROUTES
import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import administrationRoutes from "./routes/administrations.js";
import reportRoutes from "./routes/reports.js";
import serviceRoutes from "./routes/services.js"; // 🔥 YANGI

dotenv.config();

const app = express();

/* ===================== */
/* MIDDLEWARES */
/* ===================== */
app.use(
  cors({
    origin: "*", // agar frontend domen bo‘lsa, keyin shu yerga yozamiz
  }),
);
app.use(express.json());

/* ===================== */
/* HEALTH CHECK */
/* ===================== */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Sampi Medline Backend ishlayapti 🚀",
    time: new Date().toISOString(),
  });
});

/* ===================== */
/* API ROUTES */
/* ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/services", serviceRoutes); // 🔥 XIZMATLAR
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);

/* ===================== */
/* GLOBAL ERROR HANDLER */
/* ===================== */
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    message: "Serverda xatolik yuz berdi",
  });
});

/* ===================== */
/* DB CONNECT */
/* ===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* ===================== */
/* START SERVER */
/* ===================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
