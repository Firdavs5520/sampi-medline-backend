import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import auth from "./routes/auth.js";
import medicines from "./routes/medicines.js";
import services from "./routes/services.js";
import administrations from "./routes/administrations.js";
import reports from "./routes/reports.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/medicines", medicines);
app.use("/api/services", services);
app.use("/api/administrations", administrations);
app.use("/api/reports", reports);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(5000, () => console.log("Backend running")));
