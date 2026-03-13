import express from "express";
import Administration from "../models/Administration.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/manager-dashboard",
  auth,
  allowRoles("manager"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      const match = {};

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);

        match.date = {
          $gte: fromDate,
          $lte: toDate,
        };
      }

      /* ===================== */
      /* ROLE SUMMARY */
      /* ===================== */

      const byRole = await Administration.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$performedBy.role",
            totalRevenue: {
              $sum: { $multiply: ["$price", "$quantity"] },
            },
            totalCount: { $sum: "$quantity" },
          },
        },
      ]);

      /* ===================== */
      /* SERVICES */
      /* ===================== */

      const topServices = await Administration.aggregate([
        { $match: { ...match, type: "service" } },
        {
          $group: {
            _id: {
              name: "$name",
              role: "$performedBy.role",
            },
            count: { $sum: "$quantity" },
            revenue: {
              $sum: { $multiply: ["$price", "$quantity"] },
            },
          },
        },
        {
          $project: {
            name: "$_id.name",
            role: "$_id.role",
            count: 1,
            revenue: 1,
            type: { $literal: "service" },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      /* ===================== */
      /* MEDICINES */
      /* ===================== */

      const topMedicines = await Administration.aggregate([
        { $match: { ...match, type: "medicine" } },
        {
          $group: {
            _id: {
              name: "$name",
              role: "$performedBy.role",
            },
            count: { $sum: "$quantity" },
            revenue: {
              $sum: { $multiply: ["$price", "$quantity"] },
            },
          },
        },
        {
          $project: {
            name: "$_id.name",
            role: "$_id.role",
            count: 1,
            revenue: 1,
            type: { $literal: "medicine" },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      /* ===================== */
      /* TOP EMPLOYEES */
      /* ===================== */

      const topEmployees = await Administration.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$performedBy.user",
            role: { $first: "$performedBy.role" },
            revenue: {
              $sum: { $multiply: ["$price", "$quantity"] },
            },
            count: { $sum: "$quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            userId: "$user._id",
            name: "$user.name",
            role: 1,
            revenue: 1,
            count: 1,
          },
        },
      ]);

      /* ===================== */
      /* GLOBAL TOTAL */
      /* ===================== */

      const global = await Administration.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ["$price", "$quantity"] },
            },
            totalCount: { $sum: "$quantity" },
          },
        },
      ]);

      res.json({
        summaryByRole: byRole,
        topServices,
        topMedicines,
        topEmployees,
        global: global[0] || {
          totalRevenue: 0,
          totalCount: 0,
        },
      });
    } catch (error) {
      console.error("MANAGER DASHBOARD ERROR:", error);
      res.status(500).json({
        message: "Dashboard olishda xatolik",
      });
    }
  },
);

export default router;
