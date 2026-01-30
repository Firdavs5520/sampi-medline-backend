import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    variants: [
      {
        label: {
          type: String, // "1 marta", "2 marta"
          required: true,
        },
        count: {
          type: Number, // 1, 2
          required: true,
        },
        price: {
          type: Number, // 30000, 50000
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Service", serviceSchema);
