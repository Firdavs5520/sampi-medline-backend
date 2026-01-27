import mongoose from "mongoose";

const AdministrationSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  medicine: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Administration", AdministrationSchema);
