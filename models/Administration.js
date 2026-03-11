import mongoose from "mongoose";

const administrationSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["medicine", "service"],
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    performedBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      role: {
        type: String,
        enum: ["nurse", "lor"],
        required: true,
        index: true,
      },
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

administrationSchema.index({ "performedBy.role": 1, date: -1 });

export default mongoose.model("Administration", administrationSchema);
