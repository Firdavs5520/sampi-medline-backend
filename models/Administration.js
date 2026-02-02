import mongoose from "mongoose";

const AdministrationSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
      index: true, // ⚡ qidiruv tez
    },

    type: {
      type: String,
      enum: ["medicine", "service"],
      required: true,
      index: true, // ⚡ filter tez
    },

    name: {
      type: String,
      required: true,
      index: true, // ⚡ reportlar uchun
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // 🔥 MUHIM: nurseId (nurse EMAS!)
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // ⚡ populate tez
    },

    date: {
      type: Date,
      default: Date.now,
      index: true, // ⚡ vaqt bo‘yicha sort
    },
  },
  {
    timestamps: true,
    versionKey: false, // 🔹 __v olib tashlandi (toza)
  },
);

/* ===================== */
/* 🔥 COMPOUND INDEX */
/* ===================== */
// oxirgi yozuvlarni tez olish (logs, reports)
AdministrationSchema.index({ createdAt: -1 });

// nurse + vaqt bo‘yicha filter
AdministrationSchema.index({ nurseId: 1, createdAt: -1 });

export default mongoose.model("Administration", AdministrationSchema);
