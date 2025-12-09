import leadModel from "../model/lead/lead.model.js";
import oneSignalModel from "../model/oneSignal.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import taskModel from "../model/task.model.js";
import {
  employeePopulateOptions,
  leadPopulateOptions,
  taskPopulateOptions,
  taskReminderPopulateOptions,
} from "../utils/constant.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
import employeeModel from "../model/employee.model.js";
import moment from "moment-timezone";
import leadModelV2 from "../model/lead/leadV2Model.js";
const zone = "Asia/Kolkata"; // or whatever timezone you're working with

export const getTask = async (req, res, next) => {
  const id = req.params.id;
  const type = req.query.type;
  const query = req.query.query || "";
  const { dStartDate, dEndDate } = req.query;

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const ids = [];
    const now = new Date();
    let filter = { assignTo: id, deadline: { $gt: now } };

    if (type) {
      if (type == "completed") {
        filter.completed = true;
      } else if (type == "pending") {
        filter.completed = false;
      } else {
        filter.type = type;
      }
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      if (!isNumberQuery) {
        searchConditions.push(
          { clientName: { $regex: query, $options: "i" } },
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } }
        );
      } else {
        searchConditions.push({ someNumericField: Number(query) });
      }

      filter.$or = searchConditions;
    }

    if (dStartDate && dEndDate) {
      const start = moment(dStartDate)
        .tz("Asia/Kolkata")
        .startOf("day")
        .toDate();
      const end = moment(dEndDate).tz("Asia/Kolkata").endOf("day").toDate();
      const test = await taskModel.find(filter).select("_id");
      const tids = [];
      test.map((ele) => {
        tids.push(ele._id.toString());
      });
      const foundLeads = await leadModelV2
        .find({
          taskRef: { $in: tids },
          "cycle.validTill": {
            $gte: start,
            $lte: end,
          },
        })
        .select("_id taskRef");

      foundLeads.map((ele) => {
        ids.push(ele.taskRef.toString());
      });
      if (ids.length > 0) {
        filter._id = { $in: ids };
      }

      // filter.deadline = {
      //   $gte: start,
      //   $lte: end,
      // };
    }

    // console.log(filter);
    const resp = await taskModel
      .find(filter)
      .populate(taskPopulateOptions)
      .sort({ transferDate: -1, assignDate: -1 });
    // console.log(resp[0]);

    const resp2 = resp.filter((ele) => {
      if (!ele?.lead || !ele?.lead?.taskRef || !ele?.lead?.taskRef?._id) {
        // console.log(`Missing lead/taskRef in task ${ele._id}`);
        return false;
      }

      return (
        // ele.lead.taskRef._id.toString() === ele._id.toString() &&
        ele?.lead?.hideStatus === false
      );
    });

    const filteredMissed = resp.filter(
      (ele) => !resp2.some((e) => e._id.toString() === ele._id.toString())
    );

    return res.send(
      successRes(200, "Get task", {
        total: resp2.length,
        // totalM: filteredMissed?.length,
        data: resp,
        // dataM: filteredMissed,
      })
    );
  } catch (error) {
    return next(error);
  }
};

//similar of getTask but with pagination
export const getTaskPage = async (req, res, next) => {
  const id = req.params.id;
  const query = req.query.query || "";
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;
  const type = req.query.type;

  const isNumberQuery = !isNaN(query);

  const { dStartDate, dEndDate } = req.query;

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const ids = [];
    const now = new Date();
    let filter = { assignTo: id, deadline: { $gt: now }, disabled: false };

    if (type) {
      if (type === "completed") {
        filter.completed = true;
      } else if (type === "pending") {
        filter.completed = false;
      } else {
        filter.type = type;
      }
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      searchConditions.push(
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
        }
      );

      if (isNumberQuery) {
        searchConditions.push(
          isNumberQuery
            ? {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$phoneNumber" },
                    regex: query,
                  },
                },
              }
            : null
        );
      }

      // console.log(isNumberQuery);
      filter.$or = searchConditions;
    }
    // console.log(JSON.stringify(filter, null, 2));
    if (dStartDate && dEndDate) {
      const start = moment(dStartDate)
        .tz("Asia/Kolkata")
        .startOf("day")
        .toDate();
      const end = moment(dEndDate).tz("Asia/Kolkata").endOf("day").toDate();
      const test = await taskModel.find(filter).select("_id");
      // console.log(start);
      // console.log(end);
      // console.log(test);
      const tids = [];
      test.map((ele) => {
        tids.push(ele._id.toString());
      });
      // console.log(tids);

      const foundLeads = await leadModelV2
        .find({
          taskRef: { $in: tids },
          "cycle.validTill": {
            $gte: start,
            $lte: end,
          },
        })
        .select("_id taskRef");

      foundLeads.map((ele) => {
        ids.push(ele.taskRef.toString());
      });
      // console.log(ids);

      if (ids.length > 0) {
        filter._id = { $in: ids };
      }

      // filter.deadline = {
      //   $gte: start,
      //   $lte: end,
      // };
    }

    // console.log(filter);
    const resp = await taskModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate(taskPopulateOptions)
      .sort({ transferDate: -1, assignDate: -1 });
    // console.log(resp);
    // console.log(type);

    const totalItems = await taskModel.countDocuments(filter);

    // console.log(totalItems);
    // const resp2 = resp.filter((ele) => {
    //   if (!ele?.lead || !ele?.lead?.taskRef || !ele?.lead?.taskRef?._id) {
    //     // console.log(`Missing lead/taskRef in task ${ele._id}`);
    //     return false;
    //   }

    //   return (
    //     // ele.lead.taskRef._id.toString() === ele._id.toString() &&
    //     ele?.lead?.hideStatus === false
    //   );
    // });

    const filteredMissed = resp.filter(
      (ele) => !resp.some((e) => e?._id.toString() === ele?._id?.toString())
    );
    const totalPages = Math.ceil(totalItems / limit);

    // console.log("proint");
    return res.send(
      successRes(200, "Get task", {
        page,
        limit,
        totalPages,
        totalItems,
        total: resp.length,
        totalM: filteredMissed?.length,
        data: resp,
        dataM: filteredMissed,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getTaskReminders = async (req, res, next) => {
  const id = req.params.id;
  const type = req.query.type;
  const query = req.query.query || "";

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const today = new Date();
    const startOfToday = moment().tz(zone).startOf("day").toDate();

    const tomorrow = moment().tz(zone).add(1, "days").toDate();

    let filter = {
      assignTo: id,
      reminderDate: { $gte: startOfToday, $lte: tomorrow },
    };

    if (type) {
      if (type == "completed") {
        filter.completed = true;
      } else if (type == "pending") {
        filter.completed = false;
      } else {
        filter.type = type;
      }
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      if (!isNumberQuery) {
        searchConditions.push(
          { clientName: { $regex: query, $options: "i" } },
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } }
        );
      } else {
        searchConditions.push({ someNumericField: Number(query) });
      }

      filter.$or = searchConditions;
    }
    // console.log(filter);
    const resp = await taskModel
      .find(filter)
      .populate(taskPopulateOptions)
      .sort({ assignDate: -1 });

    // .populate({
    //   path: "lead",
    //   select:"",
    //   match: {
    //     $or: [
    //       { firstname: { $regex: query, $options: "i" } }, // Case-insensitive search
    //       { lastname: { $regex: query, $options: "i" } },
    //     ],
    //   },
    // });
    // const resp2 = resp.filter(
    //   (ele) =>
    //     ele.lead?.taskRef?._id?.toString() === ele?._id?.toString() &&
    //     ele.lead?.hideStatus === false
    // );

    // console.log(match);
    return res.send(
      successRes(200, "Get task", {
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getReminderToAll = async (req, res, next) => {
  const id = req.params.id;
  const type = req.query.type;
  const query = req.query.query || "";

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const today = new Date();
    const startOfToday = moment().tz(zone).startOf("day").toDate();
    const tomorrow = moment().tz(zone).add(1, "days").toDate();
    let filter = {
      // assignBy: id,
      reminderDate: { $gte: startOfToday, $lte: tomorrow },
    };

    if (type) {
      if (type == "completed") {
        filter.completed = true;
      } else if (type == "pending") {
        filter.completed = false;
      } else {
        filter.type = type;
      }
    }

    // if (query) {
    //   const isNumberQuery = !isNaN(query);
    //   const searchConditions = [];

    //   // Add search conditions based on the query type
    //   if (!isNumberQuery) {
    //     searchConditions.push(
    //       { clientName: { $regex: query, $options: "i" } },
    //       { firstName: { $regex: query, $options: "i" } },
    //       { lastName: { $regex: query, $options: "i" } }
    //     );
    //   } else {
    //     searchConditions.push({ someNumericField: Number(query) });
    //   }

    //   filter.$or = searchConditions;
    // }
    const resp = await taskModel
      .find(filter)
      .populate(taskReminderPopulateOptions)
      .sort({ assignDate: -1 });

    // .populate({
    //   path: "lead",
    //   select:"",
    //   match: {
    //     $or: [
    //       { firstname: { $regex: query, $options: "i" } }, // Case-insensitive search
    //       { lastname: { $regex: query, $options: "i" } },
    //     ],
    //   },
    // });
    // const resp2 = resp.filter(
    //   (ele) =>
    //     ele.lead?.taskRef?.toString() === ele?._id?.toString() &&
    //     ele.lead?.hideStatus === false
    // );

    // console.log(match);
    return res.send(
      successRes(200, "Get task", {
        total: resp.length,
        data: resp,
      })
    );
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};

export const getTaskByid = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const resp = await taskModel.findById(id).populate(taskPopulateOptions);
    if (resp.lead?.hideStatus === true) {
      return res.send(errorRes(404, "No task Found"));
    }
    return res.send(
      successRes(200, "Get task", {
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getTaskTeam = async (req, res, next) => {
  const id = req.params.id;
  const type = req.query.type;
  const query = req.query.query || "";
  const member = req.query.member;
  const { dStartDate, dEndDate } = req.query;

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const now = new Date();
    let taskIds = [];
    let filter = { deadline: { $gt: now }, disabled: false };

    if (member) {
      filter = { assignTo: member };
    } else {
      const teams = await employeeModel.find({ reportingTo: id }).select("_id");
      const ids = teams.map((ele) => ele._id);

      filter = { assignTo: { $in: ids } };
    }
    // console.log(filter);

    if (type) {
      if (type == "completed") {
        filter.completed = true;
      } else if (type == "pending") {
        filter.completed = false;
      } else {
        filter.type = type;
      }
    }
    // console.log(dStartDate);
    // console.log(dEndDate);
    if (dStartDate && dEndDate) {
      const start = moment(dStartDate)
        .tz("Asia/Kolkata")
        .startOf("day")
        .toDate();
      const end = moment(dEndDate).tz("Asia/Kolkata").endOf("day").toDate();
      const test = await taskModel.find(filter).select("_id");
      const tids = [];
      test.map((ele) => {
        tids.push(ele._id.toString());
      });
      // console.log(tids);
      const foundLeads = await leadModelV2
        .find({
          taskRef: { $in: tids },
          "cycle.validTill": {
            $gte: start,
            $lte: end,
          },
        })
        .select("_id taskRef");

      // console.log(foundLeads);
      foundLeads.map((ele) => {
        taskIds.push(ele.taskRef.toString());
      });
      if (taskIds.length > 0) {
        filter._id = { $in: taskIds };
      }

      // filter.deadline = {
      //   $gte: start,
      //   $lte: end,
      // };
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      if (!isNumberQuery) {
        searchConditions.push(
          { clientName: { $regex: query, $options: "i" } },
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } }
        );
      } else {
        searchConditions.push({ someNumericField: Number(query) });
      }

      filter.$or = searchConditions;
    }
    // console.log(filter);
    const resp = await taskModel
      .find(filter)
      .populate(taskPopulateOptions)
      .sort({ transferDate: -1, assignDate: -1 })
      .limit(20);

    const resp2 = resp.filter(
      (ele) =>
        ele.lead?.taskRef?._id?.toString() === ele?._id?.toString() &&
        ele.lead?.hideStatus === false
    );
    // console.log(resp2);

    return res.send(
      successRes(200, "Get task", {
        total: resp2.length,
        data: resp2,
      })
    );
  } catch (error) {
    return next(error);
  }
};

//similar to task team but with pagination
export const getTaskTeamPagination = async (req, res, next) => {
  const id = req.params.id;
  const query = req.query.query || "";
  const member = req.query.member;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;
  const type = req.query.type;

  const isNumberQuery = !isNaN(query);
  const { dStartDate, dEndDate } = req.query;

  try {
    if (!id) return res.send(errorRes(401, "No ID provided"));
    const now = new Date();
    let taskIds = [];
    let filter = { deadline: { $gt: now } };

    if (member) {
      filter = { assignTo: member };
    } else {
      const teams = await employeeModel.find({ reportingTo: id }).select("_id");
      const ids = teams.map((ele) => ele._id);

      filter = { assignTo: { $in: ids } };
    }
    // console.log(filter);

    if (type) {
      if (type == "completed") {
        filter.completed = true;
      } else if (type == "pending") {
        filter.completed = false;
      } else {
        filter.type = type;
      }
    }
    // console.log(dStartDate);
    // console.log(dEndDate);
    if (dStartDate && dEndDate) {
      const start = moment(dStartDate)
        .tz("Asia/Kolkata")
        .startOf("day")
        .toDate();
      const end = moment(dEndDate).tz("Asia/Kolkata").endOf("day").toDate();
      const test = await taskModel.find(filter).select("_id");
      const tids = [];
      test.map((ele) => {
        tids.push(ele._id.toString());
      });
      // console.log(tids);
      const foundLeads = await leadModelV2
        .find({
          taskRef: { $in: tids },
          "cycle.validTill": {
            $gte: start,
            $lte: end,
          },
        })
        .select("_id taskRef");

      // console.log(foundLeads);
      foundLeads.map((ele) => {
        taskIds.push(ele.taskRef.toString());
      });
      if (taskIds.length > 0) {
        filter._id = { $in: taskIds };
      }

      // filter.deadline = {
      //   $gte: start,
      //   $lte: end,
      // };
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      searchConditions.push(
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
        }
      );

      if (isNumberQuery) {
        searchConditions.push(
          isNumberQuery
            ? {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$phoneNumber" },
                    regex: query,
                  },
                },
              }
            : null
        );
      }

      filter.$or = searchConditions;
    }
    // console.log(filter);
    const resp = await taskModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate(taskPopulateOptions)
      .sort({ transferDate: -1, assignDate: -1 });
    const totalItems = await taskModel.countDocuments(filter);

    const resp2 = resp.filter(
      (ele) =>
        ele.lead?.taskRef?._id?.toString() === ele?._id?.toString() &&
        ele.lead?.hideStatus === false
    );
    // console.log(resp2);
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Get task", {
        page,
        limit,
        totalPages,
        totalItems,
        total: resp2.length,
        data: resp2,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const assignTask = async (req, res, next) => {
  const body = req.body;
  const assignTo = req.params.id;
  const user = req.user;
  try {
    if (!assignTo)
      return res.send(errorRes(401, "assign to assignTo required"));

    const assignDate = new Date();
    if (!body.deadline) {
      const now = new Date();
      now.setHours(23, 59, 0, 0); // Set time to 11:59 PM
      body.deadline = now;
    }
    let foundLead = await leadModelV2.findById(body?.lead);

    const newData = {
      ...body,
      assignTo: assignTo,
      assignDate,
      firstName: foundLead?.firstName,
      lastName: foundLead?.lastName,
      phoneNumber: foundLead?.phoneNumber,
      cycleDate: foundLead?.cycle?.validTill,

      // assignTo: user._id,
    };

    const resp = await taskModel.create({ ...newData });

    const foundTLPlayerId = await oneSignalModel.find({
      docId: assignTo,
    });
    if (body?.lead) {
      foundLead = await leadModelV2.findOneAndUpdate(
        { _id: body?.lead },
        { taskRef: resp?._id }
      );
    }

    if (foundTLPlayerId.length > 0) {
      // console.log(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      await sendNotificationWithImage({
        playerIds: getPlayerIds,
        title: "You've Got new task",
        message: `A new task has been assigned to you. Check the details to move things forward.`,
        imageUrl:
          "https://images.ctfassets.net/rz1oowkt5gyp/1IgVe0tV9yDjWtp68dAZJq/36ca564d33306d407dabe39c33322dd9/TaskManagement-hero.png",
      });
    }
    const resp2 = await taskModel
      .findById(resp._id)
      .populate(taskPopulateOptions);

    return res.send(
      successRes(200, "Task Assigned", {
        data: resp2,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const assignMultipleTask = async (req, res, next) => {
  const { leads, subject } = req.body;
  const body = req.body;
  const assignTo = req.params.id;

  const user = req.user;
  // console.log(leads?.length);
  // console.log(body);
  try {
    if (!Array.isArray(leads))
      return res.send(errorRes(401, "Leads List Required"));

    if (!assignTo)
      return res.send(errorRes(401, "assign to assignTo required"));

    const assignDate = new Date();
    if (!body.deadline) {
      const now = new Date();
      now.setHours(23, 59, 0, 0); // Set time to 11:59 PM
      body.deadline = now;
    }

    const newData = {
      ...body,
      assignTo: assignTo,
      assignDate,
      // assignTo: user._id,
    };
    const foundTLPlayerId = await oneSignalModel.find({
      docId: assignTo,
    });
    const uniqueLeads = [...new Set(leads)];
    // console.log("Total leads:", leads.length); // 228
    // console.log("Unique leads:", uniqueLeads.length); // 122
    // console.log("Duplicates:", leads.length - uniqueLeads.length); // 106

    if (uniqueLeads.length !== leads.length) {
      console.warn("Duplicate lead IDs detected:", leads);
    }

    await Promise.all(
      uniqueLeads.map(async (ele) => {
        try {
          let foundLead = await leadModelV2.findById(ele);
          if (foundLead.taskRef != null) {
            return;
          }
          const resp = await taskModel.create({
            ...newData,
            lead: ele,
            firstName: foundLead?.firstName,
            lastName: foundLead?.lastName,
            phoneNumber: foundLead?.phoneNumber,
            cycleDate: foundLead?.cycle?.validTill,
          });
          foundLead = await leadModelV2.findOneAndUpdate(
            { _id: ele },
            { taskRef: resp?._id }
          );

          // console.log("passed");
          if (foundTLPlayerId.length > 0) {
            // console.log(foundTLPlayerId);
            const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

            await sendNotificationWithImage({
              playerIds: getPlayerIds,
              title: "You've Got new task",
              message: `A new task has been assigned to you. Check the details to move things forward.`,
              android_channel_id: "task_assign",
              imageUrl:
                "https://images.ctfassets.net/rz1oowkt5gyp/1IgVe0tV9yDjWtp68dAZJq/36ca564d33306d407dabe39c33322dd9/TaskManagement-hero.png",
            });
          }
        } catch (error) {
          //
          console.error(`Error assigning task to lead ID: ${ele}`, error);
        }
      })
    );
    return res.send(
      successRes(200, "Task Assigned", {
        data: true,
      })
    );
  } catch (error) {
    console.error(`main Err: `, error);

    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const transferTask = async (req, res, next) => {
  const { id } = req.params;
  const { assignTo, transferReason } = req.body;
  const user = req.user;

  if (!id) {
    return res.send(errorRes(400, "Task ID is required"));
  }

  // if (!assignTo) {
  //   return res.send(errorRes(400, "assignTo is required"));
  // }

  try {
    const task = await taskModel.findById(id);
    if (!task) {
      return res.send(errorRes(404, "Task not found"));
    }
    task.transferTaskFrom = task.assignTo;

    // Save the updated task
    const updatedTask = await task.save();

    const populatedTask = await taskModel
      .findByIdAndUpdate(updatedTask._id, {
        assignTo: assignTo,
        transferReason: transferReason,
        transferDate: new Date(),
      })
      .populate(taskPopulateOptions);

    return res.send(
      successRes(200, "Task Transferred Successfully", {
        data: populatedTask,
      })
    );
  } catch (error) {
    // console.error("Error transferring task:", error); // Debugging: Log the error
    return next(error);
  }
};

export const transferMultipleTasks = async (req, res, next) => {
  const { id, assignTo, transferReason } = req.body;
  const transferTaskFrom = req.params.id;

  if (!transferTaskFrom) {
    return res.send(errorRes(400, "id is required"));
  }
  if (!Array.isArray(id)) {
    return res.send(errorRes(400, "Task IDs are required"));
  }

  try {
    const updatedTasks = [];

    for (const taskId of id) {
      const task = await taskModel.findById(taskId);
      // if (!task) {
      //   console.warn(`Task with ID ${taskId} not found`);
      //   continue; /
      // }

      // task.transferTaskFrom = task.assignTo;

      const timelineEntry = {
        assignTo: task.assignTo,
        assignBy: task.assignBy,
        transferTaskFrom: task.transferTaskFrom ?? null,
        completed: task.completed,
        completedDate: task.completedDate ?? null,
      };

      // if (!Array.isArray(task.timeLine)) {
      //   task.timeLine=[];
      // }
      // task.timeLine.push(timelineEntry);

      const savedTask = await task.save();
      const updatedTask = await taskModel
        .findByIdAndUpdate(
          savedTask._id,
          {
            assignTo: assignTo,
            transferReason: transferReason,
            transferDate: new Date(),
            transferTaskFrom: transferTaskFrom ?? task.assignTo,
            completed: false,
            $addToSet: {
              timeLine: timelineEntry,
            },
          },
          { new: true }
        )
        .populate(taskPopulateOptions);

      updatedTasks.push(updatedTask);
    }

    return res.send(
      successRes(200, "Tasks Transferred Successfully", {
        data: updatedTasks,
      })
    );
  } catch (error) {
    // console.error("Error transferring tasks:", error);
    return next(error);
  }
};

export const updateTask = async (req, res, next) => {
  const {
    stage,
    status,
    intrestedStatus,
    feedback,
    document,
    recording,
    leadStatus,
    taskCompleted,
    projects,
    requirement,
    reminderDate,
  } = req.body;

  const taskId = req.params.id;
  const user = req.user;
  try {
    if (!taskId) return res.send(errorRes(401, "taskId required"));

    const myTask = await taskModel.findById(taskId);
    const startDate = new Date(); // Current date

    if (!myTask) return res.send(errorRes(404, "task not found"));
    if (myTask.lead != null) {
      const theLead = await leadModelV2.findByIdAndUpdate(myTask.lead, {
        clientInterestedStatus: intrestedStatus,
        interestedStatus: leadStatus,
        projects,
        requirement,
        reminderDate,

        $addToSet: {
          callHistory: {
            caller: user?._id,
            callDate: startDate,
            remark: status ?? "",
            stage: stage ?? "",
            feedback: feedback ?? "",
            document: document,
            recording: recording,
            interestedStatus: intrestedStatus,
          },
          updateHistory: {
            employee: user?._id,
            changes: feedback ?? "task updated",
            updatedAt: startDate,
            remark: stage,
          },
        },
      });
    }
    const statusValue = taskCompleted ? taskCompleted.toLowerCase() : "";
    const resp = await taskModel
      .findByIdAndUpdate(taskId, {
        completed: true,
        completedDate: startDate,
        reminderDate: reminderDate,
      })
      .populate(taskPopulateOptions);

    return res.send(
      successRes(200, "Task updated", {
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const updateTaskReminder = async (req, res, next) => {
  const { remindMe = true, reminderDate, reminderDescription } = req.body;

  const taskId = req.params.id;
  try {
    if (!taskId) return res.send(errorRes(401, "taskId required"));

    const myTask = await taskModel.findById(taskId);

    if (!myTask) return res.send(errorRes(404, "task not found"));

    const resp = await taskModel
      .findByIdAndUpdate(taskId, {
        ...req.body,
      })
      .populate(taskPopulateOptions);

    return res.send(
      successRes(200, "Task updated", {
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const updateFeedback = async (req, res, next) => {
  const {
    stage,
    status,
    intrestedStatus,
    feedback,
    document,
    recording,
    leadStatus,
    taskCompleted,
    lead,
    task,
    siteVisitInterested,
    projects,
    requirement,
    siteVisitInterestedDate,
  } = req.body;
  const user = req.user;
  // console.log(req.body);

  try {
    if (lead == null) return res.send(errorRes(404, "Lead not found"));

    const startDate = new Date(); // Current date
    const theLead = await leadModelV2.findByIdAndUpdate(lead, {
      clientInterestedStatus: intrestedStatus,
      interestedStatus: leadStatus,
      siteVisitInterested,
      siteVisitInterestedDate,
      projects,
      requirement,
      $addToSet: {
        callHistory: {
          caller: user?._id,
          callDate: startDate,
          remark: status ?? "",
          stage: stage ?? "",
          feedback: feedback ?? "",
          document: document,
          recording: recording,
          interestedStatus: intrestedStatus,
        },
        updateHistory: {
          employee: user?._id,
          changes: feedback ?? "task updated",
          updatedAt: startDate,
          remark: stage,
        },
      },
    });

    if (task != null) {
      const statusValue = taskCompleted ? taskCompleted.toLowerCase() : "";
      const resp = await taskModel
        .findByIdAndUpdate(task, {
          completed: true,
          completedDate: startDate,
        })
        .populate(taskPopulateOptions);
    }

    return res.send(
      successRes(200, "Feedback added", {
        data: true,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const updateFeedbackV2 = async (req, res, next) => {
  const {
    taskCompleted,
    leadStage,
    callStatus,
    tag,
    intrestedStatus,
    feedback,
    reminderType,
    reminderDate,
    siteVisitInterested,
    siteVisitInterestedDate,
    document,
    recording,
    leadStatus,
    lead,
    task,
    projects,
    requirement,
  } = req.body;
  const user = req.user;
  // console.log(req.body);

  try {
    if (lead == null) return res.send(errorRes(404, "Lead not found"));
    const startDate = new Date(); // Current date
    let lostEntry;
    const leadInfo = await leadModelV2.findById(lead, {
      cycle: 1,
      cpNoteResolved: 1,
      leadType: 1,
    });

    if (leadStage?.toLowerCase() === "lost") {
      // console.log(leadInfo);
      lostEntry = {
        employee: leadInfo?.cycle?.teamLeader,
        date: startDate,
        remark: leadStage,
      };
    }

    const leadUpdates = {
      clientInterestedStatus: intrestedStatus,
      interestedStatus: leadStatus,
      siteVisitInterested,
      siteVisitInterestedDate,
      projects,
      requirement,
      ...(leadInfo.cpNoteResolved === false ? { cpNoteResolved: true } : {}),
      ...(leadInfo?.leadType === "internal-lead" &&
      callStatus?.toLowerCase() === "call connected"
        ? { "cycle.internalCallDone": true }
        : {}),
      // cpNoteResolved:
      // leadInfo
      $addToSet: {
        callHistory: {
          caller: user?._id,
          callDate: startDate,

          tag: tag,
          remark: callStatus ?? "",
          stage: leadStage ?? "",
          interestedStatus: intrestedStatus,
          interestedVisit: siteVisitInterested,
          reminderType: reminderType,
          feedback: feedback ?? "",
          document: document,
          recording: recording,
        },
        updateHistory: {
          employee: user?._id,
          changes: feedback ?? "task updated",
          updatedAt: startDate,
          remark: leadStage,
        },
        ...(lostEntry
          ? {
              lostHistory: lostEntry,
            }
          : {}),
      },
    };
    const theLead = await leadModelV2.findByIdAndUpdate(lead, leadUpdates);

    let datas = {};
    //
    const taskFound = await taskModel.findByIdAndUpdate(task);
    try {
      const now = moment().tz(zone);
      // const momentDueDate = moment(taskFound.reminderDueDate).tz(zone);
      if (reminderDate != null) {
        const due = moment(reminderDate).tz(zone).add(30, "minutes").toDate();
        datas = {
          ...datas,
          reminderDate: reminderDate,
          reminderDueDate: due,
        };
      }
      if (
        taskFound.reminderDueDate != null &&
        now.isBefore(taskFound.reminderDueDate)
      ) {
        //
        datas = {
          //
          ...datas,

          reminderCompleted: true,
        };
      }
    } catch (error) {
      //safe
      console.log(error);
    }
    //

    if (task != null || taskFound != null) {
      const statusValue = taskCompleted ? taskCompleted.toLowerCase() : "";
      // console.log({
      //   completed: true,
      //   completedDate: startDate,
      //   reminderDate: reminderDate,
      //   reminderType: reminderType,
      //   reminderDescription: feedback,
      //   ...(reminderDate != null ? { remindMe: true } : {}),
      //   ...(datas ? { ...datas } : {}),
      // });
      const updateTask = {
        completed: true,
        completedDate: startDate,
        reminderDate: reminderDate,
        reminderType: reminderType,
        reminderDescription: feedback,
        ...(reminderDate != null ? { remindMe: true } : {}),
        ...(datas ? { ...datas } : {}),
      };
      const resp = await taskModel
        .findByIdAndUpdate(task ?? taskFound?._id, updateTask)
        .populate(taskPopulateOptions);
    }

    return res.send(
      successRes(200, "Feedback added", {
        data: true,
      })
    );
  } catch (error) {
    console.log(error);

    return next(error);
  }
};

export const getTaskTeamReminderPaginated = async (req, res, next) => {
  const id = req.params.id;
  const { status, query } = req.query;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;

  try {
    //
    const now = moment().tz(zone).toDate();
    const now30Min = moment().tz(zone).add(30, "minute").toDate();
    const endOfDay = moment().tz(zone).endOf("day").toDate();
    let statusToFind = {
      assignBy: id,
      reminderDate: { $ne: null },
      cycleDate: { $gte: now },
    };
    if (status?.toLowerCase() === "missed") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
          },

          {
            //
            reminderDueDate: { $gte: now },
          },
          {
            //
            reminderCompleted: false,
          },
        ],
      };
    }
    // active
    else if (status?.toLowerCase() === "active") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
          },
          {
            reminderDueDate: { $ne: null },
          },
          {
            //
            reminderDate: { $gte: now, $lte: now30Min },
          },
          {
            //
            reminderCompleted: false,
          },
        ],
      };
    }
    // upcoming - ok 1
    else if (status?.toLowerCase() === "upcoming") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
          },
          {
            reminderDueDate: { $ne: null },
          },

          {
            //
            reminderDate: { $gte: now, $lte: endOfDay },
          },

          {
            //
            reminderCompleted: false,
          },
        ],
      };
    }
    // completed
    else if (status?.toLowerCase() === "completed") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
          },
          {
            //
            reminderDueDate: { $gte: now },
          },
          {
            //
            reminderCompleted: true,
          },
        ],
      };
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      searchConditions.push(
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
        }
      );

      if (isNumberQuery) {
        searchConditions.push(
          isNumberQuery
            ? {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$phoneNumber" },
                    regex: query,
                  },
                },
              }
            : null
        );
      }

      statusToFind.$or = searchConditions;
    }

    const tasks = await taskModel
      .find(statusToFind)
      .skip(skip)
      .limit(limit)
      .populate(taskReminderPopulateOptions)
      .sort({ transferDate: -1, assignDate: -1 });

    const counts = await taskModel.aggregate([
      {
        $match: {
          assignBy: id,
          // teamLeader: id,
          cycleDate: { $gte: now },
        },
      },
      {
        $facet: {
          totalTasks: [
            {
              $match: {
                reminderDate: { $ne: null },
              },
            },
            { $count: "count" },
          ],
          missedTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                  },

                  {
                    //
                    reminderDueDate: { $gte: now },
                  },
                  {
                    //
                    reminderCompleted: false,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          activeTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                  },
                  {
                    reminderDueDate: { $ne: null },
                  },

                  {
                    //
                    reminderDate: { $gte: now, $lte: now30Min },
                  },
                  {
                    //
                    reminderCompleted: false,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          upcomingTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                  },
                  {
                    reminderDueDate: { $ne: null },
                  },

                  {
                    //
                    reminderDate: { $gte: now, $lte: endOfDay },
                  },

                  {
                    //
                    reminderCompleted: false,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          completedTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                  },
                  {
                    //
                    reminderDueDate: { $gte: now },
                  },
                  {
                    //
                    reminderCompleted: true,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
        },
      },
      {
        $addFields: {
          totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
          missedTasks: { $arrayElemAt: ["$missedTasks.count", 0] },
          activeTasks: { $arrayElemAt: ["$activeTasks.count", 0] },
          upcomingTasks: { $arrayElemAt: ["$upcomingTasks.count", 0] },
          completedTasks: { $arrayElemAt: ["$completedTasks.count", 0] },
        },
      },
      {
        $project: {
          totalTasks: 1,
          missedTasks: 1,
          activeTasks: 1,
          upcomingTasks: 1,
          completedTasks: 1,
        },
      },
    ]);

    const {
      totalTasks = 0,
      missedTasks = 0,
      activeTasks = 0,
      upcomingTasks = 0,
      completedTasks = 0,
    } = counts[0] || {};

    const totalPages = Math.ceil(totalTasks / limit);

    return successRes2(res, 200, "My Reminders", {
      page,
      totalPages,
      totalTasks,
      missedTasks,
      activeTasks,
      upcomingTasks,
      completedTasks,
      data: tasks,
    });
  } catch (error) {
    //
    console.log(error);
    return errorRes2(res, 500, error);
  }
};
export const getTaskMyReminderPaginated = async (req, res, next) => {
  const id = req.params.id;
  const { status, query } = req.query;
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;

  try {
    //
    const now = moment().tz(zone).toDate();
    const now30Min = moment().tz(zone).add(30, "minute").toDate();
    const endOfDay = moment().tz(zone).endOf("day").toDate();
    let statusToFind = {
      assignTo: id,
      reminderDate: { $ne: null },
      cycleDate: { $gte: now },
    };
    if (status?.toLowerCase() === "missed") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
          },

          {
            //
            reminderDueDate: { $gte: now },
          },
          {
            //
            reminderCompleted: false,
          },
        ],
      };
    }
    // active
    else if (status?.toLowerCase() === "active") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
            reminderDueDate: { $ne: null },
          },
          {
            //
            reminderDate: { $gte: now, $lte: now30Min },
            reminderCompleted: false,
          },
        ],
      };
    }
    // upcoming
    else if (status?.toLowerCase() === "upcoming") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
            reminderDueDate: { $ne: null },
          },
          {
            //
            reminderDate: { $gte: now, $lte: endOfDay },
            reminderCompleted: false,
          },
        ],
      };
    }
    // completed
    else if (status?.toLowerCase() === "completed") {
      statusToFind = {
        ...statusToFind,
        $and: [
          {
            reminderDate: { $ne: null },
          },
          {
            //
            reminderDueDate: { $gte: now },
          },
          {
            //
            reminderCompleted: true,
          },
        ],
      };
    }

    if (query) {
      const isNumberQuery = !isNaN(query);
      const searchConditions = [];

      // Add search conditions based on the query type
      searchConditions.push(
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
        }
      );

      if (isNumberQuery) {
        searchConditions.push(
          isNumberQuery
            ? {
                $expr: {
                  $regexMatch: {
                    input: { $toString: "$phoneNumber" },
                    regex: query,
                  },
                },
              }
            : null
        );
      }

      statusToFind.$or = searchConditions;
    }

    const tasks = await taskModel
      .find(statusToFind)
      .skip(skip)
      .limit(limit)
      .populate(taskReminderPopulateOptions)
      .sort({ transferDate: -1, assignDate: -1 });

    const counts = await taskModel.aggregate([
      {
        $match: {
          assignTo: id,
          // teamLeader: id,
          cycleDate: { $gte: now },
        },
      },
      {
        $facet: {
          totalTasks: [
            {
              $match: {
                reminderDate: { $ne: null },
              },
            },
            { $count: "count" },
          ],
          missedTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                  },

                  {
                    //
                    reminderDueDate: { $gte: now },
                  },
                  {
                    //
                    reminderCompleted: false,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          activeTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                    reminderDueDate: { $ne: null },
                  },
                  {
                    //
                    reminderDate: { $gte: now, $lte: now30Min },
                    reminderCompleted: false,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          upcomingTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                    reminderDueDate: { $ne: null },
                  },
                  {
                    //
                    reminderDate: { $gte: now, $lte: endOfDay },
                    reminderCompleted: false,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
          completedTasks: [
            {
              $match: {
                $and: [
                  {
                    reminderDate: { $ne: null },
                  },
                  {
                    //
                    reminderDueDate: { $gte: now },
                  },
                  {
                    //
                    reminderCompleted: true,
                  },
                ],
              },
            },
            { $count: "count" },
          ],
        },
      },
      {
        $addFields: {
          totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
          missedTasks: { $arrayElemAt: ["$missedTasks.count", 0] },
          activeTasks: { $arrayElemAt: ["$activeTasks.count", 0] },
          upcomingTasks: { $arrayElemAt: ["$upcomingTasks.count", 0] },
          completedTasks: { $arrayElemAt: ["$completedTasks.count", 0] },
        },
      },
      {
        $project: {
          totalTasks: 1,
          missedTasks: 1,
          activeTasks: 1,
          upcomingTasks: 1,
          completedTasks: 1,
        },
      },
    ]);

    const {
      totalTasks = 0,
      missedTasks = 0,
      activeTasks = 0,
      upcomingTasks = 0,
      completedTasks = 0,
    } = counts[0] || {};

    const totalPages = Math.ceil(totalTasks / limit);

    return successRes2(res, 200, "My Reminders", {
      page,
      totalPages,
      totalTasks,
      missedTasks,
      activeTasks,
      upcomingTasks,
      completedTasks,
      data: tasks,
    });
  } catch (error) {
    //
    console.log(error);
    return errorRes2(res, 500, error);
  }
};

export const updateFeedbackWithTimer = async (req, res, next) => {
  const {
    taskCompleted,
    leadStage,
    callStatus,
    tag,
    intrestedStatus,
    feedback,
    reminderType,
    reminderDate,
    siteVisitInterested,
    siteVisitInterestedDate,
    document,
    recording,
    leadStatus,
    lead,
    task,
    projects,
    requirement,
  } = req.body;
  const user = req.user;

  try {
    if (!lead) return res.send(errorRes(404, "Lead not found"));

    const startDate = new Date();
    let lostEntry;
    let isCountable;

    const leadInfo = await leadModelV2.findById(lead, {
      cycle: 1,
      cpNoteResolved: 1,
      leadType: 1,
      callHistory: 1,
      createdAt: 1,
      clientInterestedStatus: 1,
    });

    if (leadStage?.toLowerCase() === "lost") {
      lostEntry = {
        employee: leadInfo?.cycle?.teamLeader,
        date: startDate,
        remark: leadStage,
      };
    }

    const now = moment();
    let grace = moment(leadInfo.feedbackGraceTime);
    let created = moment(leadInfo.createdAt);
    // const feedbackGraceDiff = grace.isValid() ? now.isAfter(grace) : false;
    if (grace.isValid()) {
      created = grace;
    }
    const createdDiff = now.diff(created, "minutes");
    // let validDiff = createdDiff <= 20 || feedbackGraceDiff;

    console.log(createdDiff);

    //first cond: call history is empty

    if (
      intrestedStatus?.toLowerCase() === "interested" &&
      callStatus?.toLowerCase() === "call connected" &&
      createdDiff <= 20
    ) {
      isCountable = true;
    }

    const leadUpdates = {
      ...(intrestedStatus ? { clientInterestedStatus: intrestedStatus } : {}),
      ...(leadStatus ? { interestedStatus: leadStatus } : {}),
      siteVisitInterested,
      siteVisitInterestedDate,
      projects,
      requirement,
      ...(isCountable ? { isCountable: true } : {}), // mark here
      ...(leadInfo.cpNoteResolved === false ? { cpNoteResolved: true } : {}),
      ...(leadInfo?.leadType === "internal-lead" &&
      callStatus?.toLowerCase() === "call connected"
        ? { "cycle.internalCallDone": true }
        : {}),
      $addToSet: {
        callHistory: {
          caller: user?._id,
          callDate: startDate,
          tag: tag,
          remark: callStatus ?? "",
          stage: leadStage ?? "",
          interestedStatus: intrestedStatus,
          interestedVisit: siteVisitInterested,
          reminderType: reminderType,
          feedback: feedback ?? "",
          document: document,
          recording: recording,
        },
        updateHistory: {
          employee: user?._id,
          changes: feedback ?? "task updated",
          updatedAt: startDate,
          remark: leadStage,
        },
        ...(lostEntry ? { lostHistory: lostEntry } : {}),
      },
    };

    await leadModelV2.findByIdAndUpdate(lead, leadUpdates);
    let datas = {};
    //
    const taskFound = await taskModel.findByIdAndUpdate(task);
    try {
      const now = moment().tz(zone);
      // const momentDueDate = moment(taskFound.reminderDueDate).tz(zone);
      if (reminderDate != null) {
        const due = moment(reminderDate).tz(zone).add(30, "minutes").toDate();
        datas = {
          ...datas,
          reminderDate: reminderDate,
          reminderDueDate: due,
        };
      }
      if (
        taskFound?.reminderDueDate != null &&
        now.isBefore(taskFound.reminderDueDate)
      ) {
        //
        datas = {
          //
          ...datas,

          reminderCompleted: true,
        };
      }
    } catch (error) {
      //safe
      console.log(error);
    }
    //

    if (task != null || taskFound != null) {
      const statusValue = taskCompleted ? taskCompleted.toLowerCase() : "";
      // console.log({
      //   completed: true,
      //   completedDate: startDate,
      //   reminderDate: reminderDate,
      //   reminderType: reminderType,
      //   reminderDescription: feedback,
      //   ...(reminderDate != null ? { remindMe: true } : {}),
      //   ...(datas ? { ...datas } : {}),
      // });
      const updateTask = {
        completed: true,
        completedDate: startDate,
        reminderDate: reminderDate,
        reminderType: reminderType,
        reminderDescription: feedback,
        ...(reminderDate != null ? { remindMe: true } : {}),
        ...(datas ? { ...datas } : {}),
      };
      const resp = await taskModel
        .findByIdAndUpdate(task ?? taskFound?._id, updateTask)
        .populate(taskPopulateOptions);
    }
    return res.send(successRes(200, "Feedback added", { data: true }));
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

export const getLeadsTimer = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.send(errorRes(400, "id is required"));
    }

    const employee = await employeeModel.findById(id);
    if (!employee) {
      return res.send(errorRes(404, "Employee not found"));
    }
    let searchId = employee.reportingTo;

    // console.log(id);

    // console.log(employee.designation);
    if (
      employee.designation === "desg-senior-closing-manager" ||
      employee.designation === "desg-site-head" ||
      employee.designation === "desg-post-sales-head"
    ) {
      searchId = id;
    }
    // console.log(searchId);
    const twentyMinsAgo = moment().subtract(20, "minutes").toDate();

    const leads = await leadModelV2
      .find(
        {
          "cycle.teamLeader": searchId,

          $or: [
            { createdAt: { $gte: twentyMinsAgo } },
            {
              //
              feedbackGraceTime: { $gte: moment().tz("Asia/Kolkata").toDate() },
            },
          ],
        },
        { firstName: 1, lastName: 1, phoneNumber: 1, createdAt: 1, taskRef: 1 }
      )
      .sort({ createdAt: -1 })
      .populate([
        {
          path: "taskRef",
          populate: [
            // {
            //   path: "lead",
            //   populate: leadPopulateOptions,
            // },
            {
              path: "assignBy",
              select: "firstName lastName",
              populate: [
                { path: "designation" },
                {
                  path: "reportingTo",
                  select: "firstName lastName",
                  populate: [{ path: "designation" }],
                },
              ],
            },
            {
              path: "assignTo",
              select: "firstName lastName",
              populate: [
                { path: "designation" },
                {
                  path: "reportingTo",
                  select: "firstName lastName",
                  populate: [{ path: "designation" }],
                },
              ],
            },
            {
              path: "transferTaskFrom",
              select: "firstName lastName",
            },
          ],
        },
      ]);
    return res.send(successRes(200, "Filtered Leads", { data: leads }));
  } catch (error) {
    console.error(error);
    return errorRes2(res, 500, error.message || "Server Error");
  }
};
