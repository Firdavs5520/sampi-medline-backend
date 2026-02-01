import mongoose from "mongoose";

const serviceVariantSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true, // masalan: "Oddiy", "Premium"
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    variants: {
      type: [serviceVariantSchema],
      default: [],
    },

    basePrice: {
      type: Number,
      min: 0,
      default: 0, // agar variant bo‘lmasa
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Service", serviceSchema);
