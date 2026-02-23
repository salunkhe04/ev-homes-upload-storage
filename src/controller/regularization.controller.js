import approvalStepModel from "../model/approvalStep.model.js";
import attendanceModel from "../model/attendance/attendance.model.js";
import employeeModel from "../model/employee.model.js";
import regularizationModel from "../model/regularization.model.js";
import { errorRes, successRes } from "../model/response.js";
import moment from "moment-timezone";
import { regularizationPopulateOptions } from "../utils/constant.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
import oneSignalModel from "../model/oneSignal.model.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import { RedisService } from "../app/redis.js";

export const addRegularization = async (req, res, next) => {
  const {
    appliedOn = new Date(),
    reason,
    applyBy,
    attendance,
    checkInTime,
    checkOutTime,
  } = req.body;

  try {
    // Validate required fields`
    const totalPendingReg = await regularizationModel.countDocuments({
      applyBy: applyBy,
      regularizationStatus: "pending",
    });
    const foundShiftInfoNp = await shiftInfoModel.findOne({ userId: applyBy });

    if (totalPendingReg >= foundShiftInfoNp.regularization) {
      return res.send(
        errorRes(
          401,
          "you cant apply more request than available regularization"
        )
      );
    }

    if (!reason) return res.send(errorRes(401, "Reason is required"));
    if (!attendance)
      return res.send(errorRes(401, "Attendance ID is required"));

    // Fetch the employee applying for regularization
    const applybyEmployee = await employeeModel.findById(applyBy);
    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    // Fetch the attendance record
    const attendanceRecord = await attendanceModel.findById(attendance);
    if (!attendanceRecord)
      return res.send(errorRes(404, "Attendance record not found"));

    // Fetch the approval steps for "regularization"
    const configs = await approvalStepModel.findOne({
      requestType: "regularization",
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

    await attendanceRecord.save();

    // Create the regularization request
    const newRegularization = await regularizationModel.create({
      ...req.body,
      appliedOn,
      reportingTo: applybyEmployee.reportingTo,
      aproveReason: "pending",
      regularizationStatus: "pending",
      attendance: attendance,
      checkInTime,
      checkOutTime,
      approvalSteps, // Include the approval steps
    });

    const dta = await oneSignalModel.find({
      $or: [
        { docId: applyBy },
        // { docId: "ev206-shreya-salunkhe" },
        { docId: applybyEmployee.reportingTo },
      ],

      // role: teamLeaderResp?.role,
    });
    let ids = dta.map((ele) => ele.playerId);
    // logger.info(dta);
    // logger.info("Player IDs for Notification:", ids);

    await sendNotificationWithImage({
      playerIds: [...ids],
      title: "Regularization Request",
      message: `Regularization request by ${applybyEmployee?.firstName ?? ""} ${
        applybyEmployee?.lastName ?? ""
      }`,
      imageUrl: "https://traviyo.com/Content/images/sicons/sdemo.png",
      data: {
        type: "regularization-request-approval",
        id: newRegularization?._id,
        // role: "channel-partner",
      },
    });

    return res.send(
      successRes(200, "Regularization added", {
        data: newRegularization,
      })
    );
  } catch (error) {
    console.error("Error adding regularization:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getRegularization = async (req, res, next) => {
  const { applyby, reportingto, regularizationStatus } = req.query;

  try {
    const query = {};

    if (applyby) {
      query.applyby = applyby;
    }

    if (reportingto) {
      query.reportingto = reportingto;
    }

    if (regularizationStatus) {
      query.regularizationStatus = regularizationStatus;
    }
    const weekoffs = await regularizationModel
      .find(query)
      .populate(regularizationPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Regularizationrecords found"));
    }

    return res.send(
      successRes(200, "Regularizationrecords retrieved", { data: weekoffs })
    );
  } catch (error) {
    console.error("Error retrieving Regularization:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyRegularization = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) {
      return res.send(errorRes(401, "Regularization ID required"));
    }

    const regularizations = await regularizationModel
      .find({
        applyBy: id,
      })
      .populate(regularizationPopulateOptions);

    if (regularizations.length === 0) {
      return res.send(errorRes(404, "No Week Off records found"));
    }
    const approvedList = regularizations.filter(
      (ele) => ele.regularizationStatus === "approved"
    );
    const rejectedList = regularizations.filter(
      (ele) => ele.regularizationStatus === "rejected"
    );
    const pendingList = regularizations.filter(
      (ele) => ele.regularizationStatus === "pending"
    );

    return res.send(
      successRes(200, "Regularization records retrieved", {
        data: regularizations,
        approvedList,
        pendingList,
        rejectedList,
      })
    );
  } catch (error) {
    console.error("Error retrieving Regularization:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getReportingToRegularization = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) {
      return res.send(errorRes(401, "Regularization ID required"));
    }

    const regularizations = await regularizationModel
      .find({
        "approvalSteps.adminId": id,
      })
      .populate(regularizationPopulateOptions);

    if (regularizations.length === 0) {
      return res.send(errorRes(404, "No regularization records found"));
    }
    const approvedList = regularizations.filter(
      (ele) => ele.regularizationStatus === "approved"
    );
    const rejectedList = regularizations.filter(
      (ele) => ele.regularizationStatus === "rejected"
    );
    const pendingList = regularizations.filter(
      (ele) => ele.regularizationStatus === "pending"
    );

    if (!regularizations.length) {
      return res.send(errorRes(404, "No Regularization records found"));
    }
    return res.send(
      successRes(200, "Regularization records retrieved", {
        data: regularizations,
        pendingList,
        approvedList,
        rejectedList,
      })
    );
  } catch (error) {
    console.error("Error retrieving Regularization:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getRegularizationById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "Regularizationid required"));

    const weekoff = await regularizationModel
      .findById(id)
      .populate("applyBy", "firstName lastName")
      .populate("reportingTo", "firstName lastName")
      .populate({
        path: "approvalSteps",
        populate: {
          path: "adminId",
          select: "firstName lastName",
        },
      });

    if (!weekoff) return res.send(errorRes(404, "Regularizationis not found"));

    return res.send(
      successRes(200, "get Regularization", {
        data: weekoff,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export async function updateRegularizationApproval(req, res) {
  try {
    const { id } = req.params;
    const { adminId, status, reason, remark } = req.body;
    const regularization = await regularizationModel
      .findById(id)
      .populate(regularizationPopulateOptions);
    // .populate("applyBy", "firstName lastName")
    // .populate("reportingTo", "firstName lastName")
    // .populate({
    //   path: "approvalSteps",
    //   populate: {
    //     path: "adminId",
    //     select: "firstName lastName",
    //   },
    // });
    if (!regularization)
      return res.json({ message: "regularization request not found" });
    // Find the current step that is pending for this admin
    const step = regularization.approvalSteps.find(
      (s) => s.adminId._id.toString() === adminId && s.status === "pending"
    );
    if (!step)
      return res
        .status(403)
        .json({ message: "No pending approval for this admin" });
    // Approve or reject this step
    step.status = status;
    step.approvalDate = new Date();
    step.reason = reason;
    step.remark = remark;

    if (status === "approved") {
      let nextStep = regularization.approvalSteps.find(
        (s) => s.level === step.level + 1
      );

      // Auto-approve if next step has the same admin
      while (nextStep && nextStep.adminId._id.toString() === adminId) {
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.reason = "Auto-approved (same admin)";
        nextStep.remark = remark;
        regularization.currentLevel = nextStep.level;
        nextStep = regularization.approvalSteps.find(
          (s) => s.level === regularization.currentLevel + 1
        );
      }
      const allStepsApproved = regularization.approvalSteps.every(
        (step) => step.status.toLowerCase() === "approved"
      );

      if (allStepsApproved) {
        const attendanceUpdate = {
          $set: {
            status:
              /*regularization.type === "half-day"
                ? "present"
                :*/ regularization.type ?? "present",
            wlStatus: "regularization",
            userId: regularization.applyBy._id,
            ...(regularization.checkInTime
              ? { checkInTime: regularization.checkInTime }
              : {}),
            ...(regularization.checkOutTime
              ? { checkOutTime: regularization.checkOutTime }
              : {}),
          },
          // checkInTime: regularization.checkInTime,
          // checkOutTime: regularization.checkOutTime,
        };

        // Use the checkInTime and checkOutTime from the regularization model
        // if (regularization.checkInTime) {
        //   attendanceUpdate.checkInTime = regularization.checkInTime;
        // }
        // if (regularization.checkOutTime) {
        //   attendanceUpdate.checkOutTime = regularization.checkOutTime;
        // }

        // Update the attendance record
        try {
          await attendanceModel.findByIdAndUpdate(
            regularization?.attendance?._id,
            attendanceUpdate
          );
        } catch (error) {
          //
        }
      }

      if (nextStep && nextStep.adminId.toString() != adminId) {
        regularization.currentLevel = nextStep.level;

        const nextAdminId = nextStep.adminId._id || nextStep.adminId;

        // Fetch OneSignal playerId(s) for the next level approver
        const dta = await oneSignalModel.find({
          $or: [
            { docId: nextAdminId.toString() },
            // { docId: "ev206-shreya-salunkhe" }, // optional
          ],
        });

        // logger.info(dta);

        const ids = dta.map((ele) => ele.playerId);

        // Send notification
        await sendNotificationWithImage({
          playerIds: [...ids],
          title: "Regularization Request Approval",
          message: `Approval required for regularization by ${
            regularization.applyBy?.firstName ?? ""
          } ${regularization.applyBy?.lastName ?? ""}`,
          imageUrl: "https://traviyo.com/Content/images/sicons/sdemo.png",
          data: {
            type: "regularization-request-approval",
            id: regularization?._id,
          },
        });
      }

      if (!nextStep) {
        regularization.regularizationStatus = "approved";
        try {
          const foundShiftInfo = await shiftInfoModel.findOne({
            userId: regularization.applyBy?._id,
          });
          await shiftInfoModel.findByIdAndUpdate(foundShiftInfo._id, {
            $set: {
              regularization: foundShiftInfo.regularization - 1,
            },
          });

          const cacheDel = await RedisService.delMultipleKeys([
            `employee_shift_info_${foundShiftInfo._id}`,
            `employee_shift_info_${regularization.applyBy?._id}`,
          ]);
        } catch (error) {
          // logger.info(error);
        }
      }
    } else {
      regularization.regularizationStatus = "rejected"; // If rejected, stop process
    }

    await regularization.save();
    res.send(
      successRes(200, `Request ${status}`, {
        data: regularization,
      })
    );
    // res.json({ message: `Request ${status}`, data: regularization });
  } catch (error) {
    // logger.info(error);
    res.status(500).json({ error: error.message });
  }
}

export const deleteRegularization = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Regularization ID is required"));
    const deleteRegularization = await regularizationModel.findByIdAndDelete(
      id
    );
    if (!deleteRegularization)
      return res.send(errorRes(404, `Regularization not found with ID: ${id}`));
    return res.send(
      successRes(200, `Regularization deleted successfully`, {
        deleteRegularization,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
