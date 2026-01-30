import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  res.json(await Administration.create(req.body));
});

router.get("/", auth, async (_, res) => {
  res.json(await Administration.find());
});

export default router;
