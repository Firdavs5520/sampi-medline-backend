import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["service", "medicine"],
      required: true,
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
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

    total: {
      type: Number,
      required: true,
    },

    usedBy: {
      role: {
        type: String,
        enum: ["nurse", "lor"],
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("Usage", usageSchema);
