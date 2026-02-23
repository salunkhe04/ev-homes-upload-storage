import approvalStepModel from "../model/approvalStep.model.js";
import employeeModel from "../model/employee.model.js";
import reimbursementModel from "../model/reimbursement.model.js";
import attendanceModel from "../model/attendance/attendance.model.js";
import { errorRes, successRes, successRes2 } from "../model/response.js";
import { reimbursementPopulateOptions } from "../utils/constant.js";
import moment from "moment";

export const getReimbursement = async (req, res, next) => {
  const { applyBy, reportingto, reimbursementStatus, type, paidBy } = req.query;

  let query = {};
  // let typefilter = req.query.type?.toLowerCase();
  let date = req.query.date;
  let dateFilter = {};
  let statusToFind = "";
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    // Date Filtering Based on reimbursementDate
    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          reimbursementDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
      } else if (date === "yesterday") {
        const startOfYesterday = moment()
          .subtract(1, "days")
          .startOf("day")
          .toISOString();
        const endOfYesterday = moment()
          .subtract(1, "days")
          .endOf("day")
          .toISOString();
        dateFilter = {
          reimbursementDate: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
          },
        };
      } else if (date === "last-7-days") {
        const startOf7Days = moment()
          .subtract(7, "days")
          .startOf("day")
          .toISOString();
        const endOf7Days = moment().endOf("day").toISOString();
        dateFilter = {
          reimbursementDate: {
            $gte: startOf7Days,
            $lte: endOf7Days,
          },
        };
      } else if (date === "last-30-days") {
        const startOfMonth = moment()
          .subtract(30, "days")
          .startOf("day")
          .toISOString();
        const endOfMonth = moment().endOf("day").toISOString();
        dateFilter = {
          reimbursementDate: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        };
      }
    }

    if (startDate && endDate) {
      dateFilter = {
        reimbursementDate: {
          $gte: moment(startDate).startOf("day").toISOString(),
          $lte: moment(endDate).endOf("day").toISOString(),
        },
      };
      // logger.info(startDate);
      // logger.info(endDate);

      // logger.info(dateFilter);
    }

    // Add other query filters
    if (applyBy) query.applyBy = applyBy;
    if (reportingto) query.reportingto = reportingto;
    if (reimbursementStatus) query.reimbursementStatus = reimbursementStatus;
    if (type) query.type = type;
    if (paidBy) query.paidBy = paidBy;

    // logger.info("Final Query:", { ...query, ...dateFilter });

    if (applyBy) {
      query.applyBy = applyBy;
    }

    if (reportingto) {
      query.reportingto = reportingto;
    }

    if (reimbursementStatus) {
      query.reimbursementStatus = reimbursementStatus;
    }

    if (type) {
      query.type = type;
    }

    if (paidBy) {
      query.paidBy = paidBy;
    }
    // logger.info(query);

    // Fetch Data
    const reimbursementRecords = await reimbursementModel
      .find({
        ...query,
        ...dateFilter,
        ...(statusToFind ? { reimbursementStatus: statusToFind } : {}),
      })
      .sort({ reimbursementDate: -1 }) // Sort by reimbursementDate
      .populate(reimbursementPopulateOptions);

    // const weekoffs = await reimbursementModel
    // .find(query)
    //    .populate(reimbursementPopulateOptions);

    if (reimbursementRecords.length === 0) {
      return res.send(errorRes(404, "No Reimbursement records found"));
    }

    return res.send(
      successRes(200, "Reimbursement records retrieved", {
        data: reimbursementRecords,
      })
    );
  } catch (error) {
    console.error("Error retrieving Reimbursement:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const addReimbursement = async (req, res, next) => {
  const {
    appliedOn = new Date(),
    reason,
    applyBy,
    attendance,
    aproveReason,
    amount,
    reimbursementStatus,
    type,
    attachment,
    attachment2,
  } = req.body;

  try {
    if (!reason) return res.send(errorRes(401, "Reason is required"));

    //   if (!attendance)
    //     return res.send(errorRes(401, "Attendance ID is required"));

    const applybyEmployee = await employeeModel.findById(applyBy);
    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    const reportingTo = applybyEmployee.reportingTo;

    const reportingToEmployee = await employeeModel.findById(reportingTo);
    if (!reportingToEmployee)
      return res.send(errorRes(404, "Reporting To employee not found"));

    const configs = await approvalStepModel.findOne({
      requestType: "reimbursement",
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

    // const attendanceRecord = await attendanceModel.findById(attendance);
    // if (!attendanceRecord)
    //   return res.send(errorRes(404, "Attendance record not found"));

    // await attendanceRecord.save();

    const newReimbursement = await reimbursementModel.create({
      ...req.body,
      appliedOn,
      reportingTo,
      aproveReason: aproveReason || "pending",
      amount,
      reimbursementStatus: reimbursementStatus || "pending",
      attendance: attendance,
      approvalSteps,
      currentLevel: 0,
      type,
      attachment,
      attachment2,
    });

    const createdReimbursement = await reimbursementModel
      .findById(newReimbursement._id)
      .populate(reimbursementPopulateOptions);

    return res.send(
      successRes(200, "Reimbursement added", {
        data: newReimbursement,
      })
    );
  } catch (error) {
    console.error("Error adding regularization:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyReimbursement = async (req, res, next) => {
  const { applyby, reportingto, reimbursementStatus } = req.query;

  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "Reimbursement id required"));

    const weekoffs = await reimbursementModel
      .find({
        applyBy: id,
      })
      .populate(reimbursementPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Reimbursement records found"));
    }
    const approvedList = weekoffs.filter(
      (ele) => ele.reimbursementStatus === "approved"
    );
    const rejectedList = weekoffs.filter(
      (ele) => ele.reimbursementStatus === "rejected"
    );
    const pendingList = weekoffs.filter(
      (ele) => ele.reimbursementStatus === "pending"
    );

    return res.send(
      successRes(200, "Reimbursement records retrieved", {
        data: weekoffs,
        approvedList,
        pendingList,
        rejectedList,
      })
    );
  } catch (error) {
    console.error("Error retrieving Reimbursement:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getReportingToReimbursement = async (req, res, next) => {
  const { applyby, reportingto, reimbursementStatus } = req.query;

  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "Reimbursement id required"));

    const weekoffs = await reimbursementModel
      .find({
        "approvalSteps.adminId": id,
      })
      .populate(reimbursementPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Reimbursement Off records found"));
    }
    const approvedList = weekoffs.filter(
      (ele) => ele.reimbursementStatus === "approved"
    );
    const rejectedList = weekoffs.filter(
      (ele) => ele.reimbursementStatus === "rejected"
    );
    const pendingList = weekoffs.filter(
      (ele) => ele.reimbursementStatus === "pending"
    );

    return res.send(
      successRes(200, "Reimbursement records retrieved", {
        data: weekoffs,
        approvedList,
        rejectedList,
        pendingList,
      })
    );
  } catch (error) {
    console.error("Error retrieving week offs:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getReimbursementById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "Reimbursement id required"));

    const weekoff = await reimbursementModel.findById(id);

    if (!weekoff) return res.send(errorRes(404, "Reimbursement is not found"));

    return res.send(
      successRes(200, "get Reimbursement", {
        data: weekoff,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const updateReimbursementStatus = async (req, res) => {
  const { id } = req.params;
  const { reimbursementStatus, reason, aproveReason } = req.body;

  try {
    if (!reimbursementStatus) {
      return res.send({
        success: false,
        message: "Reimbursement status is required",
      });
    }

    const weekoff = await reimbursementModel.findById(id);
    if (!weekoff) {
      return res.send({
        success: false,
        message: "reimbursement request not found",
      });
    }

    weekoff.reimbursementStatus = reimbursementStatus;
    weekoff.reason = reason || "No reason provided";
    weekoff.aproveReason = aproveReason || "pending";

    await weekoff.save();
    //   if (reimbursementStatus?.toLowerCase() === "approved") {
    //     let currentDate = moment(weekoff.weekoffDate);
    //     try {
    //       await attendanceModel.findByIdAndUpdate(
    //         weekoff.attendance,{
    //         status: "present",
    //         wlStatus: "regularization",
    //         userId: weekoff.applyBy,
    //       });
    //     } catch (error) {
    //       logger.info(error);
    //       logger.info("failed to insert regularization");
    //     }
    //   }

    return res.send(
      successRes(200, "reimbursement status updated successfully", {
        data: weekoff,
      })
    );
  } catch (error) {
    console.error("Error updating reimbursement status:", error);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const onRejectOrApproveReimbursement = async (req, res, next) => {
  try {
    const { id, status } = req.params;
    const { adminId, reason, remark, paidBy } = req.body;
    if (!id) return res.send(errorRes(401, "id required"));

    const weekoffResp = await reimbursementModel
      .findById(id)
      .populate(reimbursementPopulateOptions);

    if (!weekoffResp)
      return res.send(errorRes(404, "weekoff request not found"));

    // Find the current step that is pending for this admin
    const step = weekoffResp.approvalSteps.find(
      (s) => s.adminId?._id?.toString() === adminId && s.status === "pending"
    );

    if (!step)
      return res.send(errorRes(403, "No pending approval for this admin"));

    // Approve or reject this step
    step.status = status;
    step.approvalDate = new Date();
    step.reason = reason;
    step.remark = remark;

    if (status === "approved") {
      let nextStep = weekoffResp.approvalSteps.find(
        (s) => s.level === step.level + 1
      );
      // Auto-approve if next step has the same admin
      while (nextStep && nextStep?.adminId?._id.toString() === adminId) {
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.reason = "Auto-approved (same admin)";
        nextStep.remark = remark;
        weekoffResp.currentLevel = nextStep.level;
        nextStep = weekoffResp.approvalSteps.find(
          (s) => s.level === weekoffResp.currentLevel + 1
        );
      }

      if (nextStep && nextStep.adminId.toString() != adminId) {
        weekoffResp.currentLevel = nextStep.level;
      }
      if (!nextStep) {
        weekoffResp.reimbursementStatus = "approved";
        weekoffResp.aproveReason = reason;
        weekoffResp.paidBy = paidBy;
      }
    } else {
      weekoffResp.reimbursementStatus = "rejected"; // If rejected, stop process
    }

    await weekoffResp.save();
    // logger.info(weekoffResp);
    return successRes2(res, 200, `Request ${status}`, { data: weekoffResp });
  } catch (error) {
    return res.send(errorRes(500, `${error.message}`));
  }
};

export const deleteReimbursement = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Reimbursement ID is required"));
    const deleteReimbursement = await reimbursementModel.findByIdAndDelete(id);
    if (!deleteReimbursement)
      return res.send(errorRes(404, `Reimbursement not found with ID: ${id}`));
    return res.send(
      successRes(200, `Reimbursement deleted successfully`, {
        deleteReimbursement,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
