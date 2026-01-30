import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ===== SUMMARY ===== */
router.get("/summary", auth, async (req, res) => {
  const data = await Administration.aggregate([
    {
      $group: {
        _id: "$medicine",
        qty: { $sum: "$quantity" },
        sum: { $sum: { $multiply: ["$quantity", "$pricePerUnit"] } },
      },
    },
  ]);

  const totalQty = data.reduce((s, i) => s + i.qty, 0);
  const totalSum = data.reduce((s, i) => s + i.sum, 0);

  const mostUsed =
    data.length > 0 ? data.reduce((a, b) => (a.qty > b.qty ? a : b))._id : "-";

  res.json({
    cards: {
      totalQty,
      totalSum,
      mostUsed,
      types: data.length,
    },
    table: data,
  });
});

/* ===== TODAY / YESTERDAY ===== */
router.get("/compare", auth, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todaySum = await Administration.aggregate([
    { $match: { date: { $gte: today } } },
    { $group: { _id: null, sum: { $sum: "$pricePerUnit" } } },
  ]);

  const yesterdaySum = await Administration.aggregate([
    { $match: { date: { $gte: yesterday, $lt: today } } },
    { $group: { _id: null, sum: { $sum: "$pricePerUnit" } } },
  ]);

  res.json({
    today: todaySum[0]?.sum || 0,
    yesterday: yesterdaySum[0]?.sum || 0,
  });
});

export default router;
