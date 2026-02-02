import mongoose from "mongoose";

const AdministrationOrderSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        type: {
          type: String,
          enum: ["medicine", "service"],
          required: true,
        },
        name: String,
        quantity: Number,
        price: Number,
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
        },
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
      },
    ],

    total: Number,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("AdministrationOrder", AdministrationOrderSchema);
