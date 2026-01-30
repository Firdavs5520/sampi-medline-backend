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
    origin: "*", // frontend domain qo‘ysang ham bo‘ladi
    credentials: true,
  }),
);
app.use(express.json());

/* ===================== */
/* ROUTES */
/* ===================== */
app.get("/", (req, res) => {
  res.send("Sampi Medline API is running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);

/* ===================== */
/* DB + SERVER */
/* ===================== */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
