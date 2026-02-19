import express from "express";
import Usage from "../models/Usage.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", auth, allowRoles("manager"), async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = {};

    if (from && to) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      match.createdAt = { $gte: fromDate, $lte: toDate };
    }

    const table = await Usage.aggregate([
      { $match: match },

      // 🔥 items ni ochamiz
      { $unwind: "$items" },

      {
        $group: {
          _id: {
            role: "$usedBy.role",
            type: "$items.type",
          },
          qty: { $sum: "$items.quantity" },
          sum: { $sum: "$items.total" },
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
    ]);

    let totalQty = 0;
    let totalSum = 0;

    const byRole = {
      nurse: { Service: 0, Medicine: 0 },
      lor: { Service: 0 },
    };

    for (const row of table) {
      totalQty += row.qty;
      totalSum += row.sum;

      if (!byRole[row.role]) continue;
      if (!byRole[row.role][row.type]) continue;

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
});

export default router;
