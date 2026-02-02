import mongoose from "mongoose";

/* ===================== */
/* SERVICE VARIANT */
/* ===================== */
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

/* ===================== */
/* SERVICE */
/* ===================== */
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true, // ⚡ tez qidiruv
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
      index: true, // ⚡ aktiv xizmatlar tez
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ===================== */
/* 🔥 INDEXLAR */
/* ===================== */
// aktiv xizmatlarni tez olish
serviceSchema.index({ isActive: 1, createdAt: -1 });

// nom bo‘yicha tez sort / qidiruv
serviceSchema.index({ name: 1 });

export default mongoose.model("Service", serviceSchema);
