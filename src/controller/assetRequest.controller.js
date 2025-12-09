import approvalStepModel from "../model/approvalStep.model.js";
import employeeModel from "../model/employee.model.js";
import assetRequestModel from "../model/assetRequest.model.js";
import { errorRes, successRes, successRes2 } from "../model/response.js";
import { assetRequestPopulateOptions } from "../utils/constant.js";

export const getassetRequest = async (req, res, next) => {
  const { applyby, reportingto, assetRequestStatus } = req.query;

  try {
    const query = {};

    if (applyby) {
      query.applyby = applyby;
    }

    if (reportingto) {
      query.reportingto = reportingto;
    }

    if (assetRequestStatus) {
      query.assetRequestStatus = assetRequestStatus;
    }
    const weekoffs = await assetRequestModel
      .find(query)
      .populate(assetRequestPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Asset requests records found"));
    }

    return res.send(
      successRes(200, "Asset requests records retrieved", { data: weekoffs })
    );
  } catch (error) {
    console.error("Error retrieving Asset requests:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const addassetRequest = async (req, res, next) => {
  const {
    appliedOn = new Date(),
    quantity,
    amount,
    total,
    reason,
    applyBy,
    attendance,
    aproveReason,
    assetRequestStatus,
    accessory,
  } = req.body;

  try {
    // if (!reason) return res.send(errorRes(401, "Reason is required"));

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
      requestType: "assetRequest",
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

    const newassetRequest = await assetRequestModel.create({
      ...req.body,
      appliedOn,
      reportingTo,
      quantity,
      amount,
      total,
      aproveReason: aproveReason || "pending",
      assetRequestStatus: assetRequestStatus || "pending",
      attendance: attendance,
      approvalSteps,
      currentLevel: 0,
      accessory,
    });

    const createdassetRequest = await assetRequestModel
      .findById(newassetRequest._id)
      .populate(assetRequestPopulateOptions);

    return res.send(
      successRes(200, "Asset request added", {
        data: createdassetRequest,
      })
    );
  } catch (error) {
    console.error("Error adding assetRequest:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyassetRequest = async (req, res, next) => {
  const { applyby, reportingto, assetRequestStatus } = req.query;

  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "assetRequest id required"));

    const weekoffs = await assetRequestModel
      .find({
        applyBy: id,
      })
      .populate(assetRequestPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Asset request records found"));
    }
    const approvedList = weekoffs.filter(
      (ele) => ele.assetRequestStatus === "approved"
    );
    const rejectedList = weekoffs.filter(
      (ele) => ele.assetRequestStatus === "rejected"
    );
    const pendingList = weekoffs.filter(
      (ele) => ele.assetRequestStatus === "pending"
    );

    return res.send(
      successRes(200, "Asset request records retrieved", {
        data: weekoffs,
        approvedList,
        pendingList,
        rejectedList,
      })
    );
  } catch (error) {
    console.error("Error retrieving Asset request:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getReportingToassetRequest = async (req, res, next) => {
  const { applyby, reportingto, assetRequestStatus } = req.query;

  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "assetRequest id required"));

    const weekoffs = await assetRequestModel
      .find({
        "approvalSteps.adminId": id,
      })
      .populate(assetRequestPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Asset request records found"));
    }
    const approvedList = weekoffs.filter(
      (ele) => ele.assetRequestStatus === "approved"
    );
    const rejectedList = weekoffs.filter(
      (ele) => ele.assetRequestStatus === "rejected"
    );
    const pendingList = weekoffs.filter(
      (ele) => ele.assetRequestStatus === "pending"
    );

    return res.send(
      successRes(200, "Asset request records retrieved", {
        data: weekoffs,
        approvedList,
        rejectedList,
        pendingList,
      })
    );
  } catch (error) {
    console.error("Error retrieving asset request:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getassetRequestById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "Asset request id required"));

    const weekoff = await assetRequestModel
      .findById(id)
      .populate(assetRequestPopulateOptions);

    if (!weekoff) return res.send(errorRes(404, "Asset request is not found"));

    return res.send(
      successRes(200, "get Asset request", {
        data: weekoff,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const updateassetRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { assetRequestStatus, reason, aproveReason } = req.body;

  try {
    if (!assetRequestStatus) {
      return res.send({
        success: false,
        message: "Asset request status is required",
      });
    }

    const weekoff = await assetRequestModel
      .findById(id)
      .populate(assetRequestPopulateOptions);
    if (!weekoff) {
      return res.send({
        success: false,
        message: "Asset request not found",
      });
    }

    weekoff.assetRequestStatus = assetRequestStatus;
    weekoff.reason = reason || "No reason provided";
    weekoff.aproveReason = aproveReason || "pending";

    await weekoff.save();

    return res.send(
      successRes(200, "Asset request status updated successfully", {
        data: weekoff,
      })
    );
  } catch (error) {
    console.error("Error updating asset request status:", error);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const onRejectOrApproveassetRequest = async (req, res, next) => {
  try {
    const { id, status } = req.params;
    const { adminId, reason, remark } = req.body;
    if (!id) return res.send(errorRes(401, "id required"));

    const weekoffResp = await assetRequestModel
      .findById(id)
      .populate(assetRequestPopulateOptions);

    if (!weekoffResp) return res.send(errorRes(404, "asset request not found"));

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
        weekoffResp.assetRequestStatus = "approved";
        weekoffResp.aproveReason = reason;
      }
    } else {
      weekoffResp.assetRequestStatus = "rejected"; // If rejected, stop process
    }

    await weekoffResp.save();
    // console.log(weekoffResp);
    return successRes2(res, 200, `Request ${status}`, { data: weekoffResp });
  } catch (error) {
    return res.send(errorRes(500, `${error.message}`));
  }
};

export const deleteassetRequest = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Asset request ID is required"));
    const deleteassetRequest = await assetRequestModel.findByIdAndDelete(id);
    if (!deleteassetRequest)
      return res.send(errorRes(404, `Asset request not found with ID: ${id}`));
    return res.send(
      successRes(200, `Asset request deleted successfully`, {
        deleteassetRequest,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
