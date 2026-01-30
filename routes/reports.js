import express from "express";
import Administration from "../models/Administration.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/summary", auth, async (_, res) => {
  const table = await Administration.aggregate([
    {
      $group: {
        _id: "$itemName",
        qty: { $sum: "$quantity" },
        sum: { $sum: { $multiply: ["$quantity", "$pricePerUnit"] } },
      },
    },
  ]);

  const totalQty = table.reduce((a, b) => a + b.qty, 0);
  const totalSum = table.reduce((a, b) => a + b.sum, 0);

  res.json({
    cards: {
      totalQty,
      totalSum,
      mostUsed: table[0]?._id || "-",
      types: table.length,
    },
    table,
  });
});

export default router;
