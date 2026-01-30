import mongoose from "mongoose";

export default mongoose.model(
  "Administration",
  new mongoose.Schema({
    patientName: String,
    medicines: [{ name: String, qty: Number, price: Number }],
    services: [{ name: String, price: Number }],
    createdAt: { type: Date, default: Date.now },
  }),
);
