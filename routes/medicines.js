import express from "express";
import Medicine from "../models/Medicine.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (_, res) => {
  res.json(await Medicine.find());
});

router.post("/", auth, async (req, res) => {
  res.json(await Medicine.create(req.body));
});

router.delete("/:id", auth, async (req, res) => {
  await Medicine.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
