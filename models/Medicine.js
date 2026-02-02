import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // ⚡ qidiruv tez
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0, // ❗ manfiy ketmasin
      index: true, // ⚡ stock filter tez
    },

    minLevel: {
      type: Number,
      default: 5,
      min: 0,
      index: true, // ⚡ kam qolganlarni tez olish
    },

    lastDeliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    lastDeliveredAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/* ===================== */
/* 🔥 COMPOUND INDEX */
/* ===================== */
// kam qolgan dorilarni tez topish
medicineSchema.index({ quantity: 1, minLevel: 1 });

// oxirgi yetkazilgan dorilar
medicineSchema.index({ lastDeliveredAt: -1 });

export default mongoose.model("Medicine", medicineSchema);
