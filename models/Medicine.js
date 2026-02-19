import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // unique o‘zi index yaratadi
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    minLevel: {
      type: Number,
      default: 5,
      min: 0,
    },

    lastDeliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastDeliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ========================= */
/* 🔥 PERFORMANCE INDEXLAR */
/* ========================= */

// Kam qolgan dorilarni tez topish
medicineSchema.index({ quantity: 1, minLevel: 1 });

// Oxirgi yetkazilganlarni tez olish
medicineSchema.index({ lastDeliveredAt: -1 });

// Agar search kerak bo‘lsa (ixtiyoriy)
medicineSchema.index({ name: "text" });

/* ========================= */
/* 🔥 STATIC METHODLAR */
/* ========================= */

// Dori qo‘shish (delivery)
medicineSchema.statics.addStock = async function (
  medicineId,
  amount,
  userId
) {
  return this.findByIdAndUpdate(
    medicineId,
    {
      $inc: { quantity: amount },
      lastDeliveredBy: userId,
      lastDeliveredAt: new Date(),
    },
    { new: true }
  );
};

// Dori ishlatish (nurse) — ATOMIC & SAFE
medicineSchema.statics.useStock = async function (
  medicineId,
  amount
) {
  return this.findOneAndUpdate(
    { _id: medicineId, quantity: { $gte: amount } },
    { $inc: { quantity: -amount } },
    { new: true }
  );
};

export default mongoose.model("Medicine", medicineSchema);
