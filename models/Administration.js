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
      default: 1, // xizmatda ishlatilmaydi
    },

    price: {
      type: Number,
      required: true,
    },

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
  { timestamps: true },
);

export default mongoose.model("Administration", AdministrationSchema);
