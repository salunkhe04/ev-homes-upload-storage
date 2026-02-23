import moment from "moment/moment.js";
import approvalStepModel from "../model/approvalStep.model.js";
import employeeModel from "../model/employee.model.js";
import { errorRes, successRes } from "../model/response.js";
import shiftModel from "../model/attendance/shift/shift.model.js";
import shiftPlannerModel from "../model/attendance/shift/shiftPlannerRequest.model.js";
import { shiftPlannerRequestPopulateOptions } from "../utils/constant.js";
import logger from "../utils/logger.js";

export const getShiftPlannerRequests = async (req, res, next) => {
  try {
    const resp = await shiftPlannerModel
      .find()
      .populate(shiftPlannerRequestPopulateOptions);

    const approvedList = resp.filter((ele) => ele.requestStatus === "approved");
    const rejectedList = resp.filter((ele) => ele.requestStatus === "rejected");
    const pendingList = resp.filter((ele) => ele.requestStatus === "pending");

    return res.send(
      successRes(200, "get shift planner", {
        data: resp,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error ${e}`));
  }
};

export const getPlannerRequestsByAppliedBy = async (req, res, next) => {
  const id = req.params.id;

  try {
    const emp = await employeeModel.findById(id);
    // logger.info(emp);

    const resp = await shiftPlannerModel
      .find({ appliedBy: emp._id })
      .populate(shiftPlannerRequestPopulateOptions);
    //   if(resp)return res.send(
    //     errorRes(404, "no shift planned", )
    //   );

    const approvedList = resp.filter((ele) => ele.requestStatus === "approved");
    const rejectedList = resp.filter((ele) => ele.requestStatus === "rejected");
    const pendingList = resp.filter((ele) => ele.requestStatus === "pending");

    return res.send(
      successRes(200, "get shift planner", {
        data: resp,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error ${e}`));
  }
};

export const getPlannerRequestsByAppliedByApproved = async (req, res, next) => {
  const id = req.params.id;

  try {
    const emp = await employeeModel.findById(id);
    // logger.info(emp);

    const resp = await shiftPlannerModel
      .find({ appliedBy: emp._id, requestStatus: "approved" })
      .populate(shiftPlannerRequestPopulateOptions);
    //   if(resp)return res.send(
    //     errorRes(404, "no shift planned", )
    //   );

    const approvedList = resp.filter((ele) => ele.requestStatus === "approved");
    const rejectedList = resp.filter((ele) => ele.requestStatus === "rejected");
    const pendingList = resp.filter((ele) => ele.requestStatus === "pending");

    return res.send(
      successRes(200, "get shift planner", {
        data: resp,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error ${e}`));
  }
};

export const planShift = async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = req.body;
    if (!id) return res.send(errorRes(401, `id is required `));
    if (!body) return res.send(errorRes(401, `body is required `));

    const applybyEmployee = await employeeModel.findById(id);
    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    const configs = await approvalStepModel.findOne({
      requestType: "shift-planner",
    });

    let approvalSteps = [];
    configs.steps.map((ele, index) => {
      if (ele.role == "reportingTo") {
        approvalSteps.push({
          level: index,
          adminId: applybyEmployee.reportingTo,
          status: "pending",
        });
      } else {
        approvalSteps.push({
          level: index,
          adminId: ele.adminId,
          status: "pending",
        });
      }
    });

    const newRequest = await shiftPlannerModel.create({
      ...body,
      appliedBy: id,
      approvalSteps,
      reportingTo: applybyEmployee.reportingTo,
      requestStatus: "pending",

      aproveReason: "pending",
    });

    await newRequest.save();
    return res.send(
      successRes(200, "Shift Added successfully", { data: newRequest }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error ${e}`));
  }
};

export const delteShiftPlanner = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Shift ID is required"));
    const deleteShift = await shiftPlannerModel.findByIdAndDelete(id);
    if (!deleteShift)
      return res.send(errorRes(404, `Shift Planned not found with ID: ${id}`));
    return res.send(
      successRes(200, `Shift Planned  deleted successfully`, {
        deleteShift,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export async function updateShiftPlanApproval(req, res) {
  try {
    const { id, status } = req.params;
    const { adminId, reason, approvalReason } = req.body;
    const shiftPlanReq = await shiftPlannerModel
      .findById(id)
      .populate(shiftPlannerRequestPopulateOptions);

    if (!shiftPlanReq) return res.send(errorRes(400, "Request not found"));

    // logger.info(shiftPlanReq);
    const step = shiftPlanReq.approvalSteps.find(
      (s) => s.adminId?._id?.toString() === adminId && s.status === "pending",
    );
    // logger.info("id:", adminId);
    // logger.info("st:", status);
    // logger.info("pproval Steps:", shiftPlanReq.approvalSteps);

    if (!step)
      return res.send(errorRes(403, "No pending approval for this admin"));

    step.status = status;
    step.approvedDate = new Date();
    step.remark = approvalReason;

    if (status === "approved") {
      // logger.info("yes");
      let nextStep = shiftPlanReq.approvalSteps.find(
        (s) => s.level === step.level + 1,
      );

      while (nextStep && nextStep.adminId?._id.toString() === adminId) {
        // logger.info(nextStep);
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.remark = "Auto-approved (same admin)";
        shiftPlanReq.currentLevel = nextStep.level;
        nextStep = shiftPlanReq.approvalSteps.find(
          (s) => s.level === shiftPlanReq.currentLevel + 1,
        );
        // logger.info("update next step");
        // logger.info(nextStep);
        // logger.info("after while");
      }
      // logger.info(shiftPlanReq.currentLevel);

      if (!nextStep) {
        shiftPlanReq.requestStatus = "approved";
      }

      const allStepsApproved = shiftPlanReq.approvalSteps.every(
        (s) => s.status.toLowerCase() === "approved",
      );

      if (allStepsApproved) {
        const today = moment().startOf("day");
        const requestedDate = moment(shiftPlanReq.requestedShiftDate).startOf(
          "day",
        );

        if (requestedDate.isSameOrAfter(today)) {
          try {
            // logger.info("shift update");
          } catch (err) {
            //
            logger.error("Failed shift update:", err);
            return res.send(errorRes(500, "Shift update failed"));
          }
        } else {
          // logger.info("Requested date is in the past");
        }

        shiftPlanReq.requestStatus = "approved";
        shiftPlanReq.approvedDate = new Date();
      }
      if (nextStep && nextStep.adminId.toString() != adminId) {
        shiftPlanReq.currentLevel = nextStep.level;
      }
    } else {
      shiftPlanReq.requestStatus = "rejected";
    }

    await shiftPlanReq.save();
    res.send(successRes(200, `Request ${status}`, { data: shiftPlanReq }));
  } catch (error) {
    //
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
}

export const getReportingToShiftPlanner = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) {
      return res.send(errorRes(401, "Regularization ID required"));
    }

    const shiftPlan = await shiftPlannerModel
      .find({
        "approvalSteps.adminId": id,
      })
      .populate(shiftPlannerRequestPopulateOptions);

    if (shiftPlan.length === 0) {
      return res.send(errorRes(404, "No shift plan records found"));
    }
    const approvedList = shiftPlan.filter(
      (ele) => ele.requestStatus === "approved",
    );
    const rejectedList = shiftPlan.filter(
      (ele) => ele.requestStatus === "rejected",
    );
    const pendingList = shiftPlan.filter(
      (ele) => ele.requestStatus === "pending",
    );

    if (!shiftPlan.length) {
      return res.send(errorRes(404, "No shift plan records found"));
    }
    return res.send(
      successRes(200, "Shift plan records retrieved", {
        data: shiftPlan,
        pendingList,
        approvedList,
        rejectedList,
      }),
    );
  } catch (error) {
    logger.error("Error retrieving shift plan:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getShiftPlannerByDate = async (req, res, next) => {
  const id = req.params.id;
  const date = req.query.date;

  try {
    let startOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
    let endOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

    // logger.info(startOfDay);
    // logger.info(endOfDay);

    const resp = await shiftPlannerModel
      .findOne({
        appliedBy: id,
        requestStatus: "approved",
        requestedShiftDate: { $gte: startOfDay, $lte: endOfDay },
      })
      .populate(shiftPlannerRequestPopulateOptions);

    //
    // logger.info(resp.requestedShiftDate);

    // logger.info(resp);

    return res.send(
      successRes(200, "get shift planner", {
        data: resp,
      }),
    );
  } catch (e) {
    logger.error(e);

    return res.send(errorRes(500, `Server error ${e}`));
  }
};

export const getShiftPByMultiDays = async (req, res) => {
  const id = req.params.id;

  try {
    const startOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const endOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

    const resp = await shiftPlannerModel
      .findOne({
        appliedBy: id,
        requestStatus: "approved",
        $and: [
          {
            requestedShiftDate: { $lte: endOfDay },
          },
          {
            requestedShiftEndDate: { $gte: startOfDay },
          },
        ],
      })
      .populate(shiftPlannerRequestPopulateOptions);

    if (!resp) {
      return res.send(errorRes(404, "No approved shift request found"));
    }

    return res.send(
      successRes(200, "Shift assigned successfully for date range", {
        data: resp,
      }),
    );
  } catch (e) {
    logger.error(e);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
