import mongoose from "mongoose";

const AdministrationSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1, // service uchun avtomatik 1
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
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Administration", AdministrationSchema);
