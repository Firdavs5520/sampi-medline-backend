import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    variants: {
      type: [
        {
          label: String,
          count: Number,
          price: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
