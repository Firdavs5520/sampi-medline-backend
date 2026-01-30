import express from "express";
import Service from "../models/Service.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (_, res) => {
  res.json(await Service.find());
});

router.post("/", auth, async (req, res) => {
  res.json(await Service.create(req.body));
});

export default router;
