import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
});

export default mongoose.model("Medicine", MedicineSchema);
