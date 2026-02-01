import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true, // tablet, syrup, injection
    },

    unit: {
      type: String,
      required: true, // dona, ml, mg
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    minLevel: {
      type: Number,
      default: 5, // ⚠️ kam qoldi warning
    },

    status: {
      type: String,
      enum: ["available", "low", "out"],
      default: "available",
    },

    lastDeliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastDeliveredAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

/* 🔄 STATUS AUTO UPDATE */
medicineSchema.pre("save", function (next) {
  if (this.quantity === 0) {
    this.status = "out";
  } else if (this.quantity <= this.minLevel) {
    this.status = "low";
  } else {
    this.status = "available";
  }
  next();
});

export default mongoose.model("Medicine", medicineSchema);
