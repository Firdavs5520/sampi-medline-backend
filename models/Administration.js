import mongoose from "mongoose";

const AdministrationSchema = new mongoose.Schema(
  {
    patientName: String,

    type: {
      type: String,
      enum: ["medicine", "service"],
      required: true,
    },

    itemName: String, // dori yoki xizmat nomi
    quantity: Number,
    pricePerUnit: Number,

    nurse: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("Administration", AdministrationSchema);
