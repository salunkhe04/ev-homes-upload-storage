import cron from "node-cron";
import triggerHistoryModel from "../model/triggerLog.model.js";

import { insertDailyAttendance } from "../controller/attendance.controller.js";
import { getTodayVisitSummary } from "../controller/siteVisit.controller.js";
import { resetGraceAndRegularization } from "../controller/emlpoyeeShiftInfo.controller.js";
import {
  bulk_cp_lead_trigger_35,
  internalLeadCycleTrigger,
  leadCycleTriggerV4,
} from "../v2Controller/v2LeadController.js";
import { getTodayVisitLineUp } from "../controllerV2/leadsController.js";
import { ensurePeriodsUpToCurrentWeek } from "../routes/period/periodService.js";
import {
  notificationForPaymentDue,
  sendPaymentDueEmail,
} from "../controller/postSaleLead.controller.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import logger from "../utils/logger.js";

export const initCronJobs = () => {
  (logger.info("cron starting"),
    // Schedule a task to run at 8 AM daily and change cycle
    cron.schedule("0 8 * * *", async () => {
      try {
        // const response = await triggerCycleChangeFunctionFix();
        const response = await internalLeadCycleTrigger();

        await triggerHistoryModel.create({
          date: new Date(),
          changes: response?.changes ?? [],
          changesString: response?.changesString ?? "",
          totalTrigger: response?.total ?? 0,
          message: response?.message ?? "",
        });
      } catch (error) {
        logger.error("Error making API call:", error.message);

      }
    }));

  // Schedule a task to run at 9 AM daily and change cycle
  cron.schedule("0 9 * * *", async () => {
    try {
      // const response = await triggerCycleChangeFunctionFix();
      const response = await leadCycleTriggerV4();

      await triggerHistoryModel.create({
        date: new Date(),
        changes: response?.changes ?? [],
        changesString: response?.changesString ?? "",
        totalTrigger: response?.total ?? 0,
        message: response?.message ?? "",
      });
    } catch (error) {
      logger.error("Error making API call:", error.message);
    }
  });

  // Schedule a task to run at 10 AM daily and sent visit line-up
  cron.schedule("0 10 * * *", async () => {
    try {
      // const response = await triggerCycleChangeFunctionFix();
      const response = await getTodayVisitLineUp();
    } catch (error) {
      logger.error("Error send visit line-up:", error.message);
    }
  });

  // Schedule the job to run every day at 11:58 PM local time
  cron.schedule("58 23 * * *", async () => {
    logger.info("Running cron job at 11:58 PM local time...");
    await insertDailyAttendance();
    // Add your task logic here
  });

  // Schedule the job to run every day at 10:00 PM local time
  cron.schedule("00 22 * * *", async () => {
    logger.info("Running cron job at 10:00 PM local time...");
    await getTodayVisitSummary();
    // Add your task logic here
  });

  // Schedule the job at 12:01 AM on the 1st of every month
  cron.schedule("1 0 1 * *", async () => {
    await resetGraceAndRegularization();
    logger.info("Running job at 12:01 AM on the 1st of every month");
  });

  // Schedule a task to run at 9 AM daily and check if period is exist & update
  cron.schedule("0 9 * * *", async () => {
    try {
      const response = await ensurePeriodsUpToCurrentWeek();
    } catch (error) {
      logger.error("Error updating period:", error.message);
    }
  });

  // Schedule the job at 10 AM on every day payment due notification
  cron.schedule("0 10 * * *", async () => {
    try {
      const response = await notificationForPaymentDue();
    } catch (error) {
      logger.error("Error in payment notification ", error.message);
    }
  });

  // Schedule the job at 10 AM on every day payment due email
  cron.schedule("0 10 * * *", async () => {
    try {
      const response = await sendPaymentDueEmail();
    } catch (error) {
      logger.error("Error in payment email ", error.message);
    }
  });

  logger.info("cron added");
};
