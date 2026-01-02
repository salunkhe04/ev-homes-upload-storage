import leadModelV2 from "../model/lead/leadV2Model.js";
import moment from "moment-timezone";
const timeZone = "Asia/Kolkata";

import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { notificationQueue } from "../app/workers/notificationWorker.js";
import employeeModel from "../model/employee.model.js";
import oneSignalModel from "../model/oneSignal.model.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//TODO: dont use until 16-jul-2025
export const leadCycleTriggerV4 = async () => {
  try {
    const now = moment().tz(timeZone);
    const filterDate = moment("2025-06-15T18:30:00.000+00:00").tz(timeZone);
    const filterDateEnd = moment("2025-08-07T18:30:00.000+00:00").tz(timeZone);
    //
    const endOfYesterday = moment()
      .tz(timeZone)
      // .add(1,'day')
      .subtract(1, "day")
      .endOf("day")
      .toDate();

    const bulkOperations = [];
    const nonVisitDays = [29, 29, 29];
    const visitDays = [119, 59, 29];

    const teamLeaders = [
      { _id: "ev15-deepak-karki" }, // 1
      // { _id: "ev69-vicky-mane" }, //2
      { _id: "ev54-ranjna-gupta" }, // 4 - 2
      { _id: "ev70-jaspreet-arora" }, // 3
    ];

    // TODO: only trigger last 3 month / aka - in tagging leads - first first trigger (later)
    // TODO: need to handle all 14/6/3days first before triggering

    const actualTriggerQuery = {
      // "cycle.startDate": { $gte: filterDate.toDate() },
      bookingStatus: { $ne: "booked" },
      bookingRef: null,
      isBulkLead: false,
      // "cycle.startDate": { $gte: filterDate.toDate() },
      // "cycle.validTill": { $lte: filterDateEnd.toDate() },
      "cycle.validTill": { $lte: endOfYesterday },
      // "cycle.teamLeader": { $eq: teamLeaders[2]._id },
      // "cycle.teamLeader": { $ne: "ev54-ranjna-gupta" },
      // "cycle.currentOrder": 1,
      // "cycle.currentDays": 29,
      leadFrom: { $ne: "exhibition-2025" },

    };

    // get the leads
    const allCycleExpiredLeads = await leadModelV2
      .find({
        //
        ...actualTriggerQuery,
      })
      .lean();

    if (allCycleExpiredLeads.length > 0) {
      allCycleExpiredLeads.forEach((entry) => {
        // current TL Index
        const lastIndex = teamLeaders.findIndex(
          (ele) => ele?._id.toString() === entry?.cycle?.teamLeader?.toString()
        );
        const cCycle = { ...entry.cycle };
        const previousCycle = { ...cCycle };
        const startDate = moment(cCycle.validTill).tz(timeZone).add(1, "days");
        const validTill = moment(startDate).tz(timeZone);
        //
        if (lastIndex === -1) {
          return;
        }
        //
        // visited filter days [120, 60, 30] - assign date + 120 days
        if (
          entry.visitStatus === "visited" ||
          entry.revisitStatus === "revisited"
        ) {
          //
          cCycle.currentOrder += 1;
          cCycle.lastIndex = lastIndex;
          cCycle.teamLeader =
            teamLeaders[(lastIndex + 1) % teamLeaders.length]?._id;
          const foundIndex = visitDays.indexOf(cCycle.currentDays);
          cCycle.currentDays = visitDays[(foundIndex + 1) % visitDays.length];
          validTill.add(cCycle.currentDays, "days"); // it will change the year or not?

          cCycle.startDate = startDate;
          cCycle.validTill = validTill;
        }
        // non-visited filter days [30, 30, 30] - assign date + 30 days
        else {
          //
          cCycle.currentOrder += 1;
          cCycle.lastIndex = lastIndex;
          cCycle.teamLeader =
            teamLeaders[(lastIndex + 1) % teamLeaders.length]?._id;
          const foundIndex = nonVisitDays.indexOf(cCycle.currentDays);
          cCycle.currentDays =
            nonVisitDays[(foundIndex + 1) % nonVisitDays.length];
          validTill.add(cCycle.currentDays, "days"); // it will change the year or not?

          cCycle.startDate = startDate;
          cCycle.validTill = validTill;
        }
        // final ops
        bulkOperations.push({
          updateOne: {
            filter: { _id: entry._id },
            update: {
              teamLeader: cCycle.teamLeader,
              taskRef: null,
              $set: { cycle: cCycle },
              $push: { cycleHistoryNew: previousCycle },
            },
          },
        });
      });
    }
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

    //
    return {
      total: 0,
      changes: [],
      changesString: "no cycle changes",
      data: [],
      message: "no cycle changes",
    };
  } catch (error) {
    //
    console.error("Error updating cycles:", error);
    throw new Error("Internal Server Error");
  }
};
//TODO: internal lead trigger - 3 dys
export const internalLeadCycleTrigger = async () => {
  try {
    const now = moment().tz(timeZone);
    // const filterDate = moment("2025-06-15T18:30:00.000+00:00").tz(timeZone);
    //
    const endOfYesterday = moment()
      .tz(timeZone)
      // .add(1,'day')
      .subtract(1, "day")
      .endOf("day")
      .toDate();

    const bulkOperations = [];
    const nonVisitDays = [29, 29, 29];

    const teamLeaders = [
      { _id: "ev15-deepak-karki" }, // 1
      // { _id: "ev69-vicky-mane" },//2
      { _id: "ev54-ranjna-gupta" }, //2
      { _id: "ev70-jaspreet-arora" }, //3
    ];

    const actualTriggerQuery = {
      // "cycle.startDate": { $gte: filterDate.toDate() },
      bookingStatus: { $ne: "booked" },

      bookingRef: null,
      "cycle.internalCallDone": false,
      // "cycle.startDate": { $gte: endOfYesterday },
      "cycle.internalDeadline": { $lte: endOfYesterday },
      // "cycle.teamLeader": { $eq: teamLeaders[2]._id },
      // "cycle.teamLeader": { $ne: "ev54-ranjna-gupta" },
      // "cycle.currentOrder": 1,
      // "cycle.currentDays": 29,
      leadFrom: { $ne: "exhibition-2025" },
    };

    // get the leads
    const allCycleExpiredLeads = await leadModelV2
      .find({
        //
        ...actualTriggerQuery,
      })
      .lean();

    if (allCycleExpiredLeads.length > 0) {
      allCycleExpiredLeads.forEach((entry) => {
        // current TL Index
        const lastIndex = teamLeaders.findIndex(
          (ele) => ele?._id.toString() === entry?.cycle?.teamLeader?.toString()
        );
        const cCycle = { ...entry.cycle };
        const previousCycle = { ...cCycle };
        const start = moment(cCycle.internalDeadline).isValid()
          ? moment(cCycle.internalDeadline)
          : moment();
        const startDate = start.tz(timeZone).add(1, "days");
        const validTill = moment(startDate).tz(timeZone);
        //
        if (lastIndex === -1) {
          return;
        }
        cCycle.currentOrder += 1;
        cCycle.lastIndex = lastIndex;
        cCycle.teamLeader =
          teamLeaders[(lastIndex + 1) % teamLeaders.length]?._id;
        const foundIndex = nonVisitDays.indexOf(cCycle.currentDays);
        cCycle.currentDays =
          nonVisitDays[(foundIndex + 1) % nonVisitDays.length];
        validTill.add(cCycle.currentDays, "days"); // it will change the year or not?

        cCycle.startDate = startDate;
        cCycle.validTill = validTill;
        cCycle.internalDeadline = moment(cCycle.internalDeadline).add(
          3,
          "days"
        );
        // final ops
        bulkOperations.push({
          updateOne: {
            filter: { _id: entry._id },
            update: {
              teamLeader: cCycle.teamLeader,
              taskRef: null,
              $set: { cycle: cCycle },
              $push: { cycleHistoryNew: previousCycle },
            },
          },
        });
      });
    }
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
        message: "cycle changed successfully - internal leads",
      };
    }

    //
    return {
      total: 0,
      changes: [],
      changesString: "no cycle changes  - internal leads",
      data: [],
      message: "no cycle changes  - internal leads",
    };
  } catch (error) {
    //
    console.error("Error updating cycles:", error);
    throw new Error("Internal Server Error");
  }
};

// trigger from 16-jan to next 5 days then remove filterDate and limit to 1000
export const leadCycleChange_600_from_March_01_2025 = async () => {
  try {
    const now = moment().tz(timeZone);

    const filterDate = moment("2025-02-28T18:30:00.000+00:00").tz(timeZone);
    const bulkOperations = [];
    // TODO: when triggering this only trigger 1 by 1 tl else parrallel calls will cause re-write tl
    const teamLeaders = [
      // { _id: "ev15-deepak-karki" },
      // { _id: "ev69-vicky-mane" },
      { _id: "ev70-jaspreet-arora" },
    ];

    await Promise.all(
      teamLeaders.map(async (tl) => {
        const actualTriggerQuery = {
          // createdAt: { $lt: filterDate },
          bookingStatus: { $ne: "booked" },
          bookingRef: null,
          // disabled: true,
          // "cycle.validTill": { $lte: endOfYesterday },
          // "cycle.teamLeader": { $eq: tl._id },
          // "cycle.teamLeader": { $ne: "ev54-ranjna-gupta" },
          $or: [{ approvalStatus: null }, { approvalStatus: "pending" }],
          leadType: "cp",
          isBulkLead: null,
          channelPartner: { $ne: "my-firm-name-last" },
        };
        // console.log(actualTriggerQuery);
        // get the leads
        const allCycleExpiredLeads = await leadModelV2
          .find({
            //
            ...actualTriggerQuery,
          })
          .sort({ createdAt: -1 })
          .limit(218)
          .lean();

        if (allCycleExpiredLeads.length > 0) {
          allCycleExpiredLeads.forEach((entry) => {
            //
            const cCycle = { ...entry.cycle };
            const previousCycle = { ...cCycle };

            cCycle.currentOrder = 1;
            cCycle.currentDays = 29;
            const startDate = moment().tz(timeZone).subtract(1);
            const validTill = moment(startDate).tz(timeZone);
            validTill.add(cCycle.currentDays, "days"); // it will change the year too

            cCycle.startDate = startDate;
            cCycle.validTill = validTill;
            cCycle.teamLeader = tl?._id;

            const isStageNull =
              entry?.stage == null ||
              entry?.stage == "approval" ||
              entry?.stage == "tagging-over";
            cCycle.stage = isStageNull ? "visit" : entry?.stage;

            const isApprovalPending =
              entry?.approvalStatus === null ||
              entry?.approvalStatus === "pending";

            bulkOperations.push({
              updateOne: {
                filter: { _id: entry._id },
                update: {
                  $set: {
                    cycle: cCycle,
                    disabled: false,
                    teamLeader: cCycle.teamLeader,
                    taskRef: null,
                    stage: isStageNull ? "visit" : entry?.stage,

                    approvalStatus: isApprovalPending
                      ? "approved"
                      : entry?.approvalStatus,
                    approvalRemark: isApprovalPending
                      ? "approved-auto-300-leads-04-07-25"
                      : entry?.approvalStatus,
                  },
                  // $push: {
                  //   cycleHistory: previousCycle,
                  // cycleHistoryNew: previousCycle,
                  // },
                },
              },
            });
          });
        }
      })
    );
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

    //
    return {
      total: 0,
      changes: [],
      changesString: "no cycle changes",
      data: [],
      message: "no cycle changes",
    };
  } catch (error) {
    //
    console.error("Error updating cycles:", error);
    throw new Error("Internal Server Error");
  }
};

// Assumes these are imported at top of file:
// const fs = require("fs");
// const path = require("path");
// const csv = require("csv-parser");
// const moment = require("moment-timezone");
// const { leadModelV2, employeeModel, oneSignalModel } = require("./models");
// const { sendNotificationWithImage } = require("./notifications");
// const { notificationQueue } = require("./queues");

export const bulk_cp_lead_trigger_35 = async () => {
  const results = [];
  const dataToPush = [];
  const csvFilePath = path.join(__dirname, "bulk_cp_lead.csv");

  // make sure file exists
  try {
    await fs.promises.access(csvFilePath, fs.constants.R_OK);
  } catch (err) {
    throw new Error("CSV file not found");
  }

  // read CSV as promise so function waits until file parsed
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", resolve)
      .on("error", reject);
  });

  try {
    // group rows by teamLeader
    const grouped = {};
    for (const row of results) {
      const { teamLeader, name, phoneNumber, channelPartner } = row;
      if (!teamLeader) continue; // skip rows without TL
      if (!grouped[teamLeader]) grouped[teamLeader] = [];
      grouped[teamLeader].push({ name, phoneNumber, channelPartner });
    }

    const teamLeaders = Object.keys(grouped);

    const allPhones = results.map((r) => r.phoneNumber).filter(Boolean);
    const existingNumbers = new Set(
      (
        await leadModelV2.find(
          { phoneNumber: { $in: allPhones } },
          { phoneNumber: 1 }
        )
      ).map((d) => d.phoneNumber)
    );

    const timeZone = "Asia/Kolkata";
    const baseTime = moment()
      .tz(timeZone)
      .add(1, "day")
      .hour(12)
      .minute(0)
      .second(0);

    const rounds = Math.max(...teamLeaders.map((tl) => grouped[tl].length), 0);

    for (const tl of teamLeaders) {
      try {
        const myTeamNotify = await employeeModel
          .find({
            permissions: "lead_assign_notify",
            reportingTo: tl,
            status: "active",
          })
          .sort({ createdAt: 1, _id: 1 });

        const getIds2 = myTeamNotify.map((dt) => dt._id.toString());
        const docIdsToSearch = [...getIds2, tl];

        const foundTLPlayerId = await oneSignalModel.find({
          docId: { $in: docIdsToSearch },
        });

        if (foundTLPlayerId && foundTLPlayerId.length > 0) {
          const playerIds = foundTLPlayerId
            .map((d) => d.playerId)
            .filter(Boolean);
          if (playerIds.length > 0) {
            try {
              await sendNotificationWithImage({
                playerIds,
                title: "You've Got a New Lead!",
                imageUrl:
                  "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",
                message: `A new lead is now available for you. Please check the details and take the required steps.`,
                android_channel_id: "leads_assign",
                data: {},
              });
            } catch (err) {
              console.log("sendNotificationWithImage error:", err);
            }
          }
        }

        const foundForTL =
          foundTLPlayerId.find((d) => d.docId === tl) || foundTLPlayerId[0];
        if (foundForTL && foundForTL.playerId) {
          const delayMs = 10 * 60_000; // 10 minutes

          await notificationQueue.add(
            "sendCPLeadTriggeredNotification",
            {
              playerId: foundForTL.playerId,
              title: `You've got a new Lead`,
              message: `A lead assigned to your team is waiting. Please check and act.`,
            },
            { delay: delayMs }
          );

          // If you wanted multiple reminders uncomment & adjust below:
          // const intervalMinutes = 10;
          // const totalReminders = 4;
          // for (let i = 1; i <= totalReminders; i++) {
          //   const delay = i * intervalMinutes * 60_000;
          //   await notificationQueue.add(
          //     "sendCPLeadTriggeredNotification",
          //     { playerId: foundForTL.playerId, title: `Reminder ${i}: Lead Still Waiting!`, message: `Please act on the new lead assigned to you.` },
          //     { delay }
          //   );
          // }
        }
      } catch (err) {
        console.log("per-TL notification error for", tl, err);
      }
    }

    for (let round = 0; round < rounds; round++) {
      const slotTime = moment(baseTime).add(round * 10, "minutes");
      const startDate = slotTime.toDate();
      const validTill = moment(slotTime).add(2, "months").toDate();

      for (const tl of teamLeaders) {
        const lead = grouped[tl][round];
        if (!lead) continue;

        // skip duplicates
        if (!lead.phoneNumber) {
          console.log("Skipping row with missing phoneNumber for TL:", tl);
          continue;
        }
        if (existingNumbers.has(lead.phoneNumber)) {
          console.log("Skipping duplicate:", lead.phoneNumber);
          continue;
        }

        existingNumbers.add(lead.phoneNumber);

        const doc = {
          phoneNumberExists: false,
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
        };

        dataToPush.push(doc);
      }
    }

    // bulk insert (unordered so one bad doc won't abort all)
    if (dataToPush.length > 0) {
      await leadModelV2.insertMany(dataToPush, { ordered: false });
    }

    return { dataToPush };
  } catch (err) {
    console.error("bulk_cp_lead_trigger_35 error:", err);
    throw err;
  }
};
