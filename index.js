import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import medicineRoutes from "./routes/medicines.js";
import administrationRoutes from "./routes/administrations.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/administrations", administrationRoutes);
app.use("/api/reports", reportRoutes);

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT),
);
