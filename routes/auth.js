import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const r = express.Router();

// FIRST USERS
r.get("/seed", async (_, res) => {
  await User.deleteMany();
  await User.create([
    {
      name: "Nurse",
      email: "nurse@mail.com",
      password: bcrypt.hashSync("1234", 8),
      role: "nurse",
    },
    {
      name: "Manager",
      email: "manager@mail.com",
      password: bcrypt.hashSync("1234", 8),
      role: "manager",
    },
  ]);
  res.send("Users created");
});

r.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.sendStatus(401);

  const ok = bcrypt.compareSync(req.body.password, user.password);
  if (!ok) return res.sendStatus(401);

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
  );

  res.json({ token, role: user.role });
});

export default r;
