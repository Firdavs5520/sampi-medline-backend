import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    minLevel: {
      type: Number,
      default: 5,
    },

    lastDeliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastDeliveredAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Medicine", medicineSchema);
