import approvalStepModel from "../model/approvalStep.model.js";
import attendanceModel from "../model/attendance/attendance.model.js";
import employeeModel from "../model/employee.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import weekoffModel from "../model/attendance/weekoff/weekoff.model.js";
import moment from "moment-timezone";
import { weekOffRequestPopulateOptions } from "../utils/constant.js";
import oneSignalModel from "../model/oneSignal.model.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
import logger from "../utils/logger.js";
const timeZone = "Asia/Kolkata";

export const addweekoff = async (req, res, next) => {
  const {
    appliedOn,
    weekoffDate,
    reason,
    aproveReason,
    weekoffStatus,
    reportingTo,
    applyBy,
  } = req.body;
  // logger.info(req.body);
  try {
    if (!weekoffDate) {
      return res.send(errorRes(401, "Week Off Date is required"));
    }
    // logger.info("pass 1");

    const applybyEmployee = await employeeModel.findById(applyBy);
    // logger.info("pass 2");
    if (!applybyEmployee) {
      return res.send(errorRes(404, "Apply By employee not found"));
    }
    // logger.info("pass 3");

    const reportingToEmployee = await employeeModel.findById(reportingTo);
    if (!reportingToEmployee) {
      return res.send(errorRes(404, "Reporting To employee not found"));
    }
    // logger.info("pass 4");

    const startOfWeek = moment(weekoffDate)
      .tz(timeZone)
      .startOf("isoWeek")
      .toDate();

    const exisitingWeekOff = await weekoffModel.findOne({
      applyBy: applyBy,
      startOfWeek: startOfWeek,
    });

    if (exisitingWeekOff) {
      // logger.info("exisiting weekoff");
      return (
        res
          //
          .send(
            errorRes(
              400,
              "Cannot apply weekoff, You've already applied weekoff this week.",
            ),
          )
      );
    }

    // logger.info("pass 5");

    const configs = await approvalStepModel.findOne({
      requestType: "weekoff",
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

    // logger.info("pass 6");

    const newWeekOff = await weekoffModel.create({
      ...req.body,
      startOfWeek: startOfWeek,
      aproveReason: aproveReason || "pending",
      weekoffStatus: weekoffStatus || "pending",
      appliedOn: new Date(),
      approvalSteps,
      currentLevel: 0,
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
      title: "Week off Request",
      message: `Week Off request by ${applybyEmployee?.firstName ?? ""} ${
        applybyEmployee?.lastName ?? ""
      }`,
      imageUrl:
        "https://www.midextimeandattendance.com/wp-content/uploads/employee-time-2-2.png",
      data: {
        type: "week-off-request-approval",
        id: newWeekOff?._id,
        // role: "channel-partner",
      },
    });
    // logger.info("pass 7");

    const createdWeekOff = await weekoffModel
      .findById(newWeekOff._id)
      .populate(weekOffRequestPopulateOptions);

    // logger.info("pass 8");

    return res.send(
      successRes(200, "Week Off added", {
        data: createdWeekOff,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getWeekOffs = async (req, res, next) => {
  const { applyby, reportingto, weekoffstatus } = req.query;

  try {
    const query = {};

    if (applyby) {
      query.applyby = applyby;
    }

    if (reportingto) {
      query.reportingto = reportingto;
    }

    if (weekoffstatus) {
      query.weekoffstatus = weekoffstatus;
    }
    const weekoffs = await weekoffModel
      .find(query)
      .populate(weekOffRequestPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Week Off records found"));
    }

    return res.send(
      successRes(200, "Week Off records retrieved", { data: weekoffs }),
    );
  } catch (error) {
    logger.info("Error retrieving week offs:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyWeekOffs = async (req, res, next) => {
  const { applyby, reportingto, weekoffstatus } = req.query;

  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "weekoff id required"));
    // const query = {};

    // if (applyby) {
    //   query.applyby = applyby;
    // }

    // if (reportingto) {
    //   query.reportingto = reportingto;
    // }

    // if (weekoffstatus) {
    //   query.weekoffstatus = weekoffstatus;
    // }
    const weekoffs = await weekoffModel
      .find({
        applyBy: id,
      })
      .populate(weekOffRequestPopulateOptions)
      .sort({
        appliedOn: -1,
      });

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Week Off records found"));
    }
    const approvedList = weekoffs.filter(
      (ele) => ele.weekoffStatus === "approved",
    );
    const rejectedList = weekoffs.filter(
      (ele) => ele.weekoffStatus === "rejected",
    );
    const pendingList = weekoffs.filter(
      (ele) => ele.weekoffStatus === "pending",
    );

    return res.send(
      successRes(200, "Week Off records retrieved", {
        data: weekoffs,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (error) {
    logger.info("Error retrieving week offs:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getReportingToWeekOffs = async (req, res, next) => {
  const { applyby, reportingto, weekoffstatus } = req.query;

  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "weekoff id required"));

    const weekoffs = await weekoffModel
      .find({
        "approvalSteps.adminId": id,
      })
      .populate(weekOffRequestPopulateOptions);

    if (weekoffs.length === 0) {
      return res.send(errorRes(404, "No Week Off records found"));
    }
    const approvedList = weekoffs.filter(
      (ele) => ele.weekoffStatus === "approved",
    );
    const rejectedList = weekoffs.filter(
      (ele) => ele.weekoffStatus === "rejected",
    );
    const pendingList = weekoffs.filter(
      (ele) => ele.weekoffStatus === "pending",
    );

    return res.send(
      successRes(200, "Week Off records retrieved", {
        data: weekoffs,
        approvedList,
        rejectedList,
        pendingList,
      }),
    );
  } catch (error) {
    logger.info("Error retrieving week offs:", error);
    return res.status(500).send(errorRes(500, "Internal Server Error"));
  }
};

export const getWeekOffById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "weekoff id required"));

    const weekoff = await weekoffModel.findById(id);

    if (!weekoff) return res.send(errorRes(404, "weekoff is not found"));

    return res.send(
      successRes(200, "get weekoff", {
        data: weekoff,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const updateWeekOffStatus = async (req, res) => {
  const { id } = req.params; // WeekOff request ID
  const { weekoffStatus, aproveReason } = req.body;

  try {
    if (!weekoffStatus) {
      return res.send({
        success: false,
        message: "Week Off status is required",
      });
    }

    const weekoff = await weekoffModel.findById(id);
    if (!weekoff) {
      return res.send({
        success: false,
        message: "Week Off request not found",
      });
    }

    weekoff.weekoffStatus = weekoffStatus;
    weekoff.aproveReason = aproveReason || "No reason provided";

    await weekoff.save();
    if (weekoffStatus?.toLowerCase() === "approved") {
      let currentDate = moment(weekoff.weekoffDate);
      try {
        const existingRecord = await attendanceModel.findOne({
          userId: weekoff.applyBy,
          day: currentDate.date(),
          month: currentDate.month() + 1,
          year: currentDate.year(),
        });
        let whatToUpdate = [];
        //if exsit
        if (existingRecord) {
          if (
            existingRecord.status === "present" ||
            existingRecord.status === "completed"
          ) {
            await attendanceModel.findByIdAndUpdate(existingRecord._id, {
              wlStatus: "weekoff",
            });
          }
        } else {
          await attendanceModel.findOneAndUpdate(
            {
              userId: weekoff.applyBy,
              day: currentDate.date(),
              month: currentDate.month() + 1,
              year: currentDate.year(),
            },
            {
              $set: {
                status: "weekoff",
                wlStatus: "weekoff",
              },
              $setOnInsert: {
                date: currentDate,
                day: currentDate.date(),
                month: currentDate.month() + 1,
                year: currentDate.year(),
                status: "weekoff",
                wlStatus: "weekoff",
                userId: weekoff.applyBy,
              },
            },
            {
              new: true,
              upsert: true, // Create the record if it doesn't exist
            },
          );
        }

        // await attendanceModel.updateOne({
        //   day: currentDate.date(),
        //   month: currentDate.month() + 1, // Moment months are 0-based, so we add 1
        //   year: currentDate.year(),
        //   status: "weekoff",
        //   wlStatus: "weekoff",
        //   userId: weekoff.applyBy,
        // });
      } catch (error) {
        logger.info(error);
        // logger.info("failed to insert weekoff");
      }
    }

    return res.send(
      successRes(200, "Week Off status updated successfully", {
        data: weekoff,
      }),
    );
  } catch (error) {
    logger.info("Error updating Week Off status:", error);
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export async function updateWeekoffApproval(req, res) {
  try {
    const { weekoffId } = req.params;
    const { adminId, status, remarks } = req.body;
    const weekoff = await weekoffModel.findById(weekoffId);
    if (!weekoff) return res.json({ message: "Weekoff request not found" });
    // Find the current step that is pending for this admin
    const step = weekoff.approvalSteps.find(
      (s) => s.adminId.toString() === adminId && s.status === "Pending",
    );
    if (!step)
      return res
        .status(403)
        .json({ message: "No pending approval for this admin" });
    // Approve or reject this step
    step.status = status;
    step.approvedAt = new Date();
    step.remarks = remarks;
    if (status === "Approved") {
      let nextStep = weekoff.approvalSteps.find(
        (s) => s.level === step.level + 1,
      );
      // Auto-approve if next step has the same admin
      while (nextStep && nextStep.adminId.toString() === adminId) {
        nextStep.status = "Approved";
        nextStep.approvedAt = new Date();
        nextStep.remarks = "Auto-approved (same admin)";
        weekoff.currentLevel = nextStep.level;
        nextStep = weekoff.approvalSteps.find(
          (s) => s.level === weekoff.currentLevel + 1,
        );
      }
      // If no more steps, mark the request as fully Approved
      if (!nextStep) {
        weekoff.status = "Approved";
      }
    } else {
      weekoff.status = "Rejected"; // If rejected, stop process
    }
    await weekoff.save();
    res.json({ message: `Request ${status}`, weekoff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
//
export const onRejectOrApproveWeekoff = async (req, res, next) => {
  try {
    const { id, status } = req.params;
    const { adminId, reason, remark } = req.body;
    if (!id) return res.send(errorRes(401, "id required"));

    const weekoffResp = await weekoffModel
      .findById(id)
      .populate(weekOffRequestPopulateOptions);

    if (!weekoffResp)
      return res.send(errorRes(404, "weekoff request not found"));

    // Find the current step that is pending for this admin
    const step = weekoffResp.approvalSteps.find(
      (s) => s.adminId?._id?.toString() === adminId && s.status === "pending",
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
        (s) => s.level === step.level + 1,
      );
      // Auto-approve if next step has the same admin
      while (nextStep && nextStep?.adminId?._id.toString() === adminId) {
        nextStep.status = "approved";
        nextStep.approvalDate = new Date();
        nextStep.reason = "Auto-approved (same admin)";
        nextStep.remark = remark;
        weekoffResp.currentLevel = nextStep.level;
        nextStep = weekoffResp.approvalSteps.find(
          (s) => s.level === weekoffResp.currentLevel + 1,
        );
      }
      const allStepsApproved = weekoffResp.approvalSteps.every(
        (step) => step.status.toLowerCase() === "approved",
      );

      if (allStepsApproved) {
        //TODO: when all steps approve weekoff
        let currentDate = moment(weekoffResp.weekoffDate);
        try {
          const existingRecord = await attendanceModel.findOne({
            userId: weekoffResp.applyBy._id,
            day: currentDate.date(),
            month: currentDate.month() + 1,
            year: currentDate.year(),
          });
          //if exsit
          if (existingRecord) {
            if (
              existingRecord.status === "present" ||
              existingRecord.status === "completed"
            ) {
              await attendanceModel.findByIdAndUpdate(existingRecord._id, {
                wlStatus: "weekoff",
              });
            } else {
              await attendanceModel.findByIdAndUpdate(existingRecord._id, {
                status: "weekoff",
                wlStatus: "weekoff",
              });
            }
          } else {
            await attendanceModel.findOneAndUpdate(
              {
                userId: weekoffResp.applyBy._id,
                day: currentDate.date(),
                month: currentDate.month() + 1,
                year: currentDate.year(),
              },
              {
                // $set: {
                //   status: "weekoff",
                //   wlStatus: "weekoff",
                // },
                $setOnInsert: {
                  date: currentDate,
                  day: currentDate.date(),
                  month: currentDate.month() + 1,
                  year: currentDate.year(),
                  status: "weekoff",
                  wlStatus: "weekoff",
                  userId: weekoffResp.applyBy._id,
                },
              },
              {
                new: true,
                upsert: true, // Create the record if it doesn't exist
              },
            );
          }
        } catch (error) {
          logger.info(error);
          // logger.info("failed to insert weekoff");
        }
      }

      if (nextStep && nextStep.adminId.toString() != adminId) {
        weekoffResp.currentLevel = nextStep.level;
      }
      if (!nextStep) {
        weekoffResp.weekoffStatus = "approved";
        weekoffResp.aproveReason = reason;
      }
    } else {
      weekoffResp.weekoffStatus = "rejected"; // If rejected, stop process
    }

    await weekoffResp.save();
    return successRes2(res, 200, `Request ${status}`, { data: weekoffResp });
  } catch (error) {
    return res.send(errorRes(500, `${error.message}`));
  }
};

export const deleteWeekoff = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Weekoff ID is required"));
    const deleteWeekoff = await weekoffModel.findByIdAndDelete(id);
    if (!deleteWeekoff)
      return res.send(errorRes(404, `Weekoff not found with ID: ${id}`));
    return res.send(
      successRes(200, `Weekoff deleted successfully`, {
        deleteWeekoff,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

// import employeeModel from "../model/employee.model.js";
// import { errorRes, successRes } from "../model/response.js";
// import weekoffModel from "../model/weekoff.model.js";

// export const addweekoff = async (req, res, next) => {
//   const { weekoffDate, reason, aprovereason, weekoffstatus, reportingto, applyby } = req.body;

//   try {
//     if (!weekoffDate) return res.send(errorRes(401, "Week Off Date is required"));
//     if (!reason) return res.send(errorRes(401, "Reason is required"));

//     const applybyEmployee = await employeeModel.findById(applyby);
//     if (!applybyEmployee) return res.send(errorRes(404, "Apply By employee not found"));

//     const reportingToEmployee = await employeeModel.findById(reportingto);
//     if (!reportingToEmployee) return res.send(errorRes(404, "Reporting To employee not found"));

//     const newWeekOff = await weekoffModel.create({
//       weekoffDate,
//       reason,
//       aprovereason: aprovereason || "pending",
//       weekoffstatus: weekoffstatus|| "pending",
//       applyby,
//       reportingto,
//     });

//     return res.send(
//       successRes(200, "Week Off added", {
//         data: newWeekOff,
//       })
//     );
//   } catch (error) {
//     return res.status(500).send(errorRes(500, "Internal Server Error"));
//   }
// };

// export const getWeekOffs = async (req, res, next) => {
//   const { applyby, reportingto, weekoffstatus } = req.query;

//   try {
//     const query = {};

//     if (applyby) {
//       query.applyby = applyby;
//     }

//     if (reportingto) {
//       query.reportingto = reportingto;
//     }

//     if (weekoffstatus) {
//       query.weekoffstatus = weekoffstatus;
//     }
//     const weekoffs = await weekoffModel.find(query)
//       .populate('applyby', 'firstName lastName')
//       .populate('reportingto', 'firstName lastName');

//     if (weekoffs.length === 0) {
//       return res.send(errorRes(404, "No Week Off records found"));
//     }

//     return res.send(successRes(200, "Week Off records retrieved", { data: weekoffs }));
//   } catch (error) {
//
// logger.info("Error retrieving week offs:", error);
//     return res.status(500).send(errorRes(500, "Internal Server Error"));
//   }
// };

// export const getWeekOffById =async(req,res,next) =>{
//   const id= req.params.id;
//   try{
// if (!id)  return res.send(errorRes(401, "weekoff id required"));

// const weekoff= await weekoffModel.findById(id);

// if (!weekoff)  return res.send(errorRes(404, "weekoff is not found"));

// return res.send(
//   successRes(200,"get weekoff",{
//     data: weekoff,
//   })
// );
//   }catch(error){
//     return res.send(errorRes(500, "Internal Server Error"));
//   }
// };

// export const updateWeekOffStatus = async (req, res) => {
//   const { id } = req.params; // WeekOff request ID
//   const { weekoffstatus, aprovereason } = req.body;

//   try {

//     if (!weekoffstatus) {
//       return res.send({
//         success: false,
//         message: "Week Off status is required",
//       });
//     }

//     const weekoff = await weekoffModel.findById(id);
//     if (!weekoff) {
//       return res.send({
//         success: false,
//         message: "Week Off request not found",
//       });
//     }

//     weekoff.weekoffstatus = weekoffstatus;
//     weekoff.aprovereason = aprovereason || "No reason provided";

//     await weekoff.save();

//     return res.send({
//       success: true,
//       message: "Week Off status updated successfully",
//       data: weekoff,
//     });
//   } catch (error) {
//
// logger.info("Error updating Week Off status:", error);
//     return res.status(500).send({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const updateStartOftheWeek = async (req, res, next) => {
  try {
    const weekoff = await weekoffModel.find();
    const updatedWeekoff = await Promise.all(
      weekoff.map(async (ele) => {
        const startOfWeek = moment(ele.weekoffDate)
          .tz(timeZone)
          .startOf("week")
          .toDate();

        ele.startOfWeek = startOfWeek;
        // await weekoffModel.findOneAndUpdate(ele._id, {
        //   startOfWeek: startOfWeek,
        // });
        return ele;
      }),
    );

    return res.send(
      successRes(200, "get weekoff", {
        total: updatedWeekoff.length,
        data: updatedWeekoff,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
