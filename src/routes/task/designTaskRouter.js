import { Router } from "express";
import designTaskModel from "../../model/task/designTask.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import { sendNotificationWithInfo } from "../../controller/oneSignal.controller.js";
import oneSignalModel from "../../model/oneSignal.model.js";
import { designTaskPopulateOptions } from "../../utils/constant.js";
import moment from "moment-timezone";

const designTaskRouter = Router();
// get all tasks
designTaskRouter.get("/design-tasks", async (req, res, next) => {
  //
  const { assignTo, assignBy, query, status, startDate, endDate, priority } =
    req.query;
  //
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;

  try {
    let statusToFind = {
      //
      ...(assignTo ? { assignTo: assignTo } : {}),
      ...(assignBy ? { assignBy: assignBy } : {}),
      ...(priority ? { priority: priority } : {}),
    };
    if (query) {
      let searchFilter = {
        $or: [
          { details: { $regex: query, $options: "i" } },
          { assignTo: { $regex: query, $options: "i" } },
          { assignBy: { $regex: query, $options: "i" } },
        ].filter(Boolean),
      };
      statusToFind = { ...statusToFind, ...searchFilter };
    }

    if (startDate && endDate) {
      statusToFind = {
        ...statusToFind,
        assignDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    if (status === "pendency-request") {
      statusToFind = {
        ...statusToFind,

        "pendency.status": "pending",
      };
    } else if (status === "submission-request") {
      statusToFind = {
        ...statusToFind,
        "approval.status": "pending",
      };
    } else {
      statusToFind = {
        ...statusToFind,
        ...(status ? { status: status } : {}),
      };
    }

    // console.log(JSON.stringify(statusToFind, null, 2));
    const resp = await designTaskModel
      .find(statusToFind)
      .skip(skip)
      .limit(limit)
      .sort({ assignDate: -1 })
      .populate(designTaskPopulateOptions);

    const totalItems = await designTaskModel.countDocuments(statusToFind);

    const totalPages = Math.ceil(totalItems / limit);

    //
    return successRes2(res, 200, "design Tasks", {
      page,
      limit,
      totalPages,
      totalItems,
      data: resp,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message}`);
  }
  //
});

// Assign Task
designTaskRouter.post("/design-task-assign", async (req, res, next) => {
  //
  const { assignTo, assignBy, title, details, deadline } = req.body;
  if (!assignTo) return errorRes2(res, 401, `assignTo is required`);
  if (!assignBy) return errorRes2(res, 401, `assignBy is required`);
  if (!title) return errorRes2(res, 401, `Task details is required`);
  if (!details) return errorRes2(res, 401, `Task details is required`);
  if (!deadline) return errorRes2(res, 401, `deadline is required`);
  //
  try {
    let newDoc = {
      //
      ...req.body,
    };
    const resp = await designTaskModel.create(newDoc);
    //

    const updatedTask = await designTaskModel
      .findById(resp._id)
      .populate(designTaskPopulateOptions);

    // find user device id
    const foundTLPlayerId = await oneSignalModel.findOne({
      docId: assignTo,
      role: "employee",
    });
    //
    if (foundTLPlayerId.playerId != null) {
      // notify user
      await sendNotificationWithInfo({
        playerIds: [foundTLPlayerId.playerId],
        title: "New task assigned",
        message: `${details}`,
        data: {
          type: "designTeamTask",
        },
      });
    }

    //
    return successRes2(res, 200, `New Task Assinged ${assignTo}`, {
      data: updatedTask,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message}`);
  }
  //
});

// get pendency approval Request
designTaskRouter.get("/design-task-pendencies", async (req, res, next) => {
  //
  const { assignTo, assignBy, status = "pending" } = req.query;
  //
  try {
    let statusToFind = {
      //
      ...(assignTo ? { assignTo: assignTo } : {}),
      ...(assignBy ? { assignBy: assignBy } : {}),
      "pendency.status": status,
    };
    const resp = await designTaskModel
      .find(statusToFind)
      .populate(designTaskPopulateOptions);
    //
    return successRes2(res, 200, "design Tasks", {
      data: resp,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message}`);
  }
  //
});

// get submission approval Request
designTaskRouter.get("/design-task-submissions", async (req, res, next) => {
  //
  const { assignTo, assignBy, status = "pending" } = req.query;
  //
  try {
    let statusToFind = {
      //
      ...(assignTo ? { assignTo: assignTo } : {}),
      ...(assignBy ? { assignBy: assignBy } : {}),
      "approval.status": status,
    };
    const resp = await designTaskModel
      .find(statusToFind)
      .populate(designTaskPopulateOptions);
    //
    return successRes2(res, 200, "design Tasks", {
      data: resp,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message}`);
  }
  //
});

// get dashboard Info
designTaskRouter.get(
  "/design-task-dashboard/:assignTo",
  async (req, res, next) => {
    //
    const id = req.params.assignTo;
    //
    if (!id) return errorRes2(res, 401, `id required`);

    try {
      const aggre = await designTaskModel.aggregate([
        {
          $match: {
            //
            assignTo: id,
          },
        },
        {
          $facet: {
            total: [{ $count: "count" }],
            completed: [
              {
                $match: {
                  //
                  status: "completed",
                },
              },
              { $count: "count" },
            ],
            incomplete: [
              {
                $match: {
                  //
                  status: "not-completed",
                },
              },
              { $count: "count" },
            ],
            pendency: [
              {
                $match: {
                  //
                  status: "pendency",
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $addFields: {
            total: { $arrayElemAt: ["$total.count", 0] },
            completed: { $arrayElemAt: ["$completed.count", 0] },
            incomplete: { $arrayElemAt: ["$incomplete.count", 0] },
            pendency: { $arrayElemAt: ["$pendency.count", 0] },
          },
        },
        {
          $project: {
            total: 1,
            completed: 1,
            incomplete: 1,
            pendency: 1,
          },
        },
      ]);

      const result = await designTaskModel.aggregate([
        {
          $match: {
            assignTo: id,
          },
        },
        {
          $addFields: {
            taskDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$assignDate",
                timezone: "Asia/Kolkata", // ✅ IMPORTANT
              },
            },
          },
        },
        {
          $group: {
            _id: "$taskDate",

            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            incomplete: {
              $sum: { $cond: [{ $eq: ["$status", "not-completed"] }, 1, 0] },
            },
            pendency: {
              $sum: { $cond: [{ $eq: ["$status", "pendency"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            // returns ISODate at IST midnight but stored as UTC
            date: {
              $dateFromString: {
                dateString: "$_id",
                timezone: "Asia/Kolkata",
              },
            },
            completed: 1,
            incomplete: 1,
            pendency: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      const {
        total = 0,
        completed = 0,
        incomplete = 0,
        pendency = 0,
      } = aggre[0] || {};
      //
      return successRes2(res, 200, "design Tasks", {
        total,
        completed,
        incomplete,
        pendency,
        data: { result, total, completed, incomplete },
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

// get dashboard Info
designTaskRouter.get(
  "/design-task-tl-dashboard/:assignBy",
  async (req, res, next) => {
    //
    const id = req.params.assignBy;
    //
    if (!id) return errorRes2(res, 401, `id required`);

    try {
      const aggre = await designTaskModel.aggregate([
        {
          $facet: {
            total: [
              {
                $match: {
                  assignBy: id,
                },
              },
              { $count: "count" },
            ],
            completed: [
              {
                $match: {
                  //
                  status: "completed",
                },
              },
              { $count: "count" },
            ],
            incomplete: [
              {
                $match: {
                  //
                  status: "not-completed",
                  assignBy: id,
                },
              },
              { $count: "count" },
            ],
            pendency: [
              {
                $match: {
                  //
                  status: "pendency",
                  assignBy: id,
                },
              },
              { $count: "count" },
            ],
            approval: [
              {
                $match: {
                  //
                  "approval.status": "pending",
                  assignBy: id,
                },
              },
              { $count: "count" },
            ],
            pendencyRequest: [
              {
                $match: {
                  //
                  "pendency.status": "pending",
                  assignBy: id,
                },
              },
              { $count: "count" },
            ],
            approvalRequest: [
              {
                $match: {
                  //
                  "approval.status": "pending",
                  assignBy: id,
                },
              },
              { $count: "count" },
            ],
            tasks: [
              {
                $match: {
                  assignTo: id,
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $addFields: {
            total: { $arrayElemAt: ["$total.count", 0] },
            completed: { $arrayElemAt: ["$completed.count", 0] },
            incomplete: { $arrayElemAt: ["$incomplete.count", 0] },
            pendency: { $arrayElemAt: ["$pendency.count", 0] },
            approval: { $arrayElemAt: ["$approval.count", 0] },
            pendencyRequest: { $arrayElemAt: ["$pendencyRequest.count", 0] },
            approvalRequest: { $arrayElemAt: ["$approvalRequest.count", 0] },
            tasks: { $arrayElemAt: ["$tasks.count", 0] },
          },
        },
        {
          $project: {
            total: 1,
            completed: 1,
            incomplete: 1,
            pendency: 1,
            approval: 1,
            pendencyRequest: 1,
            approvalRequest: 1,
            tasks: 1,
          },
        },
      ]);

      const {
        total = 0,
        completed = 0,
        incomplete = 0,
        pendency = 0,
        approval = 0,
        pendencyRequest = 0,
        approvalRequest = 0,
        tasks = 0,
      } = aggre[0] || {};
      //
      return successRes2(res, 200, "design Tasks", {
        total,
        completed,
        incomplete,
        pendency,
        approval,
        pendencyRequest,
        approvalRequest,
        tasks,

        data: {
          total,
          completed,
          incomplete,
          pendency,
          approval,
          pendencyRequest,
          approvalRequest,
          tasks,
        },
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

// update refrence Images
designTaskRouter.post(
  "/design-task-update-reference-img/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const { referenceImages } = req.body;
    if (!id) return errorRes2(res, 401, `id is required`);
    //
    if (!referenceImages)
      return errorRes2(res, 401, `referenceImages is required`);
    //
    if (!Array.isArray(referenceImages))
      return errorRes2(res, 401, `referenceImages should be list`);
    //
    if (referenceImages.length === 0)
      return errorRes2(res, 401, `referenceImages is Empty`);

    //
    try {
      const foundTask = await designTaskModel.findById(id);
      //
      if (!foundTask) return errorRes2(res, 401, `Task Not Found`);
      //
      foundTask.referenceImages = referenceImages;
      await foundTask.save();
      //
      const updatedTask = await designTaskModel
        .findById(id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: foundTask.assignTo,
        role: "employee",
      });
      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: "Reference Images Added",
          message: `check & follow up task`,
          data: {
            type: "designTeamTask",
          },
        });
      }

      //
      return successRes2(res, 200, `refrence Images updated`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

designTaskRouter.post(
  "/design-task-update-deadline/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const { deadline } = req.body;
    if (!id) return errorRes2(res, 401, `id is required`);
    //
    if (!deadline) return errorRes2(res, 401, `deadline is required`);
    //
    const isvalidDeadline = moment(deadline).isValid();
    if (!isvalidDeadline) {
      return errorRes2(res, 401, `Invalid deadline Date`);
    }
    let validDate = isvalidDeadline
      ? moment(deadline).tz("Asia/Kolkata")
      : null;

    //
    try {
      const foundTask = await designTaskModel.findById(id);
      //

      if (!foundTask) return errorRes2(res, 401, `Task Not Found`);
      //
      if (validDate != null) {
        foundTask.deadline = validDate.toDate();
        await foundTask.save();
      }
      //
      const updatedTask = await designTaskModel
        .findById(id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: foundTask.assignTo,
        role: "employee",
      });
      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: "Deadline updated",
          message: `check & follow up task`,
          data: {
            type: "designTeamTask",
          },
        });
      }

      //
      return successRes2(res, 200, `Deadline updated`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

// apply pendancy
designTaskRouter.post(
  "/design-task-apply-pendency/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const { reason, appliedDate = new Date() } = req.body;

    if (!id) return errorRes2(res, 401, `id is required`);

    if (!reason) return errorRes2(res, 401, `reason is required`);

    //
    try {
      const foundTask = await designTaskModel.findById(id);
      //
      if (!foundTask) return errorRes2(res, 401, `Task Not Found`);
      //
      if (foundTask.pendency.status === "pending")
        return errorRes2(
          res,
          400,
          `you've already have pending pendency request.`,
        );
      //
      foundTask.pendency.reason = reason;
      foundTask.pendency.appliedDate = appliedDate;
      foundTask.pendency.status = "pending";
      const oldTimeline = foundTask.timeline;
      oldTimeline.push({
        type: "apply-pendency",
        reason: foundTask.pendency.reason,
        date: foundTask.pendency.appliedDate,
        status: foundTask.pendency.status,
        user: foundTask.assignTo,
      });
      foundTask.timeline = oldTimeline;

      await foundTask.save();
      //
      const updatedTask = await designTaskModel
        .findById(id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: foundTask.assignBy,
        role: "employee",
      });
      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: "Task Pendacy Applied",
          message: `${updatedTask.assignTo.firstName} has applied for pendency`,
          data: {
            type: "designTLTask",
          },
        });
      }

      //
      return successRes2(res, 200, `Pendency request applied succesfully`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

// apply submission
designTaskRouter.post(
  "/design-task-apply-submission/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const { reason, appliedDate = new Date(), attachments } = req.body;

    if (!id) return errorRes2(res, 401, `id is required`);

    if (!reason) return errorRes2(res, 401, `reason is required`);

    if (!attachments) {
      //
      return errorRes2(res, 401, `attachments required`);
    }
    if (!Array.isArray(attachments)) {
      //
      return errorRes2(res, 401, `attachments should be list`);
    }
    if (attachments.length === 0) {
      //
      return errorRes2(res, 401, `attachments is empty`);
    }

    //
    try {
      const foundTask = await designTaskModel.findById(id);
      //
      if (!foundTask) return errorRes2(res, 401, `Task Not Found`);
      //
      if (foundTask.status === "completed")
        return errorRes2(res, 400, `you've already have completed the task.`);

      if (foundTask.approval.status === "pending")
        return errorRes2(
          res,
          400,
          `you've already have pending submission request.`,
        );

      if (foundTask.approval.status === "approved")
        return errorRes2(
          res,
          400,
          `you've already have approved submission request.`,
        );

      //
      foundTask.approval.reason = reason;
      foundTask.approval.appliedDate = appliedDate;
      foundTask.approval.status = "pending";
      if (attachments) {
        foundTask.approval.attachments = attachments;
      }

      const oldTimeline = foundTask.timeline;
      //
      oldTimeline.push({
        type: "apply-task-submission",
        reason: foundTask.approval.reason,
        date: foundTask.approval.appliedDate,
        status: foundTask.approval.status,
        user: foundTask.assignTo,
        attachments: attachments ?? [],
      });
      foundTask.timeline = oldTimeline;

      await foundTask.save();
      //
      const updatedTask = await designTaskModel
        .findById(id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: foundTask.assignBy,
        role: "employee",
      });
      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: "Task submission Applied",
          message: `${updatedTask.assignTo.firstName} has applied for Task submission`,
          data: {
            type: "designTLTask",
          },
        });
      }

      //
      return successRes2(res, 200, `Task submission applied succesfully`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

// approve pendency
designTaskRouter.post(
  "/design-task-approve-pendency/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const {
      approvalReason,
      status,
      approvalDate = new Date(),
      approveBy,
    } = req.body;

    if (!id) return errorRes2(res, 401, `id is required`);

    if (!status)
      return errorRes2(res, 401, `status is required (approve / reject)`);

    if (!approvalReason) return errorRes2(res, 401, `reason is required`);
    if (!approveBy) return errorRes2(res, 401, `approveBy is required`);

    //
    try {
      const foundTask = await designTaskModel.findById(id);
      //
      if (!foundTask) return errorRes2(res, 401, `Task Not Found`);
      //
      if (foundTask.pendency.status === "approved")
        return errorRes2(res, 400, `you've already approved the request.`);

      //
      foundTask.pendency.approvalReason = approvalReason;
      foundTask.pendency.approvalDate = approvalDate;
      foundTask.pendency.status = status;
      foundTask.pendency.approveBy = approveBy;

      const oldTimeline = foundTask.timeline;
      if (status === "approved") {
        foundTask.status = "pendency";
      } else {
        foundTask.status = "pendency-rejected";
      }

      //
      oldTimeline.push({
        type: "approval-task-pendency",
        reason: foundTask.pendency.approvalReason,
        date: foundTask.pendency.appliedDate,
        status: foundTask.pendency.status,
        user: approveBy ?? foundTask.assignBy,
      });
      foundTask.timeline = oldTimeline;

      await foundTask.save();
      //
      const updatedTask = await designTaskModel
        .findById(id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: foundTask.assignTo,
        role: "employee",
      });

      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: `Task Pendency ${status}`,
          message: `${updatedTask.assignBy?.firstName} ${updatedTask.assignBy?.lastName} has ${status} your Pendency`,
          data: {
            type: "designTeamTask",
          },
        });
      }

      //
      return successRes2(res, 200, `Task pendency request ${status}`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

// approve submission
designTaskRouter.post(
  "/design-task-approve-submission/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const {
      approvalReason,
      status,
      approvalDate = new Date(),
      approveBy,
    } = req.body;

    if (!id) return errorRes2(res, 401, `id is required`);

    if (!status)
      return errorRes2(res, 401, `status is required (approve / reject)`);

    if (!approvalReason) return errorRes2(res, 401, `reason is required`);

    if (!approveBy) return errorRes2(res, 401, `approveBy is required`);

    //
    try {
      const foundTask = await designTaskModel.findById(id);
      //
      if (!foundTask) return errorRes2(res, 401, `Task Not Found`);
      //
      if (foundTask.approval.status === "approved")
        return errorRes2(res, 400, `you've already approved the request.`);

      //
      foundTask.approval.approvalReason = approvalReason;
      foundTask.approval.approvalDate = approvalDate;
      foundTask.approval.status = status;

      foundTask.approval.approveBy = approveBy ?? foundTask.assignBy;
      const oldTimeline = foundTask.timeline;
      if (status === "approved") {
        //
        foundTask.status = "completed";
        foundTask.completedDate = approvalDate;
      } else {
        foundTask.status = "submission-rejected";
      }
      //
      oldTimeline.push({
        type: "approval-task-submission",
        reason: foundTask.approval.approvalReason,
        date: foundTask.approval.appliedDate,
        status: foundTask.approval.status,
        user: approveBy ?? foundTask.assignBy,
        attachments: foundTask.approval.attachments,
      });
      foundTask.timeline = oldTimeline;

      await foundTask.save();
      //
      const updatedTask = await designTaskModel
        .findById(id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: foundTask.assignTo,
        role: "employee",
      });

      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: `Task submission ${status}`,
          message: `${updatedTask.assignBy?.firstName} ${updatedTask.assignBy?.lastName} has ${status} your submission`,
          data: {
            type: "designTeamTask",
          },
        });
      }

      //
      return successRes2(res, 200, `Task submission ${status}`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  },
);

//
designTaskRouter.post(
  "/design-transfer-task-tl/:id",
  async (req, res, next) => {
    //
    const { id } = req.params;
    const { assignTo, reason, deadline } = req.body;
    const user = req.user;

    if (!id) {
      return errorRes2(res, 401, `task id required`);
    }

    try {
      const task = await designTaskModel.findById(id);
      if (!task) {
        return errorRes2(res, 401, `task not found`);
      }
      task.transferTaskFrom = task.assignTo;
      task.assignTo = assignTo;
      task.assignDate = new Date();
      task.deadline = moment(deadline).tz("Asia/Kolkata").toDate();

      const oldTimeline = task.timeline;
      oldTimeline.push({
        type: "transferred-task",
        reason: reason,
        date: new Date(),
        user: task.assignTo,
        assignBy: task.assignTo,
        assignTo: assignTo,
      });
      task.timeline = oldTimeline;

      const updatedTask = await task.save();

      const populatedTask = await designTaskModel
        .findById(updatedTask._id)
        .populate(designTaskPopulateOptions);

      // find user device id
      const foundTLPlayerId = await oneSignalModel.findOne({
        docId: task.assignTo,
        role: "employee",
      });
      //
      if (foundTLPlayerId.playerId != null) {
        // notify user
        await sendNotificationWithInfo({
          playerIds: [foundTLPlayerId.playerId],
          title: "Transferred Task",
          message: `The task has been transferred`,
          data: {
            type: "designTeamTask",
          },
        });
      }

      return successRes2(res, 200, `Task transferred successfully `, {
        data: populatedTask,
      });
    } catch (error) {
      // console.error("Error transferring task:", error); // Debugging: Log the error
      return errorRes2(res, 500, `server error`);
    }
  },
);

//
export default designTaskRouter;
