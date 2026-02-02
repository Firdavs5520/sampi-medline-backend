import express from "express";
import Administration from "../models/Administration.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👨‍💼 MANAGER — SUMMARY (MEDICINE + SERVICE) */
/* ================================================= */
/*
  Query params:
  - from: YYYY-MM-DD
  - to:   YYYY-MM-DD
*/
router.get(
  "/summary",
  authMiddleware,
  allowRoles("manager"),
  async (req, res) => {
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

        match.createdAt = { $gte: fromDate, $lte: toDate };
      }

      /* ===================== */
      /* AGGREGATION */
      /* ===================== */
      const table = await Administration.aggregate([
        { $match: match },

        {
          $group: {
            _id: "$name",
            type: { $first: "$type" },

            qty: {
              $sum: {
                $cond: [
                  { $eq: ["$type", "medicine"] },
                  { $ifNull: ["$quantity", 1] },
                  1,
                ],
              },
            },

            sum: { $sum: "$price" },
          },
        },

        { $sort: { sum: -1 } },
      ]).allowDiskUse(true);

      /* ===================== */
      /* KPI */
      /* ===================== */
      let totalQty = 0;
      let totalSum = 0;
      let mostUsed = "-";

      if (table.length) {
        let maxQty = 0;

        for (const row of table) {
          totalQty += row.qty;
          totalSum += row.sum;

          if (row.qty > maxQty) {
            maxQty = row.qty;
            mostUsed = row._id;
          }
        }
      }

      res.json({
        cards: {
          totalQty,
          totalSum,
          mostUsed,
          types: table.length,
        },
        table,
      });
    } catch (error) {
      console.error("SUMMARY ERROR:", error);
      res.status(500).json({
        message: "Summary olishda xatolik",
      });
    }
  },
);

/* ================================================= */
/* 👨‍💼 MANAGER — TODAY / YESTERDAY COMPARISON */
/* ================================================= */
router.get(
  "/compare",
  authMiddleware,
  allowRoles("manager"),
  async (_req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      /* ⚡ parallel aggregation */
      const [todaySum, yesterdaySum] = await Promise.all([
        Administration.aggregate([
          { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
          { $group: { _id: null, sum: { $sum: "$price" } } },
        ]),

        Administration.aggregate([
          { $match: { createdAt: { $gte: yesterday, $lt: today } } },
          { $group: { _id: null, sum: { $sum: "$price" } } },
        ]),
      ]);

      res.json({
        today: todaySum[0]?.sum || 0,
        yesterday: yesterdaySum[0]?.sum || 0,
      });
    } catch (error) {
      console.error("COMPARE ERROR:", error);
      res.status(500).json({
        message: "Compare olishda xatolik",
      });
    }
  },
);

export default router;
