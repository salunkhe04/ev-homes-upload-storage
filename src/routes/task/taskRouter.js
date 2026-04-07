import { Router } from "express";
import {
  assignMultipleTask,
  assignTask,
  getTask,
  getTaskByid,
  getTaskReminders,
  getTaskTeam,
  updateFeedback,
  updateTask,
  updateTaskReminder,
  getReminderToAll,
  transferTask,
  transferMultipleTasks,
  updateFeedbackV2,
  getTaskPage,
  getTaskTeamPagination,
  getTaskTeamReminderPaginated,
  getTaskMyReminderPaginated,
  updateFeedbackWithTimer,
  getLeadsTimer,
} from "../../controller/task.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { taskReminderPopulateOptions } from "../../utils/constant.js";
import taskModel from "../../model/task.model.js";
import { Parser } from "json2csv";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import moment from "moment-timezone";
import logger from "../../utils/logger.js";
const zone = "Asia/Kolkata"; // or whatever timezone you're working with

const taskRouter = Router();

taskRouter.get(
  "/task/:id",

  // authenticateToken,
  getTask,
);
taskRouter.get(
  "/task-page/:id",
  // authenticateToken,

  getTaskPage,
);

taskRouter.get("/task-reminders/:id", authenticateToken, getTaskReminders);
taskRouter.get("/task-reminder-all/:id", authenticateToken, getReminderToAll);
taskRouter.get("/task-by-id/:id", authenticateToken, getTaskByid);
taskRouter.get("/task-team/:id", authenticateToken, getTaskTeam);
taskRouter.get(
  "/task-team-pagination/:id",
  authenticateToken,
  getTaskTeamPagination,
);

taskRouter.post("/assign-task/:id", authenticateToken, assignTask);
taskRouter.post("/transfer-task/:id", authenticateToken, transferTask);
taskRouter.post("/transfer-multiple-task/:id", transferMultipleTasks);
taskRouter.post(
  "/assign-multiple-task/:id",
  authenticateToken,
  assignMultipleTask,
);
taskRouter.post("/update-task/:id", authenticateToken, updateTask);
taskRouter.post(
  "/update-task-reminder/:id",
  authenticateToken,
  updateTaskReminder,
);

taskRouter.post("/update-feedback", authenticateToken, updateFeedback);
// taskRouter.post("/update-feedback-v2", authenticateToken, updateFeedbackV2);
taskRouter.post(
  "/update-feedback-v2",
  authenticateToken,
  updateFeedbackWithTimer,
);

taskRouter.post(
  "/update-feedback-timer-v2",
  authenticateToken,
  updateFeedbackWithTimer,
);
taskRouter.get(
  "/leads-timer",

  authenticateToken,

  getLeadsTimer,
);

taskRouter.post("/dem-task", async (req, res) => {
  try {
    const resp = await taskModel
      .find({ firstName: { $exists: false }, lead: { $ne: null } })
      .populate(taskReminderPopulateOptions);

    const filteredTasks = resp.filter(
      (ele) => ele._id?.toString() === ele?.lead?.taskRef?.toString(),
    );

    // await Promise.all(
    //   filteredTasks.map(async (ele, i) => {
    //     try {
    //       await taskModel.findByIdAndUpdate(ele?._id, {
    //         $set: {
    //           // firstName: ele?.lead?.firstName ?? null,
    //           // lastName: ele?.lead?.lastName ?? null,
    //           cycleDate: ele?.lead?.cycle?.validTill,
    //         },
    //       });
    //       logger.info(`success ${i}`);
    //     } catch (error) {
    // logger.info(error);
    //       logger.info(error);
    //     }
    //   })
    // );
    res.send({
      data: filteredTasks.length,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

taskRouter.get("/task-fixica", async (req, res) => {
  try {
    const resp = await taskModel
      .find({
        assignTo: { $regex: "hemant" },
        // reminderDate: {
        //   $gte: new Date("2025-06-18T13:50:06.624Z"),
        //   $lte: new Date("2025-06-19T13:50:06.624Z"),
        // },
      })
      .lean(); // lean makes it a plain JS object, better for CSV

    await Promise.all(
      resp.map(async (ele) => {
        //
        await leadModelV2.findOneAndUpdate(
          {
            taskRef: ele._id.toString(),
          },
          {
            $set: {
              taskRef: null,
            },
          },
        );
      }),
    );

    // await Promise.all(
    //   resp.map(async (ele) => {
    //     //
    //     if (ele?.lead?.callHistory?.length > 0) {
    //       logger.info(ele._id.toString());
    //       const lastIndex = ele?.lead?.callHistory?.length ?? 0;
    //       const lastFedback = ele?.lead?.callHistory[lastIndex]?.feedback;
    //       await taskModel.findByIdAndUpdate(ele._id.toString(), {
    //         $set: {
    //           reminderDescription: lastFedback,
    //         },
    //       });
    //     }
    //   })
    // );
    // if (!resp.length) return res.status(404).send("No tasks found");

    // const fields = Object.keys(resp[0]); // or manually define like ['_id', 'title', 'assignTo']
    // const json2csvParser = new Parser({ fields });
    // const csv = json2csvParser.parse(resp);

    // res.header("Content-Type", "text/csv");
    // res.attachment("hemant_tasks.csv");
    return res.send(resp);
  } catch (error) {
    logger.info(error);
    res.status(500).send(error);
  }
});

taskRouter.post("/task-remindeDueFix", async (req, res) => {
  const resp = await taskModel
    .find({
      $and: [
        {
          reminderDate: { $ne: null },
        },
        {
          reminderCompleted: { $exists: true },
        },
        {
          reminderCompleted: { $eq: null },
        },
      ],
    })
    .lean();
  const now = moment().tz(zone).toDate();
  //
  await Promise.all(
    resp.map(async (ele) => {
      try {
        //
        const remDueDate = moment(ele.reminderDate)
          .tz(zone)
          .add(30, "minute")
          .toDate();

        await taskModel.findByIdAndUpdate(ele._id, {
          $set: {
            reminderDueDate: remDueDate,
          },
        });
      } catch (error) {
        logger.info(error);
        //
      }
    }),
  );

  res.send("ok");
});

taskRouter.get(
  "/task-reminder-all-paginated/:id",
  // authenticateToken,
  getTaskTeamReminderPaginated,
);
taskRouter.get(
  "/my-task-reminder-paginated/:id",
  // authenticateToken,
  getTaskMyReminderPaginated,
);

taskRouter.post("/task-mismatch-fix", async (req, res) => {
  const filterDate = moment().subtract(2, "month").tz(zone).toDate();

  const resp = await taskModel
    .find({
      completed: false,
      createdAt: { $gte: filterDate },
    })
    .lean();
  const list = [];
  const now = moment().tz(zone).toDate();
  //
  await Promise.all(
    resp.map(async (ele) => {
      try {
        //
        const foundLead = await leadModelV2.findOne({
          taskRef: ele._id,
        });
        if (!foundLead) {
          try {
            await taskModel.findByIdAndDelete(ele._id);
          } catch (error) {
            logger.info(error);
          }
        }
        list.push({
          taskId: ele._id,
          leadId: foundLead?._id ?? null,
          matched: foundLead != null,
        });

        // const remDueDate = moment(ele.reminderDate)
        //   .tz(zone)
        //   .add(30, "minute")
        //   .toDate();

        // await taskModel.findByIdAndUpdate(ele._id, {
        //   $set: {
        //     reminderDueDate: remDueDate,
        //   },
        // });
      } catch (error) {
        logger.info(error);
        //
      }
    }),
  );

  res.send({
    total: list.length,
    data: list,
  });
});

//
export default taskRouter;
