import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ===================== */
/* SUMMARY (MEDICINE + SERVICE) */
/* ===================== */
router.get("/summary", auth, async (req, res) => {
  try {
    const table = await Administration.aggregate([
      {
        $group: {
          _id: "$name", // 🔥 ASOSIY O‘ZGARISH
          type: { $first: "$type" }, // medicine | service
          qty: {
            $sum: {
              $cond: [
                { $eq: ["$type", "medicine"] },
                "$quantity", // dorilar
                1, // xizmatlar
              ],
            },
          },
          sum: { $sum: "$price" }, // umumiy summa
        },
      },
      { $sort: { sum: -1 } },
    ]);

    const totalQty = table.reduce((s, i) => s + i.qty, 0);
    const totalSum = table.reduce((s, i) => s + i.sum, 0);

    const mostUsed =
      table.length > 0
        ? table.reduce((a, b) => (a.qty > b.qty ? a : b))._id
        : "-";

    res.json({
      cards: {
        totalQty,
        totalSum,
        mostUsed,
        types: table.length,
      },
      table,
    });
  } catch (e) {
    res.status(500).json({ message: "Summary xatosi" });
  }
});

/* ===================== */
/* TODAY / YESTERDAY */
/* ===================== */
router.get("/compare", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todaySum = await Administration.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, sum: { $sum: "$price" } } },
    ]);

    const yesterdaySum = await Administration.aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: today } } },
      { $group: { _id: null, sum: { $sum: "$price" } } },
    ]);

    res.json({
      today: todaySum[0]?.sum || 0,
      yesterday: yesterdaySum[0]?.sum || 0,
    });
  } catch {
    res.status(500).json({ message: "Compare xatosi" });
  }
});

export default router;
