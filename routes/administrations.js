import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  res.json(
    await Administration.create({
      ...req.body,
      nurse: req.user.id,
    }),
  );
});

export default router;
