import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["nurse", "manager"] },
});

export default mongoose.model("User", UserSchema);
