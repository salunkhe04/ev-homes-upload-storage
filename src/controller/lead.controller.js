import { validateRequiredLeadsFields } from "../middleware/lead.middleware.js";
import employeeModel from "../model/employee.model.js";
import leadModel from "../model/lead/lead.model.js";
import oneSignalModel from "../model/oneSignal.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import siteVisitModel from "../model/siteVisit.model.js";
import TeamLeaderAssignTurn from "../model/teamLeaderAssignTurn.model.js";
import moment from "moment";
import {
  employeePopulateOptions,
  leadListOptions,
  leadListPopulateOptions,
  leadPopulateOptions,
  leadPopulateOptionsv3,
  taskPopulateOptions,
} from "../utils/constant.js";
import {
  sendNotificationWithImage,
  sendNotificationWithInfo,
} from "./oneSignal.controller.js";
import { startOfWeek, addDays, format, startOfYear, endOfYear } from "date-fns";
import { fileURLToPath } from "url";

import fs from "fs";
import path from "path";
// import moment from "moment-timezone";
import PDFDocument from "pdfkit";
import taskModel from "../model/task.model.js";
import { sendMultipleEmail } from "../utils/brevo.js";
import {
  feedbackPendingTemplate,
  leadAssignPendingTemplate,
} from "../templates/html_template.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import postSaleLeadModel from "../model/postSaleLead.model.js";
import { notificationQueue } from "../app/workers/notificationWorker.js";
import periodModel from "../model/period/period.model.js";
import rankingTurnModel from "../model/period/ranking.model.js";
import { getCurrentRanks } from "../routes/period/rankingTurnRouter.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Date.prototype.addDays = function (days) {
  const date = new Date(this); // Copy the current date
  date.setDate(this.getDate() + days); // Add the days
  return date;
};

export const getAllLeads = async (req, res, next) => {
  try {
    const today = new Date();
    // const endDate = new Date("2024-10-31T23:59:59.999Z");

    const respLeads = await leadModelV2
      .find({
        // startDate: { $gte: today },
      })
      .sort({ startDate: -1, _id: 1 })
      .populate(leadPopulateOptions);

    if (!respLeads) return res.send(errorRes(404, "No leads found"));

    // logger.info("leads sent");
    return res.send(
      successRes(200, "all Leads", {
        data: respLeads,
        // count: respLeads.len,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getAllGraph = async (req, res, next) => {
  try {
    // if (!teamLeaderId) return res.send(errorRes(401, "id Required"));

    const filterDate = new Date("2024-12-10");
    const interval = req.query.interval;
    const currentDate = new Date();

    // Initialize startDate and endDate
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;

    // Set startDate and endDate based on the interval
    if (interval === "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (interval === "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      // logger.info(quarter);
      startDate = new Date(startDate);
      endDate = new Date(endDate);
    } else if (interval === "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval === "annually") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    } else {
      // Default to the current date if no valid interval is provided
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    }

    // Count leads based on the team leader and the specified date range
    const leadCount =
      (await leadModelV2.countDocuments({
        // teamLeader: { $eq: teamLeaderId },
        startDate: {
          $gte: filterDate,
          ...(interval && { $gte: startDate, $lt: endDate }),
        },
      })) || 0;

    // const bookingCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },
    //     bookingStatus: { $ne: "pending" },
    //   })) || 0;

    // const visitCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },
    //     visitStatus: { $ne: "pending" },
    //   })) || 0;

    // const revisitCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },

    //     revisitStatus: { $ne: "pending" },
    //   })) || 0;

    /* --new graphs -- */
    // const visitCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   // visitStatus: { $ne: "pending" },
    //   // leadType: { $ne: "walk-in" },
    //   $and: [
    //     {
    //       stage: { $ne: "approval" },
    //     },
    //     {
    //       stage: { $ne: "booking" },
    //     },
    //     {
    //       visitStatus: { $ne: null },
    //     },
    //     {
    //       visitStatus: { $ne: "pending" },
    //     },
    //     {
    //       leadType: "cp",
    //     },
    //   ],
    // });

    // const revisitCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   revisitStatus: { $ne: "pending" },
    //   $or: [
    //     {
    //       stage: { $ne: "tagging-over" },
    //     },
    //     {
    //       stage: { $ne: "approval" },
    //     },
    //   ],
    // });
    // const visit2Count = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   visitStatus: { $ne: "pending" },
    //   leadType: { $eq: "walk-in" },
    //   $or: [
    //     {
    //       stage: { $ne: "tagging-over" },
    //     },
    //     {
    //       stage: { $ne: "approval" },
    //     },
    //   ],
    // });

    // const bookingCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   stage: "booking",
    //   // bookingStatus: { $ne: "pending" },
    //   $and: [
    //     {
    //       bookingStatus: { $ne: null },
    //     },
    //     {
    //       bookingStatus: { $ne: "pending" },
    //     },
    //   ],
    // });

    // const pendingCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   bookingStatus: { $ne: "booked" },
    //   $or: [
    //     {
    //       visitStatus: "pending",
    //     },
    //     {
    //       revisitStatus: "pending",
    //     },
    //   ],
    // });

    const counts = await leadModelV2.aggregate([
      {
        $match: {
          $and: [
            { startDate: { $gte: filterDate } },
            interval && { startDate: { $gte: startDate, $lt: endDate } },
          ].filter(Boolean),
        },
      },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          totalItemsCount: [{ $count: "count" }],
          pendingCount: [
            {
              $match: {
                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            { $match: { contactedStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          followUpCount: [
            { $match: { followupStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          assignedCount: [
            { $match: { taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                $and: [
                  { stage: { $ne: "approval" } },
                  { stage: { $ne: "booking" } },
                  { visitStatus: { $ne: null } },
                  { visitStatus: { $ne: "pending" } },
                  { leadType: "cp" },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { revisitStatus: { $ne: null } },
                  { revisitStatus: { $ne: "pending" } },
                ],
              },
            },
            { $count: "count" },
          ],
          visit2Count: [
            {
              $match: {
                $and: [
                  { stage: { $ne: "approval" } },
                  { stage: { $ne: "booking" } },
                  { visitStatus: { $ne: null } },
                  { visitStatus: { $ne: "pending" } },
                  { leadType: { $eq: "walk-in" } },
                ],
              },
            },
            { $count: "count" },
          ],
          bookingCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                ],
              },
            },
            { $count: "count" },
          ],
          lineUpCount: [
            {
              $match: {
                stage: { $ne: "tagging-over" },
                leadType: { $ne: "walk-in" },
                siteVisitInterested: true,
              },
            },
            { $count: "count" },
          ],
          bookingWalkinCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                  { leadType: "walk-in" },
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
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                  { leadType: "cp" },
                ],
              },
            },
            { $count: "count" },
          ],
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          bookingWalkinCount: {
            $arrayElemAt: ["$bookingWalkinCount.count", 0],
          },
          bookingCpCount: { $arrayElemAt: ["$bookingCpCount.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          totalItemsCount: 1,
          lineUpCount: 1,
          bookingWalkinCount: 1,
          bookingCpCount: 1,
        },
      },
    ]);

    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,
      totalItemsCount = 0,
      lineUpCount = 0,
      bookingWalkinCount = 0,
      bookingCpCount = 0,
    } = counts[0] || {};

    // const leadToVisitCount = leadCount > 0 ? (visitCount * 100) / leadCount : 0;
    // const visitToBookingCount =
    //   visitCount > 0 ? (bookingCount * 100) / visitCount : 0;
    // const revisitToBookingCount =
    //   revisitCount > 0 ? (bookingCount * 100) / revisitCount : 0;
    // const leadToBookingCount =
    //   leadCount > 0 ? (bookingCount * 100) / leadCount : 0;

    return res.send(
      successRes(200, "graphs", {
        data: {
          leadCount,
          bookingCount,
          visitCount,
          revisitCount,
          visit2Count,
          pendingCount,
          bookingWalkinCount,
          bookingCpCount,
        },
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, "Internal Server Error", error));
  }
};

export const hideLead = async (req, res, next) => {
  const leadId = req.params.id;
  const { hideStatusDate, hideRemark } = req.body;

  try {
    if (!hideRemark) {
      return res.json({ message: "Remark is required" });
    }
    const updatedLead = await leadModelV2.findByIdAndUpdate(
      leadId,
      {
        hideStatus: true,
        hideStatusDate: Date.now(),
        hideRemark,
      },
      { new: true },
    );

    if (!updatedLead) {
      return res.send(errorRes(400, { message: "Lead not found" }));
    }
    // logger.info(updatedLead);
    return res.send(
      successRes(200, "Lead Hide successfully", {
        data: updatedLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getAllData = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let status = req.query.status?.toLowerCase();
    let teamLeaderId = req.query.teamLeader;
    const interval = req.query.interval;
    const currentDate = new Date();
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    // logger.info(interval);
    // logger.info(startDate);
    // logger.info(endDate);
    let validity = req.query.validity;
    let sort = req.query.sort;

    const targetDate = validity
      ? moment.tz(validity, "Asia/Kolkata")
      : moment.tz("Asia/Kolkata");

    // Get start and end of the target date
    const startOfDay = targetDate.startOf("day").toDate(); // 00:00:00
    const endOfDay = targetDate.endOf("day").toDate(); // 23:59:59

    const isNumberQuery = !isNaN(query);
    const filterDate = new Date("2024-12-10");
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    let statusToFind = null;
    let walkinType = { leadType: { $eq: "walk-in" } };

    if (status === "booking-done" || status === "booking") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "pending" },
        $and: [
          {
            bookingStatus: { $ne: null },
          },
          {
            bookingStatus: { $ne: "pending" },
          },
        ],
      };
    } else if (status === "revisit-done") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
          { bookingStatus: { $ne: "booked" } },
        ],

        // ...walkinType,
        // leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit-done" || status === "visit") {
      statusToFind = {
        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            leadType: { $ne: "walk-in" },
          },
        ],
        // ...walkinType,
      };
    } else if (status === "revisit-pending") {
      statusToFind = {
        stage: { $eq: "revisit" },
        stage: { $ne: "booking" },
        // revisitStatus: { $eq: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit-pending") {
      statusToFind = {
        stage: { $eq: "visit" },
        // visitStatus: { $eq: "pending" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "tagging-over") {
      statusToFind = {
        stage: { $eq: "tagging-over" },
      };
    } else if (status === "pending") {
      statusToFind = {
        // teamLeader: { $eq: teamLeaderId },
        // startDate: { $gte: filterDate },
        bookingStatus: { $ne: "booked" },

        $or: [
          {
            bookingStatus: { $ne: "booked" },
            visitStatus: "pending",
          },
          {
            bookingStatus: { $ne: "booked" },
            revisitStatus: "pending",
          },
        ],
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit2") {
      statusToFind = {
        $and: [
          {
            visitStatus: { $ne: "pending" },
          },
          {
            stage: { $ne: "tagging-over" },
          },
          {
            stage: { $ne: "approval" },
          },
          {
            leadType: "walk-in",
          },
        ],
        // ...walkinType,
      };
    } else if (status === "followup") {
      statusToFind = {
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-followup") {
      statusToFind = {
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status === "visit2-revisit-done") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
          {
            leadType: "walk-in",
          },
        ],

        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
    } else if (status === "visit2-visit-done" || status === "visit2") {
      statusToFind = {
        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            leadType: "walk-in",
          },
        ],
        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
    } else if (status == "line-up") {
      // logger.info("line-up");
      statusToFind = {
        siteVisitInterested: true,
      };
    } else if (status === "bulk-lead") {
      statusToFind = {
        ...statusToFind,
        clientType: null,
        isBulkLead: true,
      };
    } else if (status === "internal-lead") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadType: { $eq: "internal-lead" },
          },
        ],
      };
    } else if (status === "is-channel-partner") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            clientType: { $eq: "is-channel-partner" },
          },
        ],
      };
    } else if (status === "blacklisted-client") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            clientType: { $eq: "blacklisted-client" },
          },
        ],
      };
    } else if (status === "lost") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            clientType: { $eq: "lost" },
          },
        ],
      };
    }

    if (interval === "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (interval === "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      // logger.info(quarter);
      startDate = new Date(startDate);
      endDate = new Date(endDate);
    } else if (interval === "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval === "annually") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    }

    // Base Filter for Search and Leads Query
    let baseFilter = {
      $and: [
        { startDate: { $gte: filterDate } },
        interval && { startDate: { $gte: startDate, $lt: endDate } },
      ].filter(Boolean),
      // startDate: {

      //   // ...(interval? { $gte: startDate, $lt: endDate }:{$gte: filterDate}),
      // },
      ...(teamLeaderId ? { teamLeader: teamLeaderId } : {}),
      ...(statusToFind != null ? statusToFind : null),
    };
    // logger.info(JSON.stringify(baseFilter, null, 2));
    // logger.info("Start Date:", startDate);
    // logger.info("End Date:", endDate);
    // Add query search conditions (if applicable)
    if (query) {
      const searchConditions = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },

        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean);

      baseFilter.$or = searchConditions;
    }
    // logger.info(order);
    // logger.info(sortDirection);
    // logger.info(JSON.stringify(baseFilter, null, 2));
    // Fetch Leads
    const respLeads = await leadModelV2
      .find(baseFilter)
      .skip(skip)
      .limit(limit)
      // .sort({ "cycle.startDate": sortDirection })
      .populate(leadPopulateOptions);

    // Extract teamLeader from cycleHistory based on currentOrder
    const leadsWithTeamLeader = respLeads.map((lead) => {
      const currentOrder = lead.cycle.currentOrder;
      const cycleHistoryEntry = lead.cycleHistory.find(
        (entry) => entry.currentOrder === currentOrder,
      );
      return {
        ...lead.toObject(),
        // teamLeader: cycleHistoryEntry ? cycleHistoryEntry.teamLeader : null, // Get teamLeader from cycleHistory
      };
    });

    // if (!respLeads.length) return res.send(errorRes(404, "No leads found"));

    const counts = await leadModelV2.aggregate([
      {
        $match: {
          // teamLeader: teamLeaderId,
          ...(interval
            ? {
                startDate: {
                  // $gte: filterDate,
                  ...(interval && { $gte: startDate, $lt: endDate }),
                },
              }
            : {}),
        },
      },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          totalItemsCount: [
            {
              $match: baseFilter,
            },
            { $count: "count" },
          ],
          pendingCount: [
            {
              $match: {
                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            { $match: { contactedStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          followUpCount: [
            { $match: { followupStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          assignedCount: [
            { $match: { taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                $and: [
                  {
                    stage: { $ne: "approval" },
                  },
                  {
                    stage: { $ne: "booking" },
                  },
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                  {
                    leadType: "cp",
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  {
                    revisitStatus: { $ne: null },
                  },
                  {
                    revisitStatus: { $ne: "pending" },
                  },
                  { bookingStatus: { $ne: "booked" } },
                ],
              },
            },
            { $count: "count" },
          ],
          visit2Count: [
            {
              $match: {
                $and: [
                  {
                    stage: { $ne: "approval" },
                  },
                  {
                    stage: { $ne: "booking" },
                  },
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                  {
                    leadType: { $eq: "walk-in" },
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
                    bookingStatus: { $ne: null },
                  },
                  {
                    bookingStatus: { $ne: "pending" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          lineUpCount: [
            {
              $match: {
                stage: { $ne: "tagging-over" },
                leadType: { $ne: "walk-in" },
                siteVisitInterested: true,
              },
            },
            { $count: "count" },
          ],

          internalLeadCount: [
            { $match: { leadType: { $eq: "internal-lead" } } },
            { $count: "count" },
          ],
          bulkCount: [
            { $match: { isBulkLead: { $eq: true } } },
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

          // Add other count stages as required
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
          // Add other fields similarly as required
          internalLeadCount: { $arrayElemAt: ["$internalLeadCount.count", 0] },
          bulkCount: { $arrayElemAt: ["$bulkCount.count", 0] },
          exhibition2025: { $arrayElemAt: ["$exhibition2025.count", 0] },
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          totalItemsCount: 1,
          lineUpCount: 1,
          internalLeadCount: 1,
          bulkCount: 1,
          exhibition2025: 1,
          // Include only the fields you need
        },
      },
    ]);

    const blacklistedClient = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: "blacklisted-client" }],
    });
    const isCpCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: "is-channel-partner" }],
    });

    const lostCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: "lost" }],
    });
    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,
      totalItemsCount = 0,
      lineUpCount = 0,
      internalLeadCount = 0,
      bulkCount = 0,
      exhibition2025 = 0,
      // Add other counts as required
    } = counts[0] || {};

    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        contactedCount,
        followUpCount,
        assignedCount,
        visitCount,
        visit2Count,
        revisitCount,
        bookingCount,
        totalItemsCount,
        lineUpCount,
        internalLeadCount,
        bulkCount,
        exhibition2025,
        blacklistedClient,
        isCpCount,
        lostCount,
        data: leadsWithTeamLeader,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadsTeamLeader = async (req, res, next) => {
  const teamLeaderId = req.params.id;
  try {
    if (!teamLeaderId) return res.send(errorRes(401, "id required"));

    let query = req.query.query || "";
    let status = req.query.status?.toLowerCase();
    let status2 = req.query.status2?.toLowerCase();
    let member = req.query.member;
    let cycle = req.query.cycle;
    let callData = req.query.callData;
    let clientstatus = req.query.clientstatus;
    let leadstatus = req.query.leadstatus;
    let order = req.query.order;
    let bulkLead = req.query.bulkLead;
    let channelPartner = req.query.channelPartner?.toLowerCase();

    let sortDirection = -1;
    const interval = req.query.interval;
    const currentDate = new Date();
    let date = req.query.date;
    let dateFilter = {};
    let startDateDeadline = req.query.startDateDeadline;
    let endDateDeadline = req.query.endDateDeadline;
    let startDate, endDate;
    // logger.info(clientstatus);
    // logger.info(leadstatus);
    // let callDone =req.query.callDone;

    let validity = req.query.validity;
    let taskType = req.query.taskType;
    let sort = req.query.sort;
    let project = req.query.project;
    if (order === "Ascending" || order === "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (order === "Descending" || order === "descending") {
      sortDirection = -1;
    }

    let sortFilter = {
      // visitDate: -1,
      // revisitDate: -1,
      "cycle.startDate": sortDirection,
      _id: 1,
    };

    // logger.info(sortFilter);
    const targetDate = validity
      ? moment.tz(validity, "Asia/Kolkata")
      : moment.tz("Asia/Kolkata");

    // Get start and end of the target date
    const startOfDay = targetDate.startOf("day").toDate(); // 00:00:00
    const endOfDay = targetDate.endOf("day").toDate(); // 23:59:59

    let ids = [];

    // logger.info(query,status,member,ids);

    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          "cycle.validTill": {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
      }
    }

    if (startDateDeadline && endDateDeadline) {
      dateFilter = {
        "cycle.validTill": {
          $gte: moment(startDateDeadline).startOf("day").toISOString(),
          $lte: moment(endDateDeadline).endOf("day").toISOString(),
        },
      };
      // logger.info(startDateDeadline);
      // logger.info(endDateDeadline);

      // logger.info(dateFilter);
    }

    if (member) {
      // logger.info("entered member");
      const test = await taskModel.find({ assignTo: member }).select("_id");
      test.map((ele) => {
        ids.push(ele._id.toString());
      });

      // logger.info(ids);
    }
    const isNumberQuery = !isNaN(query);
    const filterDate = new Date("2024-12-10");
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    let statusToFind = {
      ...(status === "booking-done" || status === "booking"
        ? {}
        : {
            clientType: null,
          }),
    };

    let walkinType = { leadType: { $eq: "walk-in" } };

    // if (status?.includes("visit2") && status != "") {
    //   walkinType = {
    //     $and: [
    //       {
    //         leadType: { $ne: "cp" },
    //       },
    //       {
    //         leadType: { $ne: null },
    //       },
    //     ],
    //   };
    // }

    if (status === "booking-done" || status === "booking") {
      statusToFind = {
        // ...statusToFind,
        // stage: "booking",
        // bookingStatus: { $ne: "pending" },
        $and: [
          // {
          //   bookingStatus: { $ne: null },
          // },
          {
            bookingStatus: { $eq: "booked" },
          },
        ],
      };
    } else if (status === "revisit-done") {
      statusToFind = {
        ...statusToFind,

        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        ...sortFilter,
        // visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "visit-done" || status === "visit") {
      statusToFind = {
        ...statusToFind,

        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            leadType: { $eq: "cp" },
          },
        ],
        // ...walkinType,
      };
      sortFilter = {
        ...sortFilter,

        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };

      // logger.info(statusToFind);
    } else if (status === "revisit-pending") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "revisit" },
        stage: { $ne: "booking" },
        // revisitStatus: { $eq: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        ...sortFilter,

        visitDate: -1,
        // revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "visit-pending") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "visit" },
        // visitStatus: { $eq: "pending" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "tagging-over") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "tagging-over" },
      };
    } else if (status === "pending") {
      statusToFind = {
        ...statusToFind,

        teamLeader: { $eq: teamLeaderId },
        startDate: { $gte: filterDate },
        // bookingStatus: { $ne: "booked" },

        $or: [
          {
            bookingStatus: { $ne: "booked" },
            visitStatus: "pending",
          },
          {
            bookingStatus: { $ne: "booked" },
            revisitStatus: "pending",
          },
        ],
        // leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit2") {
      statusToFind = {
        ...statusToFind,

        $and: [
          {
            visitStatus: { $ne: "pending" },
          },
          {
            stage: { $ne: "tagging-over" },
          },
          {
            stage: { $ne: "approval" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
      };
      sortFilter = {
        ...sortFilter,

        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "followup") {
      statusToFind = {
        ...statusToFind,

        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-followup") {
      statusToFind = {
        ...statusToFind,

        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status === "visit2-revisit-done") {
      statusToFind = {
        ...statusToFind,

        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],

        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
      sortFilter = {
        ...sortFilter,

        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (
      status === "visit2-visit-done" ||
      status === "visit2-done" ||
      status === "visit2"
    ) {
      statusToFind = {
        ...statusToFind,

        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
      sortFilter = {
        ...sortFilter,

        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "line-up") {
      const today = moment().tz("Asia/Kolkata");
      statusToFind = {
        ...statusToFind,

        siteVisitInterested: true,
        siteVisitInterestedDate: { $gte: today.toDate() },
      };
    } else if (status === "no-feedback" || status === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,

        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    } else if (status === "cp-note-pending") {
      statusToFind = {
        ...statusToFind,
        $and: [
          { cpNoteResolved: false },
          { "callHistory.notes": { $exists: true } },
          // { "callHistory.notes": { $ne: [] } },
        ],
      };
    } else if (status === "bulk-lead") {
      statusToFind = {
        ...statusToFind,
        clientType: null,
        isBulkLead: true,
      };
    } else if (status === "internal-lead") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadType: { $eq: "internal-lead" },
          },
        ],
      };
    } else if (status === "exhibition-2025") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadFrom: { $eq: "exhibition-2025" },
          },
        ],
      };
    }
    // assing /pending/etc
    if (status2 === "not-followup" || status2 === "not-assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status2 === "followup" || status2 === "assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status2 === "no-feedback" || status2 === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    }

    if (callData == "Call Not Received" || callData == "call not received") {
      // logger.info("call not received");
    } else if (callData == "Call Done" || callData == "Call done") {
      // logger.info("call done");
    } else if (callData == "Call Cancelled" || callData == "call cancelled") {
      // logger.info("Call Cancelled");
    } else if (callData == "Call Busy") {
      // logger.info("Call Busy");
    } else if (callData == "Not Reachable") {
      // logger.info("Not Reachable");
    }

    // logger.info(sortDirection);

    if (interval == "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (interval == "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
    } else if (interval == "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval == "annually") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    }
    // logger.info(startDate);
    // logger.info(endDate);

    // Base Filter for Search and Leads Query
    let baseFilter = {
      teamLeader: { $eq: teamLeaderId },
      disabled: { $eq: false },
      // startDate: {
      //   $gte: filterDate,
      //   ...(interval && { $gte: startDate, $lt: endDate }),
      // },
      ...(statusToFind != null ? statusToFind : null),
      ...(member != null ? { taskRef: { $in: ids } } : null),
      ...(cycle != null ? { "cycle.currentDays": parseInt(cycle) - 1 } : {}),
      ...(callData != null
        ? {
            $expr: {
              $eq: [
                { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
                callData, // Compare it with the passed value
              ],
            },
          }
        : {}),

      ...(bulkLead === "true"
        ? {
            isBulkLead: true,
            // disabled: true,
          }
        : {
            // isBulkLead: { $ne: true },
            // clientType: null,
          }),
      ...(clientstatus ? { clientInterestedStatus: clientstatus } : {}),
      ...(leadstatus === "lost"
        ? {
            $expr: {
              $gt: [{ $size: "$lostHistory" }, 2],
            },
          }
        : leadstatus
          ? { interestedStatus: leadstatus }
          : {}),
      ...(channelPartner ? { channelPartner: channelPartner } : {}),
      ...(project != null
        ? {
            project: {
              $in: [
                project, // Compare it with the passed value
              ],
            },
          }
        : {}),

      ...dateFilter,

      // ...(cyclehistory != null
      //   ? {
      //      $expr:{
      //       $eq:[
      //         {$arrayElemAt:["$cycleHistory.teamLeader", -1] },
      //         cyclehistory,
      //       ]
      //      }
      //     }
      //   : {}),
    };

    if (taskType) {
      const taskIds = await taskModel
        .find({ type: taskType, ...(member ? { assignTo: member } : {}) })
        .select("_id");
      const taskIdArray = taskIds.map((task) => task._id.toString());
      // logger.info(taskIdArray.length);
      baseFilter.taskRef = { $in: taskIdArray }; // Filter leads based on taskRef
    }

    // logger.info(JSON.stringify(baseFilter, null, 2));
    // Add query search conditions (if applicable)
    if (query) {
      const searchConditions = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean);

      baseFilter.$or = searchConditions;
      baseFilter.hideStatus = { $ne: true };
    }
    // logger.info(order);
    // logger.info(sortFilter);
    // logger.info(JSON.stringify(baseFilter, null, 2));
    // Fetch Leads
    const respLeads = await leadModelV2
      .find(baseFilter)
      .skip(skip)
      .limit(limit)
      .sort(sortFilter)
      .populate(leadPopulateOptions);

    const sortedLeads = respLeads.map((ele) => {
      ele.callHistory.sort(
        (a, b) => new Date(b.callDate) - new Date(a.callDate),
      );
      return ele;
    });

    // Extract teamLeader from cycleHistory based on currentOrder
    // const leadsWithTeamLeader = respLeads.map((lead) => {
    //   const currentOrder = lead.cycle.currentOrder;
    //   const cycleHistoryEntry = lead.cycleHistory.find(
    //     (entry) => entry.currentOrder === currentOrder
    //   );
    //   return {
    //     ...lead.toObject(),
    //     teamLeader: cycleHistoryEntry ? cycleHistoryEntry.teamLeader : null, // Get teamLeader from cycleHistory
    //   };
    // });

    // if (!respLeads.length) return res.send(errorRes(404, "No leads found"));

    // logger.info({
    //   hideStatus: { $ne: true },
    //   teamLeader: teamLeaderId,
    //   startDate: {
    //     $gte: filterDate,
    //     ...(interval && { $gte: startDate, $lt: endDate }),
    //   },
    // });
    const counts = await leadModelV2.aggregate([
      {
        $match: {
          // clientType: null,

          hideStatus: { $ne: true },
          teamLeader: teamLeaderId,
          // startDate: {
          //   $gte: filterDate,
          //   ...(interval && { $gte: startDate, $lt: endDate }),
          // },
        },
      },
      {
        $facet: {
          totalItems: [
            {
              $match: {
                clientType: null,
              },
            },
            { $count: "count" },
          ],
          totalItemsCount: [
            {
              $match: baseFilter,
            },
            { $count: "count" },
          ],
          pendingCount: [
            {
              $match: {
                clientType: null,
                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            {
              $match: {
                clientType: null,
                contactedStatus: { $ne: "pending" },
              },
            },
            { $count: "count" },
          ],
          followUpCount: [
            {
              $match: {
                clientType: null,
                followupStatus: { $ne: "pending" },
              },
            },
            { $count: "count" },
          ],
          assignedCount: [
            {
              $match: {
                clientType: null,
                taskRef: { $ne: null },
              },
            },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                clientType: null,

                $and: [
                  {
                    stage: { $ne: "approval" },
                  },
                  {
                    stage: { $ne: "booking" },
                  },
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                  {
                    leadType: "cp",
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
                clientType: null,

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
                clientType: null,
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
                // stage: "booking",
                // bookingStatus: { $ne: "pending" },
                $and: [
                  // {
                  //   bookingStatus: { $ne: null },
                  // },
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
                clientType: null,

                stage: { $ne: "tagging-over" },
                leadType: { $ne: "walk-in" },
                siteVisitInterested: true,
              },
            },
            { $count: "count" },
          ],

          // Add other count stages as required
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
          // Add other fields similarly as required
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          totalItemsCount: 1,
          lineUpCount: 1,
          // Include only the fields you need
        },
      },
    ]);

    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,
      totalItemsCount = 0,
      lineUpCount = 0,
      // Add other counts as required
    } = counts[0] || {};

    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        contactedCount,
        followUpCount,
        assignedCount,
        visitCount,
        visit2Count,
        revisitCount,
        bookingCount,
        totalItemsCount,
        lineUpCount,
        data: sortedLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadsByTarget = async (req, res, next) => {
  const teamLeaderId = req.params.id;

  try {
    if (!teamLeaderId)
      return res.send(errorRes(400, "Team leader ID required"));

    const { project, status, quarter, year } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let quarterStart, quarterEnd;
    if (quarter && year) {
      const startMonth = (parseInt(quarter) - 1) * 3;
      quarterStart = new Date(parseInt(year), startMonth, 1);
      quarterEnd = new Date(parseInt(year), startMonth + 3, 0);
    }

    // logger.info("Quarter:", quarter, "Year:", year);
    // logger.info("Quarter Start:", quarterStart);
    // logger.info("Quarter End:", quarterEnd);

    let postSales = [];
    let bookingIds = [];
    // logger.info(
    //   JSON.stringify(
    //     {
    //       closingManager: teamLeaderId,
    //       "bookingStatus.type": "confirm-booking",
    //       ...(quarterStart && quarterEnd
    //         ? {
    //             $and: [
    //               { date: { $lte: quarterEnd } },
    //               { date: { $gte: quarterStart } },
    //             ],
    //             ...(project ? { project } : {}),
    //           }
    //         : {}),
    //     },
    //     null,
    //     2
    //   )
    // );
    if (status === "booking-done") {
      postSales = await postSaleLeadModel
        .find({
          closingManager: teamLeaderId,
          "bookingStatus.type": "confirm-booking",
          ...(quarterStart && quarterEnd
            ? {
                $and: [
                  { date: { $lte: quarterEnd } },
                  { date: { $gte: quarterStart } },
                ],
                ...(project ? { project } : {}),
              }
            : {}),
        })
        .select("_id date closingManager bookingStatus.type");

      bookingIds = postSales.map((p) => p._id);
    } else if (status === "registration-done") {
      postSales = await postSaleLeadModel
        .find({
          closingManager: teamLeaderId,
          registrationDone: true,
          ...(quarterStart && quarterEnd
            ? {
                date: {
                  $gte: quarterStart,
                  $lte: quarterEnd,
                },
                ...(project ? { project } : {}),
              }
            : {}),
        })
        .select("_id");

      bookingIds = postSales.map((p) => p._id);
    }

    const filter = {
      ...(status === "booking-done" || status === "registration-done"
        ? { bookingRef: { $in: bookingIds } }
        : {}),
    };

    // logger.info(JSON.stringify(filter, null, 2));

    const totalItems = await leadModelV2.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    const leads = await leadModelV2
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate(leadPopulateOptions);

    // logger.info(leads);
    return res.send(
      successRes(200, "Filtered leads based on booking-done status", {
        page,
        limit,
        totalPages,
        totalItems,
        data: leads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadsAssignFeedback = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let status = req.query.status?.toLowerCase();
    let member = req.query.member;
    let cycle = req.query.cycle;
    let callData = req.query.callData;
    let order = req.query.order;
    let sortDirection = -1;
    const interval = req.query.interval;
    const currentDate = new Date();
    let startDate, endDate;
    // let callDone =req.query.callDone;

    let ids = [];

    const isNumberQuery = !isNaN(query);
    const filterDate = new Date("2024-12-10");
    let page = parseInt(req.query.page) || 1;
    let limit =
      status === "no-feedback" ? 999999 : parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    let statusToFind = null;
    if (status === "assigned") {
      statusToFind = {
        taskRef: { $ne: null },
        teamLeader: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-assigned") {
      statusToFind = {
        taskRef: { $eq: null },
        // ...walkinType,
        teamLeader: { $ne: null },
      };
    }

    if (order == "Ascending" || order == "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (order == "Descending" || order == "descending") {
      sortDirection = -1;
    }

    // Base Filter for Search and Leads Query
    let baseFilter = {
      // teamLeader: { $eq: teamLeaderId },
      // startDate: {
      //   $gte: filterDate,
      //   ...(interval && { $gte: startDate, $lt: endDate }),
      // },
      disabled: { $eq: false },

      // hideStatus: { $ne: true },
      ...(statusToFind != null ? statusToFind : null),
      ...(member != null ? { taskRef: { $in: ids } } : null),
      ...(cycle != null ? { "cycle.currentOrder": cycle } : {}),
      ...(callData != null
        ? {
            $expr: {
              $eq: [
                { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
                callData,
              ],
            },
          }
        : {}),
    };
    // logger.info(baseFilter);
    // Add query search conditions (if applicable)
    if (query) {
      const searchConditions = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },

        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean);

      baseFilter.$or = searchConditions;
    }
    // logger.info(order);
    // logger.info(sortDirection);
    // logger.info(JSON.stringify(baseFilter, null, 2));
    // Fetch Leads
    const respLeads = await leadModelV2
      .find(baseFilter)
      .skip(skip)
      .limit(limit)
      .sort({ "cycle.startDate": sortDirection, _id: 1 })
      .populate(leadPopulateOptions);

    // Extract teamLeader from cycleHistory based on currentOrder
    // const leadsWithTeamLeader = respLeads.map((lead) => {
    //   const currentOrder = lead.cycle.currentOrder;
    //   const cycleHistoryEntry = lead.cycleHistory.find(
    //     (entry) => entry.currentOrder === currentOrder
    //   );
    //   return {
    //     ...lead.toObject(),
    //     teamLeader: cycleHistoryEntry ? cycleHistoryEntry.teamLeader : null, // Get teamLeader from cycleHistory
    //   };
    // });

    // if (!respLeads.length) return res.send(errorRes(404, "No leads found"));

    const counts = await leadModelV2.aggregate([
      {
        $match: {
          // startDate: {
          //   $gte: filterDate,
          //   ...(interval && { $gte: startDate, $lt: endDate }),
          // },
          teamLeader: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "taskRef",
          foreignField: "_id",
          as: "taskDetails",
        },
      },
      {
        $unwind: {
          path: "$taskDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          totalItemsCount: [{ $match: baseFilter }, { $count: "count" }],
          assignedCount: [
            { $match: { taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          notAssignedCount: [
            { $match: { taskRef: { $eq: null } } },
            { $count: "count" },
          ],
          notFollowUpData: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $ne: [
                        { $arrayElemAt: ["$callHistory.caller", -1] },
                        null,
                      ],
                    },
                    { $ne: ["$taskDetails.assignTo", null] },
                    {
                      $ne: [
                        { $arrayElemAt: ["$callHistory.caller", -1] },
                        "$taskDetails.assignTo",
                      ],
                    },
                    {
                      $lt: [
                        { $arrayElemAt: ["$callHistory.callDate", -1] },
                        {
                          $dateSubtract: {
                            startDate: "$$NOW",
                            unit: "day",
                            amount: 2,
                          },
                        },
                      ],
                    },
                    {
                      $or: [
                        { $eq: ["$validTill", null] },
                        { $gte: ["$validTill", "$$NOW"] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                ids: { $push: "$_id" },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
          notFollowUpCount: { $arrayElemAt: ["$notFollowUpData.count", 0] },
          notFollowUpIds: { $arrayElemAt: ["$notFollowUpData.ids", 0] },
        },
      },
      {
        $project: {
          totalItems: 1,
          assignedCount: 1,
          notAssignedCount: 1,
          totalItemsCount: 1,
          notFollowUpCount: 1,
          notFollowUpIds: 1,
        },
      },
    ]);

    const {
      totalItems = 0,
      assignedCount = 0,
      notAssignedCount = 0,
      totalItemsCount = 0,
      notFollowUpCount = 0,
      notFollowUpIds = [],
    } = counts[0] || {};

    // const counts = await leadModelV2.aggregate([
    //   {
    //     $match: {
    //       // teamLeader: teamLeaderId,
    //       startDate: {
    //         $gte: filterDate,
    //         ...(interval && { $gte: startDate, $lt: endDate }),
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "tasks",
    //       localField: "taskRef",
    //       foreignField: "_id",
    //       as: "taskDetails",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$taskDetails",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $facet: {
    //       totalItems: [{ $count: "count" }],
    //       totalItemsCount: [
    //         {
    //           $match: baseFilter,
    //         },
    //         { $count: "count" },
    //       ],
    //       assignedCount: [
    //         { $match: { taskRef: { $ne: null } } },
    //         { $count: "count" },
    //       ],
    //       notAssignedCount: [
    //         { $match: { taskRef: { $eq: null } } },
    //         { $count: "count" },
    //       ],
    //       notFollowUpCount: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 // Ensure last caller is not null
    //                 {
    //                   $ne: [
    //                     { $arrayElemAt: ["$callHistory.caller", -1] },
    //                     null,
    //                   ],
    //                 },
    //                 { $ne: ["$taskDetails.assignTo", null] },
    //                 // Check if the last caller is not equal to assignTo
    //                 {
    //                   $ne: [
    //                     { $arrayElemAt: ["$callHistory.caller", -1] },
    //                     "$taskDetails.assignTo",
    //                   ],
    //                 },
    //                 // Check if last callDate is older than 3 days
    //                 {
    //                   $lt: [
    //                     { $arrayElemAt: ["$callHistory.callDate", -1] },
    //                     {
    //                       $dateSubtract: {
    //                         startDate: "$$NOW",
    //                         unit: "day",
    //                         amount: 2,
    //                       },
    //                     },
    //                   ],
    //                 },
    //                 {
    //                   $and: [
    //                     { $ne: ["$validTill", null] }, // Include if no validTill date
    //                     { $gte: ["$validTill", "$$NOW"] }, // Include only if validTill is today or in the future
    //                   ],
    //                 },
    //               ],
    //             },
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       // Add other count stages as required
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
    //       totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
    //       assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
    //       notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
    //       notFollowUpCount: { $arrayElemAt: ["$notFollowUpCount.count", 0] },
    //       notFollowUpIds: { $arrayElemAt: ["$notFollowUpCount._id", 0] },
    //       // Add other fields similarly as required
    //     },
    //   },
    //   {
    //     $project: {
    //       totalItems: 1,
    //       assignedCount: 1,
    //       notAssignedCount: 1,
    //       totalItemsCount: 1,
    //       notFollowUpCount: 1,
    //       notFollowUpIds: 1,
    //       // Include only the fields you need
    //     },
    //   },
    // ]);

    // const {
    //   totalItems = 0,
    //   assignedCount = 0,
    //   notAssignedCount = 0,
    //   totalItemsCount = 0,
    //   notFollowUpCount = 0,
    // } = counts[0] || {};

    const totalPages = Math.ceil(totalItems / limit);
    const noFeeds = await leadModelV2
      .find({ _id: { $in: notFollowUpIds } })
      .populate(leadPopulateOptions);
    if (status === "no-feedback2") {
      // statusToFind = {
      //   $expr: {
      //     $eq: [
      //       { $arrayElemAt: ["$callHistory.caller", -1] },
      //       "$taskRef.assignTo",
      //     ],
      //   },
      // };
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const matchingTasks = respLeads.filter((leadd) => {
        const lastCallHistory =
          leadd.callHistory[leadd.callHistory?.length - 1];

        // Ensure callHistory exists and has valid data
        if (!leadd.taskRef?.assignTo?._id) {
          return false;
        }

        const lastCallDate = new Date(lastCallHistory?.callDate);
        const currentDate = new Date();

        // Calculate the difference in days (check for older than 1 day)
        const daysDiff =
          (currentDate.getTime() - lastCallDate.getTime()) /
          (1000 * 60 * 60 * 24);
        return (
          // /*lastCallHistory.caller._id !== leadd.taskRef.assignTo._id &&*/
          lastCallDate <= oneWeekAgo
        );

        // return (
        //   lastCallHistory.caller._id !== leadd.taskRef.assignTo._id &&
        //   daysDiff > 7
        // );
      });
      const csvFilePath = path.join(__dirname, "no-feedback-leads.csv");
      const headers =
        "Lead Type,Client Name,PhoneNumber,Channel Partner, TeamLeader, Last Call Date, AssignTo ";

      const rows = noFeeds.map((task) => {
        const lastCallHistory = task.callHistory[task?.callHistory?.length - 1];
        const lastCallDate = new Date(lastCallHistory?.callDate);
        const currentDate = new Date();
        // const daysDiff =
        //   (currentDate.getTime() - lastCallDate.getTime()) /
        //   (1000 * 60 * 60 * 24);

        return `${task?.leadType ?? "NA"},${task?.firstName ?? ""} ${
          task?.lastName ?? ""
        },${task.phoneNumber ?? "NA"},${
          task?.channelPartner?.firmName ?? "NA"
        },${task?.teamLeader?.firstName ?? ""} ${
          task?.teamLeader?.lastName ?? ""
        },${
          moment(lastCallDate)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY hh:mm:ss a") ?? "NA"
        }, ${task?.taskRef?.assignTo?.firstName ?? ""} ${
          task?.taskRef?.assignTo?.lastName ?? ""
        }`;
      });

      const csvContent = headers + "\n" + rows.join("\n");

      // Write CSV File
      fs.writeFileSync(csvFilePath, csvContent);
      // logger.info(`CSV successfully created at: ${csvFilePath}`);

      return res.send(
        successRes(200, "Leads for team Leader", {
          page,
          limit,
          totalPages,
          totalItems,
          assignedCount,
          notAssignedCount,
          totalItemsCount: matchingTasks.length,
          notFollowUpCount,
          data: matchingTasks,
        }),
      );
    }

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        assignedCount,
        notAssignedCount,
        totalItemsCount,
        notFollowUpCount,
        data2: notFollowUpIds,
        data: respLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadsAssignFeedbackByTl = async (req, res, next) => {
  const teamLeaderId = req.params.id;
  try {
    let query = req.query.query || "";
    let status = req.query.status?.toLowerCase();
    // let member = req.query.member;
    let cycle = req.query.cycle;
    let callData = req.query.callData;
    let order = req.query.order;
    let sortDirection = -1;
    const interval = req.query.interval;
    const currentDate = new Date();
    let startDate, endDate;
    // let callDone =req.query.callDone;

    let ids = [];

    const isNumberQuery = !isNaN(query);
    const filterDate = new Date("2024-12-10");
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    const oneWeekAgo = new Date();
    const onDayAgo = new Date();
    onDayAgo.setDate(oneWeekAgo.getDate() - 1);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let statusToFind = null;

    if (status === "assigned") {
      statusToFind = {
        teamLeader: { $eq: teamLeaderId },
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-assigned") {
      statusToFind = {
        teamLeader: { $eq: teamLeaderId },
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status === "no-feedback" || status === "feedback-pending") {
      statusToFind = {
        teamLeader: { $eq: teamLeaderId },
        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    }

    if (order == "Ascending" || order == "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (order == "Descending" || order == "descending") {
      sortDirection = -1;
    }

    // Base Filter for Search and Leads Query
    let baseFilter = {
      teamLeader: { $eq: teamLeaderId },
      clientType: null,

      // startDate: {
      //   $gte: filterDate,
      //   ...(interval && { $gte: startDate, $lt: endDate }),
      // },
      // hideStatus: { $ne: true },
      ...(statusToFind != null ? statusToFind : null),
      // ...(member != null ? { taskRef: { $in: ids } } : null),
      ...(cycle != null ? { "cycle.currentOrder": cycle } : {}),
      // ...(status === "no-feedback"
      //   ? {
      //       $expr: {
      //         $lte: [
      //           { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
      //           oneWeekAgo,
      //         ],
      //       },
      //     }
      //   : {}),
    };
    // logger.info(baseFilter);
    // Add query search conditions (if applicable)
    if (query) {
      const searchConditions = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },

        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean);

      baseFilter.$or = searchConditions;
    }
    // logger.info(order);
    // logger.info(sortDirection);
    // logger.info(JSON.stringify(baseFilter, null, 2));
    // Fetch Leads
    const respLeads = await leadModelV2
      .find(baseFilter)
      .skip(skip)
      .limit(limit)
      .sort({ "cycle.startDate": sortDirection, _id: 1 })
      .populate(leadPopulateOptions);
    const sortedLeads = respLeads.map((ele) => {
      ele.callHistory.sort(
        (a, b) => new Date(b.callDate) - new Date(a.callDate),
      );
      return ele;
    });

    // Extract teamLeader from cycleHistory based on currentOrder
    // const leadsWithTeamLeader = respLeads.map((lead) => {
    //   const currentOrder = lead.cycle.currentOrder;
    //   const cycleHistoryEntry = lead.cycleHistory.find(
    //     (entry) => entry.currentOrder === currentOrder
    //   );
    //   return {
    //     ...lead.toObject(),
    //     teamLeader: cycleHistoryEntry ? cycleHistoryEntry.teamLeader : null, // Get teamLeader from cycleHistory
    //   };
    // });

    // if (!respLeads.length) return res.send(errorRes(404, "No leads found"));

    const counts = await leadModelV2.aggregate([
      {
        $match: {
          clientType: null,

          teamLeader: teamLeaderId,
          // startDate: {
          //   $gte: filterDate,
          //   ...(interval && { $gte: startDate, $lt: endDate }),
          // },
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "taskRef",
          foreignField: "_id",
          as: "taskDetails",
        },
      },
      {
        $unwind: {
          path: "$taskDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          totalItemsCount: [{ $match: baseFilter }, { $count: "count" }],
          assignedCount: [
            { $match: { teamLeader: teamLeaderId, taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          notAssignedCount: [
            { $match: { teamLeader: teamLeaderId, taskRef: { $eq: null } } },
            { $count: "count" },
          ],
          notFollowUpData: [
            {
              $match: {
                teamLeader: { $eq: teamLeaderId },
                taskRef: { $ne: null },
                "cycle.startDate": { $gt: onDayAgo },
                $expr: {
                  $and: [
                    {
                      $ne: [
                        { $arrayElemAt: ["$callHistory.caller", -1] },
                        null,
                      ],
                    },
                    {
                      $lte: [
                        { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                        oneWeekAgo,
                      ],
                    },
                  ],
                },
              },
              // $match: {
              //   teamLeader: teamLeaderId,
              //   $expr: {
              //     $and: [
              //       {
              //         $ne: [
              //           { $arrayElemAt: ["$callHistory.caller", -1] },
              //           null,
              //         ],
              //       },
              //       { $ne: ["$taskDetails.assignTo", null] },
              //       {
              //         $ne: [
              //           { $arrayElemAt: ["$callHistory.caller", -1] },
              //           "$taskDetails.assignTo",
              //         ],
              //       },
              //       {
              //         $lt: [
              //           { $arrayElemAt: ["$callHistory.callDate", -1] },
              //           {
              //             $dateSubtract: {
              //               startDate: "$$NOW",
              //               unit: "day",
              //               amount: 2,
              //             },
              //           },
              //         ],
              //       },
              //       {
              //         $or: [
              //           { $eq: ["$validTill", null] },
              //           { $gte: ["$validTill", "$$NOW"] },
              //         ],
              //       },
              //     ],
              //   },
              // },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                ids: { $push: "$_id" },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
          notFollowUpCount: { $arrayElemAt: ["$notFollowUpData.count", 0] },
          notFollowUpIds: { $arrayElemAt: ["$notFollowUpData.ids", 0] },
        },
      },
      {
        $project: {
          totalItems: 1,
          assignedCount: 1,
          notAssignedCount: 1,
          totalItemsCount: 1,
          notFollowUpCount: 1,
          notFollowUpIds: 1,
        },
      },
    ]);

    const {
      totalItems = 0,
      assignedCount = 0,
      notAssignedCount = 0,
      totalItemsCount = 0,
      notFollowUpCount = 0,
      notFollowUpIds = [],
    } = counts[0] || {};

    // const counts = await leadModelV2.aggregate([
    //   {
    //     $match: {
    //       // teamLeader: teamLeaderId,
    //       startDate: {
    //         $gte: filterDate,
    //         ...(interval && { $gte: startDate, $lt: endDate }),
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "tasks",
    //       localField: "taskRef",
    //       foreignField: "_id",
    //       as: "taskDetails",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$taskDetails",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $facet: {
    //       totalItems: [{ $count: "count" }],
    //       totalItemsCount: [
    //         {
    //           $match: baseFilter,
    //         },
    //         { $count: "count" },
    //       ],
    //       assignedCount: [
    //         { $match: { taskRef: { $ne: null } } },
    //         { $count: "count" },
    //       ],
    //       notAssignedCount: [
    //         { $match: { taskRef: { $eq: null } } },
    //         { $count: "count" },
    //       ],
    //       notFollowUpCount: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 // Ensure last caller is not null
    //                 {
    //                   $ne: [
    //                     { $arrayElemAt: ["$callHistory.caller", -1] },
    //                     null,
    //                   ],
    //                 },
    //                 { $ne: ["$taskDetails.assignTo", null] },
    //                 // Check if the last caller is not equal to assignTo
    //                 {
    //                   $ne: [
    //                     { $arrayElemAt: ["$callHistory.caller", -1] },
    //                     "$taskDetails.assignTo",
    //                   ],
    //                 },
    //                 // Check if last callDate is older than 3 days
    //                 {
    //                   $lt: [
    //                     { $arrayElemAt: ["$callHistory.callDate", -1] },
    //                     {
    //                       $dateSubtract: {
    //                         startDate: "$$NOW",
    //                         unit: "day",
    //                         amount: 2,
    //                       },
    //                     },
    //                   ],
    //                 },
    //                 {
    //                   $and: [
    //                     { $ne: ["$validTill", null] }, // Include if no validTill date
    //                     { $gte: ["$validTill", "$$NOW"] }, // Include only if validTill is today or in the future
    //                   ],
    //                 },
    //               ],
    //             },
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       // Add other count stages as required
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
    //       totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
    //       assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
    //       notAssignedCount: { $arrayElemAt: ["$notAssignedCount.count", 0] },
    //       notFollowUpCount: { $arrayElemAt: ["$notFollowUpCount.count", 0] },
    //       notFollowUpIds: { $arrayElemAt: ["$notFollowUpCount._id", 0] },
    //       // Add other fields similarly as required
    //     },
    //   },
    //   {
    //     $project: {
    //       totalItems: 1,
    //       assignedCount: 1,
    //       notAssignedCount: 1,
    //       totalItemsCount: 1,
    //       notFollowUpCount: 1,
    //       notFollowUpIds: 1,
    //       // Include only the fields you need
    //     },
    //   },
    // ]);

    // const {
    //   totalItems = 0,
    //   assignedCount = 0,
    //   notAssignedCount = 0,
    //   totalItemsCount = 0,
    //   notFollowUpCount = 0,
    // } = counts[0] || {};

    const totalPages = Math.ceil(totalItems / limit);
    const noFeeds = await leadModelV2
      .find({ _id: { $in: notFollowUpIds } })
      .populate(leadPopulateOptions);
    if (status === "no-feedback2") {
      // statusToFind = {
      //   $expr: {
      //     $eq: [
      //       { $arrayElemAt: ["$callHistory.caller", -1] },
      //       "$taskRef.assignTo",
      //     ],
      //   },
      // };
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const matchingTasks = respLeads.filter((leadd) => {
        const lastCallHistory =
          leadd.callHistory[leadd.callHistory?.length - 1];

        // Ensure callHistory exists and has valid data
        if (!leadd.taskRef?.assignTo?._id) {
          return false;
        }

        const lastCallDate = new Date(lastCallHistory?.callDate);
        const currentDate = new Date();

        // Calculate the difference in days (check for older than 1 day)
        const daysDiff =
          (currentDate.getTime() - lastCallDate.getTime()) /
          (1000 * 60 * 60 * 24);
        return (
          // /*lastCallHistory.caller._id !== leadd.taskRef.assignTo._id &&*/
          lastCallDate <= oneWeekAgo
        );

        // return (
        //   lastCallHistory.caller._id !== leadd.taskRef.assignTo._id &&
        //   daysDiff > 7
        // );
      });
      const csvFilePath = path.join(__dirname, "no-feedback-leads.csv");
      const headers =
        "Lead Type,Client Name,PhoneNumber,Channel Partner, TeamLeader, Last Call Date, AssignTo ";

      const rows = noFeeds.map((task) => {
        const lastCallHistory = task.callHistory[task?.callHistory?.length - 1];
        const lastCallDate = new Date(lastCallHistory?.callDate);
        const currentDate = new Date();
        // const daysDiff =
        //   (currentDate.getTime() - lastCallDate.getTime()) /
        //   (1000 * 60 * 60 * 24);

        return `${task?.leadType ?? "NA"},${task?.firstName ?? ""} ${
          task?.lastName ?? ""
        },${task.phoneNumber ?? "NA"},${
          task?.channelPartner?.firmName ?? "NA"
        },${task?.teamLeader?.firstName ?? ""} ${
          task?.teamLeader?.lastName ?? ""
        },${
          moment(lastCallDate)
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY hh:mm:ss a") ?? "NA"
        }, ${task?.taskRef?.assignTo?.firstName ?? ""} ${
          task?.taskRef?.assignTo?.lastName ?? ""
        }`;
      });

      const csvContent = headers + "\n" + rows.join("\n");

      // Write CSV File
      fs.writeFileSync(csvFilePath, csvContent);
      // logger.info(`CSV successfully created at: ${csvFilePath}`);

      return res.send(
        successRes(200, "Leads for team Leader", {
          page,
          limit,
          totalPages,
          totalItems,
          assignedCount,
          notAssignedCount,
          totalItemsCount: matchingTasks.length,
          notFollowUpCount,
          data: matchingTasks,
        }),
      );
    }

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        assignedCount,
        notAssignedCount,
        totalItemsCount,
        notFollowUpCount,
        data2: notFollowUpIds,
        data: sortedLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadsAssignFeedbackByTlCounts = async (req, res, next) => {
  const { teamLeader: bTeamLeader } = req.query;
  const user = req.user;
  let teamLeader = bTeamLeader;
  if (user?.designation === "desg-post-sales-head") {
    //
    teamLeader = user?._id;
  }
  try {
    let teamLeaders = [
      "ev15-deepak-karki",
      "ev54-ranjna-gupta",
      // "ev69-vicky-mane",
      "ev70-jaspreet-arora",
    ];
    if (teamLeader) {
      teamLeaders = [teamLeader];
    }
    const teamL = await employeeModel
      .find({ _id: { $in: teamLeaders } })
      .populate(employeePopulateOptions);

    // logger.info(teamL);
    const oneWeekAgo = new Date();
    const onDayAgo = new Date();
    onDayAgo.setDate(oneWeekAgo.getDate() - 1);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filterDate = new Date("2024-12-10"); // Adjust this as needed
    const interval = req.query.interval; // Add interval logic if needed
    const startDate = interval ? new Date(interval.start) : null;
    const endDate = interval ? new Date(interval.end) : null;

    // Base filter for all leads
    const baseFilter = {
      // startDate: {
      //   $gte: filterDate,
      //   ...(interval && { $gte: startDate, $lt: endDate }),
      // },
    };

    // Fetch counts for each team leader
    const teamLeaderCounts = await Promise.all(
      teamLeaders.map(async (teamLeaderId) => {
        const counts = await leadModelV2.aggregate([
          {
            $match: {
              "cycle.teamLeader": teamLeaderId,
              // hideStatus: { $ne: true },
              ...baseFilter,
              clientType: null,
            },
          },
          {
            $facet: {
              totalItems: [{ $count: "count" }], // Total leads for this team leader (base filter only)
              assignedCount: [
                { $match: { taskRef: { $ne: null } } },
                { $count: "count" },
              ],
              notAssignedCount: [
                { $match: { taskRef: { $eq: null } } },
                { $count: "count" },
              ],
              notFollowUpCount: [
                {
                  $match: {
                    taskRef: { $ne: null },
                    "cycle.startDate": { $gt: onDayAgo },

                    $expr: {
                      $and: [
                        {
                          $ne: [
                            { $arrayElemAt: ["$callHistory.caller", -1] },
                            null,
                          ],
                        },
                        {
                          $lte: [
                            { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                            oneWeekAgo,
                          ],
                        },
                      ],
                    },
                  },
                },
                { $count: "count" },
              ],
            },
          },
          {
            $addFields: {
              totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
              assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
              notAssignedCount: {
                $arrayElemAt: ["$notAssignedCount.count", 0],
              },
              notFollowUpCount: {
                $arrayElemAt: ["$notFollowUpCount.count", 0],
              },
            },
          },
        ]);
        const findTl = teamL.find((ele) => ele._id == teamLeaderId);

        return {
          teamLeader: findTl,
          totalItems: counts[0]?.totalItems || 0,
          assignedCount: counts[0]?.assignedCount || 0,
          notAssignedCount: counts[0]?.notAssignedCount || 0,
          notFollowUpCount: counts[0]?.notFollowUpCount || 0,
        };
      }),
    );

    // Calculate global totals
    const totalItems = teamLeaderCounts.reduce(
      (sum, leader) => sum + leader.totalItems,
      0,
    );
    const totalAssignedCount = teamLeaderCounts.reduce(
      (sum, leader) => sum + leader.assignedCount,
      0,
    );
    const totalNotAssignedCount = teamLeaderCounts.reduce(
      (sum, leader) => sum + leader.notAssignedCount,
      0,
    );
    const totalNotFollowUpCount = teamLeaderCounts.reduce(
      (sum, leader) => sum + leader.notFollowUpCount,
      0,
    );

    // Calculate totalPages
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Get Counts", {
        page,
        limit,
        totalPages,
        totalItems,
        totalAssignedCount,
        totalNotAssignedCount,
        totalNotFollowUpCount,
        data: teamLeaderCounts,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const getAssignedToSalesManger = async (req, res, next) => {
  const salesManagerId = req.params.id;
  let cycle = req.query.cycle;
  let member = req.query.member;
  // logger.info(req.params);
  // logger.info(req.query);
  const respTeamLeader = await employeeModel.findById(salesManagerId);
  const teamLeaderId = respTeamLeader.reportingTo;

  // logger.info(salesManagerId);
  try {
    if (!salesManagerId) return res.send(errorRes(401, "id required"));

    let query = req.query.query || "";
    let status = req.query.status?.toLowerCase();
    let status2 = req.query.status2?.toLowerCase();

    let ids = [];
    let callData = req.query.callData;
    let clientstatus = req.query.clientstatus;
    let leadstatus = req.query.leadstatus;
    let date = req.query.date;
    let dateFilter = {};
    let startDateDeadline = req.query.startDateDeadline;
    let endDateDeadline = req.query.endDateDeadline;
    let channelPartner = req.query.channelPartner?.toLowerCase();
    let taskType = req.query.taskType;
    let interval = req.query.interval;
    let project = req.query.project;
    let member = req.query.member;

    // let callDone =req.query.callDone;
    let validity = req.query.validity;
    let order = req.query.order;
    let sortDirection = -1;
    // logger.info(status);
    const targetDate = validity
      ? moment.tz(validity, "Asia/Kolkata")
      : moment.tz("Asia/Kolkata");
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;

    if (order == "Ascending" || order == "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (order == "Descending" || order == "descending") {
      sortDirection = -1;
    }

    let sortFilter = {
      // visitDate: -1,
      // revisitDate: -1,
      "cycle.startDate": sortDirection,
      _id: 1,
    };

    // Get start and end of the target date
    const startOfDay = targetDate.startOf("day").toDate(); // 00:00:00
    const endOfDay = targetDate.endOf("day").toDate(); // 23:59:59

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
      startDate = moment(startDate).tz("Asia/Kolkata").startOf("day").toDate();
      endDate = moment(endDate).tz("Asia/Kolkata").endOf("day").toDate();
      // logger.info(startDate);
      // logger.info(endDate);
    }

    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          "cycle.validTill": {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
      }
    }

    if (startDateDeadline && endDateDeadline) {
      dateFilter = {
        "cycle.validTill": {
          $gte: moment(startDateDeadline).startOf("day").toISOString(),
          $lte: moment(endDateDeadline).endOf("day").toISOString(),
        },
      };
      // logger.info(startDateDeadline);
      // logger.info(endDateDeadline);

      // logger.info(dateFilter);
    }

    if (salesManagerId) {
      // logger.info("entered member");
      let taskFilter, transferFrom;
      if (status === "task-pending") {
        taskFilter = false;
      } else if (status === "task-completed") {
        taskFilter = true;
      }

      if (member) {
        transferFrom = true;
        // logger.info("entered member");

        // logger.info(ids);
      }
      // logger.info({
      //   assignTo: salesManagerId,
      //   ...(taskFilter != null ? { completed: taskFilter } : {}),
      //   deadline: { $gte: new Date() },
      // });

      const test = await taskModel
        .find({
          assignTo: salesManagerId,
          ...(taskFilter != null ? { completed: taskFilter } : {}),
          ...(transferFrom != null ? { transferTaskFrom: member } : {}),

          deadline: { $gte: new Date() },
        })
        .select("_id");
      // logger.info(test.length);
      test.map((ele) => {
        ids.push(ele._id.toString());
      });

      // logger.info(ids);
    }
    const isNumberQuery = !isNaN(query);
    const filterDate = new Date("2024-12-10");
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    let skip = (page - 1) * limit;

    let statusToFind = {
      ...(status === "booking-done" || status === "booking"
        ? {}
        : { clientType: null }),
    };

    // let statusToFind = null;
    let walkinType = { leadType: { $eq: "walk-in" } };

    // if (status?.includes("visit2") && status != "") {
    //   walkinType = {
    //     $and: [
    //       {
    //         leadType: { $ne: "cp" },
    //       },
    //       {
    //         leadType: { $ne: null },
    //       },
    //     ],
    //   };
    // }
    if (status === "booking-done" || status === "booking") {
      statusToFind = {
        // stage: "booking",
        // bookingStatus: { $ne: "pending" },
        $and: [
          {
            bookingStatus: { $ne: null },
          },
          {
            bookingStatus: { $eq: "booked" },
          },
        ],
      };
    } else if (status === "revisit-done") {
      statusToFind = {
        ...statusToFind,

        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        // visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "visit-done" || status === "visit") {
      statusToFind = {
        ...statusToFind,

        stage: { $ne: "approval" },
        bookingRef: { $eq: null },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            leadType: { $eq: "cp" },
          },
        ],
        // ...walkinType,
        // leadType: { $ne: "walk-in" },
      };

      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "revisit-pending") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "revisit" },
        stage: { $ne: "booking" },
        // revisitStatus: { $eq: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        // revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "visit-pending") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "visit" },
        // visitStatus: { $eq: "pending" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "tagging-over") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "tagging-over" },
      };
    } else if (status === "pending") {
      statusToFind = {
        ...statusToFind,

        teamLeader: { $eq: teamLeaderId },
        // startDate: { $gte: filterDate },
        bookingStatus: { $ne: "booked" },

        // stage: { $ne: "booking" },

        // $or: [
        //   {
        //     stage: { $ne: "booking" },
        //     visitStatus: "pending",
        //   },
        //   {
        //     stage: { $ne: "booking" },
        //     revisitStatus: "pending",
        //   },
        // ],

        $or: [
          {
            bookingStatus: { $ne: "booked" },
            visitStatus: "pending",
          },
          {
            bookingStatus: { $ne: "booked" },
            revisitStatus: "pending",
          },
        ],

        leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit2") {
      statusToFind = {
        ...statusToFind,

        $and: [
          {
            visitStatus: { $ne: "pending" },
          },
          {
            stage: { $ne: "tagging-over" },
          },
          {
            stage: { $ne: "approval" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "followup") {
      statusToFind = {
        ...statusToFind,

        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-followup") {
      statusToFind = {
        ...statusToFind,

        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status === "visit2-revisit-done") {
      statusToFind = {
        ...statusToFind,

        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],

        // ...walkinType,
        // leadType: { $eq: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (
      status === "visit2-visit-done" ||
      status === "visit2" ||
      status == "visit2"
    ) {
      statusToFind = {
        ...statusToFind,

        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status == "line-up") {
      // logger.info("booi pendding");
      const today = moment().tz("Asia/Kolkata");
      statusToFind = {
        ...statusToFind,

        siteVisitInterested: true,
        siteVisitInterestedDate: { $gte: today.toDate() }, // only today & future
      };
    } else if (status === "no-feedback" || status === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,

        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    } else if (status === "cp-note-pending") {
      statusToFind = {
        ...statusToFind,
        $and: [
          { cpNoteResolved: false },
          { "callHistory.notes": { $exists: true } },
          // { "callHistory.notes": { $ne: [] } },
        ],
      };
    } else if (status === "team-performance-visit") {
      const siteVisit = await siteVisitModel.find(
        {
          callBy: salesManagerId,
          ...(startDateDeadline && endDateDeadline
            ? {
                date: {
                  $gte: startDateDeadline,
                  $lt: endDateDeadline,
                },
              }
            : {}),
        },

        { phoneNumber: 1 },
      );

      const phoneNumberSite = siteVisit.map((ele) => ele.phoneNumber);
      statusToFind = {
        ...statusToFind,
        phoneNumber: { $in: phoneNumberSite },
        // ...walkinType,
      };
    } else if (status === "team-performance-line-up") {
      const leadLineUp = await leadModelV2.find(
        {
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

              caller: salesManagerId,
              interestedVisit: true,
            },
          },
        },
        { phoneNumber: 1 },
      );

      const phoneNumberLineUp = leadLineUp.map((ele) => ele.phoneNumber);
      statusToFind = {
        ...statusToFind,
        phoneNumber: { $in: phoneNumberLineUp },
        // ...walkinType,
      };
    } else if (status === "team-performance-interested") {
      // logger.info({
      //   callHistory: {
      //     $elemMatch: {
      //       ...(startDate && endDate
      //         ? {
      //             callDate: {
      //               $gte: startDate,
      //               $lte: endDate,
      //             },
      //           }
      //         : {}),
      //       caller: salesManagerId,
      //       interestedStatus: "interested",
      //     },
      //   },
      // });
      const leadInt = await leadModelV2.find(
        {
          callHistory: {
            $elemMatch: {
              ...(startDate && endDate
                ? {
                    callDate: {
                      $gte: startDate,
                      $lte: endDate,
                    },
                  }
                : {}),
              caller: salesManagerId,
              interestedStatus: "interested",
            },
          },
        },
        { phoneNumber: 1 },
      );

      const phoneNumberInt = leadInt.map((ele) => ele.phoneNumber);
      statusToFind = {
        ...statusToFind,
        phoneNumber: { $in: phoneNumberInt },
      };
    } else if (status === "team-performance-live-lead") {
      //       logger.info(JSON.stringify({            ...(startDate && endDate
      //               ? {
      //                   assignDate: {
      //                     $gte: startDate,
      //                     $lt: endDate,
      //                   },
      //                 }
      //               : {}),
      // }));

      const taskIds = await taskModel.find(
        {
          assignTo: salesManagerId,
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
        { _id: 1, lead: 1, type: 1 },
      );
      let liveLeadTask = taskIds.filter((task) => task.type == "live-lead");
      let liveLeadMap = liveLeadTask.map((task) => task._id);

      ids = liveLeadTask.map((ele) => ele._id);
      // statusToFind = {
      //   ...statusToFind,
      //   taskRef: { $in: liveLeadTask.map((ele) => ele._id) },

      // };
      logger.info("check");
    } else if (status === "team-performance-transfer-lead") {
      const taskIds = await taskModel.find(
        {
          assignTo: salesManagerId,
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
        { _id: 1, type: 1 },
      );
      let transferLeadTask = taskIds.filter(
        (task) => task.type == "transfer-lead",
      );
      ids = transferLeadTask.map((task) => task._id);
      // let transferLeadMap = transferLeadTask.map((task) => task._id);
      //       logger.info(transferLeadTask);
      // logger.info(transferLeadMap);

      // statusToFind = {
      //   ...statusToFind,
      //   taskRef: { $in: transferLeadTask.map((ele) => ele._id) },
      // };
    } else if (status === "exhibition-2025") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadFrom: { $eq: "exhibition-2025" },
          },
        ],
      };
    }

    // else if(status==="team-performance-task-completed"){

    //   const taskIds = await taskModel.find(
    //     {
    //       assignTo: salesManagerId,
    //       ...(startDate && endDate
    //         ? {
    //             assignDate: {
    //               $gte: startDate,
    //               $lt: endDate,
    //             },
    //           }
    //         : {}),
    //       deadline: { $gte: new Date() },
    //        completed:true,
    //     },

    //     { _id: 1, type: 1 }

    //   );

    //           logger.info(JSON.stringify(  {
    //       assignTo: salesManagerId,
    //       ...(startDate && endDate
    //         ? {
    //             assignDate: {
    //               $gte: startDate,
    //               $lt: endDate,
    //             },
    //           }
    //         : {}),
    //       deadline: { $gte: new Date() },
    //        completed:true,
    //     },));

    // }

    // logger.info(JSON.stringify({ callHistory: {
    //             $elemMatch: {
    //               ...(startDate && endDate
    //                 ? {
    //                     callDate: {
    //                       $gte: startDate,
    //                       $lt: endDate,
    //                     },
    //                   }
    //                 : {}),

    //               caller: salesManagerId,
    //               interestedVisit: true,
    //             },
    //           },}),null,2);

    if (status2 === "not-followup" || status2 === "not-assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status2 === "followup" || status2 === "assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status2 === "no-feedback" || status2 === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    }

    // logger.info("yes2");
    // Base Filter for Search and Leads Query

    let baseFilter = {
      disabled: { $eq: false },

      // teamLeader: { $eq: teamLeaderId },
      // startDate: { $gte: filterDate },
      ...(statusToFind != null ? statusToFind : {}),
      ...(cycle != null ? { "cycle.currentOrder": cycle } : {}),
      ...(ids != null ? { taskRef: { $in: ids } } : {}),

      ...(channelPartner ? { channelPartner: channelPartner } : {}),
      ...(callData != null
        ? {
            $expr: {
              $eq: [
                { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
                callData, // Compare it with the passed value
              ],
            },
          }
        : {}),
      ...(clientstatus ? { clientInterestedStatus: clientstatus } : {}),
      ...(leadstatus ? { interestedStatus: leadstatus } : {}),
      ...(project != null
        ? {
            project: {
              $in: [
                project, // Compare it with the passed value
              ],
            },
          }
        : {}),
      ...dateFilter,
    };

    // logger.info(JSON.stringify(baseFilter,null,2));

    if (taskType) {
      const taskIds = await taskModel
        .find({
          type: taskType,
          ...(salesManagerId ? { assignTo: salesManagerId } : {}),
        })
        .select("_id");
      const taskIdArray = taskIds.map((task) => task._id.toString());
      // logger.info(taskIdArray.length);
      baseFilter.taskRef = { $in: taskIdArray }; // Filter leads based on taskRef
    }
    // Add query search conditions (if applicable)
    if (query) {
      const searchConditions = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },

        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean);

      baseFilter.$or = searchConditions;
    }

    // logger.info(order);
    // logger.info(sortDirection);
    // logger.info(JSON.stringify(baseFilter, null, 2));
    // Fetch Leads
    const respLeads = await leadModelV2
      .find(baseFilter)
      .skip(skip)
      .limit(limit)
      .sort(sortFilter)
      .populate(leadPopulateOptions);
    // logger.info(respLeads.length);

    const sortedLeads = respLeads.map((ele) => {
      ele.callHistory.sort(
        (a, b) => new Date(b.callDate) - new Date(a.callDate),
      );
      return ele;
    });

    // if (!respLeads.length) return res.send(errorRes(404, "No leads found"));

    const counts = await leadModelV2.aggregate([
      {
        $match: {
          teamLeader: teamLeaderId /*, startDate: { $gte: filterDate } */,
        },
      },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          pendingCount: [
            {
              $match: {
                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            { $match: { contactedStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          followUpCount: [
            { $match: { followupStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          assignedCount: [
            { $match: { taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                stage: { $ne: "approval" },
                stage: { $ne: "booking" },
                $and: [
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
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
                visitStatus: { $ne: "pending" },
                leadType: { $eq: "walk-in" },
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
                    bookingStatus: { $ne: null },
                  },
                  {
                    bookingStatus: { $ne: "pending" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],

          // Add other count stages as required
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          // Add other fields similarly as required
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          // Include only the fields you need
        },
      },
    ]);

    // logger.info(counts);
    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,

      // Add other counts as required
    } = counts[0] || {};

    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        contactedCount,
        followUpCount,
        assignedCount,
        visitCount,
        visit2Count,
        revisitCount,
        bookingCount,
        length: respLeads.length,
        data: sortedLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadsTeamLeaderReportingTo = async (req, res, next) => {
  const id = req.params.id;
  let cycle = req.query.cycle;
  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const respTeamLeader = await employeeModel.findById(id);
    const teamLeaderId = respTeamLeader.reportingTo;

    let query = req.query.query || "";
    let status = req.query.status?.toLowerCase();
    let status2 = req.query.status2?.toLowerCase();
    let callData = req.query.callData;
    let clientstatus = req.query.clientstatus;
    let member = req.query.member;
    let leadstatus = req.query.leadstatus;
    let validity = req.query.validity;
    const interval = req.query.interval;
    const currentDate = new Date();
    let order = req.query.order;
    let channelPartner = req.query.channelPartner?.toLowerCase();
    let taskType = req.query.taskType;
    let bulkLead = req.query.bulkLead;
    let sortDirection = -1;
    let date = req.query.date;
    let dateFilter = {};
    let startDateDeadline = req.query.startDateDeadline;
    let endDateDeadline = req.query.endDateDeadline;
    let project = req.query.project;
    let startDate, endDate;
    let ids = [];

    if (order == "Ascending" || order == "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (order == "Descending" || order == "descendinh") {
      sortDirection = -1;
    }
    let sortFilter = {
      // visitDate: -1,
      // revisitDate: -1,
      "cycle.startDate": sortDirection,
      _id: 1,
    };

    const targetDate = validity
      ? moment.tz(validity, "Asia/Kolkata")
      : moment.tz("Asia/Kolkata");

    // Get start and end of the target date
    const startOfDay = targetDate.startOf("day").toDate(); // 00:00:00
    const endOfDay = targetDate.endOf("day").toDate(); // 23:59:59

    const filterDate = new Date("2024-12-10");

    const isNumberQuery = !isNaN(query);

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    let statusToFind = {
      ...(status === "booking-done" || status === "booking"
        ? {}
        : { clientType: null }),
    };

    let walkinType = { leadType: { $ne: "walk-in" } };
    if (member) {
      let taskFilter;
      if (status === "task-pending") {
        taskFilter = false;
      } else if (status === "task-completed") {
        taskFilter = true;
      }
      // logger.info("entered member");
      const test = await taskModel
        .find({
          assignTo: member,
          ...(taskFilter != null ? { completed: taskFilter } : {}),
          deadline: { $gte: new Date() },
        })
        .select("_id");
      test.map((ele) => {
        ids.push(ele._id.toString());
      });

      // logger.info(ids);
    }

    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          "cycle.validTill": {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
      }
    }

    if (startDateDeadline && endDateDeadline) {
      dateFilter = {
        "cycle.validTill": {
          $gte: moment(startDateDeadline).startOf("day").toISOString(),
          $lte: moment(endDateDeadline).endOf("day").toISOString(),
        },
      };
      // logger.info(startDate);
      // logger.info(endDate);

      // logger.info(dateFilter);
    }

    // if (status?.includes("visit2") && status != "") {
    //   walkinType = {
    //     $and: [
    //       {
    //         leadType: { $ne: "cp" },
    //       },
    //       {
    //         leadType: { $ne: null },
    //       },
    //     ],
    //   };
    // }

    if (status === "booking-done" || status === "booking") {
      statusToFind = {
        // stage: "booking",
        // bookingStatus: { $ne: "pending" },
        $and: [
          {
            bookingStatus: { $ne: null },
          },
          {
            bookingStatus: { $eq: "booked" },
          },
        ],
      };
    } else if (status === "revisit-done") {
      statusToFind = {
        ...statusToFind,

        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        // visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "visit-done" || status === "visit") {
      statusToFind = {
        ...statusToFind,

        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            leadType: { $eq: "cp" },
          },
        ],
        // ...walkinType,
        // leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "revisit-pending") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "revisit" },
        stage: { $ne: "booking" },
        // revisitStatus: { $eq: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        // revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "visit-pending") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "visit" },
        // visitStatus: { $eq: "pending" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "tagging-over") {
      statusToFind = {
        ...statusToFind,

        stage: { $eq: "tagging-over" },
      };
    } else if (status === "pending") {
      statusToFind = {
        ...statusToFind,

        teamLeader: { $eq: teamLeaderId },
        // startDate: { $gte: filterDate },
        bookingStatus: { $ne: "booked" },

        // stage: { $ne: "booking" },

        // $or: [
        //   {
        //     stage: { $ne: "booking" },
        //     visitStatus: "pending",
        //   },
        //   {
        //     stage: { $ne: "booking" },
        //     revisitStatus: "pending",
        //   },
        // ],

        $or: [
          {
            bookingStatus: { $ne: "booked" },
            visitStatus: "pending",
          },
          {
            bookingStatus: { $ne: "booked" },
            revisitStatus: "pending",
          },
        ],

        leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit2") {
      statusToFind = {
        ...statusToFind,

        $and: [
          {
            visitStatus: { $ne: "pending" },
          },
          {
            stage: { $ne: "tagging-over" },
          },
          {
            stage: { $ne: "approval" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status === "followup") {
      statusToFind = {
        ...statusToFind,

        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-followup") {
      statusToFind = {
        ...statusToFind,

        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status === "visit2-revisit-done") {
      statusToFind = {
        ...statusToFind,

        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],

        // ...walkinType,
        // leadType: { $eq: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (
      status === "visit2-visit-done" ||
      status === "visit2" ||
      status == "visit2"
    ) {
      statusToFind = {
        ...statusToFind,

        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
      sortFilter = {
        visitDate: -1,
        revisitDate: -1,
        // "cycle.startDate": sortDirection,
        _id: 1,
      };
    } else if (status == "line-up") {
      // logger.info("booi pendding");
      const today = moment().tz("Asia/Kolkata");
      statusToFind = {
        ...statusToFind,

        siteVisitInterested: true,
        siteVisitInterestedDate: { $gte: today.toDate() }, // only today & future
      };
    } else if (status === "no-feedback" || status === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,

        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    } else if (status === "cp-note-pending") {
      statusToFind = {
        ...statusToFind,
        $and: [
          { cpNoteResolved: false },
          { "callHistory.notes": { $exists: true } },
          // { "callHistory.notes": { $ne: [] } },
        ],
      };
    } else if (status === "bulk-lead") {
      statusToFind = {
        ...statusToFind,
        clientType: null,
        isBulkLead: true,
      };
    } else if (status === "internal-lead") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadType: { $eq: "internal-lead" },
          },
        ],
      };
    } else if (status === "exhibition-2025") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadFrom: { $eq: "exhibition-2025" },
          },
        ],
      };
    }

    // assing /pending/etc
    if (status2 === "not-followup" || status2 === "not-assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status2 === "followup" || status2 === "assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status2 === "no-feedback" || status2 === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    }

    if (callData == "Call Not Received" || callData == "call not received") {
      // logger.info("call not received");
    } else if (callData == "Call Done") {
      // logger.info("call done");
    } else if (callData == "Call Cancelled" || callData == "call cancelled") {
      // logger.info("Call Cancelled");
    } else if (callData == "Call Busy") {
      // logger.info("Call Busy");
    } else if (callData == "Not Reachable") {
      // logger.info("Not Reachable");
    }

    if (interval == "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (interval == "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
    } else if (interval == "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval == "annually") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    }

    // Base Filter for Search and Leads Query
    let baseFilter = {
      teamLeader: { $eq: teamLeaderId },
      disabled: { $eq: false },
      // startDate: { $gte: filterDate },
      ...(statusToFind != null ? statusToFind : null),
      ...(member != null ? { taskRef: { $in: ids } } : null),
      ...(cycle != null ? { "cycle.currentDays": parseInt(cycle) - 1 } : {}),
      // disabled: { $eq: false },
      ...(channelPartner ? { channelPartner: channelPartner } : {}),

      // hideStatus: { $ne: true },
      ...(callData != null
        ? {
            $expr: {
              $eq: [
                { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
                callData, // Compare it with the passed value
              ],
            },
          }
        : {}),

      ...(bulkLead === "true"
        ? {
            isBulkLead: true,
            // disabled: true,
          }
        : {
            // isBulkLead: { $ne: true },
            // clientType: null,
          }),
      ...(clientstatus ? { clientInterestedStatus: clientstatus } : {}),
      ...(leadstatus ? { interestedStatus: leadstatus } : {}),
      ...(project != null
        ? {
            project: {
              $in: [
                project, // Compare it with the passed value
              ],
            },
          }
        : {}),

      ...dateFilter,
    };

    if (taskType) {
      const taskIds = await taskModel
        .find({ type: taskType, ...(member ? { assignTo: member } : {}) })
        .select("_id");
      const taskIdArray = taskIds.map((task) => task._id.toString());
      // logger.info(taskIdArray.length);
      baseFilter.taskRef = { $in: taskIdArray }; // Filter leads based on taskRef
    }

    // logger.info(baseFilter);
    // Add query search conditions (if applicable)
    if (query) {
      const searchConditions = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },

        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean);

      baseFilter.$or = searchConditions;
    }

    // Fetch Leads
    const respLeads = await leadModelV2
      .find(baseFilter)
      .skip(skip)
      .limit(limit)
      .sort(sortFilter)
      .populate(leadPopulateOptions);
    const sortedLeads = respLeads.map((ele) => {
      ele.callHistory.sort(
        (a, b) => new Date(b.callDate) - new Date(a.callDate),
      );
      return ele;
    });

    // if (!respLeads.length) return res.send(errorRes(404, "No leads found"));

    // Calculate Counts
    // const counts = await leadModelV2.aggregate([
    //   { $match: { teamLeader: teamLeaderId, startDate: { $gte: filterDate } } },
    //   {
    //     $facet: {
    //       totalItems: [{ $count: "count" }],
    //       pendingCount: [
    //         {
    //           $match: {
    //             $or: [
    //               { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
    //               {
    //                 revisitStatus: "pending",
    //                 bookingStatus: { $ne: "booked" },
    //               },
    //             ],
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       contactedCount: [
    //         { $match: { contactedStatus: { $ne: "pending" } } },
    //         { $count: "count" },
    //       ],
    //       followUpCount: [
    //         { $match: { followupStatus: { $ne: "pending" } } },
    //         { $count: "count" },
    //       ],
    //       assignedCount: [
    //         { $match: { taskRef: { $ne: null } } },
    //         { $count: "count" },
    //       ],
    //       visitCount: [
    //         {
    //           $match: {
    //             stage: { $ne: "approval" },
    //             stage: { $ne: "booking" },
    //             $and: [
    //               {
    //                 visitStatus: { $ne: null },
    //               },
    //               {
    //                 visitStatus: { $ne: "pending" },
    //               },
    //             ],
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       revisitCount: [
    //         {
    //           $match: {
    //             stage: "booking",
    //             $and: [
    //               {
    //                 revisitStatus: { $ne: null },
    //               },
    //               {
    //                 revisitStatus: { $ne: "pending" },
    //               },
    //             ],
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       visit2Count: [
    //         {
    //           $match: {
    //             visitStatus: { $ne: "pending" },
    //             leadType: { $eq: "walk-in" },
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       bookingCount: [
    //         {
    //           $match: {
    //             stage: "booking",
    //             // bookingStatus: { $ne: "pending" },
    //             $and: [
    //               {
    //                 bookingStatus: { $ne: null },
    //               },
    //               {
    //                 bookingStatus: { $ne: "pending" },
    //               },
    //             ],
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       lineUpCount: [
    //         {
    //           $match: {
    //             stage: { $ne: "tagging-over" },
    //             leadType: { $ne: "walk-in" },
    //             siteVisitInterested: true,
    //           },
    //         },
    //         { $count: "count" },
    //       ],
    //       // Add other count stages as required
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
    //       pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
    //       contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
    //       followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
    //       assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
    //       visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
    //       revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
    //       visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
    //       bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
    //       lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
    //       // Add other fields similarly as required
    //     },
    //   },
    //   {
    //     $project: {
    //       totalItems: 1,
    //       pendingCount: 1,
    //       contactedCount: 1,
    //       followUpCount: 1,
    //       assignedCount: 1,
    //       visitCount: 1,
    //       revisitCount: 1,
    //       visit2Count: 1,
    //       bookingCount: 1,
    //       lineUpCount: 1,
    //       // Include only the fields you need
    //     },
    //   },
    // ]);

    // const {
    //   totalItems = 0,
    //   pendingCount = 0,
    //   contactedCount = 0,
    //   followUpCount = 0,
    //   assignedCount = 0,
    //   visitCount = 0,
    //   revisitCount = 0,
    //   visit2Count = 0,
    //   bookingCount = 0,
    //   lineUpCount = 0,

    //   // Add other counts as required
    // } = counts[0] || {};
    const counts = await leadModelV2.aggregate([
      {
        $match: {
          hideStatus: { $ne: true },
          teamLeader: teamLeaderId,
          // startDate: { $gte: filterDate },
        },
      },
      {
        $facet: {
          totalItems: [
            {
              $match: {
                clientType: null,
              },
            },
            { $count: "count" },
          ],
          totalItemsCount: [
            {
              $match: baseFilter,
            },
            { $count: "count" },
          ],
          pendingCount: [
            {
              $match: {
                clientType: null,

                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            {
              $match: {
                clientType: null,
                contactedStatus: { $ne: "pending" },
              },
            },
            { $count: "count" },
          ],
          followUpCount: [
            {
              $match: {
                clientType: null,
                followupStatus: { $ne: "pending" },
              },
            },
            { $count: "count" },
          ],
          assignedCount: [
            {
              $match: {
                clientType: null,
                taskRef: { $ne: null },
              },
            },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                clientType: null,

                $and: [
                  {
                    stage: { $ne: "approval" },
                  },
                  {
                    stage: { $ne: "booking" },
                  },
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                  {
                    leadType: "cp",
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
                clientType: null,

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
                clientType: null,
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
                // stage: "booking",
                // bookingStatus: { $ne: "pending" },
                $and: [
                  {
                    bookingStatus: { $ne: null },
                  },
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
                clientType: null,

                stage: { $ne: "tagging-over" },
                leadType: { $ne: "walk-in" },
                siteVisitInterested: true,
              },
            },
            { $count: "count" },
          ],

          // Add other count stages as required
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },

          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
          // Add other fields similarly as required
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          totalItemsCount: 1,
          lineUpCount: 1,
          // Include only the fields you need
        },
      },
    ]);

    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,
      totalItemsCount = 0,
      lineUpCount = 0,
      // Add other counts as required
    } = counts[0] || {};

    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        contactedCount,
        followUpCount,
        assignedCount,
        visitCount,
        visit2Count,
        revisitCount,
        bookingCount,
        lineUpCount,
        totalItemsCount,
        length: respLeads.length,
        data: sortedLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const leadUpdateStatus = async (req, res, next) => {
  const id = req.params.id;
  const { status, bookingRef, visitRef, revisitRef } = req.body;
  try {
    if (!id) return res.send(errorRes(401, "id required"));
    if (!status) return res.send(errorRes(401, "status required"));

    const foundLead = await leadModelV2.findById(id);
    if (!foundLead) {
      return res.send(errorRes(404, "no lead found with id"));
    }
    const foundTLPlayerId = await oneSignalModel.findOne({
      docId: foundLead?.channelPartner,
      // role: teamLeaderResp?.role,
    });

    if (status === "booked") {
      foundLead.bookingStatus = "booked";
      foundLead.stage = "booking";
      foundLead.bookingRef = bookingRef;
      await foundLead.save();
      if (foundLead.channelPartner) {
        if (foundTLPlayerId) {
          try {
            await sendNotificationWithInfo({
              playerIds: [foundTLPlayerId.playerId],
              title: "Booking Done",
              message: `Booking Done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }.`,
            });
          } catch (error) {
            logger.info(error);
          }
        }
      }
    }

    if (status === "visited") {
      foundLead.visitStatus = "visited";
      foundLead.stage = "revisit";
      foundLead.visitRef = visitRef;
      foundLead.cycle.stage = "revisit";
      foundLead.cycle.validTill = new Date().addDays(30);
      await foundLead.save();

      if (foundLead.channelPartner) {
        if (foundTLPlayerId) {
          await sendNotificationWithImage({
            playerIds: [foundTLPlayerId.playerId],
            title: "Site Visit done",
            message: `Site Visit Done for ${foundLead.firstName ?? ""} ${
              foundLead.lastName ?? ""
            }.`,
            imageUrl:
              "https://cdni.iconscout.com/illustration/premium/thumb/couple-visiting-construction-site-for-checking-work-progress-illustration-download-in-svg-png-gif-file-formats--crane-lifting-family-plot-area-real-estate-pack-buildings-illustrations-1757215.png",
          });
        }
      }
    }
    if (status === "revisited") {
      foundLead.revisitStatus = "revisited";
      foundLead.stage = "booking";
      foundLead.revisitRef = revisitRef;
      foundLead.cycle.validTill = new Date().addDays(180);

      await foundLead.save();
      if (foundLead.channelPartner) {
        if (foundTLPlayerId) {
          try {
            await sendNotificationWithInfo({
              playerIds: [foundTLPlayerId.playerId],
              title: "Revisit Done",
              message: `Revisit Done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }.`,
            });
          } catch (error) {
            logger.info(error);
          }
        }
      }
    }
    if (status === "called") {
      foundLead.contactedStatus = "contacted";
      // foundLead.revisitRef = revisitRef;
      await foundLead.save();
    }

    return res.send(
      successRes(200, "Status Updated", {
        data: foundLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadTeamLeaderGraph = async (req, res, next) => {
  const teamLeaderId = req.params.id;
  try {
    if (!teamLeaderId) return res.send(errorRes(401, "id Required"));

    const filterDate = new Date("2024-12-10");
    const interval = req.query.interval;
    const currentDate = new Date();

    // Initialize startDate and endDate
    let startDate, endDate;

    // Set startDate and endDate based on the interval
    if (interval === "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (interval === "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
    } else if (interval === "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval === "annually") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    } else {
      // Default to the current date if no valid interval is provided
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    }

    // Count leads based on the team leader and the specified date range
    // const leadCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },
    //     startDate: {
    //       $gte: filterDate,
    //       ...(interval && { $gte: startDate, $lt: endDate }),
    //     },
    //   })) || 0;

    // const bookingCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },
    //     bookingStatus: { $ne: "pending" },
    //   })) || 0;

    // const visitCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },
    //     visitStatus: { $ne: "pending" },
    //   })) || 0;

    // const revisitCount =
    //   (await leadModelV2.countDocuments({
    //     teamLeader: { $eq: teamLeaderId },

    //     revisitStatus: { $ne: "pending" },
    //   })) || 0;

    /* --new graphs -- */
    // const visitCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   // visitStatus: { $ne: "pending" },
    //   // leadType: { $ne: "walk-in" },
    //   $and: [
    //     {
    //       stage: { $ne: "approval" },
    //     },
    //     {
    //       stage: { $ne: "booking" },
    //     },
    //     {
    //       visitStatus: { $ne: null },
    //     },
    //     {
    //       visitStatus: { $ne: "pending" },
    //     },
    //     {
    //       leadType: "cp",
    //     },
    //   ],
    // });

    // const revisitCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   revisitStatus: { $ne: "pending" },
    //   $or: [
    //     {
    //       stage: { $ne: "tagging-over" },
    //     },
    //     {
    //       stage: { $ne: "approval" },
    //     },
    //   ],
    // });
    // const visit2Count = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   visitStatus: { $ne: "pending" },
    //   leadType: { $eq: "walk-in" },
    //   $or: [
    //     {
    //       stage: { $ne: "tagging-over" },
    //     },
    //     {
    //       stage: { $ne: "approval" },
    //     },
    //   ],
    // });

    // const bookingCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   stage: "booking",
    //   // bookingStatus: { $ne: "pending" },
    //   $and: [
    //     {
    //       bookingStatus: { $ne: null },
    //     },
    //     {
    //       bookingStatus: { $ne: "pending" },
    //     },
    //   ],
    // });

    // const pendingCount = await leadModelV2.countDocuments({
    //   teamLeader: { $eq: teamLeaderId },
    //   bookingStatus: { $ne: "booked" },
    //   $or: [
    //     {
    //       visitStatus: "pending",
    //     },
    //     {
    //       revisitStatus: "pending",
    //     },
    //   ],
    // });

    // logger.info({
    //   hideStatus: { $ne: true },
    //   teamLeader: teamLeaderId,
    //   startDate: {
    //     $gte: filterDate,
    //     ...(interval && { $gte: startDate, $lt: endDate }),
    //   },
    // });

    const counts = await leadModelV2.aggregate([
      {
        $match: {
          hideStatus: { $ne: true },
          teamLeader: teamLeaderId,
          startDate: {
            $gte: filterDate,
            ...(interval && { $gte: startDate, $lt: endDate }),
          },
        },
      },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          totalItemsCount: [{ $count: "count" }],
          pendingCount: [
            {
              $match: {
                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            { $match: { contactedStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          followUpCount: [
            { $match: { followupStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          assignedCount: [
            { $match: { taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                $and: [
                  { stage: { $ne: "approval" } },
                  { stage: { $ne: "booking" } },
                  { visitStatus: { $ne: null } },
                  { visitStatus: { $ne: "pending" } },
                  { leadType: "cp" },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { revisitStatus: { $ne: null } },
                  { revisitStatus: { $ne: "pending" } },
                ],
              },
            },
            { $count: "count" },
          ],
          visit2Count: [
            {
              $match: {
                $and: [
                  { stage: { $ne: "approval" } },
                  { stage: { $ne: "booking" } },
                  { visitStatus: { $ne: null } },
                  { visitStatus: { $ne: "pending" } },
                  { leadType: { $eq: "walk-in" } },
                ],
              },
            },
            { $count: "count" },
          ],
          bookingCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                ],
              },
            },
            { $count: "count" },
          ],
          lineUpCount: [
            {
              $match: {
                stage: { $ne: "tagging-over" },
                leadType: { $ne: "walk-in" },
                siteVisitInterested: true,
              },
            },
            { $count: "count" },
          ],
          bookingWalkinCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                  { leadType: "walk-in" },
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
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                  { leadType: "cp" },
                ],
              },
            },
            { $count: "count" },
          ],
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          bookingWalkinCount: {
            $arrayElemAt: ["$bookingWalkinCount.count", 0],
          },
          bookingCpCount: { $arrayElemAt: ["$bookingCpCount.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          totalItemsCount: 1,
          lineUpCount: 1,
          bookingWalkinCount: 1,
          bookingCpCount: 1,
        },
      },
    ]);

    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,
      totalItemsCount = 0,
      lineUpCount = 0,
      bookingWalkinCount = 0,
      bookingCpCount = 0,
    } = counts[0] || {};

    // const leadToVisitCount = leadCount > 0 ? (visitCount * 100) / leadCount : 0;
    // const visitToBookingCount =
    //   visitCount > 0 ? (bookingCount * 100) / visitCount : 0;
    // const revisitToBookingCount =
    //   revisitCount > 0 ? (bookingCount * 100) / revisitCount : 0;
    // const leadToBookingCount =
    //   leadCount > 0 ? (bookingCount * 100) / leadCount : 0;

    return res.send(
      successRes(200, "graphs", {
        data: {
          leadCount: totalItems,
          bookingCount,
          visitCount,
          revisitCount,
          visit2Count,
          pendingCount,
          bookingWalkinCount,
          bookingCpCount,
        },
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, "Internal Server Error", error));
  }
};

export const getLeadTeamLeaderReportingToGraph = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "id Required"));

    const userResp = await employeeModel.findById(id);

    const filterDate = new Date("2024-12-10");
    var teamLeaderId = userResp.reportingTo;

    const leadCount =
      (await leadModelV2.countDocuments({
        teamLeader: { $eq: teamLeaderId },
        startDate: { $gte: filterDate },
      })) || 0;

    const counts = await leadModelV2.aggregate([
      { $match: { teamLeader: teamLeaderId, startDate: { $gte: filterDate } } },
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          totalItemsCount: [{ $count: "count" }],
          pendingCount: [
            {
              $match: {
                $or: [
                  { visitStatus: "pending", bookingStatus: { $ne: "booked" } },
                  {
                    revisitStatus: "pending",
                    bookingStatus: { $ne: "booked" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          contactedCount: [
            { $match: { contactedStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          followUpCount: [
            { $match: { followupStatus: { $ne: "pending" } } },
            { $count: "count" },
          ],
          assignedCount: [
            { $match: { taskRef: { $ne: null } } },
            { $count: "count" },
          ],
          visitCount: [
            {
              $match: {
                $and: [
                  {
                    stage: { $ne: "approval" },
                  },
                  {
                    stage: { $ne: "booking" },
                  },
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                  {
                    leadType: "cp",
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          revisitCount: [
            {
              $match: {
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
                $and: [
                  {
                    stage: { $ne: "approval" },
                  },
                  {
                    stage: { $ne: "booking" },
                  },
                  {
                    visitStatus: { $ne: null },
                  },
                  {
                    visitStatus: { $ne: "pending" },
                  },
                  {
                    leadType: { $eq: "walk-in" },
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
                    bookingStatus: { $ne: null },
                  },
                  {
                    bookingStatus: { $ne: "pending" },
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          lineUpCount: [
            {
              $match: {
                stage: { $ne: "tagging-over" },
                leadType: { $ne: "walk-in" },
                siteVisitInterested: true,
              },
            },
            { $count: "count" },
          ],
          bookingWalkinCount: [
            {
              $match: {
                stage: "booking",
                $and: [
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                  { leadType: "walk-in" },
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
                  { bookingStatus: { $ne: null } },
                  { bookingStatus: { $ne: "pending" } },
                  { leadType: "cp" },
                ],
              },
            },
            { $count: "count" },
          ],

          // Add other count stages as required
        },
      },
      {
        $addFields: {
          totalItems: { $arrayElemAt: ["$totalItems.count", 0] },
          bookingWalkinCount: {
            $arrayElemAt: ["$bookingWalkinCount.count", 0],
          },
          bookingCpCount: { $arrayElemAt: ["$bookingCpCount.count", 0] },
          totalItemsCount: { $arrayElemAt: ["$totalItemsCount.count", 0] },
          pendingCount: { $arrayElemAt: ["$pendingCount.count", 0] },
          contactedCount: { $arrayElemAt: ["$contactedCount.count", 0] },
          followUpCount: { $arrayElemAt: ["$followUpCount.count", 0] },
          assignedCount: { $arrayElemAt: ["$assignedCount.count", 0] },
          visitCount: { $arrayElemAt: ["$visitCount.count", 0] },
          revisitCount: { $arrayElemAt: ["$revisitCount.count", 0] },
          visit2Count: { $arrayElemAt: ["$visit2Count.count", 0] },
          bookingCount: { $arrayElemAt: ["$bookingCount.count", 0] },
          lineUpCount: { $arrayElemAt: ["$lineUpCount.count", 0] },
          // Add other fields similarly as required
        },
      },
      {
        $project: {
          totalItems: 1,
          pendingCount: 1,
          contactedCount: 1,
          followUpCount: 1,
          assignedCount: 1,
          visitCount: 1,
          revisitCount: 1,
          visit2Count: 1,
          bookingCount: 1,
          totalItemsCount: 1,
          lineUpCount: 1,
          bookingWalkinCount: 1,
          bookingCpCount: 1,
          // Include only the fields you need
        },
      },
    ]);

    const {
      totalItems = 0,
      pendingCount = 0,
      contactedCount = 0,
      followUpCount = 0,
      assignedCount = 0,
      visitCount = 0,
      revisitCount = 0,
      visit2Count = 0,
      bookingCount = 0,
      totalItemsCount = 0,
      lineUpCount = 0,
      bookingWalkinCount = 0,
      bookingCpCount = 0,
      // Add other counts as required
    } = counts[0] || {};

    return res.send(
      successRes(200, "graphs", {
        data: {
          leadCount,
          bookingCount,
          visitCount,
          revisitCount,
          visit2Count,
          pendingCount,
          bookingWalkinCount,
          bookingCpCount,
          // leadToVisitCount,
          // visitToBookingCount,
          // revisitToBookingCount,
          // leadToBookingCount,
        },
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, "Internal Server Error", error));
  }
};

export const getLeadsPreSalesExecutive = async (req, res, next) => {
  const teamLeaderId = req.params.id;
  try {
    let query = req.query.query || "";
    let status = req.query.status;

    const isNumberQuery = !isNaN(query);

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let statusToFind = null;
    /*if (status === "visit-done") {
      statusToFind = { "visitStage.status": "done" };
    } else if (status === "revisit-done") {
      statusToFind = { "revisitStage.status": "done" };
    } else if (status === "booking") {
      statusToFind = { "bookingStage.status": "booked" };
    } else */ if (status === "followup") {
      statusToFind = { stage: "followup" };
    }

    let skip = (page - 1) * limit;
    let searchFilter = {
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: query,
              options: "i",
            },
          },
        },

        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$altPhoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },
        statusToFind != null ? statusToFind : null,
        { interestedStatus: { $regex: query, $options: "i" } },
      ].filter(Boolean),
    };

    const respLeads = await leadModelV2
      .find({
        ...searchFilter,
        preSalesExecutive: teamLeaderId,
      })
      .skip(skip)
      .limit(limit)
      .sort({ startDate: -1 })
      .populate(leadPopulateOptions);
    const sortedLeads = respLeads.map((ele) => {
      ele.callHistory.sort(
        (a, b) => new Date(b.callDate) - new Date(a.callDate),
      );
      return ele;
    });

    if (!respLeads) return res.send(errorRes(404, "No leads found"));

    // Count the total items matching the filter
    const totalItems = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
    });
    const pendingCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
      status: "Pending",
    });

    const contactedCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
      status: "Contacted",
    });

    const followUpCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
      status: "FollowUp",
    });

    const assignedCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
    });

    const visitCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
      "visitStage.status": "done",
    });
    const revisitCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
      "revisitStage.status": "done",
    });
    const bookingCount = await leadModelV2.countDocuments({
      preSalesExectuive: { $eq: teamLeaderId },
      "bookingStage.status": "booked",
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Leads for team Leader", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        contactedCount,
        followUpCount,
        assignedCount,
        visitCount,
        revisitCount,
        bookingCount,
        data: sortedLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const searchLeads = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let status =
      req.query.approvalStatus?.toLowerCase() ??
      req.query.status?.toLowerCase();
    let status2 = req.query.status2?.toLowerCase();
    let cycle = req.query.cycle;
    let callData = req.query.callData;
    let leadstatus = req.query.leadstatus;

    let lostStatus = req.query.lostStatus;
    let clientstatus = req.query.clientstatus;

    let order = req.query.order;
    let sortDirection = -1;
    const interval = req.query.interval;
    const currentDate = new Date();
    let date = req.query.date;
    let dateFilter = {};
    let startDateDeadline = req.query.startDateDeadline;
    let endDateDeadline = req.query.endDateDeadline;
    // logger.info(approvalStatus);
    let stage = req.query.stage?.toLowerCase();
    let channelPartner = req.query.channelPartner?.toLowerCase();
    let teamLeader = req.query.teamLeader?.toLowerCase();
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    let statusToFind = null;
    let taskType = req.query.taskType;
    let validity = req.query.validity;
    let sort = req.query.sort;

    const targetDate = validity
      ? moment.tz(validity, "Asia/Kolkata")
      : moment.tz("Asia/Kolkata");

    const startOfDay = targetDate.startOf("day").toDate(); // 00:00:00
    const endOfDay = targetDate.endOf("day").toDate(); // 23:59:59

    let ids = [];

    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          "cycle.validTill": {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
      }
    }

    if (startDateDeadline && endDateDeadline) {
      dateFilter = {
        "cycle.validTill": {
          $gte: moment(startDateDeadline).startOf("day").toISOString(),
          $lte: moment(endDateDeadline).endOf("day").toISOString(),
        },
      };
      // logger.info(startDateDeadline);
      // logger.info(endDateDeadline);

      // logger.info(dateFilter);
    }

    const isNumberQuery = !isNaN(query);
    //  const filterDate = new Date("2024-12-10");

    if (status === "booking-done" || status === "booking") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "pending" },
        $and: [
          {
            bookingStatus: { $ne: null },
          },
          {
            bookingStatus: { $eq: "booked" },
          },
        ],
      };
    } else if (status === "revisit-done") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit-done" || status === "visit") {
      statusToFind = {
        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            leadType: { $ne: "walk-in" },
          },
        ],
        // ...walkinType,
      };
    } else if (status === "revisit-pending") {
      statusToFind = {
        stage: { $eq: "revisit" },
        stage: { $ne: "booking" },
        // revisitStatus: { $eq: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit-pending") {
      statusToFind = {
        stage: { $eq: "visit" },
        // visitStatus: { $eq: "pending" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $eq: "pending" },
          },
        ],

        // ...walkinType,
        leadType: { $ne: "walk-in" },
      };
    } else if (status === "tagging-over") {
      statusToFind = {
        stage: { $eq: "tagging-over" },
      };
    } else if (status === "pending") {
      statusToFind = {
        // startDate: { $gte: filterDate },
        // bookingStatus: { $ne: "booked" },
        isBulkLead: false,
        $or: [
          {
            approvalStatus: null,
            // bookingStatus: { $ne: "booked" },
            // visitStatus: "pending",
          },
          {
            approvalStatus: "pending",
            // bookingStatus: { $ne: "booked" },
            // revisitStatus: "pending",
          },
        ],
        // leadType: { $ne: "walk-in" },
      };
    } else if (status === "visit2") {
      statusToFind = {
        $and: [
          {
            visitStatus: { $ne: "pending" },
          },
          {
            stage: { $ne: "tagging-over" },
          },
          {
            stage: { $ne: "approval" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
      };
    } else if (status === "followup") {
      statusToFind = {
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status === "not-followup") {
      statusToFind = {
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status === "visit2-revisit-done") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "booked" },
        // revisitStatus: { $ne: "pending" },
        $and: [
          {
            revisitStatus: { $ne: null },
          },
          {
            revisitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],

        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
    } else if (
      status === "visit2-visit-done" ||
      status === "visit2-done" ||
      status === "visit2"
    ) {
      statusToFind = {
        stage: { $ne: "approval" },
        stage: { $ne: "booking" },
        $and: [
          {
            visitStatus: { $ne: null },
          },
          {
            visitStatus: { $ne: "pending" },
          },
          {
            $or: [
              {
                leadType: "walk-in",
              },
              {
                leadType: "internal-lead",
              },
            ],
          },
        ],
        // ...walkinType,
        leadType: { $eq: "walk-in" },
      };
    } else if (status == "line-up") {
      // logger.info("line-up");
      statusToFind = {
        siteVisitInterested: true,
      };
    } else if (status === "no-feedback" || status === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // logger.info(oneWeekAgo);
      // logger.info(onDayAgo);

      statusToFind = {
        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    } else if (status === "internal-lead") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadType: { $eq: "internal-lead" },
          },
        ],
      };
    } else if (status === "exhibition-2025") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            leadFrom: { $eq: "exhibition-2025" },
          },
        ],
      };
    } else if (status === "informed-cp") {
      statusToFind = {
        stage: "booking",
        // bookingStatus: { $ne: "pending" },
        $and: [
          {
            bookingStatus: { $ne: null },
          },
          {
            bookingStatus: { $eq: "booked" },
          },
          {
            informedStatus: { $eq: true },
          },
        ],
      };
    } else if (status === "is-channel-partner") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            clientType: { $eq: "is-channel-partner" },
          },
        ],
      };
    } else if (status === "blacklisted-client") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            clientType: { $eq: "blacklisted-client" },
          },
        ],
      };
    } else if (status === "lost") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            clientType: { $eq: "lost" },
          },
        ],
      };
    }

    // assing /pending/etc
    if (status2 === "not-followup" || status2 === "not-assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $eq: null },
        // ...walkinType,
      };
    } else if (status2 === "followup" || status2 === "assigned") {
      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        // ...walkinType,
      };
    } else if (status2 === "no-feedback" || status2 === "feedback-pending") {
      const oneWeekAgo = new Date();
      const onDayAgo = new Date();
      onDayAgo.setDate(oneWeekAgo.getDate() - 1);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      statusToFind = {
        ...statusToFind,
        taskRef: { $ne: null },
        "cycle.startDate": { $gt: onDayAgo },
        $expr: {
          $and: [
            {
              $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
            },
            {
              $lte: [
                { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
                oneWeekAgo,
              ],
            },
          ],
        },
        // ...walkinType,
      };
    }

    if (callData == "Call Not Received" || callData == "call not received") {
      // logger.info("call not received");
    } else if (callData == "Call Done" || callData == "Call done") {
      // logger.info("call done");
    } else if (callData == "Call Cancelled" || callData == "call cancelled") {
      // logger.info("Call Cancelled");
    } else if (callData == "Call Busy") {
      // logger.info("Call Busy");
    } else if (callData == "Not Reachable") {
      // logger.info("Not Reachable");
    }

    if (order == "Ascending" || order == "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (order == "Descending" || order == "descending") {
      sortDirection = -1;
    }

    if (interval == "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
    } else if (interval == "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
    } else if (interval == "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval == "annually") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    }

    // if (callData == "Call Not Received" || callData == "call not received") {
    //   logger.info("call not received");
    // } else if (callData == "Call Done" || callData == "Call done") {
    //   logger.info("call done");
    // } else if (callData == "Call Cancelled" || callData == "call cancelled") {
    //   logger.info("Call Cancelled");
    // } else if (callData == "Call Busy") {
    //   logger.info("Call Busy");
    // } else if (callData == "Not Reachable") {
    //   logger.info("Not Reachable");
    // }

    let orFilters = [
      { firstName: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: query,
            options: "i",
          },
        },
      },
    ];

    if (isNumberQuery) {
      orFilters.push(
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phoneNumber" },
              regex: query,
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$altPhoneNumber" },
              regex: query,
            },
          },
        },
      );
    }

    orFilters.push(
      { email: { $regex: query, $options: "i" } },
      { address: { $regex: query, $options: "i" } },
      { interestedStatus: { $regex: query, $options: "i" } },
    );

    let searchFilter = {
      ...(statusToFind != null ? statusToFind : null),
      $or: orFilters,

      // ...(approvalStatus && {
      //   approvalStatus: { $regex: approvalStatus, $options: "i" },
      // }),
      ...(statusToFind != null ? statusToFind : null),

      ...(cycle != null ? { "cycle.currentDays": parseInt(cycle) - 1 } : {}),
      ...(callData != null
        ? {
            $expr: {
              $eq: [
                { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
                callData, // Compare it with the passed value
              ],
            },
          }
        : {}),
      ...(clientstatus ? { clientInterestedStatus: clientstatus } : {}),
      ...(leadstatus === "lost"
        ? {
            $expr: {
              $gt: [{ $size: "$lostHistory" }, 2],
            },
          }
        : leadstatus
          ? { interestedStatus: leadstatus }
          : {}),
      // ...(lostStatus === "lost"
      //   ? {
      //       $expr: {
      //         $gt: [{ $size: "$lostHistory" }, 2],
      //       },
      //     }
      //   : {}),
      ...(channelPartner ? { channelPartner: channelPartner } : {}),
      ...(teamLeader ? { teamLeader: teamLeader } : {}),
      ...dateFilter,

      // ...(stage ? { stage: stage } : { stage: { $ne: "tagging-over" } }),
      // ...(stage === "all"
      //   ? { stage: stage }
      //   : {
      //       /*leadType: { $ne: "walk-in" }*/
      //     }),
      // ...(status === "pending" && {
      //   leadType: { $ne: "walk-in" },
      //   stage: { $ne: "tagging-over" },
      // }),
    };

    // logger.info(JSON.stringify(searchFilter,null,2));
    if (taskType) {
      const taskIds = await taskModel.find({ type: taskType }).select("_id");
      const taskIdArray = taskIds.map((task) => task._id.toString());
      // logger.info(taskIdArray.length);
      searchFilter.taskRef = { $in: taskIdArray }; // Filter leads based on taskRef
    }
    // logger.info(JSON.stringify(searchFilter, null, 2));

    // Execute the search with the refined filter
    const respCP = await leadModelV2
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1, _id: 1 })
      .populate(leadPopulateOptions);
    const sortedLeads = respCP.map((ele) => {
      ele.callHistory.sort(
        (a, b) => new Date(b.callDate) - new Date(a.callDate),
      );
      return ele;
    });

    // Count the total items matching the filter
    // const totalItems = await leadModelV2.countDocuments(searchFilter);

    // Count the total items matching the filter
    const totalItems = await leadModelV2.countDocuments({
      // stage: { $ne: "tagging-over" },
      // leadType: { $ne: "walk-in" },
    });
    // const totalItems = await leadModelV2.countDocuments(searchFilter);
    const rejectedCount = await leadModelV2.countDocuments({
      $and: [
        { approvalStatus: "rejected" },
        // { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
      ],
    });

    const pendingCount = await leadModelV2.countDocuments({
      $and: [
        {
          isBulkLead: false,
        },
        { approvalStatus: "pending" },
        // { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
      ],
    });

    const approvedCount = await leadModelV2.countDocuments({
      $and: [
        { approvalStatus: "approved" },
        // { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
      ],
    });

    const visitCount = await leadModelV2.countDocuments({
      $and: [
        {
          stage: { $ne: "approval" },
        },
        {
          stage: { $ne: "booking" },
        },
        {
          visitStatus: { $ne: null },
        },
        {
          visitStatus: { $ne: "pending" },
        },
        {
          leadType: "cp",
        },
      ],
    });

    const visit2Count = await leadModelV2.countDocuments({
      $and: [
        {
          stage: { $ne: "approval" },
        },
        {
          stage: { $ne: "booking" },
        },
        {
          visitStatus: { $ne: null },
        },
        {
          visitStatus: { $ne: "pending" },
        },
        {
          leadType: { $eq: "walk-in" },
        },
      ],
    });
    const bookingCount = await leadModelV2.countDocuments({
      stage: "booking",
      // bookingStatus: { $ne: "pending" },
      $and: [
        {
          bookingStatus: { $ne: null },
        },
        {
          bookingStatus: { $ne: "pending" },
        },
      ],
    });
    const booking1Count = await leadModelV2.countDocuments({
      stage: "booking",
      // bookingStatus: { $ne: "pending" },
      $and: [
        { leadType: { $ne: "walk-in" } },
        {
          bookingStatus: { $ne: null },
        },
        {
          bookingStatus: { $ne: "pending" },
        },
      ],
    });

    const booking2Count = await leadModelV2.countDocuments({
      stage: "booking",
      // bookingStatus: { $ne: "pending" },
      $and: [
        { leadType: "walk-in" },
        {
          bookingStatus: { $ne: null },
        },
        {
          bookingStatus: { $ne: "pending" },
        },
      ],
    });
    const internalLeadCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ leadType: "internal-lead" }],
    });

    const bulkCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: null }, { isBulkLead: true }],
    });

    const lineUpCount = await leadModelV2.countDocuments({
      // stage: { $ne: "tagging-over" },
      leadType: { $ne: "walk-in" },
      siteVisitInterested: true,
    });

    const infomedCpCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [
        {
          bookingStatus: { $ne: null },
        },
        {
          bookingStatus: { $ne: "pending" },
        },
        {
          informedStatus: { $eq: true },
        },
      ],
    });

    const blacklistedClient = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: "blacklisted-client" }],
    });
    const isCpCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: "is-channel-partner" }],
    });

    const lostCount = await leadModelV2.countDocuments({
      // bookingStatus: { $ne: "pending" },
      $and: [{ clientType: "lost" }],
    });

    // const assignedCount = await leadModelV2.countDocuments({
    //   $and: [{ preSalesExecutive: { $ne: null } }],
    // });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);
    // cons;
    return res.send(
      successRes(200, "get leads", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        approvedCount,
        // assignedCount,
        rejectedCount,
        visitCount,
        visit2Count,
        bookingCount,
        booking1Count,
        booking2Count,
        lineUpCount,
        internalLeadCount,
        bulkCount,
        infomedCpCount,
        blacklistedClient,
        isCpCount,
        lostCount,
        data: sortedLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    return next(error);
  }
};

// TODO: update 
// export const searchLeadsv2 = async (req, res, next) => {
//   try {
//     let query = req.query.query || "";
//     let status =
//       req.query.approvalStatus?.toLowerCase() ??
//       req.query.status?.toLowerCase();
//     let status2 = req.query.status2?.toLowerCase();
//     let cycle = req.query.cycle;
//     let callData = req.query.callData;
//     let leadstatus = req.query.leadstatus;

//     let lostStatus = req.query.lostStatus;
//     let clientstatus = req.query.clientstatus;

//     let order = req.query.order;
//     let sortDirection = -1;
//     const interval = req.query.interval;
//     const currentDate = new Date();
//     let date = req.query.date;
//     let dateFilter = {};
//     let startDateDeadline = req.query.startDateDeadline;
//     let endDateDeadline = req.query.endDateDeadline;
//     // logger.info(approvalStatus);
//     let stage = req.query.stage?.toLowerCase();
//     let channelPartner = req.query.channelPartner?.toLowerCase();
//     let teamLeader = req.query.teamLeader?.toLowerCase();
//     let page = parseInt(req.query.page) || 1;
//     let limit = parseInt(req.query.limit) || 10;
//     let skip = (page - 1) * limit;
//     let statusToFind = null;
//     let taskType = req.query.taskType;
//     let validity = req.query.validity;
//     let sort = req.query.sort;

//     const targetDate = validity
//       ? moment.tz(validity, "Asia/Kolkata")
//       : moment.tz("Asia/Kolkata");

//     const startOfDay = targetDate.startOf("day").toDate(); // 00:00:00
//     const endOfDay = targetDate.endOf("day").toDate(); // 23:59:59

//     let ids = [];

//     if (date) {
//       if (date === "today") {
//         const startOfDay = moment().startOf("day").toISOString();
//         const endOfDay = moment().endOf("day").toISOString();
//         dateFilter = {
//           "cycle.validTill": {
//             $gte: startOfDay,
//             $lte: endOfDay,
//           },
//         };
//       }
//     }

//     if (startDateDeadline && endDateDeadline) {
//       dateFilter = {
//         "cycle.validTill": {
//           $gte: moment(startDateDeadline).startOf("day").toISOString(),
//           $lte: moment(endDateDeadline).endOf("day").toISOString(),
//         },
//       };
//       // logger.info(startDateDeadline);
//       // logger.info(endDateDeadline);

//       // logger.info(dateFilter);
//     }

//     const isNumberQuery = !isNaN(query);
//     //  const filterDate = new Date("2024-12-10");

//     if (status === "booking-done" || status === "booking") {
//       statusToFind = {
//         stage: "booking",
//         // bookingStatus: { $ne: "pending" },
//         $and: [
//           {
//             bookingStatus: { $ne: null },
//           },
//           {
//             bookingStatus: { $eq: "booked" },
//           },
//         ],
//       };
//     } else if (status === "revisit-done") {
//       statusToFind = {
//         stage: "booking",
//         // bookingStatus: { $ne: "booked" },
//         // revisitStatus: { $ne: "pending" },
//         $and: [
//           {
//             revisitStatus: { $ne: null },
//           },
//           {
//             revisitStatus: { $ne: "pending" },
//           },
//         ],

//         // ...walkinType,
//         leadType: { $ne: "walk-in" },
//       };
//     } else if (status === "visit-done" || status === "visit") {
//       statusToFind = {
//         stage: { $ne: "approval" },
//         stage: { $ne: "booking" },
//         $and: [
//           {
//             visitStatus: { $ne: null },
//           },
//           {
//             visitStatus: { $ne: "pending" },
//           },
//           {
//             leadType: { $ne: "walk-in" },
//           },
//         ],
//         // ...walkinType,
//       };
//     } else if (status === "revisit-pending") {
//       statusToFind = {
//         stage: { $eq: "revisit" },
//         stage: { $ne: "booking" },
//         // revisitStatus: { $eq: "pending" },
//         $and: [
//           {
//             revisitStatus: { $ne: null },
//           },
//           {
//             revisitStatus: { $eq: "pending" },
//           },
//         ],

//         // ...walkinType,
//         leadType: { $ne: "walk-in" },
//       };
//     } else if (status === "visit-pending") {
//       statusToFind = {
//         stage: { $eq: "visit" },
//         // visitStatus: { $eq: "pending" },
//         $and: [
//           {
//             visitStatus: { $ne: null },
//           },
//           {
//             visitStatus: { $eq: "pending" },
//           },
//         ],

//         // ...walkinType,
//         leadType: { $ne: "walk-in" },
//       };
//     } else if (status === "tagging-over") {
//       statusToFind = {
//         stage: { $eq: "tagging-over" },
//       };
//     } else if (status === "pending") {
//       statusToFind = {
//         // startDate: { $gte: filterDate },
//         // bookingStatus: { $ne: "booked" },
//         isBulkLead: false,
//         $or: [
//           {
//             approvalStatus: null,
//             // bookingStatus: { $ne: "booked" },
//             // visitStatus: "pending",
//           },
//           {
//             approvalStatus: "pending",
//             // bookingStatus: { $ne: "booked" },
//             // revisitStatus: "pending",
//           },
//         ],
//         // leadType: { $ne: "walk-in" },
//       };
//     } else if (status === "visit2") {
//       statusToFind = {
//         $and: [
//           {
//             visitStatus: { $ne: "pending" },
//           },
//           {
//             stage: { $ne: "tagging-over" },
//           },
//           {
//             stage: { $ne: "approval" },
//           },
//           {
//             $or: [
//               {
//                 leadType: "walk-in",
//               },
//               {
//                 leadType: "internal-lead",
//               },
//             ],
//           },
//         ],
//         // ...walkinType,
//       };
//     } else if (status === "followup") {
//       statusToFind = {
//         taskRef: { $ne: null },
//         // ...walkinType,
//       };
//     } else if (status === "not-followup") {
//       statusToFind = {
//         taskRef: { $eq: null },
//         // ...walkinType,
//       };
//     } else if (status === "visit2-revisit-done") {
//       statusToFind = {
//         stage: "booking",
//         // bookingStatus: { $ne: "booked" },
//         // revisitStatus: { $ne: "pending" },
//         $and: [
//           {
//             revisitStatus: { $ne: null },
//           },
//           {
//             revisitStatus: { $ne: "pending" },
//           },
//           {
//             $or: [
//               {
//                 leadType: "walk-in",
//               },
//               {
//                 leadType: "internal-lead",
//               },
//             ],
//           },
//         ],

//         // ...walkinType,
//         leadType: { $eq: "walk-in" },
//       };
//     } else if (
//       status === "visit2-visit-done" ||
//       status === "visit2-done" ||
//       status === "visit2"
//     ) {
//       statusToFind = {
//         stage: { $ne: "approval" },
//         stage: { $ne: "booking" },
//         $and: [
//           {
//             visitStatus: { $ne: null },
//           },
//           {
//             visitStatus: { $ne: "pending" },
//           },
//           {
//             $or: [
//               {
//                 leadType: "walk-in",
//               },
//               {
//                 leadType: "internal-lead",
//               },
//             ],
//           },
//         ],
//         // ...walkinType,
//         leadType: { $eq: "walk-in" },
//       };
//     } else if (status == "line-up") {
//       // logger.info("line-up");
//       statusToFind = {
//         siteVisitInterested: true,
//       };
//     } else if (status === "no-feedback" || status === "feedback-pending") {
//       const oneWeekAgo = new Date();
//       const onDayAgo = new Date();
//       onDayAgo.setDate(oneWeekAgo.getDate() - 1);
//       oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

//       // logger.info(oneWeekAgo);
//       // logger.info(onDayAgo);

//       statusToFind = {
//         taskRef: { $ne: null },
//         "cycle.startDate": { $gt: onDayAgo },
//         $expr: {
//           $and: [
//             {
//               $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
//             },
//             {
//               $lte: [
//                 { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
//                 oneWeekAgo,
//               ],
//             },
//           ],
//         },
//         // ...walkinType,
//       };
//     } else if (status === "internal-lead") {
//       statusToFind = {
//         ...statusToFind,
//         $and: [
//           {
//             leadType: { $eq: "internal-lead" },
//           },
//         ],
//       };
//     } else if (status === "exhibition-2025") {
//       statusToFind = {
//         ...statusToFind,
//         $and: [
//           {
//             leadFrom: { $eq: "exhibition-2025" },
//           },
//         ],
//       };
//     } else if (status === "informed-cp") {
//       statusToFind = {
//         stage: "booking",
//         // bookingStatus: { $ne: "pending" },
//         $and: [
//           {
//             bookingStatus: { $ne: null },
//           },
//           {
//             bookingStatus: { $eq: "booked" },
//           },
//           {
//             informedStatus: { $eq: true },
//           },
//         ],
//       };
//     } else if (status === "is-channel-partner") {
//       statusToFind = {
//         ...statusToFind,
//         $and: [
//           {
//             clientType: { $eq: "is-channel-partner" },
//           },
//         ],
//       };
//     } else if (status === "blacklisted-client") {
//       statusToFind = {
//         ...statusToFind,
//         $and: [
//           {
//             clientType: { $eq: "blacklisted-client" },
//           },
//         ],
//       };
//     } else if (status === "lost") {
//       statusToFind = {
//         ...statusToFind,
//         $and: [
//           {
//             clientType: { $eq: "lost" },
//           },
//         ],
//       };
//     }

//     // assing /pending/etc
//     if (status2 === "not-followup" || status2 === "not-assigned") {
//       statusToFind = {
//         ...statusToFind,
//         taskRef: { $eq: null },
//         // ...walkinType,
//       };
//     } else if (status2 === "followup" || status2 === "assigned") {
//       statusToFind = {
//         ...statusToFind,
//         taskRef: { $ne: null },
//         // ...walkinType,
//       };
//     } else if (status2 === "no-feedback" || status2 === "feedback-pending") {
//       const oneWeekAgo = new Date();
//       const onDayAgo = new Date();
//       onDayAgo.setDate(oneWeekAgo.getDate() - 1);
//       oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

//       statusToFind = {
//         ...statusToFind,
//         taskRef: { $ne: null },
//         "cycle.startDate": { $gt: onDayAgo },
//         $expr: {
//           $and: [
//             {
//               $ne: [{ $arrayElemAt: ["$callHistory.caller", -1] }, null],
//             },
//             {
//               $lte: [
//                 { $arrayElemAt: ["$callHistory.callDate", -1] }, // Get the last remark in callHistory
//                 oneWeekAgo,
//               ],
//             },
//           ],
//         },
//         // ...walkinType,
//       };
//     }

//     if (callData == "Call Not Received" || callData == "call not received") {
//       // logger.info("call not received");
//     } else if (callData == "Call Done" || callData == "Call done") {
//       // logger.info("call done");
//     } else if (callData == "Call Cancelled" || callData == "call cancelled") {
//       // logger.info("Call Cancelled");
//     } else if (callData == "Call Busy") {
//       // logger.info("Call Busy");
//     } else if (callData == "Not Reachable") {
//       // logger.info("Not Reachable");
//     }

//     if (order == "Ascending" || order == "ascending") {
//       sortDirection = 1;
//       // logger.info("ascending");
//     } else if (order == "Descending" || order == "descending") {
//       sortDirection = -1;
//     }

//     if (interval == "monthly") {
//       startDate = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1,
//       );
//       endDate = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0,
//       );
//     } else if (interval == "quarterly") {
//       const quarter = Math.floor(currentDate.getMonth() / 3);
//       startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
//       endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
//     } else if (interval == "semi-annually") {
//       const half = Math.floor(currentDate.getMonth() / 6);
//       startDate = new Date(currentDate.getFullYear(), half * 6, 1);
//       endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
//     } else if (interval == "annually") {
//       startDate = new Date(currentDate.getFullYear(), 0, 1);
//       endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
//     }

//     // if (callData == "Call Not Received" || callData == "call not received") {
//     //   logger.info("call not received");
//     // } else if (callData == "Call Done" || callData == "Call done") {
//     //   logger.info("call done");
//     // } else if (callData == "Call Cancelled" || callData == "call cancelled") {
//     //   logger.info("Call Cancelled");
//     // } else if (callData == "Call Busy") {
//     //   logger.info("Call Busy");
//     // } else if (callData == "Not Reachable") {
//     //   logger.info("Not Reachable");
//     // }

//     let orFilters = [
//       ...(query ? [{ firstName: { $regex: query, $options: "i" } }] : []),
//       ...(query ? [{ lastName: { $regex: query, $options: "i" } }] : []),
//       ...(query
//         ? [
//             {
//               $expr: {
//                 $regexMatch: {
//                   input: { $concat: ["$firstName", " ", "$lastName"] },
//                   regex: query,
//                   options: "i",
//                 },
//               },
//             },
//           ]
//         : []),
//     ];
//     if (isNumberQuery) {
//       orFilters.push(
//         ...(query
//           ? [
//               {
//                 $expr: {
//                   $regexMatch: {
//                     input: { $toString: "$phoneNumber" },
//                     regex: query,
//                   },
//                 },
//               },
//             ]
//           : []),

//         ...(query
//           ? [
//               {
//                 $expr: {
//                   $regexMatch: {
//                     input: { $toString: "$altPhoneNumber" },
//                     regex: query,
//                   },
//                 },
//               },
//             ]
//           : []),
//       );
//     }
//     orFilters.push(
//       ...(query ? [{ email: { $regex: query, $options: "i" } }] : []),
//       ...(query ? [{ address: { $regex: query, $options: "i" } }] : []),
//       ...(query
//         ? [{ interestedStatus: { $regex: query, $options: "i" } }]
//         : []),
//     );

//     let searchFilter = {
//       ...(statusToFind != null ? statusToFind : {}),
//       ...(orFilters.length != 0 ? { $or: orFilters } : {}),

//       // ...(approvalStatus && {
//       //   approvalStatus: { $regex: approvalStatus, $options: "i" },
//       // }),

//       ...(cycle != null ? { "cycle.currentDays": parseInt(cycle) - 1 } : {}),
//       ...(callData != null
//         ? {
//             $expr: {
//               $eq: [
//                 { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
//                 callData, // Compare it with the passed value
//               ],
//             },
//           }
//         : {}),
//       ...(clientstatus ? { clientInterestedStatus: clientstatus } : {}),
//       ...(leadstatus === "lost"
//         ? {
//             $expr: {
//               $gt: [{ $size: "$lostHistory" }, 2],
//             },
//           }
//         : leadstatus
//           ? { interestedStatus: leadstatus }
//           : {}),
//       // ...(lostStatus === "lost"
//       //   ? {
//       //       $expr: {
//       //         $gt: [{ $size: "$lostHistory" }, 2],
//       //       },
//       //     }
//       //   : {}),
//       ...(channelPartner ? { channelPartner: channelPartner } : {}),
//       ...(teamLeader ? { teamLeader: teamLeader } : {}),
//       ...dateFilter,

//       // ...(stage ? { stage: stage } : { stage: { $ne: "tagging-over" } }),
//       // ...(stage === "all"
//       //   ? { stage: stage }
//       //   : {
//       //       /*leadType: { $ne: "walk-in" }*/
//       //     }),
//       // ...(status === "pending" && {
//       //   leadType: { $ne: "walk-in" },
//       //   stage: { $ne: "tagging-over" },
//       // }),
//     };

//     // logger.info(JSON.stringify(searchFilter,null,2));
//     if (taskType) {
//       const taskIds = await taskModel.find({ type: taskType }).select("_id");
//       const taskIdArray = taskIds.map((task) => task._id.toString());
//       // logger.info(taskIdArray.length);
//       searchFilter.taskRef = { $in: taskIdArray }; // Filter leads based on taskRef
//     }
//     // logger.info(searchFilter);

//     // Execute the search with the refined filter
//     const respCP = await leadModelV2
//       .find(searchFilter, leadListOptions)
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1, _id: 1 })
//       .populate(leadListPopulateOptions);

//     const totalItems = await leadModelV2.countDocuments(searchFilter);

//     // Calculate the total number of pages
//     const totalPages = Math.ceil(totalItems / limit);
//     // cons;
//     return res.send(
//       successRes(200, "get leads", {
//         page,
//         limit,
//         totalPages,
//         totalItems,
//         data: respCP,
//       }),
//     );
//   } catch (error) {
//     logger.info(error);
//     return next(error);
//   }
// };

export const searchLeadsChannelPartner = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "id required"));

    let query = req.query.query || "";
    let status =
      req.query.approvalStatus?.toLowerCase() ??
      req.query.status?.toLowerCase();
    let stage = req.query.stage?.toLowerCase();
    let callData = req.query.callData;

    // logger.info("stage" + stage);
    // logger.info("statys" + status);
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 3);

    let skip = (page - 1) * limit;
    const isNumberQuery = !isNaN(query);
    let statusToFind = null;

    if (status === "approved") {
      statusToFind = {
        approvalStatus: { $eq: "approved" },
      };
    } else if (status === "rejected") {
      statusToFind = {
        approvalStatus: { $eq: "rejected" },
      };
    } else if (status === "pending") {
      statusToFind = {
        $and: [
          {
            approvalStatus: { $eq: "pending" },
          },
          {
            stage: { $eq: "approval" },
          },

          // {
          //   visitStatus: { $eq: "pending" },
          // },
          // { revisitStatus: { $eq: "pending" } },
          // {
          //   bookingStatus: { $ne: "booked" },
          // },
        ],
      };
    } else if (status === "revisit-pending" || status === "visit-done") {
      // logger.info("ersi pendding");
      statusToFind = {
        // stage: { $eq: "revisit" },
        // visitRef: { $ne: null },
        $or: [
          {
            visitStatus: "visited",
          },
          {
            visitStatus: "virtual-meeting",
          },
        ],
        $expr: {
          $and: [
            { $gte: ["$visitDate", "$startDate"] }, // visitDate >= startDate
            { $lte: ["$visitDate", "$validTill"] }, // visitDate <= validTill
          ],
        },

        // revisitStatus: { $eq: "pending" },
      };
    } else if (status === "visit-pending") {
      // logger.info("visi pendding");
      statusToFind = {
        stage: { $eq: "visit" },
        visitStatus: { $eq: "pending" },
      };
    } else if (status == "booking-pending" || status == "revisit-done") {
      // logger.info("booi pendding");
      statusToFind = {
        revisitStatus: "revisited",
        stage: { $ne: "tagging-over" },
        // stage: { $eq: "booking" },
        // bookingStatus: { $eq: "pending" },
        $expr: {
          $and: [
            { $gte: ["$visitDate", "$startDate"] }, // visitDate >= startDate
            { $lte: ["$visitDate", "$validTill"] }, // visitDate <= validTill
          ],
        },
      };
    } else if (status == "booking-done") {
      // logger.info("booi pendding");
      statusToFind = {
        bookingStatus: { $eq: "booked" },
        informedStatus: { $eq: true },
        $expr: {
          $and: [
            { $gte: ["$bookingDate", "$startDate"] }, // visitDate >= startDate
            { $lte: ["$bookingDate", "$validTill"] }, // visitDate <= validTill
          ],
        },

        // $and: [
        //   {
        //     informedStatus: { $ne: null },
        //     informedStatus: { $eq: false },
        //   },
        // ],
      };
    } else if (status == "line-up") {
      // logger.info("booi pendding");
      statusToFind = {
        siteVisitInterested: true,
      };
    } else if (status == "interested") {
      statusToFind = {
        clientInterestedStatus: { $eq: "interested" },
      };
    } else if (status == "notInterested") {
      statusToFind = {
        clientInterestedStatus: { $eq: "not-interested" },
      };
    }

    if (callData == "Call Not Received" || callData == "call not received") {
      // logger.info("call not received");
    } else if (callData == "Call Done" || callData == "Call done") {
      // logger.info("call done");
    } else if (callData == "Call Cancelled" || callData == "call cancelled") {
      // logger.info("Call Cancelled");
    } else if (callData == "Call Busy") {
      // logger.info("Call Busy");
    } else if (callData == "Not Reachable") {
      // logger.info("Not Reachable");
    }

    let orFilters = [
      { firstName: { $regex: query, $options: "i" } },
      { lastName: { $regex: query, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: query,
            options: "i",
          },
        },
      },
    ];

    if (isNumberQuery) {
      orFilters.push(
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$phoneNumber" },
              regex: query,
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$altPhoneNumber" },
              regex: query,
            },
          },
        },
      );
    }

    orFilters.push(
      { email: { $regex: query, $options: "i" } },
      { address: { $regex: query, $options: "i" } },
      { interestedStatus: { $regex: query, $options: "i" } },
      //  {
      // hideStatus: false,
      //},
      //  { hideStatus: null }
    );

    let searchFilter = {
      ...(statusToFind != null ? statusToFind : {}),
      ...(callData != null
        ? {
            $expr: {
              $eq: [
                { $arrayElemAt: ["$callHistory.remark", -1] }, // Get the last remark in callHistory
                callData, // Compare it with the passed value
              ],
            },
          }
        : {}),

      $or: orFilters,

      //commented by tech2
      // ...(stage ? { stage: stage } : { stage: { $ne: "tagging-over" } }),
      leadType: { $ne: "walk-in" },
      ...(status != "booking-done" ? { validTill: { $gte: now } } : {}),
      // ...(status != "booking-done" ? { validTill: { $gt: now } } : {}),

      channelPartner: id,
      // validTill: { $gt: now },
    };

    // logger.info(callData);
    // logger.info(JSON.stringify(searchFilter, null, 2));
    // Execute the search with the refined filter
    const respCP = await leadModelV2
      .find(searchFilter, {
        cycleHistory: 0,
        updateHistory: 0,
        cycleHistoryNew: 0,
        approvalHistory: 0,
        mergeHistory: 0,
      })
      .skip(skip)
      .limit(limit)
      .sort({ startDate: -1, _id: 1 })
      .populate(leadPopulateOptions);
    // logger.info(respCP.length);

    // Count the total items matching the filter
    // const totalItems = await leadModelV2.countDocuments(searchFilter);

    // Count the total items matching the filter
    const totalItems = await leadModelV2
      .countDocuments({
        stage: { $ne: "tagging-over" },
        leadType: { $ne: "walk-in" },
        channelPartner: id,
        validTill: { $gt: now },
      })
      .sort({ startDate: -1, _id: 1 });
    // const totalItems = await leadModelV2.countDocuments(searchFilter);
    const rejectedCount = await leadModelV2.countDocuments({
      $and: [
        { approvalStatus: "rejected" },
        { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
        { channelPartner: id },
        { startDate: { $gte: now } },
        { validTill: { $gt: now } },
      ],
    });

    const pendingCount = await leadModelV2.countDocuments({
      // stage: { $ne: "tagging-over" },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
      startDate: { $gte: sixMonthsAgo },
      validTill: { $gt: now },
      $and: [
        { stage: "approval" },
        { approvalStatus: "pending" },
        // { visitStatus: "pending" },
        // { revisitStatus: "pending" },
        // { bookingStatus: { $ne: "booked" } },
      ],
    });

    const approvedCount = await leadModelV2.countDocuments({
      $and: [
        { approvalStatus: "approved" },
        { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
        { channelPartner: id },
        { startDate: { $gte: sixMonthsAgo } },
        { validTill: { $gt: now } },
      ],
    });
    // logger.info(
    //   JSON.stringify(
    //     {
    //       visitRef: { $ne: null },
    //       // $or: [{ visitStatus: "visited" }, { visitStatus: "virtual-meeting" }],
    //       stage: { $ne: "tagging-over" },
    //       leadType: { $ne: "walk-in" },
    //       channelPartner: id,
    //       startDate: { $gte: sixMonthsAgo },
    //       validTill: { $gt: now },
    //       // revisitStatus: { $ne: null, $eq: "pending" },
    //     },
    //     null,
    //     2
    //   )
    // );

    const visitedCount = await leadModelV2.countDocuments({
      visitRef: { $ne: null },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
      validTill: { $gt: now }, // still valid overall

      $expr: {
        $and: [
          { $gte: ["$visitDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$visitDate", "$validTill"] }, // visitDate <= validTill
        ],
      },
    });

    const revisitedCount = await leadModelV2.countDocuments({
      revisitStatus: "revisited",
      stage: { $ne: "tagging-over" },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
      // startDate: { $gte: sixMonthsAgo },
      validTill: { $gt: now },
      $expr: {
        $and: [
          { $gte: ["$revisitDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$revisitDate", "$validTill"] }, // visitDate <= validTill
        ],
      },
    });

    const bookedCount = await leadModelV2.countDocuments({
      bookingStatus: "booked",
      informedStatus: { $eq: true },

      //  informedStatus: true,
      // $or: [
      //   {
      //     informedStatus: { $ne: null },
      //     informedStatus: { $ne: false },
      //   },
      // ],
      // stage: { $ne: "tagging-over" },
      leadType: { $ne: "walk-in" },

      channelPartner: id,
      $expr: {
        $and: [
          { $gte: ["$bookingDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$bookingDate", "$validTill"] }, // visitDate <= validTill
        ],
      },

      // startDate: { $gte: sixMonthsAgo },
      // ...(status == "booking-done" ? {} : { validTill: { $gt: now } }),
    });

    const lineUpCount = await leadModelV2.countDocuments({
      stage: { $ne: "tagging-over" },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
      startDate: { $gte: sixMonthsAgo },
      siteVisitInterested: true,
      validTill: { $gt: now },
      $expr: {
        $and: [
          { $gte: ["$bookingDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$bookingDate", "$validTill"] }, // visitDate <= validTill
        ],
      },
    });

    // const assignedCount = await leadModelV2.countDocuments({
    //   $and: [{ preSalesExecutive: { $ne: null } }],
    // });
    // const filtererd = respCP.filter((ele)=> {
    //   const start= moment(ele.startDate);
    //   const till= moment(ele.validTill);
    //   const now = moment();
    //   if(start.isAfter(now) && till.isBefore(now)){
    //     return true;
    //   }
    //   return false;
    // })

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);
    // cons;
    return res.send(
      successRes(200, "get leads", {
        page,
        limit,
        totalPages,
        totalItems,
        pendingCount,
        approvedCount,
        visitedCount,
        revisitedCount,
        bookedCount,
        // assignedCount,
        rejectedCount,
        lineUpCount,
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);
    return next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respLead = await leadModelV2
      .findById(id)
      .populate(leadPopulateOptions);

    if (!respLead) return errorRes(404, "No lead found");
    respLead.callHistory.sort(
      (a, b) => new Date(b.callDate) - new Date(a.callDate),
    );

    return res.send(
      successRes(200, "lead by id", {
        data: respLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getLeadByBookingId = async (req, res, next) => {
  const id = req.params.id;
  try {
    // logger.info(id);
    if (!id) return res.send(errorRes(403, "id is required"));
    const booking = await postSaleLeadModel.findById(id);
    const respLead = await leadModelV2
      .findOne({
        $or: [
          {
            bookingRef: id,
          },
          {
            phoneNumber: booking.phoneNumber,
          },
        ],
      })
      .populate(leadPopulateOptions);

    if (!respLead) return errorRes(404, "No lead found");

    return res.send(
      successRes(200, "lead by id", {
        data: respLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getSimilarLeadsById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respLead = await leadModelV2.findById(id);

    if (!respLead) return errorRes(404, "No lead found");

    const similarLeads = await leadModelV2
      .find({
        $and: [
          {
            $or: [
              { phoneNumber: respLead.phoneNumber },
              { altPhoneNumber: respLead.phoneNumber },
            ],
          },
          { _id: { $ne: id } },
        ],
      })
      .populate(leadPopulateOptions);

    return res.send(
      successRes(200, "Similar Leads", {
        data: similarLeads,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};

export const getSiteVisitLeadByPhoneNumber = async (req, res) => {
  const phoneNumber = req.params.id;
  try {
    if (!phoneNumber) return res.send(errorRes(403, "id is required"));
    const date = new Date();

    const respSite = await leadModelV2
      .findOne({
        $or: [
          {
            phoneNumber: phoneNumber,
          },
          {
            altPhoneNumber: phoneNumber,
          },
        ],
        // startDate: { $gte: new Date("2024-12-10T00:00:00.000+00:00") },
      })
      .sort({ createdAt: -1, _id: 1 })
      .populate(leadPopulateOptions);

    if (!respSite)
      return res.send(
        successRes(404, `Site vist not found with id:${phoneNumber}`, {
          data: respSite,
        }),
      );
    return res.send(
      successRes(200, "lead by id", {
        data: respSite,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};
// TODO: not using bcz automated the process
export const addLead = async (req, res, next) => {
  const body = req.filteredBody;
  const {
    email,
    firstName,
    lastName,
    phoneNumber,
    altPhoneNumber,
    remark,
    startDate,
    channelPartner, // Channel Partner ID
    teamLeader,
    preSalesExecutive,
    validTill,
    status,
    requirement,
    project,
    interestedStatus,
    leadType,
  } = body;
  // logger.info("p2");

  try {
    if (!body) return res.send(errorRes(403, "Data is required"));
    // logger.info(body);

    const validFields = validateRequiredLeadsFields(body);
    // logger.info("p3");

    if (!validFields.isValid) {
      return res.send(errorRes(400, validFields.message));
    }
    // logger.info("p4");

    const currentDate = new Date();
    const ninetyOneDaysAgo = new Date(currentDate);
    ninetyOneDaysAgo.setDate(currentDate.getDate() - 91);

    const sixtyDaysAgo = new Date(currentDate);
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);

    // logger.info("p5");
    // Condition 1: Check if the same CP is trying to create the same lead within 91 days
    if (channelPartner) {
      const timeZone = "Asia/Kolkata";

      // Get yesterday's date range in local timezone
      const startOfToday = moment().tz(timeZone).startOf("day").toDate();
      const endOfToday = moment().tz(timeZone).endOf("day").toDate();

      const todayLeadsCount = await leadModelV2.countDocuments({
        channelPartner: channelPartner,
        startDate: { $gte: startOfToday, $lt: endOfToday },
      });

      // if (todayLeadsCount >= 25) {
      //return res.send(
      // errorRes(409, `You cannot share more than 25 leads in 1 day.`)
      // );
      //   }

      const existingLeadForCP = await leadModelV2.findOne({
        phoneNumber: phoneNumber,
        channelPartner: channelPartner,
        startDate: {
          $gte: ninetyOneDaysAgo,
          $lte: currentDate,
        },
      });

      if (existingLeadForCP) {
        return res.send(
          errorRes(
            409,
            `You cannot create the same lead with phone number ${phoneNumber} within 91 days.`,
          ),
        );
      }
    }

    // logger.info("p6");

    // Condition 2: Check if a different CP created a lead with the same phone number within 60 days
    const existingLeadForOtherCP = await leadModelV2.findOne({
      phoneNumber: phoneNumber,
      channelPartner: { $ne: channelPartner }, // Other CPs
      startDate: {
        $gte: sixtyDaysAgo,
        $lte: currentDate,
      },
    });
    // logger.info("p7");

    if (existingLeadForOtherCP) {
      const newLead = await leadModelV2.create({
        ...body,
        "cycle.currentDays": 29,
      });
      const dataAnalyser = await employeeModel
        .find({
          designation: "desg-data-analyzer",
        })
        .sort({ createdAt: 1, _id: 1 });

      const getIds = dataAnalyser.map((dt) => dt._id.toString());
      const foundTLPlayerId = await oneSignalModel.find({
        docId: { $in: getIds },
        role: "employee",
      });

      if (foundTLPlayerId.length > 0) {
        // logger.info(foundTLPlayerId);
        const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

        await sendNotificationWithInfo({
          playerIds: getPlayerIds,
          title: "You've Got a New Lead!",
          message: `A new lead is now available for you to review. Please check the details and take the required steps to approve or update it`,
        });
      }

      return res.send(
        successRes(
          201,
          `Lead created successfully, but the same client lead exists with another channel partner.`,
          {
            existingLead: existingLeadForOtherCP,
            data: newLead,
          },
        ),
      );
    }
    // logger.info("p8");

    // Condition 3: If no existing lead exists, create a new one
    const newLead = await leadModelV2.create({
      ...body,
      leadType: leadType?.toLowerCase() ?? "cp",
      "cycle.currentDays": 29,
    });
    // logger.info("p9");

    const dataAnalyser = await employeeModel
      .find({
        designation: "desg-data-analyzer",
      })
      .sort({ createdAt: 1, _id: 1 });
    // logger.info("p10");

    const getIds = dataAnalyser.map((dt) => dt._id.toString());
    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: getIds },
      // role: "employee",
    });
    // logger.info("p11");

    if (foundTLPlayerId.length > 0) {
      // logger.info(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      await sendNotificationWithInfo({
        playerIds: getPlayerIds,
        title: "You've Got a New Lead!",
        message: `A new lead is now available for you to review. Please check the details and take the required steps to approve or update it`,
      });
    }

    return res.send(
      successRes(200, `Lead added successfully: ${firstName} ${lastName}`, {
        data: newLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    logger.info(error);

    return next(error);
  }
};

export const updateLead = async (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  const user = req.user;
  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!body) return res.send(errorRes(403, "Data is required"));

    const { remark } = body;

    // Update the lead by ID
    const updatedLead = await leadModelV2.findByIdAndUpdate(
      id,
      {
        ...body,
        $addToSet: {
          updateHistory: {
            employee: user?._id,
            changes: `${JSON.stringify(body)}`,
            updatedAt: new Date(),
            remark: remark,
          },
        },
      },
      { new: true },
    );
    // Check if the lead was updated successfully
    if (!updatedLead)
      return res.send(errorRes(404, `Lead not found with ID: ${id}`));
    //
    const updatedLead1 = await leadModelV2
      .findById(id)
      .populate(leadPopulateOptions);
    //
    return successRes2(res, 200, `Lead updated successfully`, {
      data: updatedLead1,
    });
    //
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `Server error: ${error?.message}`);
  }
};

export const rejectLeadById = async (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  const user = req.user;
  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!body) return res.send(errorRes(403, "Data is required"));

    const { remark } = body;
    const startDate = new Date(); // Current date

    // Update the lead by ID
    const updatedLead = await leadModelV2.findByIdAndUpdate(
      id,
      {
        ...body,
        approvalStatus: "rejected",
        approvalRemark: remark ?? "rejected",
        approvalDate: startDate,
        $addToSet: {
          approvalHistory: {
            employee: user?._id,
            approvedAt: startDate,
            remark: remark ?? "rejected",
          },
          updateHistory: {
            employee: user?._id,
            changes: `Lead Rejected`,
            updatedAt: startDate,
            remark: remark,
          },
        },
      },
      { new: true },
    );

    return res.send(
      successRes(200, `Lead Rejected Successfully`, {
        data: updatedLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const updateDetailsLead = async (req, res) => {
  const id = req.params.id;

  const {
    firstName,
    lastName,
    project,
    requirement,
    nameRemark,
    occupation,
    linkedIn,
    uploadedLinkedIn,
    email,
    propertyType,
    additionLinRemark,
  } = req.body;
  try {
    // if (!nameRemark) {
    //   return res.send(errorRes(403, "Remark is required"));
    // }
    const newLead = await leadModelV2
      .findByIdAndUpdate(
        id,
        {
          firstName,
          lastName,
          project,
          requirement,
          nameRemark,
          occupation,
          linkedIn,
          uploadedLinkedIn,
          email,
          propertyType,
          additionLinRemark,
        },
        { new: true },
      )
      .populate(leadPopulateOptions);

    return res.send(successRes(200, "Details Updated", { data: newLead }));
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, "Sever Error"));
  }
};

export const deleteLead = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));

    // Attempt to delete the lead by ID
    const deletedLead = await leadModelV2.findByIdAndDelete(id);

    // Check if the lead was found and deleted
    if (!deletedLead)
      return res.send(errorRes(404, `Lead not found with ID: ${id}`));

    return res.send(
      successRes(200, `Lead deleted successfully with ID: ${id}`, {
        deletedLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const leadAssignToTeamLeader = async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;

  const { remark, teamLeaderId } = req.body;

  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    if (!teamLeaderId)
      return res.send(errorRes(403, "teamLeaderId is required"));

    const respLead = await leadModelV2.findById(id);

    if (!respLead) return res.send(errorRes(404, "No lead found"));

    const teamLeaderResp = await employeeModel.find({ _id: teamLeaderId });

    const startDate = new Date(); // Current date
    const daysToAdd = 29;

    // Properly calculate validTill
    const validTill = new Date(startDate);
    validTill.setDate(validTill.getDate() + daysToAdd);
    const updatedLead = await leadModelV2
      .findByIdAndUpdate(
        id,
        {
          teamLeader: teamLeaderId,
          dataAnalyzer: user?._id,
          approvalStatus: "approved",
          approvalRemark: remark ?? "approved",
          approvalDate: startDate,
          stage: "visit",
          $set: {
            clientType: null,
            cycle: {
              nextTeamLeader: null,
              stage: "visit",
              currentOrder: 1,
              currentDays: daysToAdd,
              teamLeader: teamLeaderId,
              startDate: startDate,
              validTill: validTill,
            },
          },
          $addToSet: {
            approvalHistory: {
              employee: user?._id,
              approvedAt: startDate,
              remark: remark ?? "approved",
            },
            updateHistory: {
              employee: user?._id,
              changes: `Lead Assign to Team Leader ${teamLeaderResp?.firstName} ${teamLeaderResp?.lastName}`,
              updatedAt: startDate,
              remark: remark,
            },
            channelPartnerHistory: {
              channelPartner: respLead?.channelPartner,
              status: "approved",
              startDate: startDate,
              date: startDate,
              validTill: validTill,
              approval: {
                employee: user?._id,
                approvedAt: startDate,
                remark: remark ?? "approved",
              },
            },
          },
        },
        { new: true /*runValidators: true*/ },
      )
      .populate(leadPopulateOptions);

    const foundTLPlayerId = await oneSignalModel.findOne({
      docId: teamLeaderResp?._id,
      // role: teamLeaderResp?.role,
    });

    if (foundTLPlayerId) {
      // logger.info(foundTLPlayerId);

      await sendNotificationWithImage({
        playerIds: [foundTLPlayerId.playerId],
        title: "You've Got a New Lead!",
        message: `A new lead has been assigned to you. Check the details and make contact to move things forward.`,
        imageUrl:
          "https://img.freepik.com/premium-vector/checklist-with-check-marks-pencil-envelope-list-notepad_1280751-82597.jpg?w=740",
      });
      // logger.info("pass sent notification");
    }

    return res.send(
      successRes(200, "Lead Assigned Successfully", { data: updatedLead }),
    );
  } catch (error) {
    logger.info(error);
    return next(error);
  }
};

export const assignLeadToTeamLeader = async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;

  const { remark } = req.body;

  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respLead = await leadModelV2.findById(id);
    if (!respLead) return res.send(errorRes(404, "No lead found"));

    if (respLead.teamLeader) {
      if (respLead.approvalStatus != "Approved") {
        const updatedLead = await leadModelV2
          .findByIdAndUpdate(
            id,
            {
              dataAnalyser: user?._id,
              approvalStatus: "Approved",
              $addToSet: {
                approvalHistory: {
                  employee: user?._id,
                  approvedAt: Date.now(),
                  remark: remark ?? "Approved",
                },
                updateHistory: {
                  employee: user?._id,
                  changes: `Lead Approved`,
                  updatedAt: Date.now(),
                  remark: remark,
                },
              },
            },
            { new: true, runValidators: true },
          )
          .populate(leadPopulateOptions);

        return res.send(
          successRes(200, `Lead is Approved`, {
            data: updatedLead,
          }),
        );
      }
      return res.send(errorRes(401, "Team Leader is Already Assigned"));
    }

    const teamLeaders = await employeeModel
      .find({
        $or: [
          { designation: "desg-senior-closing-manager" },
          { designation: "desg-site-head" },
        ],
        status: "active",
      })
      .sort({ createdAt: 1, _id: 1 });

    const whichTurn = await TeamLeaderAssignTurn.findOne({});

    // logger.info(teamLeaders);

    const updatedLead = await leadModelV2
      .findByIdAndUpdate(
        id,
        {
          teamLeader: teamLeaders[whichTurn?.currentOrder]?._id,
          dataAnalyser: user?._id,
          approvalStatus: "Approved",
          $addToSet: {
            approvalHistory: {
              employee: user?._id,
              approvedAt: Date.now(),
              remark: remark ?? "Approved",
            },
            updateHistory: {
              employee: user?._id,
              changes: `Lead Assign to Team Leader ${
                teamLeaders[whichTurn?.currentOrder].firstName
              } ${teamLeaders[whichTurn?.currentOrder].lastName}`,
              updatedAt: Date.now(),
              remark: remark,
            },
          },
        },
        { new: true, runValidators: true },
      )
      .populate({
        path: "channelPartner",
        select: "-password -refreshToken",
      })
      .populate({
        path: "teamLeader",
        select: "-password -refreshToken",
        populate: [
          { path: "designation" },
          { path: "department" },
          { path: "division" },
          {
            path: "reportingTo",
            populate: [
              { path: "designation" },
              { path: "department" },
              { path: "division" },
            ],
          },
        ],
      })
      .populate({
        path: "dataAnalyzer",
        select: "-password -refreshToken",
        populate: [
          { path: "designation" },
          { path: "department" },
          { path: "division" },
          {
            path: "reportingTo",
            populate: [
              { path: "designation" },
              { path: "department" },
              { path: "division" },
            ],
          },
        ],
      })
      .populate({
        path: "preSalesExecutive",
        select: "-password -refreshToken",
        populate: [
          { path: "designation" },
          { path: "department" },
          { path: "division" },
          {
            path: "reportingTo",
            populate: [
              { path: "designation" },
              { path: "department" },
              { path: "division" },
            ],
          },
        ],
      })
      // .populate({
      //   path: "viewedBy.employee",
      //   select: "-password -refreshToken",
      //   populate: [
      //     { path: "designation" },
      //     { path: "department" },
      //     { path: "division" },
      //     {
      //       path: "reportingTo",
      //       populate: [
      //         { path: "designation" },
      //         { path: "department" },
      //         { path: "division" },
      //       ],
      //     },
      //   ],
      // })
      .populate({
        path: "approvalHistory.employee",
        select: "-password -refreshToken",
        populate: [
          { path: "designation" },
          { path: "department" },
          { path: "division" },
          {
            path: "reportingTo",
            populate: [
              { path: "designation" },
              { path: "department" },
              { path: "division" },
            ],
          },
        ],
      })
      .populate({
        path: "updateHistory.employee",
        select: "-password -refreshToken",
        populate: [
          { path: "designation" },
          { path: "department" },
          { path: "division" },
          {
            path: "reportingTo",
            populate: [
              { path: "designation" },
              { path: "department" },
              { path: "division" },
            ],
          },
        ],
      })
      .populate({
        path: "callHistory.caller",
        select: "-password -refreshToken",
        populate: [
          { path: "designation" },
          { path: "department" },
          { path: "division" },
        ],
      });

    const foundTLPlayerId = await oneSignalModel.findOne({
      docId: teamLeaders[whichTurn?.currentOrder]?._id,
      role: teamLeaders[whichTurn?.currentOrder]?.role,
    });

    if (foundTLPlayerId) {
      // logger.info(foundTLPlayerId);
      await sendNotificationWithInfo({
        playerIds: [foundTLPlayerId.playerId],
        title: "You've Got a New Lead!",
        message: `A new lead has been assigned to you. Check the details and make contact to move things forward.`,
      });
    }
    let nextOrder = whichTurn?.currentOrder + 1;

    // Reset to 0 if nextOrder exceeds the length of teamLeaders
    if (nextOrder >= teamLeaders.length) {
      nextOrder = 0;
    }
    // Update the currentOrder in the database
    await whichTurn.updateOne({
      lastAssignTeamLeader: teamLeaders[whichTurn?.currentOrder]?._id,
      nextAssignTeamLeader: teamLeaders[nextOrder]?._id,
      currentOrder: nextOrder,
    });

    return res.send(
      successRes(
        200,
        `lead assigned to ${teamLeaders[whichTurn?.currentOrder].firstName} ${
          teamLeaders[whichTurn?.currentOrder].lastName
        }`,
        {
          data: updatedLead,
        },
      ),
    );
  } catch (error) {
    logger.info(error);
    // logger.info("got error" + error?.message);

    next(error);
  }
};

export const assignLeadToPreSaleExecutive = async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;
  const { remark, assignTo } = req.body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respLead = await leadModelV2.findById(id);

    if (!respLead) return res.send(errorRes(404, "No lead found"));

    if (respLead.preSalesExecutive)
      return res.send(errorRes(401, "Pre Sale Executive is Already Assigned"));

    const preSalesExecutive = await employeeModel.findById(assignTo);

    const updatedLead = await leadModelV2
      .findByIdAndUpdate(
        id,
        {
          preSalesExecutive: assignTo,
          $addToSet: {
            updateHistory: {
              employee: user?._id,
              changes: `Lead Assign to Presale Executive ${preSalesExecutive.firstName} ${preSalesExecutive.lastName}`,
              updatedAt: Date.now(),
              remark: remark,
            },
          },
        },
        { new: true, runValidators: true },
      )
      .populate(leadPopulateOptions);

    const foundTLPlayerId = await oneSignalModel.findOne({
      docId: assignTo,
      role: preSalesExecutive.role,
    });

    if (foundTLPlayerId) {
      // logger.info(foundTLPlayerId);
      await sendNotificationWithInfo({
        playerIds: [foundTLPlayerId.playerId],
        title: "New Lead Assigned!",
        message: `A new lead has been assigned to you. Check the details and make contact to move things forward.`,
      });
    }

    return res.send(
      successRes(
        200,
        `Lead Assign to Presale Executive ${preSalesExecutive.firstName} ${preSalesExecutive.lastName}`,
        {
          data: updatedLead,
        },
      ),
    );
  } catch (error) {
    logger.info(error);
    // logger.info("got error" + error?.message);

    next(error);
  }
};

export const updateCallHistoryByPreSaleExcutive = async (req, res, next) => {
  const { callerId, remark, feedback, documentUrl, recordingUrl } = req.body;
  try {
    const updatedLead = await leadModelV2.findByIdAndUpdate(
      leadId,
      {
        $push: {
          callHistory: {
            caller: callerId,
            remark: remark,
            feedback: feedback,
            document: documentUrl,
            recording: recordingUrl,
          },
        },
      },
      { new: true },
    );
  } catch (error) {
    logger.info(error);
  }
};

export const updateCallHistoryPreSales = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const user = req.user;

  const { leadStage, remark, feedback, siteVisit, documentUrl, recordingUrl } =
    body;

  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!leadStage) return res.send(errorRes(403, "Lead Stage is required"));
    if (!remark) return res.send(errorRes(403, "Lead Status is required"));
    if (!feedback) return res.send(errorRes(403, "Feedback is required"));
    // if (!siteVisit) return res.send(errorRes(403, "Site Visit is required"));

    // Update the lead with call history details
    const updatedLead = await leadModelV2
      .findByIdAndUpdate(
        id,
        {
          status: leadStage,
          $push: {
            callHistory: {
              caller: user._id,
              stage: leadStage, // Include leadStage
              remark: remark, // Include leadStatus
              feedback: feedback,
              // siteVisit: siteVisit, // Include siteVisit
              document: documentUrl, // Store the document URL
              recording: recordingUrl, // Store the recording URL
            },
          },
        },
        { new: true },
      )
      .populate(leadPopulateOptions);

    if (!updatedLead) {
      return res.send(errorRes(404, `Lead not found with ID: ${id}`));
    }

    return res.send(
      successRes(200, `Caller updated successfully: ${id}`, {
        data: updatedLead,
      }),
    );
  } catch (error) {
    logger.info("Error updating call history:", error);
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const markLeadAsApproved = async (leadId, employeeId, remark) => {
  try {
    const updatedLead = await leadModelV2.findByIdAndUpdate(
      leadId,
      {
        $addToSet: {
          approvalHistory: {
            employee: employeeId,
            approvedAt: Date.now(),
            remark: remark,
          },
        },
      },
      { new: true },
    );

    return updatedLead;
  } catch (error) {
    logger.info("Error marking lead as approved:", error);
    throw new Error("Could not mark lead as approved");
  }
};

export const updateLeadDetails = async (leadId, employeeId, changes) => {
  try {
    const updatedLead = await leadModelV2.findByIdAndUpdate(
      leadId,
      {
        $addToSet: {
          updateHistory: {
            employee: employeeId,
            updatedAt: Date.now(),
            changes: changes,
          },
        },
      },
      { new: true },
    );

    return updatedLead;
  } catch (error) {
    logger.info("Error updating lead:", error);
    throw new Error("Could not update lead");
  }
};

//not needed right now
export const checkLeadsExists = async (req, res, next) => {
  const { phoneNumber, altPhoneNumber } = req.params;
  try {
    // if (!phoneNumber)
    //   return res.send(errorRes(403, "Phone Number is required"));
    const today = new Date(); // Get today's date

    const existingLead = await leadModelV2.find({
      // $or: [
      //   {
      //     phoneNumber: phoneNumber,
      //   },
      //   {
      //     altPhoneNumber: phoneNumber,
      //   },
      // ],
      startDate: { $gt: today },
    });
    // if (existingLead) {
    //   return res.send(
    //     errorRes(
    //       409,
    //       `Lead already exists with phone number: ${
    //         (phoneNumber, altPhoneNumber)
    //       }`
    //     )
    //   ); // 409 Conflict
    // }

    // If no lead exists, you can return a success response or proceed with the next operation
    return res.send({
      code: 200,
      data: existingLead,
      length: existingLead.length,
      message: "No lead found with this phone number. You can proceed.",
    });
  } catch (error) {
    logger.info(error);
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export async function getLeadCounts(req, res, next) {
  try {
    const {
      interval = "monthly",
      year,
      startDate,
      endDate,
      teamLeader,
    } = req.query;
    const currentYear = new Date().getFullYear();

    // Validate year parameter only if it's provided
    let selectedYear = currentYear;
    if (year) {
      selectedYear = parseInt(year, 10);
      if (isNaN(selectedYear)) {
        return res.json({ message: "Invalid year parameter" });
      }
    }

    // Calculate the start of the current week (Monday)
    const currentDate = new Date();
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 7); // Limit to current week (Mon-Sun)

    let matchStage = {};

    if (interval === "weekly") {
      matchStage = {
        startDate: {
          $gte: startOfCurrentWeek,
          $lt: endOfCurrentWeek,
        },
      };
    } else if (interval === "monthly") {
      if (startDate && endDate) {
        matchStage = {
          startDate: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        };
      } else {
        matchStage = {
          startDate: {
            $gte: new Date(`${selectedYear}-01-01`),
            $lt: new Date(`${selectedYear + 1}-01-01`),
          },
        };
      }
    } else {
      return res.json({ message: "Invalid interval parameter" });
    }

    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          dayOfWeek: { $dayOfWeek: "$startDate" },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "monthly") {
      groupStage = {
        _id: {
          month: { $month: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    }

    const leadCounts = await leadModelV2.aggregate([
      {
        $match: {
          ...matchStage,
          ...(teamLeader ? { teamLeader: teamLeader } : {}),
        },
      },
      { $group: groupStage },
      { $sort: { "_id.date": 1, "_id.month": 1, "_id.dayOfWeek": 1 } },
    ]);

    // Prepare a full weekly structure with zero counts for missing days
    const dayMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    let weekData = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date: format(date, "yyyy-MM-dd"),
        day: dayMap[(i + 1) % 7], // Adjust for MongoDB's $dayOfWeek (1 = Sunday)
        count: 0,
      };
    });

    // Populate `weekData` with actual counts where available
    leadCounts.forEach((item) => {
      const foundDay = weekData.find((day) => day.date === item._id.date);
      if (foundDay) foundDay.count = item.count;
    });

    if (interval === "weekly") {
      return res.send(successRes(200, "weekly", { data: weekData })); // Only send weekly data with all days accounted for
    }

    // Monthly data output
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedMonthlyData = leadCounts.map((item) => ({
      year: item._id.year,
      month: monthNames[item._id.month - 1], // Use month number to get month name
      count: item.count,
    }));

    return res.send(
      successRes(200, "ok", {
        data: formattedMonthlyData,
      }),
    );
  } catch (error) {
    logger.info("Error getting lead counts:", error);
    next(error);
  }
}

export async function getLeadCountsByTeamLeaders(req, res, next) {
  try {
    const { interval = "monthly", year, month, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed

    // Validate and set selected year
    let selectedYear = year ? parseInt(year, 10) : currentYear;
    if (isNaN(selectedYear)) {
      return res.json({ message: "Invalid year parameter" });
    }

    // Validate and set selected month
    let selectedMonth = month ? parseInt(month, 10) : currentMonth;
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
      return res.json({ message: "Invalid month parameter" });
    }

    let matchStage = {};

    if (interval === "monthly") {
      const startOfMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonthDate = new Date(selectedYear, selectedMonth, 1);
      matchStage.startDate = {
        $gte: startOfMonthDate,
        $lt: endOfMonthDate,
      };
    } else if (interval === "weekly") {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endOfCurrentWeek = addDays(startOfCurrentWeek, 6); // 6 days for a full week
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "quarterly") {
      const quarter = Math.ceil(selectedMonth / 3);
      const startOfQuarter = new Date(selectedYear, (quarter - 1) * 3, 1);
      const endOfQuarter = new Date(selectedYear, quarter * 3, 1);
      matchStage.startDate = {
        $gte: startOfQuarter,
        $lt: endOfQuarter,
      };
      // logger.info(startOfQuarter);
      // logger.info(endOfQuarter);
    } else if (interval === "semi-annually") {
      const isFirstHalf = selectedMonth <= 6;
      const startOfHalf = new Date(selectedYear, isFirstHalf ? 0 : 6, 1);
      const endOfHalf = new Date(selectedYear, isFirstHalf ? 6 : 12, 1);
      matchStage.startDate = {
        $gte: startOfHalf,
        $lt: endOfHalf,
      };
    } else if (interval === "yearly" || interval === "annually") {
      matchStage.startDate = {
        $gte: startOfYear(new Date(selectedYear, 0, 1)),
        $lt: endOfYear(new Date(selectedYear, 11, 31)),
      };
    } else if (interval === "custom" && startDate && endDate) {
      matchStage.startDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    } else {
      return res.json({ message: "Invalid interval or date range parameter" });
    }

    // Group stage and further aggregation logic for each interval
    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          teamLeader: "$teamLeader",
          week: { $week: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "monthly") {
      groupStage = {
        _id: {
          teamLeader: "$teamLeader",
          month: { $month: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "quarterly") {
      groupStage = {
        _id: {
          teamLeader: "$teamLeader",
          quarter: {
            $ceil: { $divide: [{ $month: "$startDate" }, 3] },
          },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "semi-annually") {
      groupStage = {
        _id: {
          teamLeader: "$teamLeader",
          half: {
            $cond: [{ $lte: [{ $month: "$startDate" }, 6] }, "H1", "H2"],
          },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "yearly" || interval === "annually") {
      groupStage = {
        _id: {
          teamLeader: "$teamLeader",
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "custom") {
      groupStage = {
        _id: {
          teamLeader: "$teamLeader",
        },
        count: { $sum: 1 },
      };
    }

    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $lookup: {
          from: "employees",
          localField: "_id.teamLeader",
          foreignField: "_id",
          as: "teamLeaderDetails",
        },
      },
      { $unwind: "$teamLeaderDetails" },
      {
        $project: {
          teamLeader: {
            $concat: [
              "$teamLeaderDetails.firstName",
              " ",
              "$teamLeaderDetails.lastName",
            ],
          },
          count: 1,
          interval,
          year: "$_id.year",
          ...(interval === "monthly" && {
            month: {
              $let: {
                vars: {
                  months: [
                    "",
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                },
                in: { $arrayElemAt: ["$$months", "$_id.month"] },
              },
            },
          }),
          ...(interval === "quarterly" && { quarter: "$_id.quarter" }),
          ...(interval === "semi-annually" && { half: "$_id.half" }),
        },
      },
      { $sort: { count: -1 } },
    ]);

    const responseData = leadCounts.map((item) => ({
      teamLeader: item.teamLeader,
      count: item.count,
      interval: item.interval,
      year: item.year,
      month: item.month,
      quarter: item.quarter,
      half: item.half,
    }));

    return res.send(successRes(200, "ok", { data: responseData }));
  } catch (error) {
    logger.info("Error getting unique team leader lead counts:", error);
    next(error);
  }
}

// export async function getAllLeadCountsFunnel(req, res, next) {
//   try {
//     const { interval = "yearly", year, month, startDate, endDate } = req.query;
//     const currentYear = new Date().getFullYear();
//     const currentMonth = new Date().getMonth() + 1;

//     // Set and validate year and month
//     let selectedYear = year ? parseInt(year, 10) : currentYear;
//     let selectedMonth = month ? parseInt(month, 10) : currentMonth;

//     if (
//       isNaN(selectedYear) ||
//       isNaN(selectedMonth) ||
//       selectedMonth < 1 ||
//       selectedMonth > 12
//     ) {
//       return res.json({ message: "Invalid year or month parameter" });
//     }

//     // Define match stage
//     let matchStage = {};

//     if (interval === "monthly") {
//       const startOfMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
//       const endOfMonthDate = new Date(selectedYear, selectedMonth, 1);
//       matchStage.startDate = {
//         $gte: startOfMonthDate,
//         $lt: endOfMonthDate,
//       };

//       logger.info(startOfMonthDate);
//       logger.info(endOfMonthDate);
//     } else if (interval === "weekly") {
//       const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
//       const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
//       matchStage.startDate = {
//         $gte: startOfCurrentWeek,
//         $lt: endOfCurrentWeek,
//       };
//     } else if (interval === "quarterly") {
//       const quarter = Math.floor((selectedMonth - 1) / 3);
//       const startOfQuarterDate = new Date(selectedYear, quarter * 3, 1);
//       const endOfQuarterDate = new Date(selectedYear, (quarter + 1) * 3, 1);
//       matchStage.startDate = {
//         $gte: startOfQuarterDate,
//         $lt: endOfQuarterDate,
//       };
//     } else if (interval === "semi-annually") {
//       const half = Math.floor((selectedMonth - 1) / 6);
//       const startOfHalfDate = new Date(selectedYear, half * 6, 1);
//       const endOfHalfDate = new Date(selectedYear, (half + 1) * 6, 1);
//       matchStage.startDate = {
//         $gte: startOfHalfDate,
//         $lt: endOfHalfDate,
//       };
//     } else if (interval === "yearly" || interval === "annually") {
//       matchStage.startDate = {
//         $gte: new Date(selectedYear, 0, 1),
//         $lt: new Date(selectedYear + 1, 0, 1),
//       };
//     } else if (interval === "custom" && startDate && endDate) {
//       matchStage.startDate = {
//         $gte: new Date(startDate),
//         $lt: new Date(endDate),
//       };
//     } else {
//       return res.json({ message: "Invalid interval or date range parameter" });
//     }

//     // Define all possible statuses for the funnel
//     const allStatuses = [
//       "booked",
//       "site visit",
//       "Supposed to Site Visit",
//       "approved",
//       "rejected",
//     ];

//     // Group stage by lead status and interval
//     let groupStage = {
//       _id: { status: "$status" },
//       count: { $sum: 1 },
//     };

//     if (interval === "weekly") {
//       groupStage._id.week = { $week: "$startDate" };
//       groupStage._id.year = { $year: "$startDate" };
//     } else if (interval === "monthly") {
//       groupStage._id.month = { $month: "$startDate" };
//       groupStage._id.year = { $year: "$startDate" };
//     } else if (interval === "quarterly") {
//       groupStage._id.quarter = {
//         $ceil: { $divide: [{ $month: "$startDate" }, 3] },
//       };
//       groupStage._id.year = { $year: "$startDate" };
//     } else if (interval === "semi-annually") {
//       groupStage._id.half = {
//         $ceil: { $divide: [{ $month: "$startDate" }, 6] },
//       };
//       groupStage._id.year = { $year: "$startDate" };
//     } else if (interval === "yearly" || interval === "annually") {
//       groupStage._id.year = { $year: "$startDate" };
//     }

//     const leadCounts = await leadModelV2.aggregate([
//       { $match: matchStage },
//       { $group: groupStage },
//       {
//         $project: {
//           status: "$_id.status",
//           count: 1,
//           interval,
//           year: "$_id.year",
//           month: {
//             $let: {
//               vars: {
//                 months: [
//                   "",
//                   "Jan",
//                   "Feb",
//                   "Mar",
//                   "Apr",
//                   "May",
//                   "Jun",
//                   "Jul",
//                   "Aug",
//                   "Sep",
//                   "Oct",
//                   "Nov",
//                   "Dec",
//                 ],
//               },
//               in: { $arrayElemAt: ["$$months", "$_id.month"] },
//             },
//           },
//           week: "$_id.week",
//           quarter: "$_id.quarter",
//           half: "$_id.half",
//         },
//       },
//       { $sort: { count: -1 } },
//     ]);

//     // Map lead counts to allStatuses to ensure each status is represented
//     const responseData = allStatuses.map((status) => {
//       const found = leadCounts.find((item) => item.status === status);
//       return {
//         status,
//         count: found ? found.count : 0,
//         interval,
//         year: found ? found.year : selectedYear,
//         month: found
//           ? found.month
//           : interval === "monthly"
//           ? currentMonth
//           : undefined,
//         week: found ? found.week : undefined,
//         quarter: found ? found.quarter : undefined,
//         half: found ? found.half : undefined,
//       };
//     });

//     return res.send(successRes(200, "ok", { data: responseData }));
//   } catch (error) {
// logger.info(error);
//     next(error);
//   }
// }

export async function getAllLeadCountsFunnel(req, res, next) {
  try {
    const { interval = "yearly", year, month, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let selectedYear = year ? parseInt(year, 10) : currentYear;
    let selectedMonth = month ? parseInt(month, 10) : currentMonth;

    if (
      isNaN(selectedYear) ||
      isNaN(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.json({ message: "Invalid year or month parameter" });
    }
    let matchStage = {};

    if (interval === "monthly") {
      const startOfMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonthDate = new Date(selectedYear, selectedMonth, 1);
      matchStage.startDate = { $gte: startOfMonthDate, $lt: endOfMonthDate };
    } else if (interval === "weekly") {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "quarterly") {
      const quarter = Math.floor((selectedMonth - 1) / 3);
      const startOfQuarterDate = new Date(selectedYear, quarter * 3, 1);
      const endOfQuarterDate = new Date(selectedYear, (quarter + 1) * 3, 1);
      matchStage.startDate = {
        $gte: startOfQuarterDate,
        $lt: endOfQuarterDate,
      };
    } else if (interval === "semi-annually") {
      const half = Math.floor((selectedMonth - 1) / 6);
      const startOfHalfDate = new Date(selectedYear, half * 6, 1);
      const endOfHalfDate = new Date(selectedYear, (half + 1) * 6, 1);
      matchStage.startDate = { $gte: startOfHalfDate, $lt: endOfHalfDate };
    } else if (interval === "yearly" || interval === "annually") {
      matchStage.startDate = {
        $gte: new Date(selectedYear, 0, 1),
        $lt: new Date(selectedYear + 1, 0, 1),
      };
    } else if (interval === "custom" && startDate && endDate) {
      matchStage.startDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    } else {
      return res.json({ message: "Invalid interval or date range parameter" });
    }
    const combinedCounts = {};

    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // logger.info(matchStage);

    const approvalCounts = await leadModelV2.countDocuments({
      approvalStatus: "approved",
      ...matchStage,
    });

    combinedCounts["approved"] = approvalCounts;

    const rejectedCount = await leadModelV2.countDocuments({
      approvalStatus: "rejected",
      ...matchStage,
    });

    combinedCounts["rejected"] = rejectedCount;

    const bookedCount = await leadModelV2.countDocuments({
      bookingStatus: "booked",
      ...matchStage,
    });

    combinedCounts["booked"] = bookedCount;

    //   const bookedCount = await leadModelV2.aggregate([
    //     {
    //       $match: {
    //         bookingStatus: "booked",
    //         ...matchStage,
    //       },
    //     },
    //     {
    //       $group: {
    //         _id: "$bookingStatus",
    //         count: { $sum: 1 },
    //       },
    //     },
    //   ]
    // );

    // const bookedCount = await leadModelV2.aggregate([
    //   { $match: matchStage, bookingStatus: "booked" },
    //   {
    //     $group: {
    //       _id: "$bookingStatus",
    //       count: { $sum: 1 },
    //     },
    //   },
    // ]);
    // combinedCounts["booked"] = bookedCount;

    const siteVisitCount = await leadModelV2.countDocuments({
      visitStatus: "visited",
      ...matchStage,
    });

    combinedCounts["visited"] = siteVisitCount;

    const revisitCount = await leadModelV2.countDocuments({
      revisitStatus: "revisited",
      ...matchStage,
    });

    combinedCounts["revisited"] = revisitCount;

    const interestedCount = await leadModelV2.countDocuments({
      siteVisitInterested: true,
      ...matchStage,
    });

    combinedCounts["Supposed to Site Visit"] = interestedCount;

    const allStatuses = [
      "booked",
      "visited",
      "revisited",
      "approved",
      "rejected",
      "Supposed to Site Visit",
    ];

    // Build response
    const responseData = allStatuses.map((status) => {
      return {
        status,
        count: combinedCounts[status] || 0,
        interval,
        year: selectedYear,
        month: interval === "monthly" ? selectedMonth : undefined,
        week: interval === "weekly" ? new Date().getWeek?.() : undefined,
        quarter:
          interval === "quarterly" ? Math.ceil(selectedMonth / 3) : undefined,
        half:
          interval === "semi-annually"
            ? Math.ceil(selectedMonth / 6)
            : undefined,
      };
    });

    return res.send(successRes(200, "ok", { data: responseData }));
  } catch (error) {
    logger.info(error);
    next(error);
  }
}

export async function getLeadCountsByChannelPartner(req, res, next) {
  try {
    const { interval = "monthly", year, month, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed

    // Validate and set selected year
    let selectedYear = year ? parseInt(year, 10) : currentYear;
    if (isNaN(selectedYear)) {
      return res.json({ message: "Invalid year parameter" });
    }

    // Validate and set selected month
    let selectedMonth = month ? parseInt(month, 10) : currentMonth;
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
      return res.json({ message: "Invalid month parameter" });
    }

    let matchStage = {};

    if (interval === "monthly") {
      const startOfMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonthDate = new Date(selectedYear, selectedMonth, 1);
      matchStage.startDate = {
        $gte: startOfMonthDate,
        $lt: endOfMonthDate,
      };
    } else if (interval === "weekly") {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endOfCurrentWeek = addDays(startOfCurrentWeek, 6); // 6 days for a full week
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "quarterly") {
      const quarter = Math.ceil(selectedMonth / 3);
      const startOfQuarter = new Date(selectedYear, (quarter - 1) * 3, 1);
      const endOfQuarter = new Date(selectedYear, quarter * 3, 1);
      matchStage.startDate = {
        $gte: startOfQuarter,
        $lt: endOfQuarter,
      };
    } else if (interval === "semi-annually") {
      const isFirstHalf = selectedMonth <= 6;
      const startOfHalf = new Date(selectedYear, isFirstHalf ? 0 : 6, 1);
      const endOfHalf = new Date(selectedYear, isFirstHalf ? 6 : 12, 1);
      matchStage.startDate = {
        $gte: startOfHalf,
        $lt: endOfHalf,
      };
    } else if (interval === "yearly" || interval === "annually") {
      matchStage.startDate = {
        $gte: startOfYear(new Date(selectedYear, 0, 1)),
        $lt: endOfYear(new Date(selectedYear, 11, 31)),
      };
    } else if (interval === "custom" && startDate && endDate) {
      matchStage.startDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    } else {
      return res.json({ message: "Invalid interval or date range parameter" });
    }

    // Group stage and further aggregation logic for each interval
    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          channelPartner: "$channelPartner",
          week: { $week: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "monthly") {
      groupStage = {
        _id: {
          channelPartner: "$channelPartner",
          month: { $month: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "quarterly") {
      groupStage = {
        _id: {
          channelPartner: "$channelPartner",
          quarter: {
            $ceil: { $divide: [{ $month: "$startDate" }, 3] },
          },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "semi-annually") {
      groupStage = {
        _id: {
          channelPartner: "$channelPartner",
          half: {
            $cond: [{ $lte: [{ $month: "$startDate" }, 6] }, "H1", "H2"],
          },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "yearly" || interval === "annually") {
      groupStage = {
        _id: {
          channelPartner: "$channelPartner",
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "custom") {
      groupStage = {
        _id: {
          channelPartner: "$channelPartner",
        },
        count: { $sum: 1 },
      };
    }

    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $lookup: {
          from: "channelPartners",
          localField: "_id.channelPartner",
          foreignField: "_id",
          as: "channelPartnerDetails",
        },
      },
      { $unwind: "$channelPartnerDetails" },
      {
        $project: {
          channelPartner: "$channelPartnerDetails.firmName",
          count: 1,
          interval,
          year: "$_id.year",
          ...(interval === "monthly" && {
            month: {
              $let: {
                vars: {
                  months: [
                    "",
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                },
                in: { $arrayElemAt: ["$$months", "$_id.month"] },
              },
            },
          }),
          ...(interval === "quarterly" && { quarter: "$_id.quarter" }),
          ...(interval === "semi-annually" && { half: "$_id.half" }),
        },
      },
      { $sort: { count: -1 } },
    ]);

    const responseData = leadCounts.map((item) => ({
      channelPartner: item.channelPartner,
      count: item.count,
      interval: item.interval,
      year: item.year,
      month: item.month,
      quarter: item.quarter,
      half: item.half,
    }));

    return res.send(successRes(200, "ok", { data: responseData }));
  } catch (error) {
    logger.info("Error getting unique team leader lead counts:", error);
    next(error);
  }
}

export async function getLeadCountsByChannelPartnerById(req, res, next) {
  try {
    const teamLeaderId = req.params.id;
    const { interval = "monthly", year, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();

    // Validate teamLeaderId parameter
    if (!teamLeaderId) {
      return res.json({ message: "Team leader ID is required" });
    }

    // Validate year parameter only if it's provided
    let selectedYear = currentYear;
    if (year) {
      selectedYear = parseInt(year, 10);
      if (isNaN(selectedYear)) {
        return res.json({ message: "Invalid year parameter" });
      }
    }

    // Calculate the default range for the last three months
    const currentDate = new Date();
    const defaultEndDate = currentDate;
    const defaultStartDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1,
    );
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });

    // let matchStage = {
    //   channelPartner: teamLeaderId, // Match by team leader ID
    // };

    let matchStage = {
      channelPartnerHistory: {
        $elemMatch: {
          channelPartner: teamLeaderId,
          status: "approved",
        },
      },
    };

    // logger.info(matchStage);
    if (interval === "weekly") {
      const endOfCurrentWeek = addDays(startOfCurrentWeek, 7); // Limit to current week (Mon-Sun)
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "monthly") {
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const firstDayOfNextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      );
      matchStage.startDate = {
        $gte: firstDayOfMonth,
        $lt: firstDayOfNextMonth,
      };
    } else if (interval === "annually") {
      const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1); // Jan 1
      matchStage.startDate = {
        $gte: firstDayOfYear,
        $lte: currentDate,
      };
    } else {
      return res.json({ message: "Invalid interval parameter" });
    }

    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          dayOfWeek: { $dayOfWeek: "$startDate" },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
        },

        count: { $sum: 1 },
      };
    } else if (["monthly", "annually"].includes(interval)) {
      groupStage = {
        _id: {
          month: { $month: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    }
    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { "_id.date": 1, "_id.month": 1, "_id.dayOfWeek": 1 } },
    ]);

    // Prepare a full weekly structure with zero counts for missing days
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let weekData = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date: format(date, "yyyy-MM-dd"),
        day: dayMap[(i + 1) % 7], // Adjust for MongoDB's $dayOfWeek (1 = Sunday)
        count: 0,
      };
    });

    // Populate `weekData` with actual counts where available
    leadCounts.forEach((item) => {
      const foundDay = weekData.find((day) => day.date === item._id.date);
      if (foundDay) foundDay.count = item.count;
    });

    if (interval === "weekly") {
      return res.send(
        successRes(200, "ok", {
          data: weekData,
        }),
      );

      // return res.json(weekData); // Only send weekly data with all days accounted for
    }

    // Monthly data output
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedMonthlyData = leadCounts.map((item) => ({
      year: item._id.year,
      month: monthNames[item._id.month - 1], // Use month number to get month name
      count: item.count,
    }));

    return res.send(
      successRes(200, "ok", {
        data: formattedMonthlyData,
      }),
    );
  } catch (error) {
    logger.info("Error getting lead counts by Channel Partner:", error);
    next(error);
  }
}

// export async function getLeadCountsByChannelPartnerById(req, res, next) {
//   try {
//     const teamLeaderId = req.params.id;
//     const { interval = "monthly", year, startDate, endDate } = req.query;
//     const currentYear = new Date().getFullYear();

//     // Validate teamLeaderId parameter
//     if (!teamLeaderId) {
//       return res.json({ message: "Team leader ID is required" });
//     }

//     // Validate year parameter only if it's provided
//     let selectedYear = currentYear;
//     if (year) {
//       selectedYear = parseInt(year, 10);
//       if (isNaN(selectedYear)) {
//         return res.json({ message: "Invalid year parameter" });
//       }
//     }

//     // Calculate the start of the current week (Monday)
//     const currentDate = new Date();
//     const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
//     const endOfCurrentWeek = addDays(startOfCurrentWeek, 7); // Limit to current week (Mon-Sun)

//     let matchStage = {
//       channelPartner: teamLeaderId, // Match by team leader ID
//     };

//     if (interval === "weekly") {
//       matchStage.startDate = {
//         $gte: startOfCurrentWeek,
//         $lt: endOfCurrentWeek,
//       };
//     } else if (interval === "monthly") {
//       if (startDate && endDate) {
//         matchStage.startDate = {
//           $gte: new Date(startDate),
//           $lt: new Date(endDate),
//         };
//       } else {
//         matchStage.startDate = {
//           $gte: new Date(`${selectedYear}-01-01`),
//           $lt: new Date(`${selectedYear + 1}-01-01`),
//         };
//       }
//     } else {
//       return res.json({ message: "Invalid interval parameter" });
//     }

//     let groupStage = {};
//     if (interval === "weekly") {
//       groupStage = {
//         _id: {
//           dayOfWeek: { $dayOfWeek: "$startDate" },
//           date: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
//         },
//         count: { $sum: 1 },
//       };
//     } else if (interval === "monthly") {
//       groupStage = {
//         _id: {
//           month: { $month: "$startDate" },
//           year: { $year: "$startDate" },
//         },
//         count: { $sum: 1 },
//       };
//     }

//     const leadCounts = await leadModelV2.aggregate([
//       { $match: matchStage },
//       { $group: groupStage },
//       { $sort: { "_id.date": 1, "_id.month": 1, "_id.dayOfWeek": 1 } },
//     ]);

//     // Prepare a full weekly structure with zero counts for missing days
//     const dayMap = [
//       "Sunday",
//       "Monday",
//       "Tuesday",
//       "Wednesday",
//       "Thursday",
//       "Friday",
//       "Saturday",
//     ];
//     let weekData = Array.from({ length: 7 }, (_, i) => {
//       const date = addDays(startOfCurrentWeek, i);
//       return {
//         date: format(date, "yyyy-MM-dd"),
//         day: dayMap[(i + 1) % 7], // Adjust for MongoDB's $dayOfWeek (1 = Sunday)
//         count: 0,
//       };
//     });

//     // Populate `weekData` with actual counts where available
//     leadCounts.forEach((item) => {
//       const foundDay = weekData.find((day) => day.date === item._id.date);
//       if (foundDay) foundDay.count = item.count;
//     });

//     if (interval === "weekly") {
//       return res.json(weekData); // Only send weekly data with all days accounted for
//     }

//     // Monthly data output
//     const monthNames = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];

//     const formattedMonthlyData = leadCounts.map((item) => ({
//       year: item._id.year,
//       month: monthNames[item._id.month - 1], // Use month number to get month name
//       count: item.count,
//     }));

//     return res.send(
//       successRes(200, "ok", {
//         data: formattedMonthlyData,
//       })
//     );
//   } catch (error) {
// logger.info(error);
//     next(error);
//   }
// }

//for pre sale team leader
export async function getLeadCountsByTeamLeader(req, res, next) {
  try {
    const teamLeaderId = req.params.id;
    const { interval = "monthly", year, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();

    // Validate teamLeaderId parameter
    if (!teamLeaderId) {
      return res.json({ message: "Team leader ID is required" });
    }

    // Validate year parameter only if it's provided
    let selectedYear = currentYear;
    if (year) {
      selectedYear = parseInt(year, 10);
      if (isNaN(selectedYear)) {
        return res.json({ message: "Invalid year parameter" });
      }
    }

    // Calculate the start of the current week (Monday)
    const currentDate = new Date();
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 7); // Limit to current week (Mon-Sun)

    let matchStage = {
      teamLeader: teamLeaderId, // Match by team leader ID
    };

    if (interval === "weekly") {
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "monthly") {
      if (startDate && endDate) {
        matchStage.startDate = {
          $gte: new Date(startDate),
          $lt: new Date(endDate),
        };
      } else {
        matchStage.startDate = {
          $gte: new Date(`${selectedYear}-01-01`),
          $lt: new Date(`${selectedYear + 1}-01-01`),
        };
      }
    } else {
      return res.json({ message: "Invalid interval parameter" });
    }

    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          dayOfWeek: { $dayOfWeek: "$startDate" },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$startDate" } },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "monthly") {
      groupStage = {
        _id: {
          month: { $month: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    }

    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { "_id.date": 1, "_id.month": 1, "_id.dayOfWeek": 1 } },
    ]);

    // Prepare a full weekly structure with zero counts for missing days
    const dayMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    let weekData = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date: format(date, "yyyy-MM-dd"),
        day: dayMap[(i + 1) % 7], // Adjust for MongoDB's $dayOfWeek (1 = Sunday)
        count: 0,
      };
    });

    // Populate `weekData` with actual counts where available
    leadCounts.forEach((item) => {
      const foundDay = weekData.find((day) => day.date === item._id.date);
      if (foundDay) foundDay.count = item.count;
    });

    if (interval === "weekly") {
      return res.json(weekData); // Only send weekly data with all days accounted for
    }

    // Monthly data output
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedMonthlyData = leadCounts.map((item) => ({
      year: item._id.year,
      month: monthNames[item._id.month - 1], // Use month number to get month name
      count: item.count,
    }));

    return res.send(
      successRes(200, "ok", {
        data: formattedMonthlyData,
      }),
    );
  } catch (error) {
    logger.info("Error getting lead counts by team leader:", error);
    next(error);
  }
}

export async function getLeadCountsByPreSaleExecutve(req, res, next) {
  try {
    const { interval = "yearly", year, month, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed

    // Validate and set selected year
    let selectedYear = year ? parseInt(year, 10) : currentYear;
    if (isNaN(selectedYear)) {
      return res.json({ message: "Invalid year parameter" });
    }

    // Validate and set selected month
    let selectedMonth = month ? parseInt(month, 10) : currentMonth;
    if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
      return res.json({ message: "Invalid month parameter" });
    }

    let matchStage = {};

    if (interval === "monthly") {
      const startOfMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonthDate = new Date(selectedYear, selectedMonth, 1);
      matchStage.startDate = {
        $gte: startOfMonthDate,
        $lt: endOfMonthDate,
      };
    } else if (interval === "weekly") {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endOfCurrentWeek = addDays(startOfCurrentWeek, 6); // 6 days for a full week
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "quarterly") {
      const quarter = Math.ceil(selectedMonth / 3);
      const startOfQuarter = new Date(selectedYear, (quarter - 1) * 3, 1);
      const endOfQuarter = new Date(selectedYear, quarter * 3, 1);
      matchStage.startDate = {
        $gte: startOfQuarter,
        $lt: endOfQuarter,
      };
    } else if (interval === "semi-annually") {
      const isFirstHalf = selectedMonth <= 6;
      const startOfHalf = new Date(selectedYear, isFirstHalf ? 0 : 6, 1);
      const endOfHalf = new Date(selectedYear, isFirstHalf ? 6 : 12, 1);
      matchStage.startDate = {
        $gte: startOfHalf,
        $lt: endOfHalf,
      };
    } else if (interval === "yearly" || interval === "annually") {
      matchStage.startDate = {
        $gte: startOfYear(new Date(selectedYear, 0, 1)),
        $lt: endOfYear(new Date(selectedYear, 11, 31)),
      };
    } else if (interval === "custom" && startDate && endDate) {
      matchStage.startDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    } else {
      return res.json({ message: "Invalid interval or date range parameter" });
    }

    // Group stage and further aggregation logic for each interval
    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          preSalesExecutive: "$preSalesExecutive",
          week: { $week: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "monthly") {
      groupStage = {
        _id: {
          preSalesExecutive: "$preSalesExecutive",
          month: { $month: "$startDate" },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "quarterly") {
      groupStage = {
        _id: {
          preSalesExecutive: "$preSalesExecutive",
          quarter: {
            $ceil: { $divide: [{ $month: "$startDate" }, 3] },
          },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "semi-annually") {
      groupStage = {
        _id: {
          preSalesExecutive: "$preSalesExecutive",
          half: {
            $cond: [{ $lte: [{ $month: "$startDate" }, 6] }, "H1", "H2"],
          },
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "yearly" || interval === "annually") {
      groupStage = {
        _id: {
          preSalesExecutive: "$preSalesExecutive",
          year: { $year: "$startDate" },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "custom") {
      groupStage = {
        _id: {
          preSalesExecutive: "$preSalesExecutive",
        },
        count: { $sum: 1 },
      };
    }

    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $lookup: {
          from: "employees",
          localField: "_id.preSalesExecutive",
          foreignField: "_id",
          as: "preSalesExecutiveDetails",
        },
      },
      { $unwind: "$preSalesExecutiveDetails" },
      {
        $project: {
          preSalesExecutive: {
            $concat: [
              "$preSalesExecutiveDetails.firstName",
              " ",
              "$preSalesExecutiveDetails.lastName",
            ],
          },
          count: 1,
          interval,
          year: "$_id.year",
          ...(interval === "monthly" && {
            month: {
              $let: {
                vars: {
                  months: [
                    "",
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                },
                in: { $arrayElemAt: ["$$months", "$_id.month"] },
              },
            },
          }),
          ...(interval === "quarterly" && { quarter: "$_id.quarter" }),
          ...(interval === "semi-annually" && { half: "$_id.half" }),
        },
      },
      { $sort: { count: -1 } },
    ]);

    const responseData = leadCounts.map((item) => ({
      preSalesExecutive: item.preSalesExecutive,
      count: item.count,
      interval: item.interval,
      year: item.year,
      month: item.month,
      quarter: item.quarter,
      half: item.half,
    }));

    return res.send(successRes(200, "ok", { data: responseData }));
  } catch (error) {
    logger.info("Error getting unique team leader lead counts:", error);
    next(error);
  }
}

export async function getAllLeadCountsFunnelForPreSaleTL(req, res, next) {
  try {
    const { interval = "yearly", year, month, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Set and validate year and month
    let selectedYear = year ? parseInt(year, 10) : currentYear;
    let selectedMonth = month ? parseInt(month, 10) : currentMonth;

    if (
      isNaN(selectedYear) ||
      isNaN(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.json({ message: "Invalid year or month parameter" });
    }

    // Define match stage
    let matchStage = {};

    if (interval === "monthly") {
      const startOfMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonthDate = new Date(selectedYear, selectedMonth, 1);
      matchStage.startDate = {
        $gte: startOfMonthDate,
        $lt: endOfMonthDate,
      };
    } else if (interval === "weekly") {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
      matchStage.startDate = {
        $gte: startOfCurrentWeek,
        $lt: endOfCurrentWeek,
      };
    } else if (interval === "quarterly") {
      const quarter = Math.floor((selectedMonth - 1) / 3);
      const startOfQuarterDate = new Date(selectedYear, quarter * 3, 1);
      const endOfQuarterDate = new Date(selectedYear, (quarter + 1) * 3, 1);
      matchStage.startDate = {
        $gte: startOfQuarterDate,
        $lt: endOfQuarterDate,
      };
    } else if (interval === "semi-annually") {
      const half = Math.floor((selectedMonth - 1) / 6);
      const startOfHalfDate = new Date(selectedYear, half * 6, 1);
      const endOfHalfDate = new Date(selectedYear, (half + 1) * 6, 1);
      matchStage.startDate = {
        $gte: startOfHalfDate,
        $lt: endOfHalfDate,
      };
    } else if (interval === "yearly" || interval === "annually") {
      matchStage.startDate = {
        $gte: new Date(selectedYear, 0, 1),
        $lt: new Date(selectedYear + 1, 0, 1),
      };
    } else if (interval === "custom" && startDate && endDate) {
      matchStage.startDate = {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      };
    } else {
      return res.json({ message: "Invalid interval or date range parameter" });
    }

    // Define all possible statuses for the funnel
    const allStatuses = [
      "Booked",
      "Site Visit",
      "Leads Contacted",
      "Leads Received",
    ];

    // Group stage by lead status and interval
    let groupStage = {
      _id: { status: "$status" },
      count: { $sum: 1 },
    };

    if (interval === "weekly") {
      groupStage._id.week = { $week: "$startDate" };
      groupStage._id.year = { $year: "$startDate" };
    } else if (interval === "monthly") {
      groupStage._id.month = { $month: "$startDate" };
      groupStage._id.year = { $year: "$startDate" };
    } else if (interval === "quarterly") {
      groupStage._id.quarter = {
        $ceil: { $divide: [{ $month: "$startDate" }, 3] },
      };
      groupStage._id.year = { $year: "$startDate" };
    } else if (interval === "semi-annually") {
      groupStage._id.half = {
        $ceil: { $divide: [{ $month: "$startDate" }, 6] },
      };
      groupStage._id.year = { $year: "$startDate" };
    } else if (interval === "yearly" || interval === "annually") {
      groupStage._id.year = { $year: "$startDate" };
    }

    const leadCounts = await leadModelV2.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $project: {
          status: "$_id.status",
          count: 1,
          interval,
          year: "$_id.year",
          month: {
            $let: {
              vars: {
                months: [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: { $arrayElemAt: ["$$months", "$_id.month"] },
            },
          },
          week: "$_id.week",
          quarter: "$_id.quarter",
          half: "$_id.half",
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Map lead counts to allStatuses to ensure each status is represented
    const responseData = allStatuses.map((status) => {
      const found = leadCounts.find(
        (item) => item.status === status || item.approvalStatus === status,
      );
      return {
        status,
        count: found ? found.count : 0,
        interval,
        year: found ? found.year : selectedYear,
        month: found
          ? found.month
          : interval === "monthly"
            ? currentMonth
            : undefined,
        week: found ? found.week : undefined,
        quarter: found ? found.quarter : undefined,
        half: found ? found.half : undefined,
      };
    });

    return res.send(successRes(200, "ok", { data: responseData }));
  } catch (error) {
    logger.info("Error getting all lead counts by status:", error);
    next(error);
  }
}

export const getLeadByStartEndDate = async (req, res) => {
  const { startDate, endDate, teamLeader, status, project, channelPartner } =
    req.body;

  try {
    if (!startDate || !endDate)
      return res.send(errorRes(401, "start & end date required"));

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Status filter
    let statusToFind = {};
    if (status === "visit-pending") {
      statusToFind = { visitStatus: "pending" };
    } else if (status === "revisit-pending") {
      statusToFind = { revisitStatus: "pending" };
    } else if (status === "visited") {
      statusToFind = { visitStatus: { $ne: "pending" } };
    } else if (status === "revisited") {
      statusToFind = { revisitStatus: { $ne: "pending" } };
    } else if (status === "booking-done") {
      statusToFind = { bookingStatus: "booked" };
    } else if (status === "pending") {
      statusToFind = {
        bookingStatus: { $ne: "booked" },
        $or: [{ visitStatus: "pending" }, { revisitStatus: "pending" }],
      };
    } else if (status === "tagging-over" || status === "followup") {
      statusToFind = { stage: "tagging-over" };
    }

    // Project filter
    let projectFilter = {};
    if (project) {
      projectFilter = { project: { $in: project } };
    }

    // Team leader filter
    let teamLeaderFilter = {};
    if (teamLeader) {
      teamLeaderFilter = { teamLeader };
    }
    let channelPartnerFilter = {};

    if (channelPartner) {
      channelPartnerFilter = { channelPartner };
    }

    const resp = await leadModelV2
      .find({
        ...teamLeaderFilter,
        ...statusToFind,
        ...projectFilter,
        ...channelPartnerFilter,
        startDate: { $gte: start, $lt: end },
      })
      .sort({ startDate: -1, _id: 1 })
      .populate(leadPopulateOptions);

    return res.send(
      successRes(200, "leads", {
        totalItems: resp.length,
        data: resp,
      }),
    );
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
};

export const generateInternalLeadPdf = async (req, res) => {
  try {
    const timeZone = "Asia/Kolkata";

    // Get yesterday's date range in local timezone
    const startOfYesterday = moment()
      .tz(timeZone)
      .subtract(1, "day")
      .startOf("day")
      .toDate();
    const endOfYesterday = moment()
      .tz(timeZone)
      .subtract(1, "day")
      .endOf("day")
      .toDate();
    // logger.info(startOfYesterday);
    // logger.info(endOfYesterday);

    // logger.info(
    //   moment("2024-12-10T20:39:57.938+00:00")
    //     .tz(timeZone)
    //     .format("DD-MM-YYYY HH:mm")
    // );
    // logger.info(
    //   moment(startOfYesterday).tz(timeZone).format("DD-MM-YYYY HH:mm")
    // );

    // logger.info(moment(endOfYesterday).tz(timeZone).format("DD-MM-YYYY HH:mm"));

    const leads = await leadModelV2
      .find({
        startDate: { $gte: startOfYesterday, $lt: endOfYesterday },
      })
      .populate(leadPopulateOptions);

    if (!leads.length) {
      return res.json({ message: "No leads found for yesterday" });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const pdfPath = path.join(__dirname, "leads-yesterday.pdf");
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);
    // Add title
    doc
      .fontSize(20)
      .text(
        `Internal Assigned Leads Report - ${moment(startOfYesterday)
          .tz(timeZone)
          .format("DD-MM-YYYY")}`,
        {
          align: "center",
          underline: true,
        },
      )
      .moveDown();

    let i = 1;
    leads.forEach((lead, index) => {
      if (doc.y > 700) {
        doc.fontSize(10).text(`Page ${i}`, 40, 780, {
          align: "right",
        });
        i++;

        doc.addPage();
      }
      // Draw card boundary
      doc.rect(40, doc.y, 510, 150).stroke().moveDown(0.5);

      const cardY = doc.y + 5;

      // Add lead details within the card
      doc
        .fontSize(12)
        .text(`Lead ${index + 1} out of ${leads.length}`, 50, cardY, {
          align: "left",
        })
        .text(
          `Name: ${lead.firstName || "N/A"} ${lead.lastName || ""}`,
          50,
          cardY + 15,
        )
        .text(
          `Phone: ${lead.countryCode + " " + lead.phoneNumber || "N/A"}`,
          50,
          cardY + 30,
        )
        .text(
          `Alt Phone: ${
            lead.altPhoneNumber
              ? lead.countryCode + " " + lead.altPhoneNumber
              : "N/A"
          }`,
          50,
          cardY + 45,
        )

        .text(`Email: ${lead.email || "N/A"}`, 50, cardY + 60)
        .text(
          `Projects: ${
            lead.project?.map((proj) => proj.name)?.join(", ") || "N/A"
          }`,
          50,
          cardY + 75,
        )
        .text(
          `Requirement: ${lead.requirement?.join(", ") || "N/A"}`,
          50,
          cardY + 90,
        )

        .text(`Status: ${getStatus1(lead) || "N/A"}`, 300, cardY + 15)
        .text(
          `Data Analyzer: ${
            (lead.dataAnalyzer?.firstName ?? "") +
              " " +
              (lead.dataAnalyzer?.lastName ?? "") || "N/A"
          }`,
          300,
          cardY + 30,
        )
        .text(
          `Team Leader: ${
            (lead.teamLeader?.firstName ?? "") +
              " " +
              (lead.teamLeader?.lastName ?? "") || "N/A"
          }`,
          300,
          cardY + 45,
        )

        .text(
          `Channel Partner: ${lead.channelPartner?.firmName || "N/A"}`,
          300,
          cardY + 60,
        )
        // .text(`Status: ${getStatus1(lead) || "N/A"}`, 300, cardY + 60)
        .text(
          `Assigned Date: ${
            lead.cycle?.startDate
              ? moment(lead.cycle.startDate)
                  .tz(timeZone)
                  .format("DD-MM-YYYY hh:mm:ss a")
              : "N/A"
          }`,
          300,
          cardY + 75,
        )
        .text(
          `Deadline: ${
            lead.cycle?.validTill
              ? moment(lead.cycle.validTill)
                  .tz(timeZone)
                  .format("DD-MM-YYYY hh:mm:ss a")
              : "N/A"
          }`,
          300,
          cardY + 90,
        );

      // Add some spacing between cards
      doc.moveDown(4);
    });

    doc.end();

    pdfStream.on("finish", () => {
      res.download(pdfPath, "leads-yesterday.pdf", (err) => {
        if (err) {
          logger.info("Error sending file:", err);
          res.status(500).send("Error downloading file.");
        }
        fs.unlinkSync(pdfPath);
      });
    });
  } catch (error) {
    logger.info("Error generating PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const generateChannelPartnerLeadPdf = async (req, res) => {
  try {
    const timeZone = "Asia/Kolkata";

    // Get yesterday's date range in local timezone
    const startOfYesterday = moment()
      .tz(timeZone)
      .subtract(1, "day")
      .startOf("day")
      .toDate();
    const endOfYesterday = moment()
      .tz(timeZone)
      .subtract(1, "day")
      .endOf("day")
      .toDate();

    const leads = await leadModelV2
      .find({
        startDate: { $lte: startOfYesterday, $lt: endOfYesterday },
        channelPartner: { $ne: null },
      })
      .populate(leadPopulateOptions);

    if (!leads.length) {
      return res.json({ message: "No leads found for yesterday" });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const pdfPath = path.join(__dirname, "leads-yesterday.pdf");
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);

    // Add title
    doc
      .fontSize(20)
      .text(
        `Channel Partner Leads Report - ${moment(startOfYesterday)
          .tz(timeZone)
          .format("DD-MM-YYYY")}`,
        {
          align: "center",
          underline: true,
        },
      )
      .moveDown();
    let i = 1;
    // Iterate through leads and add as card-style layout
    leads.forEach((lead, index) => {
      if (doc.y > 700) {
        doc.fontSize(10).text(`Page ${i}`, 40, 780, {
          align: "right",
        });
        i++;

        doc.addPage(); // Add new page if content exceeds height
      }

      // Draw card boundary
      doc.rect(40, doc.y, 510, 150).stroke().moveDown(0.5);

      const cardY = doc.y + 5;

      // Add lead details within the card
      doc
        .fontSize(12)
        .text(`Lead ${index + 1} out of ${leads.length}`, 50, cardY, {
          align: "left",
        })
        .text(
          `Name: ${lead.firstName || "N/A"} ${lead.lastName || ""}`,
          50,
          cardY + 15,
        )
        .text(
          `Phone: ${lead.countryCode + " " + lead.phoneNumber || "N/A"}`,
          50,
          cardY + 30,
        )
        .text(
          `Alt Phone: ${
            lead.altPhoneNumber
              ? lead.countryCode + " " + lead.altPhoneNumber
              : "N/A"
          }`,
          50,
          cardY + 45,
        )

        .text(`Email: ${lead.email || "N/A"}`, 50, cardY + 60)
        .text(
          `Projects: ${
            lead.project?.map((proj) => proj.name)?.join(", ") || "N/A"
          }`,
          50,
          cardY + 75,
        )
        .text(
          `Requirement: ${lead.requirement?.join(", ") || "N/A"}`,
          50,
          cardY + 90,
        )

        .text(`Status: ${getStatus1(lead) || "N/A"}`, 300, cardY + 15)
        .text(
          `Data Analyzer: ${
            lead.dataAnalyzer?.firstName + " " + lead.dataAnalyzer?.lastName ||
            "N/A"
          }`,
          300,
          cardY + 30,
        )
        .text(
          `Team Leader: ${
            lead.teamLeader?.firstName + " " + lead.teamLeader?.lastName ||
            "N/A"
          }`,
          300,
          cardY + 45,
        )

        .text(
          `Channel Partner: ${lead.channelPartner?.firmName || "N/A"}`,
          300,
          cardY + 60,
        )
        // .text(`Status: ${getStatus1(lead) || "N/A"}`, 300, cardY + 60)
        .text(
          `Tagging Date: ${
            lead.startDate
              ? moment(lead.startDate)
                  .tz(timeZone)
                  .format("DD-MM-YYYY hh:mm:ss a")
              : "N/A"
          }`,
          300,
          cardY + 75,
        )
        .text(
          `Valid Till: ${
            lead.validTill
              ? moment(lead.validTill)
                  .tz(timeZone)
                  .format("DD-MM-YYYY hh:mm:ss a")
              : "N/A"
          }`,
          300,
          cardY + 90,
        );

      // Add some spacing between cards
      doc.moveDown(4);
    });

    doc.end();

    pdfStream.on("finish", () => {
      res.download(pdfPath, "leads-yesterday.pdf", (err) => {
        if (err) {
          logger.info("Error sending file:", err);
          res.status(500).send("Error downloading file.");
        }
        fs.unlinkSync(pdfPath);
      });
    });
  } catch (error) {
    logger.info(error);
    logger.info("Error generating PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function getStatus1(lead) {
  if (lead.stage == "visit") {
    return `${lead.stage ?? ""} ${lead.visitStatus ?? ""}`;
  } else if (lead.stage == "revisit") {
    return `${lead.stage ?? ""} ${lead.revisitStatus ?? ""}`;
  } else if (lead.stage == "booking") {
    return `${lead.stage ?? ""} ${lead.bookingStatus ?? ""}`;
  }

  return `${lead.stage ?? ""} ${lead.visitStatus ?? ""}`;
}

export const triggerCycleChange = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const filterDate = new Date("2024-12-10");

    // Fetch all leads whose cycles have expired
    const allCycleExpiredLeads = await leadModelV2.find({
      "cycle.validTill": { $lt: currentDate },
      startDate: { $gte: filterDate },
      bookingStatus: { $ne: "booked" },
    });

    if (allCycleExpiredLeads.length > 0) {
      // Fetch active team leaders sorted by createdAt
      const teamLeaders = [
        { _id: "ev15-deepak-karki" },
        { _id: "ev69-vicky-mane" },
        { _id: "ev70-jaspreet-arora" },
        { _id: "ev54-ranjna-gupta" },
      ];
      // const teamLeaders = await employeeModel
      //   .find({
      //     $or: [
      //       { designation: "desg-site-head" },
      //       { designation: "desg-senior-closing-manager" },
      //       { designation: "desg-post-sales-head" },
      //     ],
      //     status: "active",
      //   })
      //   .sort({ createdAt: 1 })
      //   .select("_id");

      // logger.info("Team Leaders:", teamLeaders); // Debug log

      // Prepare bulk operations
      const bulkOperations = [];
      const visitDays = [15, 7, 3, 2];
      const revisitDays = [15, 7, 3];
      allCycleExpiredLeads.map((entry) => {
        const lastIndex = teamLeaders.findIndex(
          (ele) => ele?._id.toString() === entry?.cycle?.teamLeader?.toString(),
        );
        const totalTeamLeader = teamLeaders.length;
        const cCycle = { ...entry.cycle }; // Clone cycle object

        const previousCycle = { ...cCycle }; // For cycle history
        const startDate = new Date(entry.cycle.validTill); // Current date
        const validTill = new Date(startDate);

        if (lastIndex !== -1) {
          // Logic for visit stage
          if (cCycle.stage === "visit") {
            if (cCycle.currentOrder >= totalTeamLeader) {
              if (!cCycle.currentDays) {
                validTill.setDate(validTill.getDate() + 15);
                cCycle.currentOrder += 1;
                cCycle.currentDays = 15;
                cCycle.lastIndex = lastIndex;
                cCycle.teamLeader = teamLeaders[0]?._id; // Reset to first TL
              } else {
                validTill.setDate(validTill.getDate() + cCycle.currentDays);
                cCycle.currentOrder += 1;
                cCycle.lastIndex = lastIndex;
                cCycle.teamLeader = teamLeaders[0]?._id; // Reset to first TL
                const foundIndex = visitDays.indexOf(cCycle.currentDays);
                cCycle.currentDays =
                  visitDays[(foundIndex + 1) % visitDays.length]; // Cycle through visitDays infinitely
              }
              // cCycle.oldTeamLeader = cCycle.teamLeader; // Reset to first TL
            } else {
              cCycle.currentOrder += 1;
              cCycle.teamLeader =
                teamLeaders[lastIndex + 1]?._id || teamLeaders[0]?._id;
              // cCycle.oldTeamLeader = cCycle.teamLeader;
              // cCycle.lastIndex = lastIndex;
              // cCycle.nextIndex = lastIndex + 1;

              switch (cCycle.currentOrder) {
                case 1: {
                  validTill.setDate(validTill.getDate() + 14);
                  cCycle.currentDays = 14;
                  break;
                }
                case 2: {
                  validTill.setDate(validTill.getDate() + 6);
                  cCycle.currentDays = 6;
                  break;
                }
                case 3: {
                  validTill.setDate(validTill.getDate() + 2);
                  cCycle.currentDays = 2;
                  break;
                }
                case 4: {
                  validTill.setDate(validTill.getDate() + 1);
                  cCycle.currentDays = 1;
                  break;
                }
                default: {
                  validTill.setDate(validTill.getDate() + 14);
                  cCycle.currentDays = 14;
                }
              }
            }
          } else if (cCycle.stage === "revisit") {
            // Logic for revisit stage
            if (cCycle.currentOrder >= totalTeamLeader) {
              validTill.setDate(validTill.getDate() + 180);
              cCycle.currentOrder = 1;
              cCycle.teamLeader = teamLeaders[0]?._id; // Reset to first TL
              cCycle.lastIndex = lastIndex;
            } else {
              cCycle.currentOrder += 1;
              cCycle.teamLeader =
                teamLeaders[lastIndex + 1]?._id || teamLeaders[0]?._id;
              cCycle.lastIndex = lastIndex;
              cCycle.nextIndex = lastIndex + 1;

              switch (cCycle.currentOrder) {
                case 1: {
                  validTill.setDate(validTill.getDate() + 29);
                  cCycle.currentDays = 29;
                  break;
                }
                case 2: {
                  validTill.setDate(validTill.getDate() + 14);
                  cCycle.currentDays = 14;
                  break;
                }
                case 3: {
                  validTill.setDate(validTill.getDate() + 6);
                  cCycle.currentDays = 6;
                  break;
                }
                case 4: {
                  validTill.setDate(validTill.getDate() + 2);
                  cCycle.currentDays = 2;
                  break;
                }
                default: {
                  validTill.setDate(validTill.getDate() + 29);
                  cCycle.currentDays = 29;
                }
              }
            }
          }

          cCycle.startDate = startDate;
          cCycle.validTill = validTill;

          // Add bulk update operation
          bulkOperations.push({
            updateOne: {
              filter: { _id: entry._id },
              update: {
                teamLeader: cCycle.teamLeader,
                $set: { cycle: cCycle },
                $push: { cycleHistory: previousCycle }, // Add previous cycle to history
              },
            },
          });
        }
      });

      // Execute bulk update
      if (bulkOperations.length > 0) {
        const bulkResult = await leadModelV2.bulkWrite(bulkOperations);
        // logger.info("Bulk Update Result:", bulkResult);

        return res.send(
          successRes(200, "Cycles updated successfully", {
            matchedCount: bulkResult.matchedCount,
            modifiedCount: bulkResult.modifiedCount,
            total: bulkOperations?.length,
            data: bulkOperations,
          }),
        );
      }
    }

    // If no leads need cycle changes
    return res.send(
      successRes(200, "No cycle changes needed", {
        data: [],
        totalItem: 0,
      }),
    );
  } catch (error) {
    logger.info("Error updating cycles:", error);
    return res.status(500).send({ message: "Internal Server Error", error });
  }
};

export const getCpSalesFunnel = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "channel partner required"));
    let status = req.query.approvalStatus?.toLowerCase();
    let stage = req.query.stage?.toLowerCase();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 3);

    // Count the total items matching the filter
    // const bookingDone = await leadModelV2.countDocuments({
    //   startDate: { $gte: sixMonthsAgo },
    //   channelPartner: id,
    //   bookingStatus: { $eq: "booked" },
    // });
    const totalItems = await leadModelV2
      .countDocuments({
        stage: { $ne: "tagging-over" },
        leadType: { $ne: "walk-in" },
        channelPartner: id,
        validTill: { $gte: new Date() },
      })
      .sort({ startDate: -1 });

    const bookingDone = await leadModelV2.countDocuments({
      bookingStatus: { $eq: "booked" },
      informedStatus: { $eq: true },
      $expr: {
        $and: [
          { $gte: ["$bookingDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$bookingDate", "$validTill"] }, // visitDate <= validTill
        ],
      },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
    });

    // const visitDone = await leadModelV2.countDocuments({
    //   startDate: { $gte: sixMonthsAgo },
    //   channelPartner: id,
    //   visitStatus: { $eq: "visited" },
    // });

    const visitDone = await leadModelV2.countDocuments({
      leadType: { $ne: "walk-in" },

      $or: [
        {
          visitStatus: "visited",
        },
        {
          visitStatus: "virtual-meeting",
        },
      ],
      $expr: {
        $and: [
          { $gte: ["$visitDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$visitDate", "$validTill"] }, // visitDate <= validTill
        ],
      },
      channelPartner: id,
      validTill: { $gte: new Date() },
    });

    const contacted = await leadModelV2.countDocuments({
      validTill: { $gte: new Date() },
      channelPartner: id,
      callHistory: {
        $exists: true,
        $not: { $size: 0 },
      },
    });
    const received = await leadModelV2.countDocuments({
      validTill: { $gte: new Date() },
      channelPartner: id,
      leadType: { $ne: "walk-in" },
    });
    const interested = await leadModelV2.countDocuments({
      validTill: { $gte: new Date() },
      channelPartner: id,
      clientInterestedStatus: { $eq: "interested" },
    });
    const notInterested = await leadModelV2.countDocuments({
      validTill: { $gte: new Date() },
      channelPartner: id,
      clientInterestedStatus: { $eq: "not-interested" },
    });

    const followup = await leadModelV2.countDocuments({
      validTill: { $gte: new Date() },
      channelPartner: id,
      // callHistory: { $gte: 1 },
      followupStatus: { $eq: "followup" },
    });

    const revisitedCount = await leadModelV2.countDocuments({
      revisitStatus: "revisited",

      $expr: {
        $and: [
          { $gte: ["$revisitDate", "$startDate"] }, // visitDate >= startDate
          { $lte: ["$revisitDate", "$validTill"] }, // visitDate <= validTill
        ],
      },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
      revisitRef: { $ne: null },
      validTill: { $gte: new Date() },
    });

    // const revisitDone = await leadModelV2.countDocuments({
    //   startDate: { $gte: sixMonthsAgo },
    //   channelPartner: id,
    //   // callHistory: { $gte: 1 },
    //   revisitStatus: { $eq: "revisited" },
    // });

    const approvalCount = await leadModelV2.countDocuments({
      $and: [
        { approvalStatus: "approved" },
        { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
        { channelPartner: id },
        { validTill: { $gte: new Date() } },
      ],
    });

    // const approvalCount = await leadModelV2.countDocuments({
    //   startDate: { $gte: sixMonthsAgo },
    //   channelPartner: id,
    //   // callHistory: { $gte: 1 },
    //   approvalStatus: { $eq: "approved" },
    // });

    const rejectedCount = await leadModelV2.countDocuments({
      $and: [
        { approvalStatus: "rejected" },
        { stage: { $ne: "tagging-over" } },
        { leadType: { $ne: "walk-in" } },
        { channelPartner: id },
        { validTill: { $gte: new Date() } },
      ],
    });

    // const rejectedCount = await leadModelV2.countDocuments({
    //   startDate: { $gte: sixMonthsAgo },
    //   channelPartner: id,
    //   // callHistory: { $gte: 1 },
    //   approvalStatus: { $eq: "rejected" },
    // });

    const pendingCount = await leadModelV2.countDocuments({
      // stage: { $ne: "tagging-over" },
      leadType: { $ne: "walk-in" },
      channelPartner: id,
      validTill: { $gte: new Date() },
      $and: [
        { stage: "approval" },
        { approvalStatus: "pending" },
        // { visitStatus: "pending" },
        // { revisitStatus: "pending" },
        // { bookingStatus: { $ne: "booked" } },
      ],
    });

    // const booking=await leadModelV2.findById(_id).populate(leadPopulateOptions);

    // itreseted, not intrested

    return res.send({
      data: {
        bookingDone,
        revisitedCount,
        visitDone,
        contacted,
        received,
        interested,
        notInterested,
        followup,
        approvalCount,
        rejectedCount,
        pendingCount,
        totalItems,
      },
    });
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(error));
  }
};

export const get24hrLeadsNameList = async (req, res, next) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 360);

    // Count the total items matching the filter
    const list = await leadModelV2
      .find({
        leadType: "cp",
        startDate: { $gte: oneDayAgo },
        channelPartner: { $ne: null },
      })
      .select("channelPartner")
      .populate({
        path: "channelPartner",
        select: "firmName",
      });
    // itreseted, not intrested
    const newList = list.map(
      (ele) => `${ele.channelPartner.firmName} just shared a Lead`,
    );
    return res.send(
      successRes(200, "got", {
        data: newList,
      }),
    );
  } catch (error) {
    logger.info(error);
    logger.info(error);
    return res.send(errorRes(error));
  }
};

export const triggerCycleChangeFunction = async () => {
  try {
    const filterDate = new Date("2024-12-10");
    const timeZone = "Asia/Kolkata";

    const endOfYesterday = moment()
      .tz(timeZone)
      .subtract(1, "day")
      .endOf("day")
      .toDate();

    const actualTriggerQuery = {
      startDate: { $gte: filterDate },
      bookingStatus: { $ne: "booked" },
      "cycle.validTill": { $lte: endOfYesterday },
    };
    // logger.info(actualTriggerQuery);

    const allCycleExpiredLeads = await leadModelV2
      .find({
        ...actualTriggerQuery,
      })
      .lean();

    if (allCycleExpiredLeads.length > 0) {
      const teamLeaders = [
        { _id: "ev15-deepak-karki" },
        { _id: "ev69-vicky-mane" },
        { _id: "ev70-jaspreet-arora" },
        { _id: "ev54-ranjna-gupta" },
      ];

      const bulkOperations = [];
      const visitDays = [14, 6, 2, 1];
      const revisitDays = [29, 14, 6, 2];

      allCycleExpiredLeads.forEach((entry) => {
        const lastIndex = teamLeaders.findIndex(
          (ele) => ele?._id.toString() === entry?.cycle?.teamLeader?.toString(),
        );
        const totalTeamLeader = teamLeaders.length;
        const cCycle = { ...entry.cycle };
        const previousCycle = { ...cCycle };
        const firstTeamLeader = entry.cycleHistory[0]?.teamLeader;
        const lastTeamLeaderNext = teamLeaders[0]._id;
        const startDate = new Date(entry.cycle.validTill.addDays(1));
        const validTill = new Date(startDate);

        if (lastIndex !== -1) {
          if (cCycle.stage === "visit") {
            if (cCycle.currentOrder >= totalTeamLeader) {
              if (!cCycle.currentDays) {
                validTill.setDate(validTill.getDate() + visitDays[0]);
                cCycle.currentOrder += 1;
                cCycle.currentDays = visitDays[0];
                cCycle.lastIndex = lastIndex;
                cCycle.teamLeader =
                  teamLeaders[(lastIndex + 1) % teamLeaders.length]._id; // Reset to first TL
              } else {
                cCycle.currentOrder += 1;
                cCycle.lastIndex = lastIndex;
                cCycle.teamLeader =
                  teamLeaders[(lastIndex + 1) % teamLeaders.length]._id; // Reset to first TL
                const foundIndex = visitDays.indexOf(cCycle.currentDays);
                cCycle.currentDays =
                  visitDays[(foundIndex + 1) % visitDays.length]; // Cycle through visitDays infinitely
                validTill.setDate(validTill.getDate() + cCycle.currentDays);
              }

              /*
              validTill.setMonth(validTill.getMonth() + 5);
              cCycle.currentOrder += 1;
              cCycle.teamLeader = firstTeamLeader;
              */
            } else {
              cCycle.currentOrder += 1;

              if (lastIndex + 1 >= 4) {
                cCycle.teamLeader = lastTeamLeaderNext;
              } else {
                cCycle.teamLeader =
                  teamLeaders[lastIndex + 1]?._id || firstTeamLeader;
              }

              switch (cCycle.currentOrder) {
                case 1: {
                  validTill.setDate(validTill.getDate() + 14);
                  cCycle.currentDays = 14;
                  break;
                }
                case 2: {
                  validTill.setDate(validTill.getDate() + 6);
                  cCycle.currentDays = 6;
                  break;
                }
                case 3: {
                  validTill.setDate(validTill.getDate() + 2);
                  cCycle.currentDays = 2;
                  break;
                }
                case 4: {
                  validTill.setDate(validTill.getDate() + 1);
                  cCycle.currentDays = 1;
                  break;
                }
                default: {
                  validTill.setDate(validTill.getDate() + 14);
                  cCycle.currentDays = 14;
                }
              }
            }
          } else if (cCycle.stage === "revisit") {
            if (cCycle.currentOrder >= totalTeamLeader) {
              if (!cCycle.currentDays) {
                validTill.setDate(validTill.getDate() + revisitDays[0]);
                cCycle.currentOrder += 1;
                cCycle.currentDays = revisitDays[0];
                cCycle.lastIndex = lastIndex;
                cCycle.teamLeader =
                  teamLeaders[(lastIndex + 1) % teamLeaders.length]._id; // Reset to first TL
              } else {
                cCycle.currentOrder += 1;
                cCycle.lastIndex = lastIndex;
                cCycle.teamLeader =
                  teamLeaders[(lastIndex + 1) % teamLeaders.length]._id; // Reset to first TL
                const foundIndex = revisitDays.indexOf(cCycle.currentDays);
                cCycle.currentDays =
                  revisitDays[(foundIndex + 1) % revisitDays.length]; // Cycle through visitDays infinitely
                validTill.setDate(validTill.getDate() + cCycle.currentDays);
              }

              // validTill.setMonth(validTill.getMonth() + 5);
              // cCycle.currentOrder += 1;
              // cCycle.teamLeader = firstTeamLeader;
            } else {
              cCycle.currentOrder += 1;
              if (lastIndex + 1 >= 4) {
                cCycle.teamLeader = lastTeamLeaderNext;
              } else {
                cCycle.teamLeader =
                  teamLeaders[lastIndex + 1]?._id || firstTeamLeader;
              }

              switch (cCycle.currentOrder) {
                case 1:
                  validTill.setDate(validTill.getDate() + 30);
                  break;
                case 2:
                  validTill.setDate(validTill.getDate() + 14);
                  break;
                case 3:
                  validTill.setDate(validTill.getDate() + 6);
                  break;
                case 4:
                  validTill.setDate(validTill.getDate() + 2);
                  break;
                default:
                  validTill.setDate(validTill.getDate() + 30);
              }
            }
          }

          // Explicitly handle year rollover
          const adjustedYear = validTill.getFullYear();
          if (adjustedYear > startDate.getFullYear()) {
            // logger.info(
            //   `Year adjusted: ${startDate.getFullYear()} -> ${adjustedYear}`
            // );
            validTill.setFullYear(adjustedYear);
          }

          cCycle.startDate = startDate;
          cCycle.validTill = validTill;

          bulkOperations.push({
            updateOne: {
              filter: { _id: entry._id },
              update: {
                teamLeader: cCycle.teamLeader,
                taskRef: null,
                $set: { cycle: cCycle },
                $push: { cycleHistory: previousCycle },
              },
            },
          });
        }
      });

      if (bulkOperations.length > 0) {
        const bulkResult = await leadModelV2.bulkWrite(bulkOperations);
        const list =
          bulkOperations.map((ele) => ele?.updateOne?.filter?._id) ?? [];

        return {
          matchedCount: bulkResult.matchedCount,
          modifiedCount: bulkResult.modifiedCount,
          total: bulkOperations.length,
          changes: list,
          changesString: JSON.stringify(bulkOperations),
          data: bulkOperations,
          message: "cycle changed successfully",
        };
      }
    }

    return {
      total: 0,
      changes: [],
      changesString: "no cycle changes",
      data: [],
      message: "no cycle changes",
    };
  } catch (error) {
    logger.info("Error updating cycles:", error);
    throw new Error("Internal Server Error");
  }
};

export const triggerCycleChangeFunctionFix = async () => {
  try {
    // const filterDate = new Date("2024-12-10");
    const timeZone = "Asia/Kolkata";

    const endOfYesterday = moment()
      .tz(timeZone)
      // .add(1,'day')
      .subtract(1, "day")
      .endOf("day")
      .toDate();

    const actualTriggerQuery = {
      // _id: "677a4a0a4d75d8d34106abfc",
      // startDate: { $gte: filterDate },
      bookingStatus: { $ne: "booked" },
      bookingRef: null,
      "cycle.validTill": { $lte: endOfYesterday },
      "cycle.teamLeader": { $ne: "ev54-ranjna-gupta" },
    };
    // logger.info(actualTriggerQuery);

    const allCycleExpiredLeads = await leadModelV2
      .find({
        ...actualTriggerQuery,
      })
      .lean();
    const bulkOperations = [];
    const visitDays = [14, 6, 2];
    const revisitDays = [29, 14, 6];
    const teamLeaders = [
      { _id: "ev15-deepak-karki" },
      { _id: "ev69-vicky-mane" },
      { _id: "ev70-jaspreet-arora" },
      // { _id: "ev54-ranjna-gupta" },
    ];

    if (allCycleExpiredLeads.length > 0) {
      allCycleExpiredLeads.forEach((entry) => {
        //get lastIndex
        const lastIndex = teamLeaders.findIndex(
          (ele) => ele?._id.toString() === entry?.cycle?.teamLeader?.toString(),
        );
        const cCycle = { ...entry.cycle };
        const previousCycle = { ...cCycle };

        const startDate = new Date(cCycle.validTill.addDays(1));
        const validTill = new Date(startDate);

        // logger.info(`${i} pass 8`);
        if (lastIndex === -1) {
          return;
        }

        if (cCycle.stage === "visit") {
          cCycle.currentOrder += 1;
          cCycle.lastIndex = lastIndex;
          cCycle.teamLeader =
            teamLeaders[(lastIndex + 1) % teamLeaders.length]?._id;
          const foundIndex = visitDays.indexOf(cCycle.currentDays);
          cCycle.currentDays = visitDays[(foundIndex + 1) % visitDays.length];
          validTill.setDate(validTill.getDate() + cCycle.currentDays);

          // Explicitly handle year rollover
          const adjustedYear = validTill.getFullYear();
          if (adjustedYear > startDate.getFullYear()) {
            validTill.setFullYear(adjustedYear);
          }

          cCycle.startDate = startDate;
          cCycle.validTill = validTill;
        } else if (cCycle.stage === "revisit" || cCycle.stage === "booking") {
          cCycle.currentOrder += 1;
          cCycle.lastIndex = lastIndex;
          cCycle.teamLeader =
            teamLeaders[(lastIndex + 1) % teamLeaders.length]?._id;
          const foundIndex = revisitDays.indexOf(cCycle.currentDays);
          cCycle.currentDays =
            revisitDays[(foundIndex + 1) % revisitDays.length];
          validTill.setDate(validTill.getDate() + cCycle.currentDays);

          // Explicitly handle year rollover
          const adjustedYear = validTill.getFullYear();
          if (adjustedYear > startDate.getFullYear()) {
            validTill.setFullYear(adjustedYear);
          }
          cCycle.startDate = startDate;
          cCycle.validTill = validTill;
        }

        bulkOperations.push({
          updateOne: {
            filter: { _id: entry._id },
            update: {
              teamLeader: cCycle.teamLeader,
              taskRef: null,
              $set: { cycle: cCycle },
              $push: { cycleHistory: previousCycle },
            },
          },
        });
      });
    }
    if (bulkOperations.length > 0) {
      // const filteredRanjna = bulkOperations.filter((ele)=>{});
      const bulkResult = await leadModelV2.bulkWrite(bulkOperations);
      const list =
        bulkOperations.map((ele) => ele?.updateOne?.filter?._id) ?? [];

      return {
        matchedCount: bulkResult.matchedCount,
        modifiedCount: bulkResult.modifiedCount,
        total: bulkOperations.length,
        changes: list,
        changesString: JSON.stringify(bulkOperations),
        data: bulkOperations,
        message: "cycle changed successfully",
      };
    }

    return {
      total: 0,
      changes: [],
      changesString: "no cycle changes",
      data: [],
      message: "no cycle changes",
    };
  } catch (error) {
    logger.info("Error updating cycles:", error);
    throw new Error("Internal Server Error");
  }
};
//backup trigger
// export const triggerCycleChangeFunction = async () => {
//   try {
//     const filterDate = new Date("2024-12-10");
//     const timeZone = "Asia/Kolkata";

//     const endOfYesterday = moment()
//       .tz(timeZone)
//       .subtract(1, "day")
//       .endOf("day")
//       .toDate();

//     const actualTriggerQuery = {
//       startDate: { $gte: filterDate },
//       bookingStatus: { $ne: "booked" },
//       "cycle.validTill": { $lte: endOfYesterday },
//     };
//     logger.info(actualTriggerQuery);

//     const allCycleExpiredLeads = await leadModelV2.find({
//       ...actualTriggerQuery,
//     });

//     if (allCycleExpiredLeads.length > 0) {
//       const teamLeaders = [
//         { _id: "ev15-deepak-karki" },
//         { _id: "ev69-vicky-mane" },
//         { _id: "ev70-jaspreet-arora" },
//         { _id: "ev54-ranjna-gupta" },
//       ];

//       const bulkOperations = [];

//       allCycleExpiredLeads.forEach((entry) => {
//         const lastIndex = teamLeaders.findIndex(
//           (ele) => ele?._id.toString() === entry?.cycle?.teamLeader?.toString()
//         );
//         const totalTeamLeader = teamLeaders.length;
//         const cCycle = { ...entry.cycle };
//         const previousCycle = { ...cCycle };
//         const firstTeamLeader = entry.cycleHistory[0]?.teamLeader;
//         const lastTeamLeaderNext = teamLeaders[0]._id;
//         const startDate = new Date(entry.cycle.validTill.addDays(1));
//         const validTill = new Date(startDate);

//         if (lastIndex !== -1) {
//           if (cCycle.stage === "visit") {
//             if (cCycle.currentOrder >= totalTeamLeader) {
//               validTill.setMonth(validTill.getMonth() + 5);
//               cCycle.currentOrder += 1;
//               cCycle.teamLeader = firstTeamLeader;
//             } else {
//               cCycle.currentOrder += 1;

//               if (lastIndex + 1 >= 4) {
//                 cCycle.teamLeader = lastTeamLeaderNext;
//               } else {
//                 cCycle.teamLeader =
//                   teamLeaders[lastIndex + 1]?._id || firstTeamLeader;
//               }

//               switch (cCycle.currentOrder) {
//                 case 1:
//                   validTill.setDate(validTill.getDate() + 14);
//                   break;
//                 case 2:
//                   validTill.setDate(validTill.getDate() + 6);
//                   break;
//                 case 3:
//                   validTill.setDate(validTill.getDate() + 2);
//                   break;
//                 case 4:
//                   validTill.setDate(validTill.getDate() + 1);
//                   break;
//                 default:
//                   validTill.setDate(validTill.getDate() + 14);
//               }
//             }
//           } else if (cCycle.stage === "revisit") {
//             if (cCycle.currentOrder >= totalTeamLeader) {
//               validTill.setMonth(validTill.getMonth() + 5);
//               cCycle.currentOrder += 1;
//               cCycle.teamLeader = firstTeamLeader;
//             } else {
//               cCycle.currentOrder += 1;
//               if (lastIndex + 1 >= 4) {
//                 cCycle.teamLeader = lastTeamLeaderNext;
//               } else {
//                 cCycle.teamLeader =
//                   teamLeaders[lastIndex + 1]?._id || firstTeamLeader;
//               }

//               switch (cCycle.currentOrder) {
//                 case 1:
//                   validTill.setDate(validTill.getDate() + 30);
//                   break;
//                 case 2:
//                   validTill.setDate(validTill.getDate() + 14);
//                   break;
//                 case 3:
//                   validTill.setDate(validTill.getDate() + 6);
//                   break;
//                 case 4:
//                   validTill.setDate(validTill.getDate() + 2);
//                   break;
//                 default:
//                   validTill.setDate(validTill.getDate() + 30);
//               }
//             }
//           }

//           // Explicitly handle year rollover
//           const adjustedYear = validTill.getFullYear();
//           if (adjustedYear > startDate.getFullYear()) {
//             logger.info(
//               `Year adjusted: ${startDate.getFullYear()} -> ${adjustedYear}`
//             );
//             validTill.setFullYear(adjustedYear);
//           }

//           cCycle.startDate = startDate;
//           cCycle.validTill = validTill;

//           bulkOperations.push({
//             updateOne: {
//               filter: { _id: entry._id },
//               update: {
//                 teamLeader: cCycle.teamLeader,
//                 taskRef: null,
//                 $set: { cycle: cCycle },
//                 $push: { cycleHistory: previousCycle },
//               },
//             },
//           });
//         }
//       });

//       if (bulkOperations.length > 0) {
//         const bulkResult = await leadModelV2.bulkWrite(bulkOperations);
//         const list =
//           bulkOperations.map((ele) => ele?.updateOne?.filter?._id) ?? [];

//         return {
//           matchedCount: bulkResult.matchedCount,
//           modifiedCount: bulkResult.modifiedCount,
//           total: bulkOperations.length,
//           changes: list,
//           changesString: JSON.stringify(bulkOperations),
//           data: bulkOperations,
//           message: "cycle changed successfully",
//         };
//       }
//     }

//     return {
//       total: 0,
//       changes: [],
//       changesString: "no cycle changes",
//       data: [],
//       message: "no cycle changes",
//     };
//   } catch (error) {
// logger.info(error);
//     throw new Error("Internal Server Error");
//   }
// };

export const getlast24HrNotAssignedLeads = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // logger.info(twentyFourHoursAgo);
    const resp = await leadModelV2
      .find({
        leadType: "cp",
        approvalStatus: "approved",
        startDate: { $gte: new Date("2024-12-10T00:00:00.000Z") },
        "cycle.startDate": { $lte: twentyFourHoursAgo },
        // "cycle.currentOrder": 1,
        // "cycle.stage": "visit",
        cycleHistory: [],
        taskRef: { $eq: null },
        $or: [
          { leadAssignedEmailSent: { $exists: false } },
          { leadAssignedEmailSent: false },
        ],
      })
      .populate(leadPopulateOptions);
    // logger.info(resp[0]);
    // logger.info(resp.length);

    //return if empty list
    if (resp.length <= 0) return resp;

    const taskOperations = [];
    await Promise.all(
      resp.map(async (entry) => {
        try {
          let eStatus = "NA";
          if (entry?.stage === "visit") {
            eStatus = `visit ${entry?.visitStatus}`;
          } else if (entry?.stage === "revisit") {
            eStatus = `revisit ${entry?.revisitStatus}`;
          }
          // logger.info(
          //   `${entry?.firstName} ${entry?.lastName}`,
          //   `${entry?.countryCode} ${entry?.phoneNumber}`,
          //   entry.channelPartner?.firmName ?? entry?.leadType ?? "NA",
          //   `${entry?.dataAnalyzer?.firstName} ${entry?.dataAnalyzer?.lastName}`,
          //   moment(entry.cycle?.startDate)
          //     .tz("Asia/Kolkata")
          //     .format("DD-MM-YYYY hh:mm:ss") ?? "NA"
          // );
          await sendMultipleEmail(
            [entry?.teamLeader?.email],
            `Task Assignment is pending for lead which was assigned to ${
              entry?.teamLeader?.firstName
            } ${entry?.teamLeader?.lastName} at ${moment(entry.cycle?.startDate)
              .tz("Asia/Kolkata")
              .format("DD-MM-YYYY hh:mm")}`,
            leadAssignPendingTemplate(
              `${entry?.firstName} ${entry?.lastName}`,
              `${entry?.countryCode} ${entry?.phoneNumber}`,
              entry.channelPartner?.firmName ?? entry?.leadType ?? "NA",
              `${entry?.dataAnalyzer?.firstName} ${entry?.dataAnalyzer?.lastName}`,
              moment(entry.cycle?.startDate)
                .tz("Asia/Kolkata")
                .format("DD-MM-YYYY hh:mm:ss") ?? "NA",
              `${entry?.teamLeader?.firstName} ${entry?.teamLeader?.lastName}`,
            ),
            [],
            [
              entry?.dataAnalyzer?.email,
              "deepak@evgroup.co.in",
              "ricki@evgroup.co.in",
              "pavan@evgroup.co.in",
              "evhomes.operations@evgroup.co.in",
            ],
          );

          taskOperations.push({
            updateOne: {
              filter: { _id: entry._id },
              update: {
                leadAssignedEmailSent: true,
              },
            },
          });
          await leadModelV2.bulkWrite(taskOperations);
        } catch (error) {
          logger.info(error);
          //
          logger.info(error);
        }
      }),
    );
    // logger.info(taskOperations.length);
    // logger.info(resp.length);

    // logger.info(resp);

    return resp;
  } catch (error) {
    logger.info(error);
    return null;
  }
};

export const getlast24HrNotFeedbackLeads = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();
    // logger.info(twentyFourHoursAgo);
    const resp = await taskModel
      .find({
        assignDate: { $lte: twentyFourHoursAgo },
        completed: false,
        deadline: { $lt: now },
        lead: { $ne: null },
        $or: [
          { feedbackPendingEmailSent: { $exists: false } },
          { feedbackPendingEmailSent: false },
        ],
      })
      .sort({ assignDate: -1, _id: 1 })
      .populate(taskPopulateOptions);
    // logger.info(resp.length);

    const filteredTasks = resp.filter(
      (tsk) =>
        tsk.lead?.callHistory?.length <= 0 &&
        tsk.lead?.taskRef?._id?.toString() ===
          tsk._id?.toString() /* && tsk.lead?.cycle?.stage === "visit"*/,
    );
    // logger.info(filteredTasks[0]?.lead);

    const taskOperations = [];
    if (filteredTasks.length <= 0) return filteredTasks;
    // logger.info(
    //   `${filteredTasks[0].lead?.firstName} ${filteredTasks[0].lead?.lastName}`,
    //   `${filteredTasks[0].lead?.countryCode} ${filteredTasks[0].lead?.phoneNumber}`,
    //   `${filteredTasks[0].assignBy?.firstName} ${filteredTasks[0].assignBy?.lastName}`,
    //   `${filteredTasks[0].assignTo?.firstName} ${filteredTasks[0].assignTo?.lastName}`,
    //   moment(filteredTasks[0].assignDate)
    //     .tz("Asia/Kolkata")
    //     .format("DD-MM-YYYY hh:mm:ss") ?? "NA"
    //   // eStatus
    // );
    await Promise.all(
      filteredTasks.map(async (entry) => {
        try {
          let eStatus;
          if (entry.lead?.stage === "visit") {
            eStatus = `visit ${entry.lead?.visitStatus}`;
          } else if (entry.lead?.stage === "revisit") {
            eStatus = `revisit ${entry.lead?.revisitStatus}`;
          }
          await sendMultipleEmail(
            [entry?.assignTo?.email],
            `Feedback is pending for lead which was assigned to ${
              entry.assignTo?.firstName
            } ${entry.assignTo?.lastName} by ${entry.assignBy?.firstName} ${
              entry.assignBy?.lastName
            } at ${moment(entry.assignDate)
              .tz("Asia/Kolkata")
              .format("DD-MM-YYYY hh:mm")}`,
            feedbackPendingTemplate(
              `${entry.lead?.firstName} ${entry.lead?.lastName}`,
              `${entry.lead?.countryCode} ${entry.lead?.phoneNumber}`,
              `${entry.assignBy?.firstName} ${entry.assignBy?.lastName}`,
              `${entry.assignTo?.firstName} ${entry.assignTo?.lastName}`,
              moment(entry.assignDate)
                .tz("Asia/Kolkata")
                .format("DD-MM-YYYY hh:mm:ss") ?? "NA",
              eStatus,
            ),
            [],
            [
              entry?.assignBy?.email,
              "pavan@evgroup.co.in",
              "ricki@evgroup.co.in",
              "evhomes.operations@evgroup.co.in",
            ],
          );

          taskOperations.push({
            updateOne: {
              filter: { _id: entry._id },
              update: {
                feedbackPendingEmailSent: true,
              },
            },
          });
          await taskModel.bulkWrite(taskOperations);
        } catch (error) {
          logger.info(error);
          //
          logger.info(error);
        }
      }),
    );
    // logger.info(filteredTasks.length);
    // logger.info(taskOperations.length);
    // logger.info(filteredTasks[0]);

    return filteredTasks;
  } catch (error) {
    logger.info(error);
    logger.info(error);
    return null;
  }
};
// TODO: Dont use
export const addLeadV2Autmated = async (req, res, next) => {
  const body = req.filteredBody;
  const {
    email,
    firstName,
    lastName,
    phoneNumber,
    altPhoneNumber,
    remark,
    channelPartner, // Channel Partner ID
    leadType,
  } = body;
  const user = req.user;
  // logger.info("p2");

  try {
    if (!body) return res.send(errorRes(403, "Data is required"));
    // logger.info(body);

    const validFields = validateRequiredLeadsFields(body);
    // logger.info("p3");

    if (!validFields.isValid) {
      return res.send(errorRes(400, validFields.message));
    }
    // logger.info("p4");
    const existQuery = { $or: [{ phoneNumber }] };

    if (altPhoneNumber) {
      existQuery.$or.push({ phoneNumber: altPhoneNumber });
      existQuery.$or.push({ altPhoneNumber: phoneNumber });
      existQuery.$or.push({ altPhoneNumber });
    }
    // logger.info(existQuery);

    const existingLead = await leadModelV2.findOne(existQuery);

    if (existingLead) {
      return res.send(
        errorRes(409, `Same lead with already exist with phone number.`),
      );
    }

    const currentDate = new Date();
    const ninetyOneDaysAgo = new Date(currentDate);
    ninetyOneDaysAgo.setDate(currentDate.getDate() - 91);

    const sixtyDaysAgo = new Date(currentDate);
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);

    // logger.info("p5");
    const whichTurn = await TeamLeaderAssignTurn.findOne({});
    // logger.info(whichTurn);

    const teamLeaders = whichTurn.listOfTeamLeaders;
    const teamLeaderId = teamLeaders[whichTurn?.currentOrder];
    // Condition 3: If no existing lead exists, create a new one
    const cycleStartDate = new Date(); // Current date
    const daysToAdd = 29;

    // Properly calculate cycleValidTill
    const cycleValidTill = new Date(cycleStartDate);
    cycleValidTill.setDate(cycleValidTill.getDate() + daysToAdd);
    // get current period - sample or ranking
    const targetDate = new Date();
    let filter = {
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    };

    // normal lead
    let updates = {
      ...body,
      leadType: leadType?.toLowerCase() ?? "cp",
      teamLeader: teamLeaderId,
      dataAnalyzer: user?._id,
      approvalStatus: "approved",
      approvalRemark: remark ?? "approved",
      approvalDate: cycleStartDate,
      stage: "visit",
      clientType: null,
      cycle: {
        nextTeamLeader: null,
        stage: "visit",
        currentOrder: 1,
        currentDays: daysToAdd,
        teamLeader: teamLeaderId,
        startDate: cycleStartDate,
        validTill: cycleValidTill,
      },
      approvalHistory: [
        {
          employee: user?._id,
          approvedAt: cycleStartDate,
          remark: remark ?? "approved",
        },
      ],
      updateHistory: [
        {
          employee: user?._id,
          changes: `Lead Assign to Team Leader ${teamLeaderId}`,
          updatedAt: cycleStartDate,
          remark: remark,
        },
      ],
      channelPartnerHistory: [
        {
          channelPartner: channelPartner,
          status: "approved",
          startDate: cycleStartDate,
          date: cycleStartDate,
          validTill: cycleValidTill,
          approval: {
            employee: user?._id,
            approvedAt: cycleStartDate,
            remark: remark ?? "approved",
          },
        },
      ],
    };

    //internal-lead condition
    if (leadType === "internal-lead") {
      updates = {
        ...body,
        leadType: leadType?.toLowerCase() ?? "cp",
        //teamLeader: teamLeaderId,
        dataAnalyzer: user?._id,
        approvalStatus: "approved",
        approvalRemark: remark ?? "approved",
        approvalDate: cycleStartDate,
        stage: "visit",
        clientType: null,
      };
    }

    const newLead = await leadModelV2.create(updates);

    if (leadType != "internal-lead") {
      let nextOrder = whichTurn?.currentOrder + 1;

      // Reset to 0 if nextOrder exceeds the length of teamLeaders
      if (nextOrder >= teamLeaders.length) {
        nextOrder = 0;
      }
      // Update the currentOrder in the database
      await whichTurn.updateOne({
        lastAssignTeamLeader: teamLeaders[whichTurn?.currentOrder],
        nextAssignTeamLeader: teamLeaders[nextOrder],
        currentOrder: nextOrder,
      });
    }

    // logger.info("p9");

    const dataAnalyser = await employeeModel
      .find({
        designation: "desg-data-analyzer",
        status: "active",
      })
      .sort({ createdAt: 1, _id: 1 });
    // logger.info("p10");
    const myTeamNotify = await employeeModel
      .find({
        permissions: "lead_assign_notify",
        reportingTo: teamLeaderId,
        status: "active",
      })
      .sort({ createdAt: 1, _id: 1 });

    const getIds = dataAnalyser.map((dt) => dt._id.toString());
    const getIds2 = myTeamNotify.map((dt) => dt._id.toString());

    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [...getIds, ...getIds2, teamLeaderId] },
      // role: "employee",
    });
    // logger.info("p11");

    if (foundTLPlayerId.length > 0) {
      // logger.info(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);
      const filteredIds = getPlayerIds.filter((ele) => ele != "");
      // logger.info(filteredIds);

      try {
        await sendNotificationWithImage({
          playerIds: filteredIds,
          title: "You've Got a New Lead!",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",

          message: `A new lead is now available for you. Please check the details and take the required steps.`,
          android_channel_id: "leads_assign",

          data: {},
        });
      } catch (error) {
        logger.info(error);
        logger.info(error);
      }
    }
    try {
      //
      const getPlayerIds = foundTLPlayerId.find(
        (dt) => dt.docId === teamLeaderId,
      );
      const allIt2 = [...getIds2, getPlayerIds];
      const allIt = allIt2.filter((ele) => ele != "");

      const intervalMinutes = 4; // every 4 minutes
      const totalReminders = 4; // how many times

      for (let i = 1; i <= totalReminders; i++) {
        const delay = i * intervalMinutes * 60_000; // convert minutes → ms

        await notificationQueue.add(
          "sendLeadAssignNotification",
          {
            playerId: getPlayerIds.playerId,
            phoneNumber,
            title: `Reminder ${i}: Lead Still Waiting!`,
            message: `Please act on the new lead assigned to you.`,
          },
          { delay },
        );

        try {
          await notificationQueue.add(
            "sendLeadAssignNotificationTeam",
            {
              playerIds: allIt,
              phoneNumber,
              title: `Reminder ${i}: Lead Still Waiting!`,
              message: `Please act on the new lead assigned to you.`,
            },
            { delay },
          );
        } catch (error) {
          logger.info(error);
          //
        }
      }

      // // schedule job after 1 min
      // await notificationQueue.add(
      //   "sendLeadAssignNotification",
      //   {
      //     playerId: getPlayerIds.playerId,
      //     phoneNumber:phoneNumber,
      //     title: "Reminder 2: Lead Still Waiting!",
      //     message: `Please act on the new lead assigned to you.`,
      //   },
      //   { delay: 60_000 } // 1 min
      // );

      // // schedule job after 3 min
      // await notificationQueue.add(
      //   "sendLeadAssignNotification",
      //   {
      //     playerId: getPlayerIds.playerId,
      //     phoneNumber:phoneNumber,
      //     title: "Reminder 3: Lead Still Waiting!",
      //     message: `Please act on the new lead assigned to you.`,
      //   },
      //   { delay: 180_000 } // 3 min
      // );
    } catch (error) {
      logger.info(error);
      //
      logger.info(error);
    }

    const updatedLead = await leadModelV2
      .findById(newLead._id)
      .populate(leadPopulateOptions);

    return res.send(
      successRes(200, `Lead added successfully: ${firstName} ${lastName}`, {
        data: updatedLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    logger.info(error);

    return next(error);
  }
};

export const addLeadV2AutmatedWithPeriod = async (req, res, next) => {
  const body = req.filteredBody;
  const {
    email,
    firstName,
    lastName,
    phoneNumber,
    altPhoneNumber,
    remark,
    channelPartner, // Channel Partner ID
    leadType,
    propertyType,
  } = body;
  const user = req.user;
  // logger.info("p2");

  try {
    if (!body) return errorRes2(res, 403, "Data is required");
    // logger.info(body);

    const validFields = validateRequiredLeadsFields(body);
    // logger.info("p3");

    if (!validFields.isValid) {
      return errorRes2(res, 400, validFields.message);
    }
    // logger.info("p4");
    const existQuery = { $or: [{ phoneNumber }] };

    if (altPhoneNumber) {
      existQuery.$or.push({ phoneNumber: altPhoneNumber });
      existQuery.$or.push({ altPhoneNumber: phoneNumber });
      existQuery.$or.push({ altPhoneNumber });
    }
    // logger.info(existQuery);

    const existingLead = await leadModelV2.findOne(existQuery);

    if (existingLead) {
      return errorRes2(
        res,
        409,
        `Same lead with already exist with phone number.`,
      );
    }

    const currentDate = new Date();
    const ninetyOneDaysAgo = new Date(currentDate);
    ninetyOneDaysAgo.setDate(currentDate.getDate() - 91);

    const sixtyDaysAgo = new Date(currentDate);
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);
    let teamLeaderId, updates;
    const cycleStartDate = new Date(); // Current date
    const daysToAdd = 29;
    // Properly calculate cycleValidTill
    const cycleValidTill = new Date(cycleStartDate);
    cycleValidTill.setDate(cycleValidTill.getDate() + daysToAdd);

    const targetDate = new Date();
    let filter = {
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    };

    // get current period - sample or ranking
    const foundPeriod = await periodModel.findOne(filter);
    if (!foundPeriod) {
      return errorRes2(
        res,
        404,
        `No Active Period Found Please Refresh the Period`,
      );
    }
    let currentRTurn;
    let currentTurnIndex = 0;
    let whichTurn;
    // code for ranking period
    if (foundPeriod.period === "ranking-period") {
      // logger.info("its ranking period");
      // update ranking if any
      await getCurrentRanks();
      // refresh ranking
      currentRTurn = await rankingTurnModel.findOne(filter);

      // get teamleader from that turn
      currentTurnIndex = currentRTurn.ranking.findIndex(
        (ele) => ele.isMyTurn === true,
      );
      // if fails
      if (currentTurnIndex === -1) {
        return errorRes2(res, 404, `No TeamLeader found with active Turn`);
      }
      // find whoseTurn is now
      const currentTurn = currentRTurn.ranking[currentTurnIndex];
      teamLeaderId = currentTurn.user;
      // logger.info("ranking period tl " + teamLeaderId);
    }
    // for sample period
    else {
      // logger.info("its sample period");

      // logger.info("p5");
      whichTurn = await TeamLeaderAssignTurn.findOne({});
      // logger.info(whichTurn);

      const teamLeaders = whichTurn.listOfTeamLeaders;
      teamLeaderId = teamLeaders[whichTurn?.currentOrder];
      // logger.info("sample period tl " + teamLeaderId);
    }

    let curDate = moment().tz("Asia/Kolkata");
    let endOfDay = moment().tz("Asia/Kolkata").endOf("day");
    let curAfter = moment({ hour: 21, minute: 1 }).tz("Asia/Kolkata");
    let nextDay = moment({ hour: 11, minute: 59 })
      .add(1, "days")
      .tz("Asia/Kolkata");

    if (curDate.isBefore(endOfDay) && curDate.isAfter(curAfter)) {
      // curAfter
      curDate = nextDay;
    }

    // normal lead
    updates = {
      ...body,
      leadType: leadType?.toLowerCase() ?? "cp",
      teamLeader: teamLeaderId,
      dataAnalyzer: user?._id,
      approvalStatus: "approved",
      approvalRemark: remark ?? "approved",
      approvalDate: cycleStartDate,
      stage: "visit",
      clientType: null,
      propertyType: propertyType,
      feedbackGraceTime: curDate.toDate(),
      cycle: {
        nextTeamLeader: null,
        stage: "visit",
        currentOrder: 1,
        currentDays: daysToAdd,
        teamLeader: teamLeaderId,
        startDate: cycleStartDate,
        validTill: cycleValidTill,
      },
      approvalHistory: [
        {
          employee: user?._id,
          approvedAt: cycleStartDate,
          remark: remark ?? "approved",
        },
      ],
      updateHistory: [
        {
          employee: user?._id,
          changes: `Lead Assign to Team Leader ${teamLeaderId}`,
          updatedAt: cycleStartDate,
          remark: remark,
        },
      ],
      channelPartnerHistory: [
        {
          channelPartner: channelPartner,
          status: "approved",
          startDate: cycleStartDate,
          date: cycleStartDate,
          validTill: cycleValidTill,
          approval: {
            employee: user?._id,
            approvedAt: cycleStartDate,
            remark: remark ?? "approved",
          },
        },
      ],
    };

    //internal-lead condition
    if (leadType === "internal-lead") {
      updates = {
        ...body,
        leadType: leadType?.toLowerCase() ?? "cp",
        //teamLeader: teamLeaderId,
        dataAnalyzer: user?._id,
        approvalStatus: "approved",
        approvalRemark: remark ?? "approved",
        approvalDate: cycleStartDate,
        stage: "visit",
        clientType: null,
      };
    }

    const newLead = await leadModelV2.create(updates);
    // updates on ranking model
    if (foundPeriod.period === "ranking-period") {
      try {
        //
        // logger.info("ranking period update 1");
        const currentTurn = currentRTurn.ranking[currentTurnIndex];

        // push lead id to turn.leads
        currentRTurn.ranking[currentTurnIndex].leads.push(newLead._id);
        // logger.info("ranking period leads pushed");

        // append leads given count
        if (currentTurn.leadsGiven + 1 >= currentTurn.leadsShouldRecieve) {
          // logger.info("ranking period is last lead given");
          //
          // check if leads should be leads-given is eq to should-be-given;
          currentRTurn.ranking[currentTurnIndex].isMyTurn = false;
          // then change isMyTurn to next also make sure if its last index goto first again.
          const nextIndex =
            (currentTurnIndex + 1) % currentRTurn.ranking.length;
          currentRTurn.ranking[nextIndex].isMyTurn = true;
          currentRTurn.ranking[nextIndex].leadsGiven = 0;
          // logger.info("ranking period isMyturn Changes to - ", nextIndex);
        }
        currentRTurn.ranking[currentTurnIndex].leadsGiven =
          currentTurn.leadsGiven + 1;

        await currentRTurn.save();
      } catch (error) {
        //
        logger.info(error);
      }
    }
    // update on sample period tl -sequence
    if (leadType != "internal-lead" && foundPeriod.period != "ranking-period") {
      // logger.info("sample period updates 1");

      let nextOrder = whichTurn?.currentOrder + 1;
      const teamLeaders = whichTurn.listOfTeamLeaders;

      // Reset to 0 if nextOrder exceeds the length of teamLeaders
      if (nextOrder >= teamLeaders.length) {
        nextOrder = 0;
        // logger.info("sample period last TL - changing now");
      }
      // Update the currentOrder in the database
      await whichTurn.updateOne({
        lastAssignTeamLeader: teamLeaders[whichTurn?.currentOrder],
        nextAssignTeamLeader: teamLeaders[nextOrder],
        currentOrder: nextOrder,
      });
      // logger.info("sample period last TL - sequence updated");
    }

    // logger.info("p9");

    const dataAnalyser = await employeeModel
      .find({
        designation: "desg-data-analyzer",
        status: "active",
      })
      .sort({ createdAt: 1, _id: 1 });
    // logger.info("p10");
    const myTeamNotify = await employeeModel
      .find({
        permissions: "lead_assign_notify",
        reportingTo: teamLeaderId,
        status: "active",
      })
      .sort({ createdAt: 1, _id: 1 });

    const getIds = dataAnalyser.map((dt) => dt._id.toString());
    const getIds2 = myTeamNotify.map((dt) => dt._id.toString());

    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [...getIds, ...getIds2, teamLeaderId] },
      // role: "employee",
    });
    // logger.info("p11");

    if (foundTLPlayerId.length > 0) {
      // logger.info(foundTLPlayerId);

      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);
      const filteredIds = getPlayerIds.filter((ele) => ele != "");
      // logger.info(filteredIds);

      try {
        await sendNotificationWithImage({
          playerIds: filteredIds,
          title: "You've Got a New Lead!",
          imageUrl: "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",
          android_channel_id: "leads_assign",

          message: `A new lead is now available for you. Please check the details and take the required steps.`,
          data: {},
        });
      } catch (error) {
        logger.info(error);
      }
    }
    try {
      //
      const getPlayerIds = foundTLPlayerId.find(
        (dt) => dt.docId === teamLeaderId,
      );
      const allIt2 = [...getIds2, getPlayerIds];
      const allIt = allIt2.filter((ele) => ele != "");

      let totalReminders = 4;
      let intervalMinutes = 4;

      // schedule job after 1 min
      for (let i = 1; i <= totalReminders; i++) {
        const delay = i * intervalMinutes * 60_000; // convert minutes → ms

        await notificationQueue.add(
          "sendLeadAssignNotification",
          {
            playerId: getPlayerIds.playerId,
            phoneNumber,
            title: `Reminder ${i}: Lead Still Waiting!`,
            message: `Please act on the new lead assigned to you.`,
          },
          { delay },
        );
        try {
          await notificationQueue.add(
            "sendLeadAssignNotificationTeam",
            {
              playerIds: allIt,
              phoneNumber,
              title: `Reminder ${i}: Lead Still Waiting!`,
              message: `Please act on the new lead assigned to you.`,
            },
            { delay },
          );
        } catch (error) {
          logger.info(error);
          //
        }
      }
    } catch (error) {
      logger.info(error);
      //
    }

    const updatedLead = await leadModelV2
      .findById(newLead._id)
      .populate(leadPopulateOptions);

    return successRes2(
      res,
      200,
      `Lead added successfully: ${firstName} ${lastName}`,
      {
        data: updatedLead,
      },
    );
  } catch (error) {
    logger.info(error);

    return errorRes2(res, 404, `${error?.message ?? error}`);
  }
};

export const getInformedCpLeads = async (req, res, next) => {
  try {
    const { status, channelPartner } = req.query;
    logger.info(req.query);
    let filter = {
      bookingStatus: "booked",
      leadType: "cp",
      channelPartner: { $ne: null },
    };

    if (channelPartner) {
      filter.channelPartner = channelPartner;
    }

    if (status === "yes") {
      filter.informedStatus = true;
    } else if (status === "no") {
      filter.informedStatus = false;
    }
    const respLead = await leadModelV2
      .find(filter, {
        phoneNumber: 1,
        firstName: 1,
        lastName: 1,
        channelPartner: 1,
        bookingRef: 1,
        informedStatus: 1,
      })
      .populate(leadPopulateOptionsv3);

    // console.log(respLead.length);

    if (!respLead.length) return errorRes(404, "No lead found");

    return res.send(
      successRes(200, "informed status leads", {
        data: respLead,
      }),
    );
  } catch (error) {
    logger.info(error);
    next(error);
  }
};
