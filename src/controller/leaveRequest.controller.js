import leaveRequestModel from "../model/attendance/leave/leaveRequest.model.js";
import employeeModel from "../model/employee.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import moment from "moment-timezone";
import attendanceModel from "../model/attendance/attendance.model.js";
import { leaveRequestPopulateOptions } from "../utils/constant.js";
import oneSignalModel from "../model/oneSignal.model.js";
import { createLeaveHistoryFunc } from "./leaveHistory.controller.js";

import {
  sendNotificationWithImage,
  sendNotificationWithInfo,
} from "./oneSignal.controller.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import approvalStepModel from "../model/approvalStep.model.js";
import leaveHistoryModel from "../model/attendance/leave/leavehistory.model.js";
import logger from "../utils/logger.js";

export const getLeave = async (req, res, next) => {
  const { applicant, reportingTo, leaveStatus } = req.query;
  try {
    const query = {};
    if (applicant) {
      query.applicant = applicant;
    }
    if (reportingTo) {
      query.reportingTo = reportingTo;
    }
    if (leaveStatus) {
      query.leaveStatus = leaveStatus;
    }

    const resp = await leaveRequestModel
      .find(query)
      .populate("applicant", "firstName lastName email")
      .populate("reportingTo", "firstName lastName email");

    if (resp.length === 0) {
      return res.send(errorRes(404, "No Leave records found"));
    }
    return res.send(successRes(200, "Leave records retrieved", { data: resp }));
  } catch (error) {
    logger.info("Error retrieving leave requests:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getApplyLeave = async (req, res, next) => {
  const id = req.params.id;
  const { leaveStatus, startDate, endDate } = req.query;
  try {
    const start = moment(startDate).tz("Asia/Kolkata").startOf("day").toDate();
    const end = moment(endDate).tz("Asia/Kolkata").endOf("day").toDate();

    if (!id) return res.send(errorRes(401, "id is required"));

    let filter = {
      "approvalSteps.adminId": id,
      ...(leaveStatus ? { leaveStatus: leaveStatus } : {}),
      ...(startDate ? { startDate: { $gte: start } } : {}),
      ...(endDate ? { endDate: { $lte: end } } : {}),
    };

    const resp = await leaveRequestModel
      .find(filter)
      .populate(leaveRequestPopulateOptions)
      .sort({
        appliedOn: -1,
      });

    const approvedList = resp.filter((ele) => ele.leaveStatus === "approved");
    const rejectedList = resp.filter((ele) => ele.leaveStatus === "rejected");
    const pendingList = resp.filter((ele) => ele.leaveStatus === "pending");

    return res.send(
      successRes(200, "Leave records retrieved", {
        data: resp,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (error) {
    logger.info("Error retrieving leave requests:", error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyLeave = async (req, res, next) => {
  // const { applicant, reportingTo, leaveStatus } = req.query;
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "id is required"));

    const resp = await leaveRequestModel
      .find({ applicant: id })
      .populate(leaveRequestPopulateOptions)
      .sort({
        appliedOn: -1,
      });

    const approvedList = resp.filter((ele) => ele.leaveStatus === "approved");
    const rejectedList = resp.filter((ele) => ele.leaveStatus === "rejected");
    const pendingList = resp.filter((ele) => ele.leaveStatus === "pending");

    return res.send(
      successRes(200, "Leave records retrieved", {
        data: resp,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (error) {
    logger.info("Error retrieving leave requests:", error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addLeave = async (req, res, next) => {
  const {
    leaveType,
    appliedOn = new Date(),
    startDate,
    endDate,
    numberOfDays,
    leaveReason,
    reportingTo,
    applicant,
  } = req.body;

  // console.log(req.body);
  const user = req.user;
  let newLeaveRequest = null;
  try {
    if (!startDate) return res.send(errorRes(401, "Start Date is required"));
    if (!endDate) return res.send(errorRes(401, "End Date is required"));
    if (!leaveReason) return res.send(errorRes(401, "Reason is required"));

    const applybyEmployee = await employeeModel.findById(applicant);

    if (!applybyEmployee)
      return res.send(errorRes(404, "Apply By employee not found"));

    const reportingToEmployee = await employeeModel.findById(reportingTo);

    if (!reportingToEmployee)
      return res.send(errorRes(404, "Reporting To employee not found"));
    // logger.info(applybyEmployee);
    const myLeaves = await shiftInfoModel.findOne({ userId: applicant });

    const totalPendingLeaves = await leaveRequestModel.countDocuments({
      applicant: applicant,
      leaveType: leaveType,
      leaveStatus: "pending",
    });

    // console.log("totalPendingLeaves ",totalPendingLeaves);
    let leaves = myLeaves.compensatoryoff;
    if (leaveType === "on-paid-leave") {
      leaves = myLeaves.paidLeave;
    } else if (leaveType === "on-casual-leave") {
      leaves = myLeaves.casualLeave;
    } else if (leaveType === "on-compensation-off-leave") {
      leaves = myLeaves.compensatoryoff;
    }

    // if (totalPendingLeaves >= leaves) {
    //   console.log("faiked");
    //   return res.send(
    //     errorRes(401, "you cant apply more request than available leaves"),
    //   );
    // }

    // logger.info(myLeaves);

    if (leaveType === "on-paid-leave" && numberOfDays > myLeaves.paidLeave) {
      return res.send(errorRes(401, "Your Dont Have Enough Paid Leaves"));
    } else if (
      leaveType === "on-casual-leave" &&
      numberOfDays > myLeaves.casualLeave
    ) {
      return res.send(errorRes(401, "Your Dont Have Enough Casual Leaves"));
    } else if (
      leaveType === "on-compensation-off-leave" &&
      numberOfDays > myLeaves.compensatoryoff
    ) {
      return res.send(errorRes(401, "Your Dont Have Enough Compensation Off"));
    }

    const configs = await approvalStepModel.findOne({
      requestType: "leave",
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

    //leave cut
    try {
      const info = await shiftInfoModel.findOne({ userId: applicant });

      if (!info) {
        return res.send(errorRes(404, "Shift info not found"));
      }

      let updateLeave = {};
      let lastLeaveCount = 0;

      if (leaveType === "on-paid-leave") {
        lastLeaveCount = info.paidLeave;
        updateLeave = { paidLeave: info.paidLeave - numberOfDays };
      } else if (leaveType === "on-casual-leave") {
        lastLeaveCount = info.casualLeave;
        updateLeave = { casualLeave: info.casualLeave - numberOfDays };
      } else if (leaveType === "on-compensation-off-leave") {
        lastLeaveCount = info.compensatoryoff;
        updateLeave = {
          compensatoryoff: info.compensatoryoff - numberOfDays,
        };
      }

      await shiftInfoModel.findByIdAndUpdate(info._id, {
        $set: updateLeave,
      });
      newLeaveRequest = await leaveRequestModel.create({
        ...req.body,
        appliedOn: new Date(),
        approvalSteps,
        currentLevel: 0,
      });

      const resp = await createLeaveHistoryFunc({
        date: new Date(),
        description: leaveReason,
        count: numberOfDays,
        userId: applicant,
        type: "used",
        leaveType: leaveType,
        leave: newLeaveRequest._id,
        howManyBefore: lastLeaveCount,
      });
    } catch (e) {
      logger.info(e);
      return res.status(500).send(errorRes(500, "Internal Server Error"));
    }

    const dta = await oneSignalModel.find({
      $or: [
        { docId: applicant },
        // { docId: "ev201-aktarul-biswas" }
      ],
      // role: teamLeaderResp?.role,
    });
    let ids = dta.map((ele) => ele.playerId);
    // logger.info(foundTLPlayerId);

    await sendNotificationWithImage({
      playerIds: [...ids],
      title: "Leave Request",
      message: `Leave request by ${applybyEmployee?.firstName ?? ""} ${
        applybyEmployee?.lastName ?? ""
      }`,
      imageUrl: "https://uknowva.com/images/aashna/leave-management.png",
      data: {
        type: "leave-request-approval",
        id: newLeaveRequest?._id,
        // role: "channel-partner",
      },
    });

    const updateLeaveRequest = await leaveRequestModel
      .findById(newLeaveRequest?._id)
      .populate(leaveRequestPopulateOptions);

    return res.send(
      successRes(200, "Leave Request added", {
        data: updateLeaveRequest,
      }),
    );
  } catch (error) {
    logger.info("Error in addLeave:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { leaveStatus, approveReason } = req.body;
  try {
    if (!leaveStatus) {
      return res.send({
        success: false,
        message: "Leave Status is required",
      });
    }
    const leave = await leaveRequestModel
      .findById(id)
      .populate(leaveRequestPopulateOptions);
    if (!leave) {
      return res.send({
        success: false,
        message: "Leave request not found",
      });
    }
    leave.leaveStatus = leaveStatus;
    leave.approveReason = approveReason || "No reason provided";

    await leave.save();
    if (leaveStatus?.toLowerCase() === "approved") {
      const dates = [];
      let currentDate = moment(leave.startDate);

      while (currentDate <= moment(leave.endDate)) {
        dates.push({
          day: currentDate.date(),
          month: currentDate.month() + 1, // Moment months are 0-based, so we add 1
          year: currentDate.year(),
          status: leave.leaveType?._id,
          wlStatus: leave.leaveType,
          userId: leave.applicant?._id,
        });
        currentDate.add(1, "days");
      }
      // logger.info(dates);
      try {
        await attendanceModel.insertMany(dates, { ordered: false });
      } catch (error) {
        if (error.writeErrors) {
          // logger.info("Some entries were skipped due to duplicates.");
        } else {
          // logger.info("Failed to insert leaves:", error);
        }
        logger.info(error);
      }
      const dta = await oneSignalModel.find({
        $or: [{ docId: leave.applicant?._id }],
        // role: teamLeaderResp?.role,
      });
      let ids = dta.map((ele) => ele.playerId);
      // logger.info(foundTLPlayerId);

      await sendNotificationWithImage({
        playerIds: [...ids],
        title: "Leave Approved",
        message: `Leave approved by ${leave.reportingTo?.firstName ?? ""} ${
          leave.reportingTo?.lastName ?? ""
        }`,
        imageUrl: "https://uknowva.com/images/aashna/leave-management.png",
        data: {
          type: "leave-request",
          id: id,
          // role: "channel-partner",
        },
      });
      // logger.info("pass sent notification");
    } else if (leaveStatus?.toLowerCase() === "rejected") {
      const dta = await oneSignalModel.find({
        $or: [{ docId: leave.applicant?._id }],
        // role: teamLeaderResp?.role,
      });
      let ids = dta.map((ele) => ele.playerId);
      // logger.info(foundTLPlayerId);

      await sendNotificationWithImage({
        playerIds: [...ids],
        title: "Leave Rejected",
        message: `Leave rejected by ${leave.reportingTo?.firstName ?? ""} ${
          leave.reportingTo?.lastName ?? ""
        }`,
        imageUrl: "https://uknowva.com/images/aashna/leave-management.png",
        data: {
          type: "leaveRequest",
          id: id,
          // role: "channel-partner",
        },
      });
    }

    return res.send(
      successRes(200, "Leave Status updated successfully", { data: leave }),
    );
  } catch (error) {
    logger.info("Error updating Leave Status :", error);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const onRejectOrApproveLeave = async (req, res, next) => {
  try {
    const { id, status } = req.params;
    const { adminId, reason, remark } = req.body;
    if (!id) return res.send(errorRes(401, "id required"));

    const leaveResp = await leaveRequestModel
      .findById(id)
      .populate(leaveRequestPopulateOptions);

    if (!leaveResp)
      return res.send(errorRes(404, "regularization request not found"));

    // Find the current step that is pending for this admin
    const step = leaveResp.approvalSteps.find(
      (s) => s.adminId?._id?.toString() === adminId && s.status === "pending",
    );
    // logger.info(step);

    if (!step)
      return res.send(errorRes(403, "No pending approval for this admin"));

    // Approve or reject this step
    step.status = status;
    step.approvalDate = new Date();
    step.reason = reason;
    step.remark = remark;
    // logger.info("after update first step");
    // logger.info(step);

    if (status === "approved") {
      // logger.info("status is approved");

      let nextStep = leaveResp.approvalSteps.find(
        (s) => s.level === step.level + 1,
      );
      // logger.info(nextStep);
      // Auto-approve if next step has the same admin
      while (nextStep && nextStep?.adminId?._id.toString() === adminId) {
        // logger.info("same admin");
        // logger.info(nextStep);
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.reason = "Auto-approved (same admin)";
        nextStep.remark = remark;
        leaveResp.currentLevel = nextStep.level;
        // logger.info(nextStep);
        nextStep = leaveResp.approvalSteps.find(
          (s) => s.level === leaveResp.currentLevel + 1,
        );
        // logger.info("update next step");
        // logger.info(nextStep);
      }
      const allStepsApproved = leaveResp.approvalSteps.every(
        (step) => step.status?.toLowerCase() === "approved",
      );
      // logger.info(`all step approved ? ${allStepsApproved}`);
      let lastLeaveCount;

      if (allStepsApproved) {
        //TODO: when all steps approve leave
        const dates = [];
        let currentDate = moment(leaveResp.startDate);
        let leaveEndDate = moment(leaveResp.endDate);

        while (currentDate <= moment(leaveResp.endDate)) {
          dates.push({
            day: currentDate.date(),
            month: currentDate.month() + 1, // Moment months are 0-based, so we add 1
            year: currentDate.year(),
            status: leaveResp.leaveType?._id,
            wlStatus: leaveResp?.leaveType,
            userId: leaveResp.applicant?._id,
          });
          currentDate.add(1, "days");
        }
        // logger.info(dates);
        try {
          const duration = leaveResp.dayType === "full-day" ? 1 : 0.5;

          await Promise.all(
            dates.map(async (att) => {
              await attendanceModel.updateOne(
                {
                  day: att.day,
                  month: att.month,
                  year: att.year,
                  userId: att.userId,
                },
                {
                  $set: {
                    status: leaveResp.leaveType?._id,
                    wlStatus: leaveResp.leaveType?._id,
                    leaveDuration: duration,
                  },
                },
                { upsert: true },
              );
            }),
          );

          // await attendanceModel.insertMany(dates, { ordered: false });
        } catch (error) {
          if (error?.writeErrors) {
            logger.info("Some entries were skipped due to duplicates.");
          } else {
            logger.info("Failed to insert leaves:", error);
          }
          logger.info(error);
        }
        // try {
        //   const info = await shiftInfoModel.findOne({
        //     userId: leaveResp.applicant?._id,
        //   });
        //   let whatToUpdate = {};
        //   if (leaveResp.leaveType?._id === "on-compensation-off-leave") {
        //     lastLeaveCount = info.compensatoryoff;
        //     whatToUpdate = {
        //       compensatoryoff: info.compensatoryoff - leaveResp.numberOfDays,
        //     };
        //   } else if (leaveResp.leaveType?._id === "on-paid-leave") {
        //     lastLeaveCount = info.paidLeave;

        //     whatToUpdate = {
        //       paidLeave: info.paidLeave - leaveResp.numberOfDays,
        //     };
        //   } else if (leaveResp.leaveType?._id === "on-casual-leave") {
        //     lastLeaveCount = info.casualLeave;

        //     whatToUpdate = {
        //       casualLeave: info.casualLeave - leaveResp.numberOfDays,
        //     };
        //   }
        //   // logger.info(whatToUpdate);
        //   await shiftInfoModel.findByIdAndUpdate(info._id, {
        //     $set: {
        //       ...whatToUpdate,
        //     },
        //   });
        // } catch (error) {
        //   //
        // }

        const dta = await oneSignalModel.find({
          $or: [{ docId: leaveResp.applicant?._id }],
          // role: teamLeaderResp?.role,
        });
        let ids = dta.map((ele) => ele.playerId);
        // logger.info(foundTLPlayerId);

        await sendNotificationWithImage({
          playerIds: [...ids],
          title: "Leave Approved",
          message: `Leave approved by ${
            leaveResp.reportingTo?.firstName ?? ""
          } ${leaveResp.reportingTo?.lastName ?? ""}`,
          imageUrl: "https://uknowva.com/images/aashna/leave-management.png",
          data: {
            type: "leave-request",
            id: id,
            // role: "channel-partner",
          },
        });
      }

      if (nextStep && nextStep.adminId.toString() != adminId) {
        leaveResp.currentLevel = nextStep.level;
      }
      if (!nextStep) {
        leaveResp.leaveStatus = "approved";
        leaveResp.approveReason = reason;

        //   // const resp = await createLeaveHistoryFunc({
        //   //   date: new Date(),
        //   //   description: leaveResp.leaveReason,
        //   //   count: leaveResp.numberOfDays,
        //   //   userId: leaveResp.applicant,
        //   //   type: "used",
        //   //   leaveType: leaveResp.leaveType,
        //   //   leave: leaveResp._id,
        //   //   howManyBefore: lastLeaveCount,
        //   // });
      }
    } else {
      //reverse leave when rejected
      if (status === "rejected") {
        leaveResp.leaveStatus = "rejected";
        const leaveFrom = moment(leaveResp.startDate).format("DD MMM YYYY");
        const leaveTo = moment(leaveResp.endDate).format("DD MMM YYYY");
        const description = `Auto-reverse leave for rejection (${leaveFrom} - ${leaveTo})`;

        const info = await shiftInfoModel.findOne({
          userId: leaveResp.applicant?._id,
        });

        if (info) {
          let reverseUpdate = {};

          if (leaveResp.leaveType?._id === "on-paid-leave") {
            reverseUpdate = {
              paidLeave: info.paidLeave + leaveResp.numberOfDays,
            };
          } else if (leaveResp.leaveType?._id === "on-casual-leave") {
            reverseUpdate = {
              casualLeave: info.casualLeave + leaveResp.numberOfDays,
            };
          } else if (leaveResp.leaveType?._id === "on-compensation-off-leave") {
            reverseUpdate = {
              compensatoryoff: info.compensatoryoff + leaveResp.numberOfDays,
            };
          }

          await shiftInfoModel.findByIdAndUpdate(info._id, {
            $set: reverseUpdate,
          });
        }

        await leaveHistoryModel.findOneAndDelete({
          leave: leaveResp._id,
          userId: leaveResp.applicant?._id,
          type: "used",
        });

        await createLeaveHistoryFunc({
          date: new Date(),
          description: description,
          count: leaveResp.numberOfDays,
          userId: leaveResp.applicant,
          type: "deposit",
          leaveType: leaveResp.leaveType,
          leave: leaveResp._id,
        });
      }
    }

    await leaveResp.save();
    return successRes2(res, 200, `Request ${status}`, { data: leaveResp });
  } catch (error) {
    logger.info(error);

    return res.send(errorRes(500, `${error.message}`));
  }
};

export const deleteLeaveRequest = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Leave Request ID is required"));

    const leaveReq = await leaveRequestModel.findById(id);
    const leaveFrom = moment(leaveReq.startDate).format("DD MMM YYYY");
    const leaveTo = moment(leaveReq.endDate).format("DD MMM YYYY");

    const description = `Auto-reverse leave for withdrawal (${leaveFrom} - ${leaveTo})`;

    if (!leaveReq)
      return res.send(errorRes(404, `Leave Request not found with ID: ${id}`));

    if (leaveReq.leaveStatus === "approved") {
      return res.send(errorRes(403, "Approved leave cannot be deleted"));
    }

    const info = await shiftInfoModel.findOne({
      userId: leaveReq.applicant,
    });

    if (info) {
      let reverseUpdate = {};

      if (leaveReq.leaveType === "on-paid-leave") {
        reverseUpdate = {
          paidLeave: info.paidLeave + leaveReq.numberOfDays,
        };
      } else if (leaveReq.leaveType === "on-casual-leave") {
        reverseUpdate = {
          casualLeave: info.casualLeave + leaveReq.numberOfDays,
        };
      } else if (leaveReq.leaveType === "on-compensation-off-leave") {
        reverseUpdate = {
          compensatoryoff: info.compensatoryoff + leaveReq.numberOfDays,
        };
      }

      await shiftInfoModel.findByIdAndUpdate(info._id, {
        $set: reverseUpdate,
      });
    }

    await leaveRequestModel.findByIdAndDelete(id);
    await createLeaveHistoryFunc({
      date: new Date(),
      description: description,
      count: leaveReq.numberOfDays,
      userId: leaveReq.applicant,
      type: "deposit",
      leaveType: leaveReq.leaveType,
      leave: leaveReq._id,
    });

    return res.send(
      successRes(200, "Leave Request deleted and leave reversed successfully"),
    );
  } catch (error) {
    logger.info(error);

    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const multipleRejectApproveLeave = async (req, res, next) => {
  try {
    const { status } = req.params;
    const { ids, adminId, reason, remark } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return errorRes2(res, 401, "ids array required");
    }

    const results = [];

    for (const id of ids) {
      try {
        const leaveResp = await leaveRequestModel
          .findById(id)
          .populate(leaveRequestPopulateOptions);

        if (!leaveResp) {
          results.push({ id, success: false, message: "leave resp not found" });
          continue;
        }

        const step = leaveResp.approvalSteps.find(
          (s) =>
            s.adminId?._id?.toString() === adminId && s.status === "pending",
        );

        if (!step) {
          results.push({
            id,
            success: false,
            message: "No pending approval",
          });
          continue;
        }

        step.status = status;
        step.approvalDate = new Date();
        step.reason = reason;
        step.remark = remark;

        if (status === "approved") {
          let nextStep = leaveResp.approvalSteps.find(
            (s) => s.level === step.level + 1,
          );

          while (nextStep && nextStep?.adminId?._id.toString() === adminId) {
            nextStep.status = "approved";
            nextStep.approvalDate = new Date();
            nextStep.reason = "Auto-approved (same admin)";
            nextStep.remark = remark;
            leaveResp.currentLevel = nextStep.level;

            nextStep = leaveResp.approvalSteps.find(
              (s) => s.level === leaveResp.currentLevel + 1,
            );
          }

          const allStepsApproved = leaveResp.approvalSteps.every(
            (step) => step.status?.toLowerCase() === "approved",
          );

          if (allStepsApproved) {
            const dates = [];
            let currentDate = moment(leaveResp.startDate);

            while (currentDate <= moment(leaveResp.endDate)) {
              dates.push({
                day: currentDate.date(),
                month: currentDate.month() + 1,
                year: currentDate.year(),
                status: leaveResp.leaveType?._id,
                wlStatus: leaveResp?.leaveType,
                userId: leaveResp.applicant?._id,
              });
              currentDate.add(1, "days");
            }

            try {
              const duration = leaveResp.dayType === "full-day" ? 1 : 0.5;

              await Promise.all(
                dates.map(async (att) => {
                  await attendanceModel.updateOne(
                    {
                      day: att.day,
                      month: att.month,
                      year: att.year,
                      userId: att.userId,
                    },
                    {
                      $set: {
                        status: leaveResp.leaveType?._id,
                        wlStatus: leaveResp.leaveType?._id,
                        leaveDuration: duration,
                      },
                    },
                    { upsert: true },
                  );
                }),
              );
            } catch (error) {
              logger.info(error);
            }

            const dta = await oneSignalModel.find({
              $or: [{ docId: leaveResp.applicant?._id }],
            });

            let playerIds = dta.map((ele) => ele.playerId);

            await sendNotificationWithImage({
              playerIds: [...playerIds],
              title: "Leave Approved",
              message: `Leave approved by ${
                leaveResp.reportingTo?.firstName ?? ""
              } ${leaveResp.reportingTo?.lastName ?? ""}`,
              imageUrl:
                "https://uknowva.com/images/aashna/leave-management.png",
              data: {
                type: "leave-request",
                id: id,
              },
            });
          }

          if (nextStep && nextStep.adminId.toString() != adminId) {
            leaveResp.currentLevel = nextStep.level;
          }

          if (!nextStep) {
            leaveResp.leaveStatus = "approved";
            leaveResp.approveReason = reason;
          }
        } else if (status === "rejected") {
          leaveResp.leaveStatus = "rejected";

          const leaveFrom = moment(leaveResp.startDate).format("DD MMM YYYY");
          const leaveTo = moment(leaveResp.endDate).format("DD MMM YYYY");

          const info = await shiftInfoModel.findOne({
            userId: leaveResp.applicant?._id,
          });

          if (info) {
            let reverseUpdate = {};

            if (leaveResp.leaveType?._id === "on-paid-leave") {
              reverseUpdate = {
                paidLeave: info.paidLeave + leaveResp.numberOfDays,
              };
            } else if (leaveResp.leaveType?._id === "on-casual-leave") {
              reverseUpdate = {
                casualLeave: info.casualLeave + leaveResp.numberOfDays,
              };
            } else if (
              leaveResp.leaveType?._id === "on-compensation-off-leave"
            ) {
              reverseUpdate = {
                compensatoryoff: info.compensatoryoff + leaveResp.numberOfDays,
              };
            }

            await shiftInfoModel.findByIdAndUpdate(info._id, {
              $set: reverseUpdate,
            });
          }

          await leaveHistoryModel.findOneAndDelete({
            leave: leaveResp._id,
            userId: leaveResp.applicant?._id,
            type: "used",
          });

          await createLeaveHistoryFunc({
            date: new Date(),
            description: `Auto-reverse leave (${leaveFrom} - ${leaveTo})`,
            count: leaveResp.numberOfDays,
            userId: leaveResp.applicant,
            type: "deposit",
            leaveType: leaveResp.leaveType,
            leave: leaveResp._id,
          });
        }

        await leaveResp.save();

        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, message: err.message });
      }
    }

    return successRes2(res, 200, `Multiple Leave request done`, {
      data:true
    });
  } catch (error) {
    logger.info(`Error approving leave:`, error);

    return errorRes2(res, 500, error.message);
  }
};
