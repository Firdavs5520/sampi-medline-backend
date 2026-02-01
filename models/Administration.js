import mongoose from "mongoose";

const administrationSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["medicine", "service"],
      required: true,
    },

    // 🔗 Medicine ishlatilganda
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
    },

    // 🔗 Service ishlatilganda
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    name: {
      type: String,
      required: true, // reportlar uchun (denormalized)
    },

    quantity: {
      type: Number,
      default: 1, // faqat medicine uchun
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  },
);

/* ===================== */
/* INDEXLAR (REPORT UCHUN) */
/* ===================== */
administrationSchema.index({ createdAt: 1 });
administrationSchema.index({ type: 1 });
administrationSchema.index({ nurse: 1 });

export default mongoose.model("Administration", administrationSchema);
