import { Router } from "express";
import leadModelV2 from "../model/lead/leadV2Model.js";
import { errorRes2, successRes2 } from "../model/response.js";
import { leadPopulateOptions } from "../utils/constant.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import employeeModel from "../model/employee.model.js";
import taskModel from "../model/task.model.js";
import moment from "moment-timezone";
import leadModel from "../model/lead/lead.model.js";
import { getLeadsTeamLeaderV2 } from "../controllerV2/leadsController.js";
import {
  bulk_cp_lead_trigger_35,
  internalLeadCycleTrigger,
  leadCycleChange_600_from_March_01_2025,
  leadCycleTriggerV4,
} from "../v2Controller/v2LeadController.js";
import triggerHistoryModel from "../model/triggerLog.model.js";
import estimateGeneratedModel from "../model/estimateGenerate.model.js";
import siteVisitModel from "../model/siteVisit.model.js";
import { console } from "inspector";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import logger from "../utils/logger.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leadRouterV2 = Router();

leadRouterV2.post(
  "/add-cp-to-queue/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const { channelPartner, employee, status, startDate, validTill } = req.body;
    const user = req.user;
    const now = new Date();

    try {
      //
      const resp = await leadModelV2.findById(id);
      if (!resp) return errorRes2(res, 401, "No lead found");

      const updatedResp = await leadModelV2
        .findByIdAndUpdate(
          id,
          {
            $addToSet: {
              channelPartnerHistory: {
                channelPartner: channelPartner,
                date: now,
                status: status,
                startDate: startDate,
                validTill: validTill,
                approval: {
                  employee: employee ?? user?._id,
                  approvedAt: now,
                  remark: status,
                },
              },
            },
          },
          { new: true },
        )
        .populate(leadPopulateOptions);

      return successRes2(res, 200, "added to queue", { data: updatedResp });
    } catch (error) {
      //
      res.json(error);
    }
  },
);

leadRouterV2.post(
  "/retag-channel-partner/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const { channelPartner, status, remark, startDate, validTill } = req.body;
    const user = req.user;
    // logger.info(req.body);
    const now = new Date();
    try {
      //
      const resp = await leadModelV2.findById(id);
      if (!resp) return errorRes2(res, 401, "No lead found");
      // Check if channelPartner exists in history
      const updatedResp = await leadModelV2
        .findByIdAndUpdate(
          id,
          {
            leadType: "cp",
            channelPartner: channelPartner,
            startDate: startDate,
            validTill: validTill,
            $addToSet: {
              channelPartnerHistory: {
                channelPartner: channelPartner,
                status: status,
                startDate: startDate,
                date: startDate,
                validTill: validTill,
                approval: {
                  employee: user?._id,
                  approvedAt: startDate,
                  remark: remark ?? "approved",
                },
              },
              updateHistory: {
                employee: user?._id,
                changes: `${JSON.stringify(req.body)}`,
                updatedAt: now,
                remark: "retag-cp",
              },
              approvalHistory: {
                employee: user?._id,
                approvedAt: startDate,
                remark: remark ?? "approved",
              },
            },
          },
          { new: true },
        )
        .populate(leadPopulateOptions);

      return successRes2(res, 200, "added to queue", { data: updatedResp });
    } catch (error) {
      //
      // logger.info(error);
      return errorRes2(res, 500, "Internal Server Error");
    }
  },
);

leadRouterV2.post("/add-cp-to-queue-list", async (req, res) => {
  try {
    const filterDate = new Date("2024-12-10");
    //
    const resp = await leadModelV2.find({
      leadType: "cp",
      startDate: { $lt: filterDate },
      channelPartner: { $ne: null },
    });

    // await Promise.all(
    //   resp.map(async (lead) => {
    //     try {
    //       //
    //       await leadModelV2.findByIdAndUpdate(lead?._id, {
    //         $addToSet: {
    //           channelPartnerHistory: {
    //             channelPartner: lead?.channelPartner,
    //             date: lead?.startDate,
    //             startDate: lead?.startDate,
    //             validTill: lead?.validTill,
    //             status: lead?.approvalStatus,
    //             approval: {
    //               employee: lead?.dataAnalyzer,
    //               approvedAt: lead?.approvalDate,
    //               remark: lead?.approvalRemark,
    //             },
    //           },
    //         },
    //       });
    //     } catch (error) {
    //       //
    //       logger.info(error);
    //     }
    //   })
    // );

    // const updated = await leadModelV2.findByIdAndUpdate(
    //   resp._id,
    //   {
    //     $addToSet: {
    //       channelPartnerHistory: {
    //         channelPartner: resp.channelPartner,
    //         date: resp.startDate,
    //         startDate: resp.startDate,
    //         validTill: resp.validTill,
    //         status: resp.approvalStatus,
    //         approval: {
    //           employee: resp.dataAnalyzer,
    //           approvedAt: resp.approvalDate,
    //           remark: resp.approvalRemark,
    //         },
    //       },
    //     },
    //   },
    //   { new: true }
    // );
    res.json(resp);
  } catch (error) {
    //
    // logger.info(error);
    res.json(error);
  }
});

leadRouterV2.post("/find-same-phone-lead", async (req, res) => {
  try {
    const filterDate = new Date("2024-12-10");

    const cursor = await leadModelV2.aggregate([
      {
        $group: {
          _id: "$phoneNumber", // Group by phone number
          count: { $sum: 1 }, // Count occurrences of each phone number
        },
      },
      {
        $match: {
          count: { $gt: 1 }, // Only consider numbers with duplicates
        },
      },
    ]);

    // Convert the aggregation cursor to an array
    // const duplicateCount = await cursor.toArray();

    res.json({ total: cursor.length, data: cursor });
  } catch (error) {
    //
    // logger.info(error);
    res.json(error);
  }
});

leadRouterV2.post("/merge-duplicate-leads", async (req, res) => {
  try {
    const duplicatePhones = await leadModelV2.aggregate([
      {
        $group: {
          _id: "$phoneNumber",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    const results = [];
    // const filteredList = duplicatePhones;
    // for (const dup of filteredList) {
    //   const phone = dup._id;

    //   const leads = await leadModelV2
    //     .find({ phoneNumber: phone })
    //     .sort({ createdAt: -1 });

    //   if (leads.length < 2) continue;

    //   const latestLead = leads[0];
    //   const olderLeads = leads.slice(1);

    //   // --- Merge callHistory normally ---
    //   let mergedCallHistory = [...(latestLead.callHistory || [])];
    //   for (const oldLead of olderLeads) {
    //     mergedCallHistory.push(...(oldLead.callHistory || []));
    //   }
    //   // ✅ Just sort by callDate ascending
    //   mergedCallHistory.sort(
    //     (a, b) => new Date(a?.callDate) - new Date(b?.callDate)
    //   );

    //   // --- Merge and deduplicate channelPartnerHistory ---
    //   let allCPHistory = [...(latestLead.channelPartnerHistory || [])];
    //   for (const oldLead of olderLeads) {
    //     allCPHistory.push(...(oldLead.channelPartnerHistory || []));
    //   }

    //   // Remove exact duplicates based on 4 key fields
    //   const seen = new Set();
    //   const uniqueCPHistory = allCPHistory.filter((entry) => {
    //     const key = `${entry?.channelPartner}_${entry?.startDate}_${entry?.endDate}_${entry?.status}`;
    //     if (seen.has(key)) return false;
    //     seen.add(key);
    //     return true;
    //   });

    //   // Sort by startDate after filtering
    //   uniqueCPHistory.sort(
    //     (a, b) => new Date(a?.startDate) - new Date(b?.startDate)
    //   );

    //   // --- Merge history tracking ---
    //   const mergeHistory = olderLeads.map((lead) => lead.toObject());
    //   mergeHistory.sort(
    //     (a, b) => new Date(a?.createdAt) - new Date(b?.createdAt)
    //   );

    //   // --- Save latest lead ---
    //   latestLead.callHistory = mergedCallHistory;
    //   latestLead.channelPartnerHistory = uniqueCPHistory;
    //   latestLead.mergeHistory = mergeHistory;

    //   await latestLead.save();

    //   // --- Delete older leads ---
    //   await leadModelV2.deleteMany({
    //     _id: { $in: olderLeads.map((l) => l._id) },
    //   });

    //   results.push({
    //     phoneNumber: phone,
    //     mergedInto: latestLead._id,
    //     deletedLeads: olderLeads.length,
    //   });
    // }

    res.json({
      success: true,
      message: "Leads merged successfully, duplicates removed.",
      mergedLeads: results,
    });
  } catch (error) {
    console.error("Merge error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error occurred.",
    });
  }
});

leadRouterV2.get(
  "/sales-dashboard-count/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    let { startDate, endDate, interval } = req.query;
    const filterDate = new Date("2024-12-10");
    const now = new Date();

    if (interval === "monthly") {
      startDate = moment().startOf("month").toDate();
      endDate = moment().endOf("month").toDate();
    } else if (interval === "quarterly") {
      startDate = moment().startOf("quarter").toDate();
      endDate = moment().endOf("quarter").toDate();
    } else if (interval === "semi-annually") {
      const month = moment().month();
      const year = moment().year();
      const isFirstHalf = month < 6;

      startDate = moment([year, isFirstHalf ? 0 : 6])
        .startOf("month")
        .toDate();
      endDate = moment([year, isFirstHalf ? 5 : 11])
        .endOf("month")
        .toDate();
    } else if (interval === "annually") {
      startDate = moment().startOf("year").toDate();
      endDate = moment().endOf("year").toDate();
    }
    // logger.info(interval);
    // logger.info(startDate);
    // logger.info(endDate);

    const dateFilter =
      startDate && endDate
        ? {
            startDate: {
              $gte: startDate,
              $lte: endDate,
            },
          }
        : {};

    const allCounts = {
      id: id,
      name: null,
      designation: null,
      date: now,
      startDate: startDate,
      endDate: endDate,
      lead: {
        total: 0,
        visit1: 0,
        visit2: 0,
        revisit: 0,
        booking: 0,
        pending: 0,
        assigned: 0,
        notAssigned: 0,
        lineup: 0,
        bookingCp: 0,
        bookingWalkIn: 0,
        cpNotePendingCount: 0,
        internalLeadCount: 0,
        exhibition2025: 0,
      },
      task: {
        total: 0,
        pending: 0,
        completed: 0,
      },
    };

    try {
      const empResp = await employeeModel
        .findById(id)
        .select("firstName lastName reportingTo designation");
      //
      allCounts.name = `${empResp.firstName} ${empResp.lastName}`;
      allCounts.designation = empResp.designation;
      const today = moment().tz("Asia/Kolkata");

      const counts = await leadModelV2.aggregate([
        {
          $match: {
            teamLeader: empResp.reportingTo,
            ...dateFilter,

            // startDate: { $gte: filterDate },
          },
        },
        {
          $facet: {
            totalItems: [
              {
                $match: {
                  disabled: false,
                },
              },
              { $count: "count" },
            ],
            pendingCount: [
              {
                $match: {
                  disabled: false,
                  $or: [
                    // { visitRef: { $eq: null } },
                    // { revisitRef: { $eq: null } },

                    {
                      visitStatus: "pending",
                      bookingStatus: { $ne: "booked" },
                    },
                    {
                      revisitStatus: "pending",
                      bookingStatus: { $ne: "booked" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            assignedCount: [
              { $match: { disabled: false, taskRef: { $ne: null } } },
              { $count: "count" },
            ],
            notAssignedCount: [
              { $match: { disabled: false, taskRef: { $eq: null } } },
              { $count: "count" },
            ],
            visitCount: [
              {
                $match: {
                  disabled: false,
                  stage: { $ne: "approval" },
                  stage: { $ne: "booking" },
                  $and: [
                    {
                      visitStatus: { $ne: null },
                    },
                    {
                      visitStatus: { $ne: "pending" },
                    },
                    { leadType: { $eq: "cp" } },
                  ],
                },
              },
              { $count: "count" },
            ],
            revisitCount: [
              {
                $match: {
                  disabled: false,
                  stage: "booking",
                  $and: [
                    {
                      revisitStatus: { $ne: null },
                    },
                    {
                      revisitStatus: { $ne: "pending" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            visit2Count: [
              {
                $match: {
                  disabled: false,
                  visitStatus: { $ne: "pending" },

                  $or: [
                    {
                      leadType: { $eq: "walk-in" },
                    },
                    {
                      leadType: { $eq: "internal-lead" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingCount: [
              {
                $match: {
                  stage: "booking",
                  // bookingStatus: { $ne: "pending" },
                  $and: [
                    {
                      bookingStatus: { $eq: "booked" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            internalLeadCount: [
              {
                $match: {
                  disabled: false,
                  $and: [{ leadType: { $eq: "internal-lead" } }],
                },
              },
              { $count: "count" },
            ],
            lineUpCount: [
              {
                $match: {
                  disabled: false,
                  $and: [
                    { siteVisitInterested: { $eq: true } },
                    { siteVisitInterestedDate: { $gte: today.toDate() } },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingWalkinCount: [
              {
                $match: {
                  stage: "booking",
                  $and: [
                    { bookingStatus: { $eq: "booked" } },
                    {
                      $or: [
                        { leadType: "walk-in" },
                        { leadType: "internal-lead" },
                      ],
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingCpCount: [
              {
                $match: {
                  stage: "booking",
                  $and: [
                    { bookingStatus: { $eq: "booked" } },
                    { leadType: "cp" },
                  ],
                },
              },
              { $count: "count" },
            ],
            bulkCount: [
              {
                $match: {
                  disabled: false,
                  isBulkLead: true,
                },
              },
              { $count: "count" },
            ],

            cpNotePendingCount: [
              {
                $match: {
                  $and: [
                    { cpNoteResolved: false },
                    { "callHistory.notes": { $exists: true } },
                    // { "callHistory.notes": { $ne: [] } },
                  ],
                },
              },
              { $count: "count" },
            ],

            exhibition2025: [
              {
                $match: {
                  leadFrom: "exhibition-2025",
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $addFields: {
            totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
            pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
            assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
            notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
            visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
            revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
            visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
            bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
            lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
            bookingWalkinCount: {
              $arrayElemAt: ["$bookingWalkinCount.count", 0],
            },
            bookingCpCount: { $arrayElemAt: ["$bookingCpCount.count", 0] },
            cpNotePendingCount: {
              $arrayElemAt: ["$cpNotePendingCount.count", 0],
            },
            bulkCount: {
              $arrayElemAt: ["$bulkCount.count", 0],
            },
            internalLeadCount: {
              $arrayElemAt: ["$internalLeadCount.count", 0],
            },
            exhibition2025: {
              $arrayElemAt: ["$exhibition2025.count", 0],
            },
          },
        },
        {
          $project: {
            totalItems: 1,
            pendingCount: 1,
            assignedCount: 1,
            visitCount: 1,
            revisitCount: 1,
            visit2Count: 1,
            bookingCount: 1,
            lineUpCount: 1,
            notAssignedCount: 1,
            bookingWalkinCount: 1,
            bookingCpCount: 1,
            cpNotePendingCount: 1,
            bulkCount: 1,
            internalLeadCount: 1,
            exhibition2025: 1,

            // Include only the fields you need
          },
        },
      ]);

      const {
        totalItems = 0,
        pendingCount = 0,
        // contactedCount = 0,
        // followUpCount = 0,
        assignedCount = 0,
        visitCount = 0,
        revisitCount = 0,
        visit2Count = 0,
        bookingCount = 0,
        lineUpCount = 0,
        notAssignedCount = 0,
        bookingWalkinCount = 0,
        bookingCpCount = 0,
        cpNotePendingCount = 0,
        bulkCount = 0,
        internalLeadCount = 0,
        exhibition2025 = 0,
        // Add other counts as required
      } = counts[0] || {};

      allCounts.lead.total = totalItems;
      allCounts.lead.pending = pendingCount;
      allCounts.lead.visit1 = visitCount;
      allCounts.lead.visit2 = visit2Count;
      allCounts.lead.revisit = revisitCount;
      allCounts.lead.assigned = assignedCount;
      allCounts.lead.lineup = lineUpCount;
      allCounts.lead.notAssigned = notAssignedCount;
      allCounts.lead.booking = bookingCount;
      allCounts.lead.bookingCp = bookingCpCount;
      allCounts.lead.bookingWalkIn = bookingWalkinCount;
      allCounts.lead.cpNotePendingCount = cpNotePendingCount;
      allCounts.lead.bulkCount = bulkCount;
      allCounts.lead.internalLeadCount = internalLeadCount;
      allCounts.lead.exhibition2025 = exhibition2025;

      // logger.info({
      //   assignTo: id,
      //   // teamLeader: empResp.reportingTo,
      //   deadline: { $gte: now },
      // });
      const taskCounts = await taskModel.aggregate([
        {
          $match: {
            disabled: false,

            assignTo: id,
            // teamLeader: empResp.reportingTo,
            deadline: { $gte: now },
          },
        },
        {
          $facet: {
            totalTasks: [{ $count: "count" }],
            pendingTaskCount: [
              { $match: { completed: { $eq: false } } },
              { $count: "count" },
            ],
            completedTaskCount: [
              { $match: { completed: { $eq: true } } },
              { $count: "count" },
            ],
            // Add other count stages as required
          },
        },
        {
          $addFields: {
            totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
            pendingTaskCount: { $arrayElemAt: ["$pendingTaskCount.count", 0] },
            completedTaskCount: {
              $arrayElemAt: ["$completedTaskCount.count", 0],
            },
            // Add other fields similarly as required
          },
        },
        {
          $project: {
            totalTasks: 1,
            pendingTaskCount: 1,
            completedTaskCount: 1,
            // Include only the fields you need
          },
        },
      ]);
      const {
        totalTasks = 0,
        pendingTaskCount = 0,
        completedTaskCount = 0,
      } = taskCounts[0] || {};

      allCounts.task.total = totalTasks;
      allCounts.task.pending = pendingTaskCount;
      allCounts.task.completed = completedTaskCount;

      return successRes2(res, 200, "Dashboard Counts", { data: allCounts });
    } catch (error) {
      //
      // logger.info(error);
      return errorRes2(res, 500, "Internal Server Error");
    }
  },
);

leadRouterV2.get(
  "/closing-manager-dashboard-count/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    let { startDate, endDate, interval } = req.query;
    const filterDate = new Date("2024-12-10");
    const now = new Date();
    const currentDate = new Date();
    // logger.info(req.query);
    // logger.info(req.params);

    if (interval === "monthly") {
      startDate = moment().startOf("month").toDate();
      endDate = moment().endOf("month").toDate();
    } else if (interval === "quarterly") {
      startDate = moment().startOf("quarter").toDate();
      endDate = moment().endOf("quarter").toDate();
    } else if (interval === "semi-annually") {
      const month = moment().month();
      const year = moment().year();
      const isFirstHalf = month < 6;

      startDate = moment([year, isFirstHalf ? 0 : 6])
        .startOf("month")
        .toDate();
      endDate = moment([year, isFirstHalf ? 5 : 11])
        .endOf("month")
        .toDate();
    } else if (interval === "annually") {
      startDate = moment().startOf("year").toDate();
      endDate = moment().endOf("year").toDate();
    }
    // logger.info(interval);
    // logger.info(startDate);
    // logger.info(endDate);

    const dateFilter =
      startDate && endDate
        ? {
            startDate: {
              $gte: startDate,
              $lte: endDate,
            },
          }
        : null;

    // logger.info(dateFilter);
    const allCounts = {
      id: id,
      name: null,
      designation: null,
      date: now,
      startDate: startDate,
      endDate: endDate,
      lead: {
        total: 0,
        visit1: 0,
        visit2: 0,
        revisit: 0,
        booking: 0,
        pending: 0,
        assigned: 0,
        notAssigned: 0,
        lineup: 0,
        bookingCp: 0,
        bookingWalkIn: 0,
        cpNotePendingCount: 0,
        internalLeadCount: 0,
        bulkCount: 0,
        exhibition2025: 0,
      },
      task: {
        total: 0,
        pending: 0,
        completed: 0,
      },
    };

    try {
      const empResp = await employeeModel
        .findById(id)
        .select("firstName lastName reportingTo designation");
      //
      allCounts.name = `${empResp.firstName} ${empResp.lastName}`;
      allCounts.designation = empResp.designation;
      const today = moment().tz("Asia/Kolkata");
      let filter = {
        $match: {
          teamLeader: id,
        },
      };
      if (dateFilter != null) {
        filter.$match = {
          ...filter.$match,
          ...dateFilter,
        };
      }
      // logger.info(filter);
      const counts = await leadModelV2.aggregate([
        filter,
        {
          $facet: {
            totalItems: [
              {
                $match: {
                  disabled: false,
                },
              },
              { $count: "count" },
            ],
            pendingCount: [
              {
                $match: {
                  disabled: false,
                  $or: [
                    // { visitRef: { $ne: null } },
                    // { revisitRef: { $ne: null } },
                    {
                      visitStatus: "pending",
                      bookingStatus: { $ne: "booked" },
                    },
                    {
                      revisitStatus: "pending",
                      bookingStatus: { $ne: "booked" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            assignedCount: [
              { $match: { disabled: false, taskRef: { $ne: null } } },
              { $count: "count" },
            ],
            notAssignedCount: [
              { $match: { disabled: false, taskRef: { $eq: null } } },
              { $count: "count" },
            ],
            visitCount: [
              {
                $match: {
                  disabled: false,
                  stage: { $ne: "approval" },
                  stage: { $ne: "booking" },
                  $and: [
                    {
                      visitStatus: { $ne: null },
                    },
                    {
                      visitStatus: { $ne: "pending" },
                    },
                    { leadType: { $eq: "cp" } },
                  ],
                },
              },
              { $count: "count" },
            ],
            revisitCount: [
              {
                $match: {
                  disabled: false,
                  stage: "booking",
                  $and: [
                    {
                      revisitStatus: { $ne: null },
                    },
                    {
                      revisitStatus: { $ne: "pending" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            visit2Count: [
              {
                $match: {
                  disabled: false,
                  visitStatus: { $ne: "pending" },

                  $or: [
                    {
                      leadType: { $eq: "walk-in" },
                    },
                    {
                      leadType: { $eq: "internal-lead" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingCount: [
              {
                $match: {
                  stage: "booking",
                  // bookingStatus: { $ne: "pending" },
                  $and: [
                    {
                      bookingStatus: { $eq: "booked" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            lineUpCount: [
              {
                $match: {
                  disabled: false,
                  $and: [
                    { siteVisitInterested: { $eq: true } },
                    // { siteVisitInterestedDate: { $gte: new Date() } },
                    { siteVisitInterestedDate: { $gte: today.toDate() } }, // only today & future
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingWalkinCount: [
              {
                $match: {
                  stage: "booking",
                  $and: [
                    { bookingStatus: { $eq: "booked" } },
                    {
                      $or: [
                        { leadType: "walk-in" },
                        { leadType: "internal-lead" },
                      ],
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingCpCount: [
              {
                $match: {
                  stage: "booking",
                  $and: [
                    { bookingStatus: { $eq: "booked" } },
                    { leadType: "cp" },
                  ],
                },
              },
              { $count: "count" },
            ],

            bulkCount: [
              {
                $match: {
                  disabled: false,
                  isBulkLead: true,
                },
              },
              { $count: "count" },
            ],
            cpNotePendingCount: [
              {
                $match: {
                  $and: [
                    { cpNoteResolved: false },
                    { "callHistory.notes": { $exists: true } },
                    // { "callHistory.notes": { $ne: [] } },
                  ],
                },
              },
              { $count: "count" },
            ],

            internalLeadCount: [
              {
                $match: {
                  disabled: false,
                  $and: [{ leadType: { $eq: "internal-lead" } }],
                },
              },
              { $count: "count" },
            ],
            exhibition2025: [
              {
                $match: {
                  leadFrom: "exhibition-2025",
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $addFields: {
            totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
            pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
            assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
            notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
            visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
            revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
            visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
            bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
            lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
            bookingWalkinCount: {
              $arrayElemAt: ["$bookingWalkinCount.count", 0],
            },
            bookingCpCount: { $arrayElemAt: ["$bookingCpCount.count", 0] },

            cpNotePendingCount: {
              $arrayElemAt: ["$cpNotePendingCount.count", 0],
            },
            bulkCount: {
              $arrayElemAt: ["$bulkCount.count", 0],
            },

            internalLeadCount: {
              $arrayElemAt: ["$internalLeadCount.count", 0],
            },
            exhibition2025: {
              $arrayElemAt: ["$exhibition2025.count", 0],
            },

            // Add other fields similarly as required
          },
        },
        {
          $project: {
            totalItems: 1,
            pendingCount: 1,
            assignedCount: 1,
            visitCount: 1,
            revisitCount: 1,
            visit2Count: 1,
            bookingCount: 1,
            lineUpCount: 1,
            notAssignedCount: 1,
            bookingWalkinCount: 1,
            bookingCpCount: 1,
            cpNotePendingCount: 1,
            bulkCount: 1,
            internalLeadCount: 1,
            exhibition2025: 1,

            // Include only the fields you need
          },
        },
      ]);

      const {
        totalItems = 0,
        pendingCount = 0,
        // contactedCount = 0,
        // followUpCount = 0,
        assignedCount = 0,
        visitCount = 0,
        revisitCount = 0,
        visit2Count = 0,
        bookingCount = 0,
        lineUpCount = 0,
        notAssignedCount = 0,
        bookingWalkinCount = 0,
        bookingCpCount = 0,
        cpNotePendingCount = 0,
        bulkCount = 0,
        internalLeadCount = 0,
        exhibition2025 = 0,
        // Add other counts as required
      } = counts[0] || {};

      allCounts.lead.total = totalItems;
      allCounts.lead.pending = pendingCount;
      allCounts.lead.visit1 = visitCount;
      allCounts.lead.visit2 = visit2Count;
      allCounts.lead.revisit = revisitCount;
      allCounts.lead.assigned = assignedCount;
      allCounts.lead.lineup = lineUpCount;
      allCounts.lead.notAssigned = notAssignedCount;
      allCounts.lead.booking = bookingCount;
      allCounts.lead.bookingCp = bookingCpCount;
      allCounts.lead.bookingWalkIn = bookingWalkinCount;
      allCounts.lead.cpNotePendingCount = cpNotePendingCount;
      allCounts.lead.bulkCount = bulkCount;
      allCounts.lead.internalLeadCount = internalLeadCount;
      allCounts.lead.exhibition2025 = exhibition2025;

      // logger.info({
      //   assignTo: id,
      //   // teamLeader: empResp.reportingTo,
      //   deadline: { $gte: now },
      // });

      const taskCounts = await taskModel.aggregate([
        {
          $match: {
            disabled: false,
            assignBy: id,
            // teamLeader: empResp.reportingTo,
            deadline: { $gte: now },
            completed: false,
          },
        },
        {
          $facet: {
            totalTasks: [{ $count: "count" }],
            pendingTaskCount: [
              { $match: { completed: { $eq: false } } },
              { $count: "count" },
            ],
            completedTaskCount: [
              { $match: { completed: { $eq: true } } },
              { $count: "count" },
            ],
            // Add other count stages as required
          },
        },
        {
          $addFields: {
            totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
            pendingTaskCount: { $arrayElemAt: ["$pendingTaskCount.count", 0] },
            completedTaskCount: {
              $arrayElemAt: ["$completedTaskCount.count", 0],
            },
            // Add other fields similarly as required
          },
        },
        {
          $project: {
            totalTasks: 1,
            pendingTaskCount: 1,
            completedTaskCount: 1,
            // Include only the fields you need
          },
        },
      ]);
      const {
        totalTasks = 0,
        pendingTaskCount = 0,
        completedTaskCount = 0,
      } = taskCounts[0] || {};

      allCounts.task.total = totalTasks;
      allCounts.task.pending = pendingTaskCount;
      allCounts.task.completed = completedTaskCount;

      return successRes2(res, 200, "Dashboard Counts", { data: allCounts });
    } catch (error) {
      //
      logger.info(error);
      return errorRes2(res, 500, "Internal Server Error");
    }
  },
);

//list of employees count with filter
leadRouterV2.get(
  "/sales-dashboard-employee-list-count/:id",
  // authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const dept = req.query.dept;
    const interval = req.query.interval;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;

    // logger.info(req.query);
    const today = moment().tz("Asia/Kolkata");
    const now = new Date();
    if (interval === "weekly") {
      startDate = today.startOf("week").toDate();
      endDate = today.endOf("week").toDate();
      // logger.info(startDate);
      // logger.info(endDate);
    } else if (interval === "monthly") {
      startDate = today.startOf("month").toDate();
      endDate = today.endOf("month").toDate();
    } else if (interval === "custom" && startDate && endDate) {
      startDate = moment(startDate).tz("Asia/Kolkata").startOf("day").toDate();
      endDate = moment(endDate).tz("Asia/Kolkata").endOf("day").toDate();
      // logger.info(startDate);
      // logger.info(endDate);
    }

    let filter = {
      reportingTo: id,
      status: "active",
    };
    if (dept === "sales") {
      filter = {
        reportingTo: id,
        status: "active",
        designation: {
          $in: [
            "desg-sales-executive",
            "desg-senior-sales-manager",
            "desg-sales-manager",
            "desg-sales-manager",
          ],
        },
      };
    }

    const employees = await employeeModel
      .find(filter)
      .select(
        "firstName lastName profilePic designation employeeId email phoneNumber",
      )
      .populate({
        path: "designation",
        select: "designation", // only include the name of the designation
      });

    try {
      //
      const allEmployeeCounts = [];

      for (const emp of employees) {
        const empId = emp._id;

        // logger.info({
        //   assignTo: id,
        //   // teamLeader: empResp.reportingTo,
        //   deadline: { $gte: now },
        // });
        const baseFilter = {
          // disabled: false,

          assignTo: empId,

          // teamLeader: empResp.reportingTo,
          // deadline: { $gte: now },
          // deadline: {

          //   // $gte: filterDate,
          //   ...(interval && { $gte: startDate, $lt: endDate }),
          // },
          ...(startDate && endDate
            ? {
                assignDate: {
                  $gte: startDate,
                  $lt: endDate,
                },
              }
            : {}),
          deadline: { $gte: new Date() },
        };
        // logger.info(baseFilter);
        const taskCounts = await taskModel.aggregate([
          {
            $match: baseFilter,
          },
          {
            $facet: {
              totalTasks: [{ $count: "count" }],
              pendingTaskCount: [
                { $match: { completed: { $eq: false } } },
                { $count: "count" },
              ],
              completedTaskCount: [
                { $match: { completed: { $eq: true } } },
                { $count: "count" },
              ],
              // Add other count stages as required
            },
          },
          {
            $addFields: {
              totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
              pendingTaskCount: {
                $arrayElemAt: ["$pendingTaskCount.count", 0],
              },
              completedTaskCount: {
                $arrayElemAt: ["$completedTaskCount.count", 0],
              },
              // Add other fields similarly as required
            },
          },
          {
            $project: {
              totalTasks: 1,
              pendingTaskCount: 1,
              completedTaskCount: 1,
              // Include only the fields you need
            },
          },
        ]);
        const {
          totalTasks = 0,
          pendingTaskCount = 0,
          completedTaskCount = 0,
        } = taskCounts[0] || {};

        allEmployeeCounts.push({
          user: {
            _id: empId,
            id: empId,
            firstName: emp.firstName,
            lastName: emp.lastName,
            employeeId: emp.employeeId,
            designation: emp.designation,
            profilePic: emp.profilePic,
            phoneNumber: emp.phoneNumber,
            email: emp.email,
          },
          task: {
            total: totalTasks,
            pending: pendingTaskCount,
            completed: completedTaskCount,
          },
        });
      }
      return successRes2(res, 200, "Dashboard Employee list Counts", {
        data: allEmployeeCounts,
      });
    } catch (error) {
      //
      logger.info(error);
      return errorRes2(res, 500, "Internal Server Error");
    }
  },
);

//individual count with filter
leadRouterV2.get(
  "/sales-dashboard-employee-individual-count/:id",
  // authenticateToken,
  async (req, res) => {
    const { id } = req.params; // id of the employee

    const now = new Date();

    const interval = req.query.interval;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    try {
      const today = moment().tz("Asia/Kolkata");

      if (interval === "weekly") {
        startDate = today.startOf("week").toDate();
        endDate = today.endOf("week").toDate();
        // logger.info(startDate);
        // logger.info(endDate);
      } else if (interval === "monthly") {
        startDate = today.startOf("month").toDate();
        endDate = today.endOf("month").toDate();
      } else if (interval === "custom" && startDate && endDate) {
        startDate = moment(startDate)
          .tz("Asia/Kolkata")
          .startOf("day")
          .toDate();
        endDate = moment(endDate).tz("Asia/Kolkata").endOf("day").toDate();
        // logger.info(startDate);
        // logger.info(endDate);
      }

      const emp = await employeeModel
        .findById(id)
        .select(
          "firstName lastName profilePic designation employeeId email phoneNumber reportingTo",
        )
        .populate({
          path: "designation",
          select: "designation",
        });

      // if (!emp) {
      //   return errorRes2(res, 404, "Employee not found");
      // }
      // logger.info(
      //   JSON.stringify({
      //     ...(startDate && endDate
      //       ? {
      //           assignDate: {
      //             $gte: startDate,
      //             $lt: endDate,
      //           },
      //         }
      //       : {}),
      //   })
      // );
      const completedCount = await taskModel.countDocuments({
        assignTo: emp._id,
        completed: true,
        ...(startDate && endDate
          ? {
              completedDate: {
                $gte: startDate,
                $lt: endDate,
              },
            }
          : {}),
      });
      const taskCounts = await taskModel.aggregate([
        {
          $match: {
            // disabled: false,
            assignTo: emp._id,
            // deadline: { $gte: now },
            ...(startDate && endDate
              ? {
                  assignDate: {
                    $gte: startDate,
                    $lt: endDate,
                  },
                }
              : {}),

            deadline: { $gte: new Date() },
          },
        },
        {
          $facet: {
            totalTasks: [{ $count: "count" }],
            pendingTaskCount: [
              { $match: { completed: false } },
              { $count: "count" },
            ],
            completedTaskCount: [
              { $match: { completed: true } },
              { $count: "count" },
            ],

            // liveLeadTaskCount: [
            //   { $match: { completed: true, type: "live-lead" } },
            //   { $count: "count" },
            // ],

            // transferLeadTaskCount: [
            //   { $match: { completed: true, type: "transfer-lead" } },
            //   { $count: "count" },
            // ],
          },
        },
        {
          $addFields: {
            totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
            pendingTaskCount: {
              $arrayElemAt: ["$pendingTaskCount.count", 0],
            },
            completedTaskCount: {
              $arrayElemAt: ["$completedTaskCount.count", 0],
            },
            // liveLeadTaskCount: {
            //   $arrayElemAt: ["$liveLeadTaskCount.count", 0],
            // },
            // transferLeadTaskCount: {
            //   $arrayElemAt: ["$transferLeadTaskCount.count", 0],
            // },
          },
        },
        {
          $project: {
            totalTasks: 1,
            pendingTaskCount: 1,
            completedTaskCount: 1,
            // liveLeadTaskCount: 1,
            // transferLeadTaskCount: 1,
          },
        },
      ]);

      const {
        totalTasks = 0,
        pendingTaskCount = 0,
        completedTaskCount = 0,
        // liveLeadTaskCount = 0,
        // transferLeadTaskCount = 0,
      } = taskCounts[0] || {};

      const taskIds = await taskModel.find(
        {
          disabled: false,
          assignTo: emp._id,
          ...(startDate && endDate
            ? {
                assignDate: {
                  $gte: startDate,
                  $lt: endDate,
                },
              }
            : {}),
          deadline: { $gte: new Date() },
        },
        { _id: 1, lead: 1, phoneNumber: 1, type: 1 },
      );
      let assignedTaskIds = taskIds.map((task) => task.phoneNumber);
      let liveLeadTask = taskIds.filter((task) => task.type == "live-lead");
      let transferLeadTask = taskIds.filter(
        (task) => task.type == "transfer-lead",
      );

      // logger.info(assignedTaskIds);
      let leadIds = taskIds.map((ele) => ele.lead);
      // logger.info(leadIds);
      const leadCounts = await leadModelV2.aggregate([
        {
          $match: {
            _id: { $in: leadIds },
          },
        },
        {
          $facet: {
            lineup: [
              {
                $match: {
                  callHistory: {
                    $elemMatch: {
                      ...(startDate && endDate
                        ? {
                            callDate: {
                              $gte: startDate,
                              $lt: endDate,
                            },
                          }
                        : {}),

                      caller: id,
                      interestedVisit: true,
                    },
                  },
                },
              },
              { $count: "count" },
            ],
            interestedCount: [
              {
                $match: {
                  callHistory: {
                    $elemMatch: {
                      ...(startDate && endDate
                        ? {
                            callDate: {
                              $gte: startDate,
                              $lt: endDate,
                            },
                          }
                        : {}),

                      caller: id,
                      interestedStatus: "interested",
                    },
                  },
                },
              },
              { $count: "count" },
            ],

            liveLeadTaskCount: [
              {
                $match: {
                  taskRef: { $in: liveLeadTask.map((ele) => ele._id) },
                },
              },
              { $count: "count" },
            ],

            transferLeadTaskCount: [
              {
                $match: {
                  taskRef: { $in: transferLeadTask.map((ele) => ele._id) },
                },
              },
              { $count: "count" },
            ],
          },
        },

        {
          $addFields: {
            lineup: {
              $arrayElemAt: ["$lineup.count", 0],
            },
            interestedCount: {
              $arrayElemAt: ["$interestedCount.count", 0],
            },

            liveLeadTaskCount: {
              $arrayElemAt: ["$liveLeadTaskCount.count", 0],
            },

            transferLeadTaskCount: {
              $arrayElemAt: ["$transferLeadTaskCount.count", 0],
            },
          },
        },
        {
          $project: {
            lineup: 1,
            interestedCount: 1,
            liveLeadTaskCount: 1,
            transferLeadTaskCount: 1,
          },
        },
      ]);

      // logger.info(
      //   JSON.stringify({
      //     callHistory: {
      //       $elemMatch: {
      //         ...(startDate && endDate
      //           ? {
      //               callDate: {
      //                 $gte: startDate,
      //                 $lt: endDate,
      //               },
      //             }
      //           : {}),

      //         caller: id,
      //         interestedVisit: true,
      //       },
      //     },
      //   })
      // );
      const {
        lineup = 0,
        interestedCount = 0,
        liveLeadTaskCount = 0,
        transferLeadTaskCount = 0,
      } = leadCounts[0] || {};

      // TODO: get visit counts with filterd date - get-visit count - callby;
      const visitCounts = await siteVisitModel.countDocuments({
        //
        callBy: id,
        ...(startDate && endDate
          ? {
              date: {
                $gte: startDate,
                $lt: endDate,
              },
            }
          : {}),

        ...(assignedTaskIds
          ? {
              phoneNumber: { $in: assignedTaskIds },
            }
          : {}),
      });

      const employeePerformance = {
        user: {
          _id: emp._id,
          id: emp._id,

          firstName: emp.firstName,
          lastName: emp.lastName,
          employeeId: emp.employeeId,
          designation: emp.designation,
          profilePic: emp.profilePic,
          phoneNumber: emp.phoneNumber,
          email: emp.email,
          reportingTo: emp.reportingTo,
        },
        task: {
          total: totalTasks,
          pending: pendingTaskCount,
          completed: completedCount, //completedTaskCount,
          liveLead: liveLeadTaskCount,
          transferLead: transferLeadTaskCount,
        },
        lead: {
          lineup,
          interestedCount,
          liveLeadTaskCount,
          transferLeadTaskCount,
        },
        visitCount: visitCounts,
      };

      return successRes2(res, 200, "Employee Individual Performance", {
        data: employeePerformance,
      });
    } catch (error) {
      console.error(error);
      return errorRes2(res, 500, "Internal Server Error");
    }
  },
);

leadRouterV2.get(
  "/sourcing-manager-dashboard-count",
  // authenticateToken,
  async (req, res) => {
    let { startDate, endDate, interval } = req.query;
    const now = new Date();
    if (interval === "monthly") {
      startDate = moment().startOf("month").toDate();
      endDate = moment().endOf("month").toDate();
    } else if (interval === "quarterly") {
      startDate = moment().startOf("quarter").toDate();
      endDate = moment().endOf("quarter").toDate();
    } else if (interval === "semi-annually") {
      const month = moment().month();
      const year = moment().year();
      const isFirstHalf = month < 6;

      startDate = moment([year, isFirstHalf ? 0 : 6])
        .startOf("month")
        .toDate();
      endDate = moment([year, isFirstHalf ? 5 : 11])
        .endOf("month")
        .toDate();
    } else if (interval === "annually") {
      startDate = moment().startOf("year").toDate();
      endDate = moment().endOf("year").toDate();
    }
    // logger.info(interval);
    // logger.info(startDate);
    // logger.info(endDate);

    const dateFilter =
      startDate && endDate
        ? {
            startDate: {
              $gte: startDate,
              $lte: endDate,
            },
          }
        : null;

    // logger.info(dateFilter);
    const allCounts = {
      name: null,
      designation: null,
      date: now,
      startDate: startDate,
      endDate: endDate,
      lead: {
        total: 0,
        visit1: 0,
        visit2: 0,
        revisit: 0,
        booking: 0,
        pending: 0,
        assigned: 0,
        notAssigned: 0,
        lineup: 0,
        bookingCp: 0,
        bookingWalkIn: 0,
        cpNotePendingCount: 0,
        internalLeadCount: 0,
        bulkCount: 0,
        exhibition2025: 0,
      },
      task: {
        total: 0,
        pending: 0,
        completed: 0,
      },
    };

    try {
      const today = moment().tz("Asia/Kolkata");
      let filter = {
        $match: {},
      };
      if (dateFilter != null) {
        filter.$match = {
          ...filter.$match,
          ...dateFilter,
        };
      }
      // logger.info(filter);
      const counts = await leadModelV2.aggregate([
        filter,
        {
          $facet: {
            totalItems: [
              {
                $match: {
                  disabled: false,
                },
              },
              { $count: "count" },
            ],
            pendingCount: [
              {
                $match: {
                  disabled: false,
                  $or: [
                    // { visitRef: { $ne: null } },
                    // { revisitRef: { $ne: null } },
                    {
                      visitStatus: "pending",
                      bookingStatus: { $ne: "booked" },
                    },
                    {
                      revisitStatus: "pending",
                      bookingStatus: { $ne: "booked" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            assignedCount: [
              { $match: { disabled: false, taskRef: { $ne: null } } },
              { $count: "count" },
            ],
            notAssignedCount: [
              { $match: { disabled: false, taskRef: { $eq: null } } },
              { $count: "count" },
            ],
            visitCount: [
              {
                $match: {
                  disabled: false,
                  stage: { $ne: "approval" },
                  stage: { $ne: "booking" },
                  $and: [
                    {
                      visitStatus: { $ne: null },
                    },
                    {
                      visitStatus: { $ne: "pending" },
                    },
                    { leadType: { $eq: "cp" } },
                  ],
                },
              },
              { $count: "count" },
            ],
            revisitCount: [
              {
                $match: {
                  disabled: false,
                  stage: "booking",
                  $and: [
                    {
                      revisitStatus: { $ne: null },
                    },
                    {
                      revisitStatus: { $ne: "pending" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            visit2Count: [
              {
                $match: {
                  disabled: false,
                  visitStatus: { $ne: "pending" },

                  $or: [
                    {
                      leadType: { $eq: "walk-in" },
                    },
                    {
                      leadType: { $eq: "internal-lead" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingCount: [
              {
                $match: {
                  stage: "booking",
                  // bookingStatus: { $ne: "pending" },
                  $and: [
                    {
                      bookingStatus: { $eq: "booked" },
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            lineUpCount: [
              {
                $match: {
                  disabled: false,
                  $and: [
                    { siteVisitInterested: { $eq: true } },
                    // { siteVisitInterestedDate: { $gte: new Date() } },
                    { siteVisitInterestedDate: { $gte: today.toDate() } }, // only today & future
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingWalkinCount: [
              {
                $match: {
                  stage: "booking",
                  $and: [
                    { bookingStatus: { $eq: "booked" } },
                    {
                      $or: [
                        { leadType: "walk-in" },
                        { leadType: "internal-lead" },
                      ],
                    },
                  ],
                },
              },
              { $count: "count" },
            ],
            bookingCpCount: [
              {
                $match: {
                  stage: "booking",
                  $and: [
                    { bookingStatus: { $eq: "booked" } },
                    { leadType: "cp" },
                  ],
                },
              },
              { $count: "count" },
            ],

            bulkCount: [
              {
                $match: {
                  disabled: false,
                  isBulkLead: true,
                },
              },
              { $count: "count" },
            ],
            cpNotePendingCount: [
              {
                $match: {
                  $and: [
                    { cpNoteResolved: false },
                    { "callHistory.notes": { $exists: true } },
                    // { "callHistory.notes": { $ne: [] } },
                  ],
                },
              },
              { $count: "count" },
            ],

            internalLeadCount: [
              {
                $match: {
                  disabled: false,
                  $and: [{ leadType: { $eq: "internal-lead" } }],
                },
              },
              { $count: "count" },
            ],
            exhibition2025: [
              {
                $match: {
                  leadFrom: "exhibition-2025",
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $addFields: {
            totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
            pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
            assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
            notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
            visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
            revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
            visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
            bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
            lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
            bookingWalkinCount: {
              $arrayElemAt: ["$bookingWalkinCount.count", 0],
            },
            bookingCpCount: { $arrayElemAt: ["$bookingCpCount.count", 0] },

            cpNotePendingCount: {
              $arrayElemAt: ["$cpNotePendingCount.count", 0],
            },
            bulkCount: {
              $arrayElemAt: ["$bulkCount.count", 0],
            },

            internalLeadCount: {
              $arrayElemAt: ["$internalLeadCount.count", 0],
            },
            exhibition2025: {
              $arrayElemAt: ["$exhibition2025.count", 0],
            },

            // Add other fields similarly as required
          },
        },
        {
          $project: {
            totalItems: 1,
            pendingCount: 1,
            assignedCount: 1,
            visitCount: 1,
            revisitCount: 1,
            visit2Count: 1,
            bookingCount: 1,
            lineUpCount: 1,
            notAssignedCount: 1,
            bookingWalkinCount: 1,
            bookingCpCount: 1,
            cpNotePendingCount: 1,
            bulkCount: 1,
            internalLeadCount: 1,
            exhibition2025: 1,

            // Include only the fields you need
          },
        },
      ]);

      const {
        totalItems = 0,
        pendingCount = 0,
        // contactedCount = 0,
        // followUpCount = 0,
        assignedCount = 0,
        visitCount = 0,
        revisitCount = 0,
        visit2Count = 0,
        bookingCount = 0,
        lineUpCount = 0,
        notAssignedCount = 0,
        bookingWalkinCount = 0,
        bookingCpCount = 0,
        cpNotePendingCount = 0,
        bulkCount = 0,
        internalLeadCount = 0,
        exhibition2025 = 0,
        // Add other counts as required
      } = counts[0] || {};

      allCounts.lead.total = totalItems;
      allCounts.lead.pending = pendingCount;
      allCounts.lead.visit1 = visitCount;
      allCounts.lead.visit2 = visit2Count;
      allCounts.lead.revisit = revisitCount;
      allCounts.lead.assigned = assignedCount;
      allCounts.lead.lineup = lineUpCount;
      allCounts.lead.notAssigned = notAssignedCount;
      allCounts.lead.booking = bookingCount;
      allCounts.lead.bookingCp = bookingCpCount;
      allCounts.lead.bookingWalkIn = bookingWalkinCount;
      allCounts.lead.cpNotePendingCount = cpNotePendingCount;
      allCounts.lead.bulkCount = bulkCount;
      allCounts.lead.internalLeadCount = internalLeadCount;
      allCounts.lead.exhibition2025 = exhibition2025;

      return successRes2(res, 200, "Dashboard Counts", { data: allCounts });
    } catch (error) {
      //
      logger.info(error);
      return errorRes2(res, 500, "Internal Server Error");
    }
  },
);

leadRouterV2.get("/leads-team-leader/:id", getLeadsTeamLeaderV2);

leadRouterV2.get("/leads-trigger-600-leads", async (req, res) => {
  try {
    //
    const resp = await leadCycleChange_600_from_March_01_2025();

    await triggerHistoryModel.create({
      date: new Date(),
      changes: resp?.changes ?? [],
      changesString: resp?.changesString ?? "",
      totalTrigger: resp?.total ?? 0,
      message: "manual-trigger", //resp?.message ?? "",
    });

    return successRes2(res, 200, "ok", { data: resp });
  } catch (error) {
    //
    return errorRes2(res, 500, error);
  }
});

function generateDummyData(count) {
  const firstNames = [
    "John",
    "Jane",
    "Alex",
    "Emily",
    "Chris",
    "Olivia",
    "Michael",
    "Sophia",
    "David",
    "Emma",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Brown",
    "Taylor",
    "Anderson",
    "Lee",
    "Martin",
    "Clark",
    "Lewis",
    "Walker",
  ];

  const data = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phoneNumber = parseInt(
      `${Math.floor(Math.random() * 900 + 100)}${Math.floor(
        Math.random() * 900 + 100,
      )}${Math.floor(Math.random() * 9000 + 1000)}`,
    );

    data.push({ firstName, lastName, phoneNumber, leadType: "cp" });
  }

  return data;
}

leadRouterV2.get(
  "/add-dummy-leads",
  // authenticateToken,
  async (req, res) => {
    const resp = generateDummyData(10);
    await Promise.all(
      resp.map(async (ele) => {
        try {
          //
          let changes = {
            ...ele,
            stage: "visit",
            approvalStatus: "approved",
            teamLeader: "EV900-test-closing-m",
            cycle: {
              teamLeader: "EV900-test-closing-m",
              startDate: new Date("2025-05-31T07:47:08.850+00:00"),
              validTill: new Date("2025-05-31T07:47:08.850+00:00"),
            },
          };
          // logger.info(changes);
          await leadModelV2.create(changes);
        } catch (error) {
          //
          logger.info(error);
        }
      }),
    );
    res.send(resp);
  },
);

leadRouterV2.get("/leads-visit-stimate", async (req, res) => {
  try {
    //
    let results = [];

    const leads = await leadModelV2.find({
      $or: [
        { visitDate: { $gte: new Date("2025-06-01T00:00:00.000+00:00") } },
        { revisitDate: { $gte: new Date("2025-06-01T00:00:00.000+00:00") } },
      ],
    });

    await Promise.all(
      leads.map(async (ele) => {
        try {
          //
          const found = await estimateGeneratedModel.findOne({ lead: ele._id });
          results.push({
            firstName: ele.firstName,
            lastName: ele.lastName,
            phoneNumber: ele.phoneNumber,
            closingManager: ele.cycle.teamLeader,
            estimateGenerated: found ? "YES" : "NO",
            visitDate: ele.visitDate,
            revisitDate: ele.revisitDate,
          });
        } catch (error) {
          //
        }
      }),
    );
    res.send(results);
  } catch (error) {
    //
    res.send(error);
  }
});
leadRouterV2.get("/leads-trigger-v4", async (req, res) => {
  try {
    //
    const resp = await leadCycleTriggerV4();
    await triggerHistoryModel.create({
      date: new Date(),
      changes: resp?.changes ?? [],
      changesString: resp?.changesString ?? "",
      totalTrigger: resp?.total ?? 0,
      message: "manual-trigger", //resp?.message ?? "",
    });

    res.send({ resp });
  } catch (error) {
    //
    res.send({ error });
  }
});
leadRouterV2.get("/internal-leads-trigger", async (req, res) => {
  try {
    //
    const resp = await internalLeadCycleTrigger();
    // await triggerHistoryModel.create({
    //   date: new Date(),
    //   changes: resp?.changes ?? [],
    //   changesString: resp?.changesString ?? "",
    //   totalTrigger: resp?.total ?? 0,
    //   message: "manual-trigger - internal", //resp?.message ?? "",
    // });

    res.send({ resp });
  } catch (error) {
    //
    res.send({ error });
  }
});

leadRouterV2.get("/internal-leads-trigger-date-fix", async (req, res) => {
  try {
    //
    const resp = await leadModelV2.find({
      leadType: "internal-lead",
    });

    resp.forEach((ele) => {
      const start = moment(ele.cycle.startDate);
      const inDate = start.add(3, "days");
      ele.cycle.internalDeadline = inDate.toDate();
      ele.save();
    });

    // await triggerHistoryModel.create({
    //   date: new Date(),
    //   changes: resp?.changes ?? [],
    //   changesString: resp?.changesString ?? "",
    //   totalTrigger: resp?.total ?? 0,
    //   message: "manual-trigger - internal", //resp?.message ?? "",
    // });

    res.send({ resp });
  } catch (error) {
    //
    res.send({ error });
  }
});

leadRouterV2.get("/last-weeek-rj-lead", async (req, res) => {
  // logger.info("okay");

  const format = [];
  try {
    const todayDate = moment().tz("Asia/kolkata");
    const curDate = moment().tz("Asia/kolkata").subtract(2, "weeks");

    // logger.info(curDate);
    const lead = await leadModelV2
      .find({
        approvalDate: {
          $gte: curDate.toDate(),
          $lt: todayDate.startOf("day").toDate(),
        },
        "cycle.currentOrder": 1,
        $and: [
          {
            teamLeader: "ev54-ranjna-gupta",
          },
          { "cycle.teamLeader": "ev54-ranjna-gupta" },
        ],
      })
      // .limit(10)
      .populate(leadPopulateOptions);

    const totalData = lead
      .map((e) => {
        //
        let callHistory = e.callHistory[0];
        if (callHistory != null) {
          //
          const callDate = moment(callHistory?.callDate);
          const assignedDate = moment(e?.taskRef?.assignDate);
          const diff = callDate.diff(assignedDate, "minutes");

          if (diff > 20) {
            format.push({
              phoneNumber: e.phoneNumber,
              firstName: e.firstName,
              lastName: e.lastName,
              assignTo: `${e.taskRef?.assignTo?.firstName} ${e.taskRef?.assignTo?.lastName}`,
              assignBy: `${e.taskRef?.assignBy?.firstName} ${e.taskRef?.assignBy?.lastName}`,
              assignDate: moment(e.taskRef?.assignDate).format(
                "DD/MM/YYYY HH:mm",
              ),
              callDate: callDate.format("DD/MM/YYYY HH:mm"),
              callStatus: callHistory?.remark,
              feedback: callHistory?.feedback,
              differenceBetweenCall: diff + ` min`,
            });
            return e;
          }
        }
        return false;
      })
      .filter(Boolean);

    // logger.info(lead.length);
    return successRes2(res, 200, "ok", {
      length: format.length,
      data: format,
    });

    // return res.
  } catch (error) {
    //
  }
});

leadRouterV2.post("/upload-channel-partner-bulk-leads", async (req, res) => {
  const results = [];
  const dataToPush = [];
  const csvFilePath = path.join(__dirname, "bulk_cp_lead.csv");

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        // 1. Group by teamLeader
        const grouped = {};
        for (const row of results) {
          const { teamLeader, name, phoneNumber, channelPartner } = row;

          if (!grouped[teamLeader]) grouped[teamLeader] = [];
          grouped[teamLeader].push({ name, phoneNumber, channelPartner });
        }

        const teamLeaders = Object.keys(grouped);

        const existingNumbers = new Set(
          (
            await leadModelV2.find(
              { phoneNumber: { $in: results.map((r) => r.phoneNumber) } },
              { phoneNumber: 1 },
            )
          ).map((d) => d.phoneNumber),
        );

        const timeZone = "Asia/Kolkata";
        const baseTime = moment()
          .tz(timeZone)
          //  .add(1, "day")
          .hour(12)
          .minute(40)
          .second(0);

        // 4. Rounds
        const rounds = Math.max(...teamLeaders.map((tl) => grouped[tl].length));

        for (let round = 0; round < rounds; round++) {
          const slotTime = moment(baseTime).add(round * 10, "minutes");
          const startDate = slotTime.toDate();
          const validTill = moment(slotTime).add(2, "months").toDate();

          for (const tl of teamLeaders) {
            const lead = grouped[tl][round];
            if (!lead) continue;
            let phoneExits = false;
            if (existingNumbers.has(lead.phoneNumber)) {
              // logger.info("Skipping duplicate:", lead.phoneNumber);
              phoneExits = true;
              continue;
            }

            dataToPush.push({
              phoneNumberExists: phoneExits,
              firstName: lead.name,
              phoneNumber: lead.phoneNumber,
              teamLeader: tl,
              channelPartner: lead.channelPartner,
              leadType: "cp",
              stage: "pending",
              approvalRemark: "auto imported CP lead",
              startDate: new Date(),
              validTill,
              project: [],
              address: ".",
              disabled: false,
              isBulkLead: false,
              cycle: {
                stage: "visit",
                startDate,
                validTill,
                teamLeader: tl,
                currentOrder: 1,
                currentDays: 29,
              },

              createdAt: startDate,
            });
          }
        }

        await leadModelV2.insertMany(dataToPush, { ordered: false });

        return successRes2(res, 200, "updates", { data: dataToPush });
      } catch (err) {
        console.error(err);
      }
    });
});

// leadRouterV2.post("/upload-channel-partner-bulk-leads", async (req, res) => {
//   try {
//     const resp =  bulk_cp_lead_trigger_35();
//     logger.info(resp);
//     return successRes2(res, 200, "ok", { data: resp });
//   } catch (error) {
//     logger.info(error);

//     return errorRes2(res, 500, `error ${error}  `);
//   }
// });

export default leadRouterV2;
