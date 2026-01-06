import { Router } from "express";
import designTaskModel from "../../model/task/designTask.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import { sendNotificationWithInfo } from "../../controller/oneSignal.controller.js";
import oneSignalModel from "../../model/oneSignal.model.js";
import { designTaskPopulateOptions } from "../../utils/constant.js";

const designTaskRouter = Router();
// get all tasks
designTaskRouter.get("/design-tasks", async (req, res, next) => {
  //
  const { assignTo, assignBy } = req.query;
  //
  try {
    let statusToFind = {
      //
      ...(assignTo ? { assignTo: assignTo } : {}),
      ...(assignBy ? { assignBy: assignBy } : {}),
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

// Assign Task
designTaskRouter.post("/design-task-assign", async (req, res, next) => {
  //
  const { assignTo, assignBy, details, deadline } = req.body;
  if (!assignTo) return errorRes2(res, 401, `assignTo is required`);
  if (!assignBy) return errorRes2(res, 401, `assignBy is required`);
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
            totalTasks: [{ $count: "count" }],
            completed: [
              {
                $match: {
                  //
                  status: "completed",
                },
              },
              { $count: "count" },
            ],
            pending: [
              {
                $match: {
                  //
                  status: "not-completed",
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $addFields: {
            totalTasks: { $arrayElemAt: ["$totalTasks.count", 0] },
            completed: { $arrayElemAt: ["$completed.count", 0] },
            pending: { $arrayElemAt: ["$pending.count", 0] },
          },
        },
        {
          $project: {
            totalTasks: 1,
            completed: 1,
            pending: 1,
          },
        },
      ]);

      const { totalItems = 0, completed = 0, pending = 0 } = aggre[0] || {};
      //
      return successRes2(res, 200, "design Tasks", {
        totalItems,
        completed,
        pending,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  }
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
  }
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
          `you've already have pending pendency request.`
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
  }
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
          `you've already have pending submission request.`
        );

      if (foundTask.approval.status === "approved")
        return errorRes2(
          res,
          400,
          `you've already have approved submission request.`
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
        });
      }

      //
      return successRes2(res, 200, `Task submission Applied`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  }
);

// approve pendency
designTaskRouter.post(
  "/design-task-approve-pendency/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const { approvalReason, status, approvalDate = new Date() } = req.body;

    if (!id) return errorRes2(res, 401, `id is required`);

    if (!status)
      return errorRes2(res, 401, `status is required (approve / reject)`);

    if (!approvalReason) return errorRes2(res, 401, `reason is required`);

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
      const oldTimeline = foundTask.timeline;
      //
      oldTimeline.push({
        type: "approval-task-pendency",
        reason: foundTask.pendency.approvalReason,
        date: foundTask.pendency.appliedDate,
        status: foundTask.pendency.status,
        user: foundTask.assignBy,
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
        });
      }

      //
      return successRes2(res, 200, `Task submission Applied`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  }
);

// approve submission
designTaskRouter.post(
  "/design-task-approve-submission/:id",
  async (req, res, next) => {
    //
    const id = req.params.id;
    const { approvalReason, status, approvalDate = new Date() } = req.body;

    if (!id) return errorRes2(res, 401, `id is required`);

    if (!status)
      return errorRes2(res, 401, `status is required (approve / reject)`);

    if (!approvalReason) return errorRes2(res, 401, `reason is required`);

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
      const oldTimeline = foundTask.timeline;
      if (status === "approved") {
        //
        foundTask.status = "completed";
      }
      //
      oldTimeline.push({
        type: "approval-task-submission",
        reason: foundTask.approval.approvalReason,
        date: foundTask.approval.appliedDate,
        status: foundTask.approval.status,
        user: foundTask.assignBy,
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
        });
      }

      //
      return successRes2(res, 200, `Task submission Applied`, {
        data: updatedTask,
      });
    } catch (error) {
      //
      return errorRes2(res, 500, `${error?.message}`);
    }
    //
  }
);
//
export default designTaskRouter;
