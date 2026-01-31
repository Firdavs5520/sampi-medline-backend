import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* SUMMARY — MEDICINE + SERVICE (+ DATE FILTER) */
/* ================================================= */
/*
  Query params (ixtiyoriy):
  - from: YYYY-MM-DD
  - to:   YYYY-MM-DD
*/
router.get("/summary", auth, async (req, res) => {
  try {
    const { from, to } = req.query;

    /* ===================== */
    /* DATE FILTER */
    /* ===================== */
    const match = {};
    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      match.createdAt = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    /* ===================== */
    /* AGGREGATION */
    /* ===================== */
    const table = await Administration.aggregate([
      { $match: match },

      {
        $group: {
          _id: "$name", // 🔥 HAR DOIM BOR NOM
          type: { $first: "$type" }, // medicine | service

          qty: {
            $sum: {
              $cond: [
                { $eq: ["$type", "medicine"] },
                { $ifNull: ["$quantity", 1] }, // dorilar
                1, // xizmatlar
              ],
            },
          },

          sum: {
            $sum: {
              $ifNull: ["$price", 0],
            },
          },
        },
      },

      { $sort: { sum: -1 } },
    ]);

    /* ===================== */
    /* KPI */
    /* ===================== */
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
    console.error(e);
    res.status(500).json({ message: "Summary xatosi" });
  }
});

/* ================================================= */
/* TODAY / YESTERDAY COMPARISON */
/* ================================================= */
router.get("/compare", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todaySum = await Administration.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      {
        $group: {
          _id: null,
          sum: { $sum: "$price" },
        },
      },
    ]);

    const yesterdaySum = await Administration.aggregate([
      {
        $match: {
          createdAt: {
            $gte: yesterday,
            $lt: today,
          },
        },
      },
      {
        $group: {
          _id: null,
          sum: { $sum: "$price" },
        },
      },
    ]);

    res.json({
      today: todaySum[0]?.sum || 0,
      yesterday: yesterdaySum[0]?.sum || 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Compare xatosi" });
  }
});

export default router;
