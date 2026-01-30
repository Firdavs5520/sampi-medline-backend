import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
  },
  { timestamps: true },
);

export default mongoose.model("Medicine", MedicineSchema);
