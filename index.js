import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ROUTES
import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import serviceRoutes from "./routes/services.js";
import administrationRoutes from "./routes/administrations.js";
import reportRoutes from "./routes/reports.js";
import deliveryLogRoutes from "./routes/deliveryLogs.js";
import lorRoutes from "./routes/lor.js";

dotenv.config();

const app = express();

/* ===================== */
/* TRUST PROXY */
/* ===================== */
app.set("trust proxy", 1);

/* ===================== */
/* SECURITY HEADERS */
/* ===================== */
app.use(helmet());

/* ===================== */
/* RATE LIMIT */
/* ===================== */
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 daqiqa
    max: 300, // 1 minutda 300 request
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* ===================== */
/* CORS */
/* ===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "https://sampi-medline.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS bloklandi"));
    },
    credentials: true,
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
  res.status(200).json({
    status: "OK",
    message: "Sampi Medline API ishlayapti 🚀",
    timestamp: new Date(),
  });
});

/* ===================== */
/* ROUTES */
/* ===================== */
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/delivery-logs", deliveryLogRoutes);
app.use("/api/lor", lorRoutes);

/* ===================== */
/* 404 HANDLER */
/* ===================== */
app.use((req, res) => {
  res.status(404).json({
    message: "Route topilmadi",
    path: req.originalUrl,
  });
});

/* ===================== */
/* GLOBAL ERROR HANDLER */
/* ===================== */
app.use((err, _req, res, _next) => {
  console.error("❌ SERVER ERROR:", err);

  res.status(500).json({
    message:
      process.env.NODE_ENV === "production" ? "Server xatoligi" : err.message,
  });
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
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* ===================== */
/* GRACEFUL SHUTDOWN */
/* ===================== */
process.on("SIGINT", async () => {
  console.log("🛑 Server to‘xtatilmoqda...");
  await mongoose.connection.close();
  process.exit(0);
});
