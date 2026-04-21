import { Router } from "express";
import {
  addLead,
  assignLeadToPreSaleExecutive,
  checkLeadsExists,
  deleteLead,
  getAllLeads,
  getLeadById,
  getLeadsTeamLeader,
  getSimilarLeadsById,
  searchLeads,
  updateLead,
  getLeadsPreSalesExecutive,
  updateCallHistoryPreSales,
  getLeadCounts,
  getLeadCountsByTeamLeaders,
  getAllLeadCountsFunnel,
  getLeadCountsByChannelPartner,
  getLeadCountsByTeamLeader,
  getLeadCountsByPreSaleExecutve,
  getAllLeadCountsFunnelForPreSaleTL,
  rejectLeadById,
  leadAssignToTeamLeader,
  getLeadTeamLeaderGraph,
  getLeadsTeamLeaderReportingTo,
  leadUpdateStatus,
  getLeadByStartEndDate,
  generateInternalLeadPdf,
  generateChannelPartnerLeadPdf,
  triggerCycleChange,
  searchLeadsChannelPartner,
  getLeadCountsByChannelPartnerById,
  getCpSalesFunnel,
  get24hrLeadsNameList,
  getSiteVisitLeadByPhoneNumber,
  getLeadTeamLeaderReportingToGraph,
  triggerCycleChangeFunction,
  getAssignedToSalesManger,
  getAllData,
  getAllGraph,
  getLeadsAssignFeedback,
  getLeadByBookingId,
  getLeadsAssignFeedbackByTl,
  getLeadsAssignFeedbackByTlCounts,
  triggerCycleChangeFunctionFix,
  hideLead,
  updateDetailsLead,
  getLeadsByTarget,
  addLeadV2Autmated,
  addLeadV2AutmatedWithPeriod,
  getInformedCpLeads,
} from "../../controller/lead.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { validateLeadsFields } from "../../middleware/lead.middleware.js";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import employeeModel from "../../model/employee.model.js";
import cpModel from "../../model/channelPartner.model.js";
import ourProjectModel from "../../model/ourProjects.model.js";
import leadModel from "../../model/lead/lead.model.js";
import moment from "moment-timezone";
import PDFDocument from "pdfkit";
import siteVisitModel from "../../model/siteVisit.model.js";
import {
  employeePopulateOptions,
  leadPopulateOptions,
  leadPopulateOptions2,
} from "../../utils/constant.js";
import { addSiteVisitsManual } from "../../controller/siteVisit.controller.js";
import triggerHistoryModel from "../../model/triggerLog.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import shiftModel from "../../model/attendance/shift/shift.model.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import postSaleLeadModel from "../../model/postSaleLead.model.js";
import taskModel from "../../model/task.model.js";
import { notificationQueue } from "../../app/workers/notificationWorker.js";
import logger from "../../utils/logger.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leadRouter = Router();

leadRouter.get("/leads", authenticateToken, getAllLeads);
leadRouter.get("/leads-data", authenticateToken, getAllData);
leadRouter.get("/leads-graph", authenticateToken, getAllGraph);
leadRouter.get(
  "/leads-team-leader/:id",

  authenticateToken,

  getLeadsTeamLeader,
);

leadRouter.get(
  "/leads-team-leader-target/:id",

  authenticateToken,

  getLeadsByTarget,
);
leadRouter.get(
  "/leads-assign-feedback",
  authenticateToken,
  getLeadsAssignFeedback,
);

leadRouter.post(
  "/lead-update-details/:id",
  authenticateToken,
  updateDetailsLead,
);
leadRouter.post("/leads-hide/:id", authenticateToken, hideLead);
leadRouter.get(
  "/leads-assign-count",
  authenticateToken,
  getLeadsAssignFeedbackByTlCounts,
);

leadRouter.get(
  "/lead-assign-feedback/:id",
  authenticateToken,
  getLeadsAssignFeedbackByTl,
);

leadRouter.get(
  "/lead-cycle-timeline2/:id",
  authenticateToken,
  async (req, res) => {
    let timeline = [];
    const id = req.params.id;

    let newTimeLine2 = [];
    try {
      if (!id) return res.send(errorRes(401, "id required"));

      const leadResp = await leadModelV2
        .findById(id)
        .populate(leadPopulateOptions)
        .lean();

      const teamLeaders = [
        { _id: "ev15-deepak-karki" },
        { _id: "ev69-vicky-mane" },
        { _id: "ev70-jaspreet-arora" },
        { _id: "ev54-ranjna-gupta" },
      ];
      const teamLeadersIds = [
        "ev15-deepak-karki",
        "ev69-vicky-mane",
        "ev70-jaspreet-arora",
        "ev54-ranjna-gupta",
      ];

      const teamLeadersResp = await employeeModel
        .find({ _id: { $in: teamLeadersIds } })
        .select("firstName lastName")
        .populate([
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ]);

      const sortedTeamLeaders = teamLeadersIds.map((id) =>
        teamLeadersResp.find((leader) => leader._id.toString() === id),
      );

      timeline.push(...leadResp.cycleHistory, leadResp.cycle);
      let curreCycle = leadResp.cycle;

      for (let i = 0; i < 5; i++) {
        // logger.info(`${i} ok`);
        var currTimeline = timeline[i];
        // logger.info(`${typeof currTimeline}`);
        if (!currTimeline) {
          // logger.info(`${i} pass 1`);
          const lastIndex = teamLeaders.findIndex(
            (ele) =>
              ele?._id.toString() === curreCycle?.teamLeader?._id?.toString() ||
              ele?._id.toString() === curreCycle?.teamLeader?.toString(),
          );
          // logger.info(`${i} pass 2- ${lastIndex}`);

          const totalTeamLeader = teamLeaders.length;
          let cCycle = { ...curreCycle };
          // if (i > 1) {
          // logger.info(newTimeLine2[i]);
          //   cCycle = newTimeLine2[i];
          // }

          // logger.info(`${i} pass 3`);

          const previousCycle = { ...cCycle };
          // logger.info(`${i} pass 4`);

          const firstTeamLeader =
            leadResp.currentOrder <= 1
              ? leadResp.cycle.teamLeader
              : timeline[0]?.teamLeader;
          // logger.info(`${i} pass 5`);

          const lastTeamLeaderNext = sortedTeamLeaders[0];
          // logger.info(`${i} pass 6`);

          const startDate = new Date(curreCycle.validTill.addDays(1));
          const startDate2 = new Date(curreCycle.validTill);
          // logger.info(`${i} pass 7`);

          const validTill = new Date(startDate);
          // logger.info(`${i} pass 8`);

          if (lastIndex !== -1) {
            // logger.info(`${i} pass 9 lastIndex not null`);

            //TOFO:visit
            if (cCycle?.stage === "visit") {
              if (cCycle.currentOrder >= totalTeamLeader) {
                validTill.setMonth(validTill.getMonth() + 5);
                cCycle.currentOrder += 1;
                cCycle.teamLeader = firstTeamLeader;
              } else {
                cCycle.currentOrder += 1;

                if (lastIndex + 1 >= 4) {
                  cCycle.teamLeader = lastTeamLeaderNext;
                } else {
                  cCycle.teamLeader =
                    sortedTeamLeaders[lastIndex + 1] || firstTeamLeader;
                }

                switch (cCycle.currentOrder) {
                  case 1:
                    validTill.setDate(validTill.getDate() + 14);
                    break;
                  case 2:
                    validTill.setDate(validTill.getDate() + 6);
                    break;
                  case 3:
                    validTill.setDate(validTill.getDate() + 2);
                    break;
                  case 4:
                    validTill.setDate(validTill.getDate() + 1);
                    break;
                  default:
                    validTill.setDate(validTill.getDate() + 14);
                }
              }
            } else if (cCycle.stage === "revisit") {
              if (cCycle.currentOrder >= totalTeamLeader) {
                validTill.setMonth(validTill.getMonth() + 5);
                cCycle.currentOrder += 1;
                cCycle.teamLeader = firstTeamLeader;
              } else {
                cCycle.currentOrder += 1;
                cCycle.teamLeader =
                  teamLeaders[lastIndex + 1]?._id || firstTeamLeader;

                switch (cCycle.currentOrder) {
                  case 1:
                    validTill.setDate(validTill.getDate() + 29);
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
                    validTill.setDate(validTill.getDate() + 29);
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
            // logger.info(`${i} - done`);
            // logger.info(cCycle);

            newTimeLine2.push(cCycle);
            curreCycle = cCycle;
          }
        } else {
          newTimeLine2.push(currTimeline);
        }
      }
      let newTimeLine = timeline.map((ele) => {
        // logger.info(ele.validTill);
        ele.validTillFormated = moment(ele.validTill)
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY HH:mm");
        ele.startDateFormated = moment(ele.startDate)
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY HH:mm");

        return ele;
      });

      return res.send(
        successRes(200, "get 2", {
          total: newTimeLine2.length,
          data: newTimeLine2,
        }),
      );
    } catch (error) {
      logger.info(error);
      // logger.info(error);
      return res.send(errorRes(500, "Internal Server Error"));
    }
  },
);

leadRouter.get("/local-time-from-iso", async (req, res) => {
  const date = req.query.date;
  if (!date) return res.send(errorRes(401, "date required"));
  const resp = moment(date).tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm");

  return res.send(
    successRes(200, "local time", {
      data: resp,
    }),
  );
});

leadRouter.get(
  "/leads-sales-manager/:id",
  authenticateToken,
  getAssignedToSalesManger,
);

leadRouter.get(
  "/leads-team-leader-reporting/:id",
  authenticateToken,
  getLeadsTeamLeaderReportingTo,
);

leadRouter.get(
  "/leads-team-leader-graph/:id",
  authenticateToken,
  getLeadTeamLeaderGraph,
);
leadRouter.get(
  "/leads-team-leader-reporting-graph/:id",
  authenticateToken,
  getLeadTeamLeaderReportingToGraph,
);

leadRouter.get(
  "/leads-pre-sales-executive/:id",
  authenticateToken,
  getLeadsPreSalesExecutive,
);

leadRouter.post(
  "/lead-update-caller/:id",
  authenticateToken,
  updateCallHistoryPreSales,
);

leadRouter.get(
  "/search-lead",
  // authenticateToken,
  searchLeads,
);

leadRouter.get(
  "/search-lead-channel-partner/:id",
  authenticateToken,
  searchLeadsChannelPartner,
);

leadRouter.post("/lead-update-status/:id", authenticateToken, leadUpdateStatus);

leadRouter.get("/lead/:id", authenticateToken, getLeadById);
leadRouter.get("/lead-by-booking/:id", authenticateToken, getLeadByBookingId);

leadRouter.get("/similar-leads/:id", authenticateToken, getSimilarLeadsById);

leadRouter.post(
  "/lead-assign-tl/:id",
  authenticateToken,
  leadAssignToTeamLeader,
);
leadRouter.post("/lead-reject/:id", authenticateToken, rejectLeadById);

leadRouter.post(
  "/lead-assign-pre-sale-executive/:id",
  authenticateToken,
  assignLeadToPreSaleExecutive,
);
// on use
leadRouter.post(
  "/leads-add",
  authenticateToken,
  validateLeadsFields,
  addLeadV2AutmatedWithPeriod,
  // addLeadV2Autmated
);

leadRouter.post(
  "/leads-add-v2",
  authenticateToken,
  validateLeadsFields,
  addLeadV2Autmated,
);
leadRouter.post(
  "/leads-add-v3",
  authenticateToken,
  validateLeadsFields,
  addLeadV2AutmatedWithPeriod,
);

leadRouter.post("/lead-update/:id", authenticateToken, updateLead);
leadRouter.delete("/lead/:id", authenticateToken, deleteLead);
leadRouter.get(
  "/leads-exists/:phoneNumber",
  authenticateToken,
  checkLeadsExists,
);

//for data analyser
leadRouter.get(
  "/lead-count",

  authenticateToken,

  getLeadCounts,
);
leadRouter.get(
  "/lead-cp-sales-funnel/:id",
  authenticateToken,
  getCpSalesFunnel,
);
leadRouter.get(
  "/lead-24-hr-leads-list",
  authenticateToken,
  get24hrLeadsNameList,
);

leadRouter.get(
  "/lead-count-pre-sale-team-leader-for-data-analyser",
  authenticateToken,
  getLeadCountsByTeamLeaders,
);
leadRouter.get(
  "/lead-count-channel-partners",
  authenticateToken,
  getLeadCountsByChannelPartner,
);
leadRouter.get(
  "/lead-count-channel-partners-id/:id",
  // authenticateToken,
  getLeadCountsByChannelPartnerById,
);

leadRouter.get("/lead-count-funnel", authenticateToken, getAllLeadCountsFunnel);

//pre sales team leader
leadRouter.get(
  "/lead-count-pre-sale-team-leader/:id",
  authenticateToken,
  getLeadCountsByTeamLeader,
);

leadRouter.get(
  "/lead-count-pre-sale-executive-for-pre-sale-tl",
  authenticateToken,
  getLeadCountsByPreSaleExecutve,
);
leadRouter.get(
  "/lead-count-funnel-pre-sales-tl",
  authenticateToken,
  getAllLeadCountsFunnelForPreSaleTL,
);

leadRouter.post(
  "/lead-by-start-end-date",
  authenticateToken,
  getLeadByStartEndDate,
);

leadRouter.get("/infomed-cp-leads", authenticateToken, getInformedCpLeads);

leadRouter.get("/similar-leads2", authenticateToken, checkLeadsExists);
const parseDate = (dateString, timeString = "12:00:00") => {
  // Split the date string into day, month, year
  const [day, month, year] = dateString.split("-").map(Number);

  // Split the time string into hours, minutes, seconds
  const [hours, minutes, seconds] = timeString.split(":").map(Number);

  // Create a new Date object with the specified date and time in UTC
  const date = new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds),
  );

  // Adjust to IST by adding 5 hours and 30 minutes
  date.setUTCHours(date.getUTCHours() + 5);
  date.setUTCMinutes(date.getUTCMinutes() + 30);

  return date;
};

leadRouter.get(
  "/sitevisitLead-phoneNumber/:id",
  authenticateToken,
  getSiteVisitLeadByPhoneNumber,
);

leadRouter.get("/lead-pdf-self", authenticateToken, generateInternalLeadPdf);
leadRouter.get(
  "/lead-pdf-cp",
  authenticateToken,
  generateChannelPartnerLeadPdf,
);
leadRouter.get(
  "/lead-trigger-cycle-change",
  authenticateToken,
  triggerCycleChange,
);
leadRouter.get("/lead-trigger-cycle--test", async (req, res) => {
  try {
    const resp = await triggerCycleChangeFunctionFix();
    // const resp = await triggerCycleChangeFunction();

    await triggerHistoryModel.create({
      date: new Date(),
      changes: resp?.changes ?? [],
      changesString: resp?.changesString ?? "",
      totalTrigger: resp?.total ?? 0,
      message: "manual-trigger", //resp?.message ?? "",
    });

    return res.send(resp);
  } catch (error) {
    logger.info(error);
    return res.send(error);
  }
});
const calculateDaysDifference2 = (startDate, endDate) => {
  // logger.info(startDate, endDate);
  const start = moment(startDate).tz("UTC"); // Convert to UTC or your timezone
  const end = moment(endDate).tz("UTC");

  return end.diff(start, "days"); // Get difference in days
};
const isDateExpired2 = (givenDate) => {
  return moment().isAfter(moment(givenDate), "day"); // Compare only date (ignores time)
};
leadRouter.get("/lead-current-days-fix", async (req, res) => {
  const lastCycleResp = await leadModelV2
    .find({
      // "cycle.currentDays": { $exists: false },
      // startDate: { $gte: new Date("2024-12-10T00:00:57.938+00:00") },
      // approvalStatus: "approved",
      // leadType: "cp",
      visitStatus: "pending",
      "cycle.currentDays": 29,
      stage: "visit",
      // bookingStatus: { $ne: "booked" },
      bookingRef: null,
      // cycleHistory: [],
      // $expr: {
      //   $gt: [{ $size: { $ifNull: ["$cycleHistory", []] } }, 0],
      // },
    })
    .lean();

  const updated = await Promise.all(
    lastCycleResp.map(async (ele) => {
      const startDate = ele.cycle?.startDate;
      const endDate = ele.cycle?.validTill;
      // logger.info(startDate, endDate);

      const diff =
        startDate && endDate
          ? calculateDaysDifference2(startDate, endDate)
          : null;
      const shouldBe = diff == 29 ? 29 : diff;

      // if(diff ===29){
      //   await leadModel.findByIdAndUpdate(ele._id, {
      //     $set: {
      //       "cycle.currentOrder": cycleLength,
      //       "cycle.validTill": moment(endDate).subtract(diff, 'days'),
      //     },
      //   });

      // }
      const cycleLength = (ele.cycleHistory?.length ?? 0) + 1;
      const isSameOrder = cycleLength == ele?.cycle?.currentOrder;
      const isSameDiff = shouldBe == ele?.cycle?.currentDays;
      const taggingOver = isDateExpired2(ele.validTill);
      const isSameTagging =
        taggingOver === true && ele.stage === "tagging-over";
      const newValidTill = moment(endDate).subtract(diff, "days").toDate();
      if (isSameOrder === false) {
        // await leadModel.findByIdAndUpdate(ele._id, {
        //   $set: {
        //     "cycle.currentOrder": cycleLength,
        //   },
        // });
      }
      if (isSameDiff === false) {
        // await leadModel.findByIdAndUpdate(ele._id, {
        //   $set: {
        //     "cycle.currentDays": shouldBe,
        //   },
        // });
      }
      if (isSameTagging === false) {
        // await leadModel.findByIdAndUpdate(ele._id, {
        //   $set: {
        //     stage: "tagging-over",
        //     "cycle.stage": "tagging-over",
        //   },
        // });
      }

      return {
        diff: diff,
        taggingOver,
        isSameTagging,
        stage: ele.stage,
        cp: ele.channelPartner,
        shouldBe: shouldBe,
        isSameDiff: isSameDiff,
        isSameOrder: isSameOrder,
        cycleLength,
        cycle: ele?.cycle,
        id: ele?._id,
        phone: ele?.phoneNumber,
        newValidTill,
      };
    }),
  );

  res.json({
    total: updated.length,
    data: updated,
  });
});

leadRouter.get("/lead-trigger-cycle-5-fix", async (req, res) => {
  try {
    const lastCycleResp = await leadModelV2.find({
      // approvalStatus: { $ne: null },
      // "cycle.currentOrder": { $eq: 2 },
      "cycle.currentOrder": { $gt: 0, $lt: 3 },
      "cycle.stage": "visit",
      visitStatus: "pending",
      startDate: {
        $gte: "2024-12-16T00:00:00Z",
        $lt: "2025-01-02T23:59:00Z",
      },

      // $expr: {
      //   $eq: [{ $size: { $ifNull: ["$callHistory", []] } }, 0],
      // },

      // "cycle.teamLeader": "ev15-deepak-karki",
    });
    const test = await Promise.all(
      lastCycleResp.map(async (ele) => {
        let dateOld = new Date(ele.cycle.validTill);
        dateOld.setDate(dateOld.getDate() - 1); // Use getDate() instead of getDay() to subtract 1 day
        // await leadModel.findByIdAndUpdate(ele._id, {
        //   "cycle.validTill": dateOld,
        // });

        return {
          phone: ele.phoneNumber,
          stage: ele.cycle.stage,
          currentOrder: ele.cycle.currentOrder,
          teamLeader: ele.cycle.teamLeader,
          startDate: ele.cycle.startDate,
          validTill: ele.cycle.validTill,
          validTill2: dateOld,
        };
      }),
    );
    // const lastCycleResp = await leadModel.find({
    // approvalStatus: { $ne: null },
    //   startDate: {
    //     $eq: "2025-01-04T11:30:00.000+00:00",
    //   },
    // "cycle.teamLeader": "ev15-deepak-karki",
    // });

    //2025-01-04T11:30:00.000+00:00
    // const fixedLeads = await Promise.all(
    //   lastCycleResp.map(async (ele) => {
    //     ele.cycle.teamLeader = ele.cycleHistory[0].teamLeader;
    // await leadModel.findByIdAndUpdate(ele._id, {
    //   "cycle.teamLeader": ele.cycleHistory[0].teamLeader,
    //   teamLeader: ele.cycleHistory[0].teamLeader,
    // });
    //     return ele;
    //   })
    // );
    return res.send(successRes(200, "", { total: test.length, data: test }));
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(200, error));
  }
});
leadRouter.get("/lead-tagging-over-check", async (req, res) => {
  const date1 = new Date();
  try {
    // const tagginOverLeads = await leadModel.find({
    //   stage: "approval",
    //   validTill: { $lt: date1 },
    //   leadType: { $ne: "walk-in" },
    //   visitStatus: "pending",
    // });
    const tagginOverLeads = await leadModelV2.find({
      stage: "approval",
      // approvalStatus: { $ne: null },
      approvalStatus: { $eq: "approved" },

      validTill: { $gte: date1 },
    });

    // await Promise.all(
    //   tagginOverLeads.map(async (ele) => {
    //     await leadModel.findOneAndUpdate(
    //       { _id: ele._id },
    //       {
    //         stage: "tagging-over",
    //         status: "tagging-over",
    //       }
    //     );
    //   })
    // );

    res.send({ data: tagginOverLeads });
  } catch (error) {
    logger.info(error);
    res.send(data);
  }
});
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
leadRouter.get("/fix-pending-lead", async (req, res) => {
  try {
    const today = new Date();
    const oldLeads = await leadModelV2.find({
      stage: { $ne: "tagging-over" },
      approvalStatus: { $ne: "approved" },
      startDate: {
        $gte: new Date("2024-09-25T00:00:00.000Z"), // Filter for December leads
      },
      validTill: {
        $lt: new Date("2025-01-01T00:00:00.000Z"),
      },
    });

    // Separate expired and valid leads
    const validLeads = [];
    const expiredLeads = [];

    oldLeads.forEach((ele) => {
      if (ele.validTill < today) {
        expiredLeads.push(ele._id);
      } else {
        validLeads.push({ id: ele._id, phoneNumber: ele.phoneNumber });
      }
    });

    // Update only valid leads
    if (expiredLeads.length > 0) {
      // await leadModel.updateMany(
      //   { _id: { $in: expiredLeads } },
      //   { $set: { stage: "tagging-over" } }
      // );
    }

    return res.send({
      total: oldLeads.length,
      updated: validLeads.length,
      expired: expiredLeads.length,
      data: { validLeads, expiredLeads },
    });
  } catch (error) {
    logger.info("Error updating leads:", error);
    return res.status(500).send({
      message: "An error occurred while processing leads",
      error: error.message,
    });
  }
});

leadRouter.get("/ok", (req, res) => {
  // Online Javascript Editor for free
  // Write, Edit and Run your Javascript code using JS Online Compiler

  function parseUnitNumber(unit) {
    // Split the unit string into floor and number based on the length of the unit
    const floor = Math.floor(unit / 100); // Extract floor by dividing by 100
    const number = unit % 100; // Extract unit number by taking the remainder
    return { floor, number };
  }
  const ok = list.map((ele) => {
    const parsed = parseUnitNumber(parseInt(ele.flatNo));
    ele.floor = parsed.floor;
    ele.number = parsed.number;
    if (ele.number === 2 || ele.number === 9) {
      ele.configuration = "2BHK";
    } else {
      ele.configuration = "3BHK";
    }
    ele.allInclusiveValue = 0;
    ele.sellableCarpetArea = Math.ceil(ele.sellableCarpetArea);
    ele.type = "";
    return ele;
  });
  res.send(ok);
});

leadRouter.get("/lead-cycleHistory", async (req, res) => {
  try {
    const filterDate = new Date("2024-12-28");
    const filterDatelat = new Date("2024-12-30");
    const timeZone = "Asia/Kolkata";

    // Fetch leads with the filtering criteria
    const resp = await leadModelV2.find({
      "cycle.startDate": { $gte: filterDate, $lt: filterDatelat },
      leadType: { $ne: "walk-in" },
    });

    const cycleChanges = resp.filter((ele) => ele.cycleHistory.length > 0);

    // Define the fields for CSV
    const fields = [
      "id",
      "firstName",
      "lastName",
      "phoneNumber",
      "channelPartner",
      "currentCycleTeamLeader",
      "currentCycleOrder",
      "currentCycleStage",
      "currentCycleAssignDate",
      "currentCycleDeadline",
      "cycleHistory[0].order",
      "cycleHistory[0].teamLeader",
      "cycleHistory[0].stage",
      "cycleHistory[0].AssignDate",
      "cycleHistory[0].Deadline",
    ];

    // Prepare CSV header
    const header = fields.join(",") + "\n";

    // Prepare CSV rows
    const csvRows = cycleChanges.map((lead) => {
      return fields
        .map((field) => {
          switch (field) {
            case "id":
              return `"${lead._id || ""}"`;

            case "firstName":
              return `"${lead.firstName || ""}"`;
            case "lastName":
              return `"${lead.lastName || ""}"`;
            case "phoneNumber":
              return `"${lead.phoneNumber || ""}"`;
            case "channelPartner":
              return `"${lead.channelPartner || "NA"}"`;

            case "currentCycleTeamLeader":
              return lead.cycle?.teamLeader
                ? `"${lead.cycle.teamLeader}"`
                : '""';
            case "currentCycleStage":
              return lead.cycle?.stage ? `"${getStatus1(lead)}"` : '""';
            case "currentCycleOrder":
              return lead.cycle?.currentOrder
                ? `"${lead.cycle.currentOrder}"`
                : '""';
            case "currentCycleAssignDate":
              return lead.cycle?.startDate
                ? `"${moment(lead.cycle.startDate)
                    .tz(timeZone)
                    .format("DD-MM-YYYY HH:mm")}"`
                : '""';
            case "currentCycleDeadline":
              return lead.cycle?.validTill
                ? `"${moment(lead.cycle.validTill)
                    .tz(timeZone)
                    .format("DD-MM-YYYY HH:mm")}"`
                : '""';

            case "cycleHistory[0].order":
              return lead.cycleHistory[0]?.currentOrder
                ? `"${lead.cycleHistory[0].currentOrder}"`
                : '""';
            case "cycleHistory[0].teamLeader":
              return lead.cycleHistory[0]?.teamLeader
                ? `"${lead.cycleHistory[0].teamLeader}"`
                : '""';
            case "cycleHistory[0].stage":
              return lead.cycleHistory[0]?.stage
                ? `"${lead.cycleHistory[0].stage}"`
                : '""';
            case "cycleHistory[0].AssignDate":
              return lead.cycleHistory[0]?.startDate
                ? `"${moment(lead.cycleHistory[0].startDate)
                    .tz(timeZone)
                    .format("DD-MM-YYYY HH:mm")}"`
                : '""';
            case "cycleHistory[0].Deadline":
              return lead.cycleHistory[0]?.validTill
                ? `"${moment(lead.cycleHistory[0].validTill)
                    .tz(timeZone)
                    .format("DD-MM-YYYY HH:mm")}"`
                : '""';

            default:
              return '""'; // Default empty string for any undefined fields
          }
        })
        .join(",");
    });

    // Combine header and rows
    const csvContent = header + csvRows.join("\n");

    // Write CSV to a file
    const filePath = "./cycleHistory.csv";
    fs.writeFileSync(filePath, csvContent);

    // Send the file for download
    return res.download(filePath, "cycleHistory.csv", (err) => {
      if (err) {
        return res.status(500).send({ error: "Error downloading file" });
      }
      // Clean up the file after download
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    logger.info(error);
    return res.status(500).send({ error: error.message });
  }
});

leadRouter.get("/all-leads", async (req, res) => {
  try {
    const filterDate = new Date("2024-12-10");
    // logger.info(filterDate);
    const allLeads = await leadModelV2.find({
      startDate: { $gte: filterDate },
      bookingStatus: { $ne: "booked" },
    });

    const cycleHistoryNotEmpty = allLeads.filter(
      (el) => el.cycleHistory.length >= 3,
    );

    const onlyWalkin = cycleHistoryNotEmpty.filter(
      (el) => el.leadType === "walk-in",
    );
    res.send({
      total: allLeads.length,
      cycleHLength: cycleHistoryNotEmpty.length,
      onlyWalkinLength: onlyWalkin.length,
      // onlyWalkin,
      // data: allLeads,
      cycleHistoryNotEmpty,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

leadRouter.get("/removed-assigned", async (req, res) => {
  try {
    const filterDate = new Date("2024-12-10");
    // logger.info(filterDate);
    const allLeads = await leadModelV2
      .find({
        startDate: { $gte: filterDate },
        "cycle.currentOrder": { $gt: 1 },
        bookingStatus: { $ne: "booked" },
      })
      .populate(leadPopulateOptions);

    const onlyWalkin = allLeads.filter(
      (el) =>
        el.taskRef?.assignTo?.reportingTo?._id != el.cycle.teamLeader?._id,
    );
    // await Promise.all(
    //   allLeads.map(async (el) => {
    //     if (
    //       el.taskRef?.assignTo?.reportingTo?._id != el.cycle.teamLeader?._id
    //     ) {
    //       await leadModel.findByIdAndUpdate(el._id, {taskRef: null})
    //     }
    //   })
    // );

    res.send({
      total: allLeads.length,
      onlyWalkinLength: onlyWalkin.length,
      onlyWalkin,
      // data: allLeads,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

leadRouter.post("/lead-updates", async (req, res) => {
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(__dirname, "year_issue_11.csv");

  const cpResp = await cpModel.find();
  const teamLeaders = await employeeModel.find({
    $or: [
      { designation: "desg-senior-closing-manager" },
      { designation: "desg-site-head" },
      { designation: "desg-post-sales-head" },
    ],
  });
  const dataAnalyzers = await employeeModel.find({
    designation: "desg-data-analyzer",
  });

  const projectsResp = await ourProjectModel.find({});

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  let i = 0;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      for (const row of results) {
        const {
          Leadreceivedon,
          Name: firstName,
          Surname: lastName,
          Number: phoneNumber,
          Cp,
          TeamLeaderDate: leadAssignDate,
          Teamleader,
          Project,
          Requirement,
          taggingstatus,
          "Data Analyer": anayl,
        } = row;
        let startDate = parseDate(Leadreceivedon, "6:00:00");
        let cycleStartDate = parseDate(leadAssignDate, "6:00:00");
        let requirement = Requirement.replace(/\s+/g, "")
          .toUpperCase()
          ?.split(",");
        let projs = [];
        Project.split(",").map((ojk) => {
          // logger.info(ojk);

          let projects = projectsResp.find((proj) => {
            if (proj.name.toLowerCase().includes(ojk.split(" ")[0])) {
              projs.push(proj?._id);
            }
          });
        });

        let newTeamleader =
          teamLeaders.find((tl) =>
            tl.firstName
              .toLowerCase()
              .includes(Teamleader.split(" ")[0].toLowerCase()),
          )?._id ?? null;

        let channelPartner =
          cpResp.find((cp) =>
            cp.firmName.toLowerCase().includes(Cp.toLowerCase()),
          )?._id ?? null;

        // if (Cp != "") {
        //   const newCpId = Cp?.replace(/\s+/g, "-").toLowerCase();
        //   try {
        //     const newCp = await cpModel.create({
        //       _id: newCpId,
        //       email: Cp?.replace(/\s+/g, "").toLowerCase() + "@gmail.com",
        //       firmName: Cp.toLowerCase(),
        //       password: "Evhomecp",
        //     });
        //     channelPartner = newCp._id;
        //   } catch (error) {
        // logger.info(error);}
        // }

        let dataAnalyzer = dataAnalyzers.find((dt) =>
          dt.firstName
            ?.toLowerCase()
            ?.includes(anayl?.split(" ")[0]?.toLowerCase()),
        )?._id;

        i = i >= 1 ? 0 : 1;
        const validTill = new Date(cycleStartDate);
        validTill.setDate(validTill.getDate() + 14);
        const taggingValidTill = new Date(startDate);
        taggingValidTill.setDate(taggingValidTill.getDate() + 59);

        // i++;
        dataTuPush.push({
          firstName,
          leadType: "cp",
          lastName,
          phoneNumber: parseInt(phoneNumber.replace(/\s+/g, "").toLowerCase()),
          teamLeader: newTeamleader,
          channelPartner,
          dataAnalyzer,
          requirement,
          approvalStatus: taggingstatus?.toLowerCase(),
          approvalDate: cycleStartDate,
          approvalRemark: "approved",
          startDate,
          validTill: taggingValidTill,
          cycleStartDate,
          stage: "visit",
          project: projs,
          cycle: {
            nextTeamLeader: null,
            stage: "visit",
            currentOrder: 1,
            teamLeader: newTeamleader,
            startDate: cycleStartDate,
            validTill: validTill,
          },
          approvalHistory: [
            {
              employee: dataAnalyzer,
              approvedAt: cycleStartDate,
              remark: "approved",
            },
          ],
        });
      }
      // await leadModel.insertMany(dataTuPush);
      // Send the results only after processing is done
      return res.send(dataTuPush);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

leadRouter.post("/lead-check-exist", async (req, res) => {
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(__dirname, "issue_leads_2025_.csv");

  const cpResp = await cpModel.find();
  const teamLeaders = await employeeModel.find({
    $or: [
      { designation: "desg-senior-closing-manager" },
      { designation: "desg-site-head" },
      { designation: "desg-post-sales-head" },
    ],
  });
  const dataAnalyzers = await employeeModel.find({
    designation: "desg-data-analyzer",
  });

  const projectsResp = await ourProjectModel.find({});

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  let i = 0;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      for (const row of results) {
        const {
          Leadreceivedon,
          Name: firstName,
          Surname: lastName,
          Number: phoneNumber,
          Cp,
          TeamLeaderDate: leadAssignDate,
          Teamleader,
          Project,
          Requirement,
          taggingstatus,
          "Data Analyer": anayl,
        } = row;
        let startDate = parseDate(Leadreceivedon, "6:00:00");
        let cycleStartDate = parseDate(leadAssignDate, "6:00:00");
        let requirement = Requirement.replace(/\s+/g, "")
          .toUpperCase()
          ?.split(",");
        let projs = [];
        Project.split(",").map((ojk) => {
          // logger.info(ojk);

          let projects = projectsResp.find((proj) => {
            if (proj.name.toLowerCase().includes(ojk.split(" ")[0])) {
              projs.push(proj?._id);
            }
          });
        });

        let newTeamleader =
          teamLeaders.find((tl) =>
            tl.firstName
              .toLowerCase()
              .includes(Teamleader.split(" ")[0].toLowerCase()),
          )?._id ?? null;

        let channelPartner =
          cpResp.find((cp) =>
            cp.firmName.toLowerCase().includes(Cp.toLowerCase()),
          )?._id ?? null;

        // if (Cp != "") {
        //   const newCpId = Cp?.replace(/\s+/g, "-").toLowerCase();
        //   try {
        //     const newCp = await cpModel.create({
        //       _id: newCpId,
        //       email: Cp?.replace(/\s+/g, "").toLowerCase() + "@gmail.com",
        //       firmName: Cp.toLowerCase(),
        //       password: "Evhomecp",
        //     });
        //     channelPartner = newCp._id;
        //   } catch (error) {
        // logger.info(error);}
        // }

        let dataAnalyzer = dataAnalyzers.find((dt) =>
          dt.firstName
            ?.toLowerCase()
            ?.includes(anayl?.split(" ")[0]?.toLowerCase()),
        )?._id;

        i = i >= 1 ? 0 : 1;
        const validTill = new Date(cycleStartDate);
        validTill.setDate(validTill.getDate() + 14);
        const taggingValidTill = new Date(startDate);
        taggingValidTill.setDate(taggingValidTill.getDate() + 59);

        // i++;
        dataTuPush.push({
          firstName,
          leadType: "cp",
          lastName,
          phoneNumber: parseInt(phoneNumber.replace(/\s+/g, "").toLowerCase()),
          teamLeader: newTeamleader,
          channelPartner,
          dataAnalyzer,
          requirement,
          approvalStatus: taggingstatus?.toLowerCase(),
          approvalDate: cycleStartDate,
          approvalRemark: "approved",
          startDate,
          validTill: taggingValidTill,
          cycleStartDate,
          stage: "visit",
          project: projs,
          cycle: {
            nextTeamLeader: null,
            stage: "visit",
            currentOrder: 1,
            teamLeader: newTeamleader,
            startDate: cycleStartDate,
            validTill: validTill,
          },
          approvalHistory: [
            {
              employee: dataAnalyzer,
              approvedAt: cycleStartDate,
              remark: "approved",
            },
          ],
        });
      }
      const phones = dataTuPush.map((ele) => ele.phoneNumber).filter(Boolean);
      const leads = await leadModelV2.find({
        phoneNumber: { $in: phones },
        startDate: { $gt: new Date("2024-12-18T08:00:53.557Z") },
        dataAnalyzer: { $ne: null },
        stage: "approval",
        approvalStatus: "approved",
        visitStatus: "pending",
      });
      // await Promise.all(
      //   leads.map(async (el) => {
      //     await leadModel.findByIdAndUpdate(el._id, { stage: "visit" });
      //   })
      // );

      // await leadModel.insertMany(dataTuPush);
      // Send the results only after processing is done
      return res.send(leads);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

leadRouter.get("/lead-trigger-h-1", async (req, res) => {
  try {
    const resp2 = await triggerHistoryModel
      .findById("677f42b90a6cd2546178a434")
      .populate("changes");
    const filteredLeads = resp2.changes.filter(
      (ele) =>
        ele.cycle.teamLeader === "ev54-ranjna-gupta" &&
        ele.cycle.currentOrder === 3,
    );
    return res.send({
      data: filteredLeads,
    });
  } catch (error) {
    logger.info(error);
  }
});

leadRouter.get("/lead-fix-date-22", async (req, res) => {
  // try {
  //   const resp = await leadModel.find({
  //     cycleHistory: { $exists: true },
  //     $expr: {
  //       $gte: [{ $size: "$cycleHistory" }, 5],
  //     },
  //     "cycle.currentOrder": 6,
  //     "cycle.currentDays": 14,
  //   });
  //   Promise.all(
  //     resp.map(async (ele) => {
  //       try {
  //         // const validDate= new Date(ele.cycle.validTill);
  //         const timeZone = "Asia/Kolkata";
  //         const yesterdayDate = moment(ele.cycle.validTill)
  //           .tz(timeZone)
  //           .subtract(8, "day")
  //           .toDate();
  //         // logger.info(`${ele.cycle.validTill} - ${yesterdayDate}`);
  //         await leadModel.findByIdAndUpdate(ele._id, {
  //           "cycle.validTill": yesterdayDate,
  //         });
  //       } catch (error) {
  // logger.info(error);
  //         print(e);
  //       }
  //     })
  //   );
  //   return successRes2(res, 200, "ok", {
  //     data: resp,
  //   });
  // } catch (error) {
  // logger.info(error);
  //   return res.send(successRes(500, error));
  // }
});

leadRouter.get(
  "/lead-cycle-timeline/:id",
  authenticateToken,
  async (req, res) => {
    let timeline = [];
    const id = req.params.id;

    let newTimeLine2 = [];
    try {
      if (!id) return res.send(errorRes(401, "id required"));

      const leadResp = await leadModelV2
        .findById(id)
        .populate(leadPopulateOptions)
        .lean();

      // const teamLeaders = [
      //   { _id: "ev15-deepak-karki" },
      //   { _id: "ev69-vicky-mane" },
      //   { _id: "ev70-jaspreet-arora" },
      //   { _id: "ev54-ranjna-gupta" },
      // ];
      const teamLeadersIds = [
        "ev15-deepak-karki",
        "ev69-vicky-mane",
        "ev70-jaspreet-arora",
        // "ev54-ranjna-gupta",
      ];

      const visitDays = [14, 6, 2];
      // const visitDays = [14, 6, 2, 1];
      const revisitDays = [29, 14, 6];

      const teamLeadersResp = await employeeModel
        .find({ _id: { $in: teamLeadersIds } })
        .select("firstName lastName")
        .populate([
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ]);

      const sortedTeamLeaders = teamLeadersIds.map((id) =>
        teamLeadersResp.find((leader) => leader._id.toString() === id),
      );

      timeline.push(...leadResp.cycleHistory, leadResp.cycle);
      let curreCycle = leadResp.cycle;
      // logger.info(timeline);

      for (let i = 0; i < 6; i++) {
        // logger.info(`${i} ok`);
        var currTimeline = timeline[i];
        // logger.info(`${typeof currTimeline}`);
        if (!currTimeline) {
          // logger.info(`${i} pass 1`);
          const lastIndex = sortedTeamLeaders.findIndex(
            (ele) =>
              ele?._id.toString() === curreCycle?.teamLeader?._id?.toString() ||
              ele?._id.toString() === curreCycle?.teamLeader?.toString(),
          );
          // logger.info(`${i} pass 2- ${lastIndex}`);

          let cCycle = { ...curreCycle };

          const startDate = new Date(curreCycle.validTill.addDays(1));
          const validTill = new Date(startDate);
          // logger.info(`${i} pass 8`);

          if (lastIndex === -1) {
            timeline.push(currTimeline);
            // newTimeLine2.push(currTimeline);
            return res.send(errorRes(404, "Team Leader not found"));
          }
          if (leadResp.stage === "visit") {
            // logger.info(`${i} pass 9 lastIndex not null`);
            cCycle.currentOrder += 1;
            cCycle.lastIndex = lastIndex;
            cCycle.teamLeader =
              sortedTeamLeaders[(lastIndex + 1) % sortedTeamLeaders.length];
            const foundIndex = visitDays.indexOf(cCycle.currentDays);
            cCycle.currentDays = visitDays[(foundIndex + 1) % visitDays.length];
            validTill.setDate(validTill.getDate() + cCycle.currentDays);

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
            // logger.info(`${i} - done`);
            // logger.info(cCycle);

            timeline.push(cCycle);
            // newTimeLine2.push(cCycle);
            curreCycle = cCycle;
          } else if (leadResp.stage === "revisit") {
            // logger.info(`${i} pass 9 lastIndex not null`);
            cCycle.currentOrder += 1;
            cCycle.lastIndex = lastIndex;
            cCycle.teamLeader =
              sortedTeamLeaders[(lastIndex + 1) % sortedTeamLeaders.length];
            const foundIndex = revisitDays.indexOf(cCycle.currentDays);
            cCycle.currentDays =
              revisitDays[(foundIndex + 1) % revisitDays.length];
            validTill.setDate(validTill.getDate() + cCycle.currentDays);

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
            // logger.info(`${i} - done`);
            // logger.info(cCycle);

            timeline.push(cCycle);
            // newTimeLine2.push(cCycle);
            curreCycle = cCycle;
          }
        }
      }
      let newTimeLine = timeline.map((ele) => {
        // logger.info(ele.validTill);
        ele.validTillFormated = moment(ele.validTill)
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY HH:mm");
        ele.startDateFormated = moment(ele.startDate)
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY HH:mm");

        return ele;
      });

      return res.send(
        successRes(200, "get 2", {
          total: timeline.length,
          data: timeline,
        }),
      );
    } catch (error) {
      logger.info(error);
      // logger.info(error);
      return res.send(errorRes(500, "Internal Server Error"));
    }
  },
);

leadRouter.post("/employe-info-csv", async (req, res) => {
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(__dirname, "Employee_List_id_1.csv");

  const teamLeaders = await employeeModel.find().lean();

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  let i = 0;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      for (const row of results) {
        const {
          "Employee ID": empId,
          "Birth Date": dob,
          "Blood Group": bloodGroup,
          "Joining Date": doj,
        } = row;
        let dateOfJoing = parseDate(doj, "6:00:00");

        // i++;
        dataTuPush.push({
          dateOfJoing,
          empId,
          bloodGroup,
          dob,
        });
      }
      const filterdList = [];

      const empsList = await Promise.all(
        teamLeaders.map(async (ele) => {
          const eid = ele.employeeId.toLowerCase().includes("ev")
            ? ele.employeeId.toLowerCase().replace("ev", "")
            : ele.employeeId;
          const fdJod = dataTuPush.find((el2) => el2?.empId === eid);
          ele.joiningDate = fdJod?.dateOfJoing;
          if (fdJod?.dob != null) {
            try {
              await employeeModel.findByIdAndUpdate(ele._id, {
                dateOfBirth: new Date(fdJod?.dob),
              });
            } catch (error) {
              logger.info(error);
            }
          }

          // if (fdJod?.dateOfJoing != null) {
          //   try {
          //     await employeeModel.findByIdAndUpdate(ele._id, {
          //       joiningDate: new Date(fdJod.dateOfJoing),
          //     });
          //   } catch (error) {
          // logger.info(error);}
          // }
          filterdList.push({
            ...ele,
            joinDate: fdJod?.dateOfJoing,
          });
          return ele;
        }),
      );
      // await leadModel.insertMany(dataTuPush);
      // Send the results only after processing is done
      return res.send(filterdList);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

leadRouter.post("/employe-caller-update", async (req, res) => {
  try {
    // const result = await leadModel.updateMany(
    //   { "callHistory.caller": "ev116-kishor-rajput" },
    //   {
    //     $set: {
    //       "callHistory.$[elem].caller": "ev204-kishor-rajput",
    //     },
    //   },
    //   {
    //     arrayFilters: [{ "elem.caller": "ev116-kishor-rajput" }],
    //   }
    // );
    // const result = await siteVisitModel.updateMany(
    //   { closingTeam: "ev116-kishor-rajput" },
    //   {
    //     $set: {
    //       "closingTeam.$": "ev204-kishor-rajput",
    //     },
    //   },
    //   {
    //     arrayFilters: [{ closingTeam: "ev116-kishor-rajput" }],
    //   }
    // );

    const result = await shiftModel.updateMany(
      { employees: "ev116-kishor-rajput" },
      {
        $set: {
          "employees.$": "ev204-kishor-rajput",
        },
      },
      {
        arrayFilters: [{ employees: "ev116-kishor-rajput" }],
      },
    );

    res.send("OK" + result.length);
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

leadRouter.post("/lead-fix-14-day-first-time", async (req, res) => {
  try {
    const resp = await leadModelV2
      .find({
        leadType: "cp",
        approvalStatus: "approved",
        "cycleHistory.0.stage": "visit",
        "cycleHistory.0.currentDays": 29,
        "cycle.stage": "visit",
        "cycle.currentOrder": 2,
      })
      .lean();
    const filted = [];
    const transfper = await Promise.all(
      resp.map(async (ele) => {
        let startD = moment(ele.cycle.startDate)
          .tz("Asia/Kolkata")
          .add(6, "days")
          .toDate();

        await leadModelV2.findByIdAndUpdate(ele._id, {
          "cycle.currentDays": 6,
          "cycle.validTill": startD,
        });

        filted.push({
          ...ele,
          validTill2: startD,
        });
      }),
    );
    res.send({
      total: resp.length,
      data: filted,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

leadRouter.post("/lead-ranjna-transfer-2", async (req, res) => {
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(
    __dirname,
    "leads_ranjna_mam_29_days_22_04_25.csv",
  );

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  let i = 0;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      for (const row of results) {
        const {
          id: id,
          "cycle.teamLeader": teamLeader,
          transferTo: transferTo,
        } = row;
        const startDate = moment().tz("Asia/Kolkata").toDate();
        const endDate = moment().tz("Asia/Kolkata").add(6, "days").toDate();
        dataTuPush.push({
          id,
          teamLeader,
          transferTo,
          startDate,
          endDate,
        });
      }
      // await leadModel.insertMany(dataTuPush);
      // Send the results only after processing is done
      // await Promise.all(
      //   dataTuPush.map(async (ele) => {
      //     try {
      //       await leadModel.findByIdAndUpdate(ele.id, {
      //         $set: {
      //           teamLeader: ele.transferTo,
      //           "cycle.teamLeader": ele.transferTo,
      //           "cycle.startDate": ele.startDate,
      //           "cycle.validTill": ele.endDate,
      //           taskRef: null,
      //           "cycle.currentDays": 6,
      //         },
      //       });
      //     } catch (error) {
      // logger.info(error);
      //       logger.info(error);
      //     }
      //   })
      // );
      return res.send(dataTuPush);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

leadRouter.post("/lead-ranjna-change-teamleader", async (req, res) => {
  try {
    const resp = await leadModelV2.find({
      "cycle.nextTeamLeader": { $ne: null },
    });
    await Promise.all(
      resp.map(async (ele) => {
        await leadModelV2.findByIdAndUpdate(ele._id, {
          teamLeader: ele.cycle.nextTeamLeader,
          "cycle.teamLeader": ele.cycle.nextTeamLeader,
        });
      }),
    );
    return res.send({
      total: resp.length,
      data: resp,
    });
  } catch (error) {
    logger.info(error);
    return res.send(error);
  }
});

leadRouter.get("/lead-teamleader-not-same", async (req, res) => {
  try {
    const resp = await leadModelV2.find({
      startDate: { $gte: new Date("2024-12-10T00:00:00.000Z") },
      "cycle.teamLeader": { $ne: null },
    });
    const filters = resp.filter(
      (ele) => ele.teamLeader != ele.cycle.teamLeader,
    );

    return res.send({
      total: filters.length,
      data: filters,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

leadRouter.post("/add-note-to-feedback/:id", async (req, res) => {
  const { id } = req.params;
  const { feedbackId, note, channelPartner, date = new Date() } = req.body;
  // logger.info(id);
  // logger.info(req.body);
  try {
    const resp = await leadModelV2
      .findOneAndUpdate(
        { _id: id, "callHistory._id": feedbackId },
        {
          cpNoteResolved: false,
          $push: {
            "callHistory.$.notes": {
              note: note,
              channelPartner: channelPartner,
              date: date,
            },
          },
        },
        { new: true },
      )
      .populate(leadPopulateOptions);

    return successRes2(res, 200, "ok", {
      data: resp,
    });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, error);
    // res.send(error);
  }
});
function extractPhoneNumber(raw) {
  if (!raw || typeof raw !== "string") return null;

  // Step 1: Remove non-digit characters
  let digits = raw.replace(/\D/g, "");

  // Step 2: Remove leading '91' if number is longer than 10 digits
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Step 3: Ensure it's exactly 10 digits
  // if (digits.length === 10) {
  //   return digits;
  // }

  return digits; // Invalid phone number
}
function parseCustomDateTime(raw) {
  if (!raw || typeof raw !== "string") return null;

  try {
    const cleaned = raw.replace(".", ":").trim();
    const [datePart, timePart] = cleaned.split(" ");

    if (!datePart || !timePart) return null;

    const [day, month, year] = datePart.split("-");
    if (!day || !month || !year) return null;

    const isoString = `${year}-${month}-${day}T${timePart}`;
    const dateObj = new Date(isoString);

    // Check if invalid date
    if (isNaN(dateObj.getTime())) return null;

    return dateObj;
  } catch (e) {
    return null;
  }
}

function extractUnits(raw) {
  if (!raw || typeof raw !== "string") return [];

  // Clean: remove special chars except spaces, normalize multiple spaces
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ");

  const result = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const next = words[i + 1] || "";

    // Combine "2" + "BHK" => "2BHK"
    if (/^\d$/.test(current) && next === "BHK") {
      result.push(`${current}BHK`);
      i++; // skip next word
    }
    // Match full forms like "2BHK", "4BHK"
    else if (/^\dBHK$/.test(current)) {
      result.push(current);
    }
    // Handle special case "JODI"
    else if (current === "JODI") {
      result.push("Jodi");
    }
  }

  return result;
}

leadRouter.post("/old-bulk-visited-leads", async (req, res) => {
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(__dirname, "heart_city_leads-55.csv");

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  let i = 0;
  const teamLeadersIds = [
    "ev15-deepak-karki",
    "ev69-vicky-mane",
    "ev70-jaspreet-arora",
    // "ev54-ranjna-gupta",
  ];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      let i = 0;
      for (const row of results) {
        const {
          Name,
          Email,
          Phone,
          "Customer Feedback": feedback,
          "Added Time": addedTime,
          "Choice of Apartment": req,
          Residence: address,
          Source: source,
          TEAM,
          name,
          phoneNumber,
        } = row;
        // const startDate = moment().tz("Asia/Kolkata").toDate();
        // const endDate = moment().tz("Asia/Kolkata").add(6, "days").toDate();
        // const newNumber = extractPhoneNumber(Phone);
        // const newDate = parseCustomDateTime(addedTime);
        const newDate = new Date();
        // const newRequ = extractUnits(req);
        // const teamLeader = TEAM;
        const teamLeader = teamLeadersIds[i % teamLeadersIds.length];
        // const callHis =
        //   feedback != ""
        //     ? [
        //         {
        //           feedback: feedback,
        //         },
        //       ]
        //     : [];
        dataTuPush.push({
          ...row,
          // firstName: name,
          // phoneNumber,
          // isBulkLead: false,
          // clientType: null,
          // // firstName: Name,
          // // phoneNumber: newNumber,
          // startDate: newDate,
          // // email: Email,
          // address: ".",
          // teamLeader: teamLeader,
          // // source: "internal-lead",
          // leadType: "internal-lead",
          // stage: "visit",
          // approvalRemark: "heart city leads",
          // project: ["project-ev-heart-city-mosare-2025"],
          // cycle: {
          //   currentOrder: 1,
          //   currentDays: 29,
          //   stage: "visit",
          //   teamLeader: teamLeader,
          //   startDate: new Date("2025-07-16T07:47:08.850+00:00"),
          //   validTill: new Date("2025-08-14T07:47:08.850+00:00"),
          // },
          // callHistory: callHis,
          // requirement: newRequ,
        });
        i++;
      }
      // try {
      //   await leadModelV2.insertMany(dataTuPush, { ordered: false });
      // } catch (error) {
      // logger.info(error);
      //   if (error.name === "MongoBulkWriteError") {
      //     console.warn("Duplicate entries skipped.");
      //   } else {
      //     console.error("Insert failed:", error);
      //   }
      // }
      return res.send(dataTuPush);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

leadRouter.post("/fix-old-bulk-call-date", async (req, res) => {
  //
  try {
    //
    const resp = await leadModelV2.find({ isBulkLead: true });

    resp.forEach((ele) => {
      if (ele.callHistory.length > 0) {
        ele.callHistory[0].callDate = ele.startDate;
        ele.save();
      }
    });
    res.send("ok");
  } catch (error) {
    logger.info(error);
    //
    res.send("not ok");
  }
});

leadRouter.post("/cross-check-booking-exist-lead", async (req, res) => {
  const bookings = await postSaleLeadModel.find({
    $or: [
      { "bookingStatus.type": { $ne: "Cancelled" } },
      { "bookingStatus.type": { $ne: "cancelled" } },
    ],
  });
  const result = [];

  await Promise.all(
    bookings.map(async (ele) => {
      const foundLead = await leadModelV2.findOne({
        phoneNumber: ele.phoneNumber,
      });

      if (foundLead?._id) {
        //
        try {
          //
          const newLead = await leadModelV2.findByIdAndUpdate(foundLead._id, {
            // firstName: ele.firstName,
            // lastName: ele.lastName,
            stage: "booking",
            // bookingRef: ele._id,
            bookingStatus: ele.bookingStatus.type,
            // startDate: ele.date,
            // teamLeader: ele.closingManager,
            bookingDate: ele.date,

            // cycle: {
            //   stage: "booking",
            //   teamLeader: ele.closingManager,
            //   //
            // },
          });
        } catch (error) {
          logger.info(error);
          //
        }
      }

      // if (!foundLead?._id) {
      //   //
      //   try {
      //     //
      //     const newLead = await leadModelV2.create({
      //       phoneNumber: ele.phoneNumber,
      //       firstName: ele.firstName,
      //       lastName: ele.lastName,
      //       stage: "booking",
      //       bookingRef: ele._id,
      //       bookingStatus: ele.bookingStatus.type,
      //       startDate: ele.date,
      //       teamLeader: ele.closingManager,

      //       cycle: {
      //         stage: "booking",
      //         teamLeader: ele.closingManager,
      //         //
      //       },
      //       isCountableBooking: true,
      //       createdAt: moment("2025-10-16T08:30:05.136+00:00").toDate(),
      //       feedbackGraceTime: moment("2025-10-16T08:30:05.136+00:00").toDate(),
      //     });
      //   } catch (error) {
      // logger.info(error);
      //     //
      //     logger.info(error);
      //   }
      // }
      result.push({
        phoneNumber: ele.phoneNumber,
        firstName: ele.firstName,
        leadExist: foundLead?._id ?? false,
      });
    }),
  );

  res.send({
    total: result.length,
    data: result,
  });
});

leadRouter.post("/edit-feeback-lead/:id", async (req, res) => {
  const id = req.params.id;
  const { feedback, feedbackId } = req.body;
  try {
    //
    const resp = await leadModelV2.findOneAndUpdate(
      {
        _id: id,
        "callHistory._id": feedbackId,
      },
      {
        $set: {
          "callHistory.$.feedback": feedback,
          "callHistory.$.edited": true,
        },
      },
    );
    const findLead = await leadModelV2
      .findById(id)
      .populate(leadPopulateOptions);

    return successRes2(res, 200, "feedback update", {
      data: findLead,
    });
  } catch (error) {
    logger.info(error);
    //
    return errorRes2(res, 500, "internal server error");
    res.send(error);
  }
});

leadRouter.get("/leads-by-task", async (req, res) => {
  try {
    const { assignTo } = req.query;

    if (!assignTo) {
      return res.status(400).json({ message: "assignTo is required" });
    }

    const tasks = await taskModel.find({ assignTo, completed: true });

    if (!tasks.length) {
      return res.status(404).json({ message: "No completed tasks found" });
    }

    const taskIds = tasks.map((task) => task._id);

    // logger.info(taskIds);

    const leads = await leadModel
      .find({
        taskRef: { $in: taskIds },
        // interestedStatus: true,
        clientInterestedStatus: "interested",
      })
      .populate(leadPopulateOptions2);

    res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    logger.info("Error fetching leads by task:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// cp xello leads by 10min
leadRouter.post("/xello-1time-10m", async (req, res) => {
  // await notificationQueue.drain(true);
  // return;
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(__dirname, "bulk_cp_lead.csv");

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  let i = 0;
  const teamLeadersIds = [
    "ev15-deepak-karki",
    "ev69-vicky-mane",
    "ev70-jaspreet-arora",
    // "ev54-ranjna-gupta",
  ];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      let i = 0;
      const grouped = {};

      for (const row of results) {
        const { teamLeader, name, phoneNumber, channelPartner } = row;
        const newDate = new Date();
        if (!grouped[teamLeader]) grouped[teamLeader] = [];
        grouped[teamLeader].push({ name, phoneNumber, channelPartner });
        i++;
      }
      const teamLeaders = Object.keys(grouped);

      const timeZone = "Asia/Kolkata";
      const baseTime = moment()
        .tz(timeZone)
        .add(1, "day")
        .hour(12)
        .minute(0)
        .second(0);

      // 4. Rounds
      const rounds = Math.max(...teamLeaders.map((tl) => grouped[tl].length));

      for (let round = 0; round < rounds; round++) {
        const slotTime = moment(baseTime).add(round * 10, "minutes");
        const delay = round * 10;
        const startDate = slotTime.toDate();
        const validTill = moment(slotTime).add(2, "months").toDate();

        for (const tl of teamLeaders) {
          const lead = grouped[tl][round];
          if (!lead) continue;

          dataTuPush.push({
            firstName: lead.name,
            phoneNumber: lead.phoneNumber,
            teamLeader: tl,
            channelPartner: lead.channelPartner,
            leadType: "cp",
            stage: "visit",
            approvalRemark: "auto imported CP lead - xelo by deepak sir",
            startDate: new Date(),
            validTill,
            project: [],
            address: ".",
            clientType: null,
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
            delay,
          });
        }
      }
      //
      await Promise.all(
        dataTuPush.map(async (ele) => {
          //
          const delay = ele.delay * 60_000; // convert minutes → ms

          // logger.info(ele);
          await notificationQueue.add(
            "assignXelloLead",
            {
              //
              firstName: ele.firstName,
              phoneNumber: ele.phoneNumber,
              teamLeader: ele.teamLeader,
              channelPartner: ele.channelPartner,
              approvalRemark: "auto imported CP lead - xelo by deepak sir",
            },
            { delay },
          );
          // logger.info("SCHEDULED:", ele.phoneNumber, delay);
        }),
      );
      //
      return res.send(dataTuPush);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

leadRouter.post("/tasks-deserialize", async (req, res) => {
  try {
    const batchSize = 1000;
    let bulkOps = [];
    let count = 0;
    const memoDate = moment().tz("Asia/Kolkata").subtract(10, "day").toDate();
    // const cursor = leadModelV2
    //   .find({
    //     taskRef: { $ne: null },
    //     "task.completed": false,
    //     "cycle.startDate": { $gte: memoDate },
    //   })
    //   .populate(leadPopulateOptions) // ⚠️ try to remove if possible
    //   .lean()
    //   .cursor();

    // for await (const e of cursor) {
    //   bulkOps.push({
    //     updateOne: {
    //       filter: { _id: e._id },
    //       update: {
    //         $set: {
    //           task: {
    //             id: e.taskRef?._id,
    //             assignTo: e.taskRef?.assignTo?._id,
    //             assignBy: e.taskRef?.assignBy?._id,
    //             type: e.taskRef?.type,
    //             assignDate: e.taskRef?.assignDate,
    //             deadline: e.taskRef?.deadline,
    //             completedDate: e.taskRef?.completedDate,
    //             details: e.taskRef?.details,
    //             completed: e.taskRef?.completed,
    //             transferTaskFrom: e.taskRef?.transferTaskFrom?._id,
    //             phoneNumber: e.taskRef?.phoneNumber,
    //           },
    //         },
    //       },
    //     },
    //   });

    //   if (bulkOps.length === batchSize) {
    //     await leadModelV2.bulkWrite(bulkOps);
    //     count += bulkOps.length;
    //     bulkOps = [];
    //     console.log("Processed:", count);
    //   }
    // }

    // remaining
    // if (bulkOps.length > 0) {
    //   await leadModelV2.bulkWrite(bulkOps);
    //   count += bulkOps.length;
    // }

    res.status(200).json({
      success: true,
      processed: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

leadRouter.post("/calls-deserialize", async (req, res) => {
  try {
    const batchSize = 1000;
    let bulkOps = [];
    let count = 0;
    const memoDate = moment().tz("Asia/Kolkata").subtract(10, "day").toDate();
    const cursor = leadModelV2.find({}).lean().cursor();

    // for await (const e of cursor) {
    //   bulkOps.push({
    //     updateOne: {
    //       filter: { _id: e._id },
    //       update: {
    //         $set: {
    //           totalCalls: e?.callHistory?.length ?? 0,
    //         },
    //       },
    //     },
    //   });

    //   if (bulkOps.length === batchSize) {
    //     await leadModelV2.bulkWrite(bulkOps);
    //     count += bulkOps.length;
    //     bulkOps = [];
    //     console.log("Processed:", count);
    //   }
    // }

    // // remaining
    // if (bulkOps.length > 0) {
    //   await leadModelV2.bulkWrite(bulkOps);
    //   count += bulkOps.length;
    // }

    res.status(200).json({
      success: true,
      processed: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default leadRouter;
