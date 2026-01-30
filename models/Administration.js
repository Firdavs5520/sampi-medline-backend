import mongoose from "mongoose";

const administrationSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["medicine", "service"],
      required: true,
    },

    itemName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    pricePerUnit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Administration", administrationSchema);
