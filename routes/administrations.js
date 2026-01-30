import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    console.log("REQ.USER:", req.user);
    console.log("REQ.BODY:", req.body);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User aniqlanmadi" });
    }

    const { patientName, type, name, quantity, price } = req.body;

    if (!patientName || !type || !name || !price) {
      return res.status(400).json({ message: "Majburiy maydon yetishmayapti" });
    }

    const admin = await Administration.create({
      patientName,
      type,
      name,
      quantity: type === "medicine" ? quantity : 1,
      price,
      nurseId: req.user.id,
    });

    res.json(admin);
  } catch (e) {
    console.error("ADMIN CREATE ERROR:", e);
    res.status(500).json({ message: e.message });
  }
});

export default router;
