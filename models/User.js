import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // ⚡ login tez (BITTA JOYDA)
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔒 default holatda chiqmaydi
    },

    role: {
      type: String,
      enum: ["delivery", "manager", "nurse"],
      required: true,
      index: true, // ⚡ role bo‘yicha filter tez
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true, // ⚡ aktiv userlar tez
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
// role + aktivlik bo‘yicha tez filter
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", userSchema);
