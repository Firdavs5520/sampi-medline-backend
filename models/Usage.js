import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Medicine", "Service"],
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "items.type",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 1000, // himoya
    },
    priceAtTime: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const usageSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    items: {
      type: [itemSchema],
      validate: (v) => v.length > 0 && v.length <= 50, // 50 dan ko‘p item bo‘lmaydi
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
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
  { timestamps: true, versionKey: false },
);

usageSchema.index({ createdAt: -1 });

export default mongoose.model("Usage", usageSchema);
