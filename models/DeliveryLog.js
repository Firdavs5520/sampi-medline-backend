import mongoose from "mongoose";

const DeliveryLogSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
      index: true, // ⚡ dori bo‘yicha filter tez
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ⚡ delivery xodim bo‘yicha filter
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
// oxirgi deliverylar tez chiqadi
DeliveryLogSchema.index({ createdAt: -1 });

// ma’lum bir dori bo‘yicha tarix
DeliveryLogSchema.index({ medicine: 1, createdAt: -1 });

// delivery xodim + vaqt
DeliveryLogSchema.index({ deliveredBy: 1, createdAt: -1 });

export default mongoose.model("DeliveryLog", DeliveryLogSchema);
