import express from "express";
import Service from "../models/Service.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* CREATE SERVICE */
router.post("/", auth, async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.json(service);
  } catch (e) {
    res.status(500).json({ message: "Xizmat qo‘shishda xato" });
  }
});

/* GET ALL SERVICES */
router.get("/", auth, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (e) {
    res.status(500).json({ message: "Xizmatlarni olishda xato" });
  }
});

/* UPDATE SERVICE */
router.put("/:id", auth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!service) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json(service);
  } catch (e) {
    res.status(500).json({ message: "Xizmatni tahrirlashda xato" });
  }
});

/* DELETE SERVICE */
router.delete("/:id", auth, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Xizmat topilmadi" });
    }

    res.json({ message: "Xizmat o‘chirildi" });
  } catch (e) {
    res.status(500).json({ message: "Xizmatni o‘chirishda xato" });
  }
});

export default router;
