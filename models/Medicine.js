import mongoose from "mongoose";

export default mongoose.model(
  "Medicine",
  new mongoose.Schema({
    name: String,
    price: Number,
  }),
);
