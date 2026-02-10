import express from "express";
import Usage from "../models/Usage.js";
import { authMiddleware, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👨‍💼 MANAGER — SUMMARY (ROLE + TYPE) */
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
      const table = await Usage.aggregate([
        { $match: match },

        {
          $group: {
            _id: {
              role: "$usedBy.role", // nurse / lor
              type: "$type", // service / medicine
            },
            qty: { $sum: "$quantity" },
            sum: { $sum: "$total" },
          },
        },

        {
          $project: {
            _id: 0,
            role: "$_id.role",
            type: "$_id.type",
            qty: 1,
            sum: 1,
          },
        },

        { $sort: { sum: -1 } },
      ]).allowDiskUse(true);

      /* ===================== */
      /* KPI */
      /* ===================== */
      let totalQty = 0;
      let totalSum = 0;

      const byRole = {
        nurse: { service: 0, medicine: 0 },
        lor: { service: 0 },
      };

      for (const row of table) {
        totalQty += row.qty;
        totalSum += row.sum;

        if (!byRole[row.role]) continue;
        byRole[row.role][row.type] = row.sum;
      }

      res.json({
        cards: {
          totalQty,
          totalSum,
        },
        byRole,
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

export default router;
