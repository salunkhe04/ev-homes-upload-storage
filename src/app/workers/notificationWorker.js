import { Queue, Worker } from "bullmq";
import { isRedisConnected, redis } from "../redis.js";
import {
  sendNotificationWithImage,
  sendNotificationWithInfo,
} from "../../controller/oneSignal.controller.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import moment from "moment-timezone";
import oneSignalModel from "../../model/oneSignal.model.js";
import employeeModel from "../../model/employee.model.js";
import logger from "../../utils/logger.js";
export let notificationQueue;
notificationQueue = new Queue("notifications", { connection: redis });
const worker = new Worker(
  "notifications",
  async (job) => {
    if (job.name === "sendLeadAssignNotification") {
      const { playerId, title, message, phoneNumber } = job.data;
      const foundLead = await leadModelV2.findOne(
        { phoneNumber },
        { taskRef: 1 },
      );
      if (foundLead.taskRef != null) {
        return;
      }

      await sendNotificationWithImage({
        playerIds: [playerId],
        title,
        message,
        imageUrl: "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",

        android_channel_id: "leads_assign",
        data: {},
      });
    }

    if (job.name === "sendLeadAssignNotificationTeam") {
      const { playerIds, title, message, phoneNumber } = job.data;
      const foundLead = await leadModelV2.findOne(
        { phoneNumber },
        { taskRef: 1 },
      );
      if (foundLead.taskRef != null) {
        return;
      }

      await sendNotificationWithImage({
        playerIds: playerIds,
        title,
        message,
        imageUrl: "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",

        android_channel_id: "leads_assign",
        data: {},
      });
    }
    if (job.name === "assignXelloLead") {
      const {
        firstName,
        teamLeader,
        phoneNumber,
        channelPartner,
        approvalRemark,
      } = job.data;

      logger.info("lead added xelo start", JSON.stringify(job.data));

      const timeZone = "Asia/Kolkata";
      const baseTime = moment().tz(timeZone);
      const startDate = baseTime.toDate();
      const validTill = moment(baseTime).add(2, "months").toDate();
      const tlValidTIll = moment(baseTime).add(30, "days").toDate();

      await leadModelV2.create(
        {
          firstName: firstName,
          phoneNumber: phoneNumber,
          teamLeader: teamLeader,
          channelPartner: channelPartner,
          leadType: "cp",
          stage: "visit",
          approvalRemark: approvalRemark,
          startDate: startDate,
          validTill: validTill,
          project: [],
          address: ".",
          cycle: {
            stage: "visit",
            startDate: startDate,
            validTill: tlValidTIll,
            teamLeader: teamLeader,
            currentOrder: 1,
            currentDays: 29,
          },
        },
        { ordered: false },
      );

      logger.info("lead added xelo end", startDate.toISOString());
      const myTeamNotify = await employeeModel
        .find({
          permissions: "lead_assign_notify",
          reportingTo: teamLeader,
          status: "active",
        })
        .sort({ createdAt: 1, _id: 1 });

      const getIds2 = myTeamNotify.map((dt) => dt._id.toString());

      const foundTLPlayerId = await oneSignalModel.find({
        docId: { $in: [...getIds2, teamLeader] },
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
            imageUrl:
              "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",

            message: `A new lead is now available for you. Please check the details and take the required steps.`,
            android_channel_id: "leads_assign",

            data: {},
          });
        } catch (error) {
          logger.info(error);
        }
      }
      try {
        //
        const getPlayerIds = foundTLPlayerId.find(
          (dt) => dt.docId === teamLeader,
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
            //
          }
        }
      } catch (error) {
        //
        logger.info(error);
      }
    }
  },
  { connection: redis, autorun: true },
);

worker.on("completed", (job) => {
  logger.info(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  logger.info(`❌ Job ${job.id} failed:`, err);
});
