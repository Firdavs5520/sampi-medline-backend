import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
  },
  { timestamps: true },
);

export default mongoose.model("Service", ServiceSchema);
