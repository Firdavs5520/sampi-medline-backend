import express from "express";
import Administration from "../models/Administration.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

/* ================================================= */
/* 👨‍💼 MANAGER DASHBOARD (FULL ANALYTICS) */
/* ================================================= */
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
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        match.date = { $gte: fromDate, $lte: toDate };
      }

      /* ===================== */
      /* 🔹 Nurse vs LOR SUMMARY */
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
      /* 🔹 TOP SERVICES */
      /* ===================== */
      const topServices = await Administration.aggregate([
        { $match: { ...match, type: "service" } },
        {
          $group: {
            _id: "$name",
            count: { $sum: "$quantity" },
            revenue: {
              $sum: { $multiply: ["$price", "$quantity"] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      /* ===================== */
      /* 🔹 TOP EMPLOYEES */
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
            _id: 0,
            userId: "$user._id",
            name: "$user.name",
            role: 1,
            revenue: 1,
            count: 1,
          },
        },
      ]);

      /* ===================== */
      /* 🔹 GLOBAL TOTAL */
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
