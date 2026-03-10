import employeeModel from "../model/employee.model.js";
import leaveHistoryModel from "../model/attendance/leave/leavehistory.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import { leaveHistoryPopulateOptions } from "../utils/constant.js";
import moment from "moment-timezone";
import shiftModel from "../model/attendance/shift/shift.model.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import leaveRequestModel from "../model/attendance/leave/leaveRequest.model.js";
import logger from "../utils/logger.js";

export const getLeaveHistory = async (req, res) => {
  try {
    const respDes = await leaveHistoryModel
      .find()
      .populate(leaveHistoryPopulateOptions);

    return res.send(
      successRes(200, "Get Leave History", {
        data: respDes,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const getLeaveHistoryById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const emp = await employeeModel.findById(id);
    // logger.info(emp);

    const resp = await leaveHistoryModel
      .find({ userId: emp._id })
      .sort({ createdAt: -1 })
      .populate(leaveHistoryPopulateOptions);

    return res.send(
      successRes(200, "get leave history", {
        data: resp,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, `Server error ${e}`));
  }
};

export const createLeaveHistory = async (req, res) => {
  const body = req.body;

  const {
    userId,
    leaveType,
    deposittype,
    description,
    type,
    count,
    date,
    usedOn,
    adminId,
  } = body;

  try {
    const newLeaveHistory = await leaveHistoryModel.create({
      ...body,
    });
    await newLeaveHistory.save();

    return res.send(
      successRes(200, `leave history added successfully: ${body}`, {
        data: newLeaveHistory,
      }),
    );
  } catch (error) {
    logger.info(error);

    return res.send(errorRes(500, error));
  }
};

export const createLeaveHistoryFunc = async ({
  userId,
  leaveType,
  deposittype,
  description,
  type,
  count,
  date,
  usedOn,
  adminId,
  leave,
  regularization,
  howManyBefore,
  validity,
}) => {
  try {
    let validTill = moment(validity).isValid()
      ? moment(validity).tz("Asia/Kolkata").toDate()
      : null;
    let currnDate = moment(date).isValid()
      ? moment(date).tz("Asia/Kolkata")
      : moment().tz("Asia/Kolkata");

    if (!validity && leaveType === "on-compensation-off-leave") {
      //
      validTill = currnDate.add(6, "months").toDate();
    }
    const newLeaveHistory = await leaveHistoryModel.create({
      userId,
      leaveType,
      deposittype,
      description,
      type,
      count,
      date,
      usedOn,
      adminId,
      leave,
      regularization,
      howManyBefore,
      validTill,
    });
    await newLeaveHistory.save();

    return {
      success: true,
      data: newLeaveHistory,
      message: "Leave history created successfully",
    };
  } catch (error) {
    logger.info(error);

    return {
      success: false,
      error,
    };
  }
};

export const deleteLeaveHistory = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Leave History ID is required"));
    const deleteLeaveHistory = await leaveHistoryModel.findByIdAndDelete(id);
    if (!deleteLeaveHistory)
      return res.send(errorRes(404, `Leave History not found with ID: ${id}`));
    return res.send(
      successRes(
        200,
        `Leave History deleted successfully: ${deleteLeaveHistory.leaveType}`,
        {
          deleteLeaveHistory,
        },
      ),
    );
  } catch (error) {
    logger.info(error);

    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

//comp - off expiry
// export const compOffExpiry = async (req, res) => {
//   try {
//     const timeZone = "Asia/Kolkata";
//     const today = moment().tz(timeZone);

//     // const targetDate = today.subtract(6, "months");

//     logger.info(today);

//     const startOfDay = today.startOf("day").toDate();

//     const endOfDay = today.endOf("day").toDate();

//     logger.info("star", startOfDay);
//     logger.info("endOfDay", endOfDay);

//     const expiredCompOffs = await leaveHistoryModel.find({
//       leaveType: "on-compensation-off-leave",
//       validTill: {
//         $gte: startOfDay,
//         // $lte: endOfDay,
//       },
//     });

//     const updatedUsers = [];
//     // for (const user of expiredCompOffs) {
//     //   const { userId } = user;

//     const leaveHistory = await leaveHistoryModel.find({
//       userId,

//       leaveType: "on-compensation-off-leave",
//     });

//     //   await createLeaveHistoryFunc({
//     //     userId,
//     //     date: today.toDate(),
//     //     description: "Comp-off expired after 6 months",
//     //     count: 1,
//     //     type: "expired",
//     //     leaveType: "on-compensation-off-leave",
//     //     deposittype: "auto-generated",
//     //   });

//     //   const shift = await shiftInfoModel.findOne({ userId });

//     //   logger.info(shift);

//     //   // if (!shift) continue;

//     //   const currentCompOff = shift.compensatoryoff || 0;
//     //   const currentOverDue = shift.overDueCompOff || 0;

//     //   const updatedCompOff = Math.max(currentCompOff - 1, 0);
//     //   const updatedOverDue = currentOverDue + 1;

//     //   const resp = await shiftInfoModel.updateOne(
//     //     { userId },
//     //     {
//     //       $set: {
//     //         compensatoryoff: updatedCompOff,
//     //         overDueCompOff: updatedOverDue,
//     //       },
//     //     },
//     //   );

//     //   const updatedShift = await shiftInfoModel.findOne({ userId });
//     //   updatedUsers.push(updatedShift);
//     // }

//     return res.send(
//       successRes(200, "Comp-off expiry processed", {
//         length: updatedUsers.length,
//         data: updatedUsers,
//       }),
//     );
//   } catch (e) {
//     return res.send(errorRes(500, `Server error ${e}`));
//   }
// };

//all comp off leaves //the most oldest "used" comp off is less than today's 6 month
// if yes dont do anythong , else deduct //like 31/01/2026 , oldest "deposit" is 06/09 etc.. means 6 months not complted, dont minus , if deposit is before than that minus it
//  //like 02/04/2025

export const compOffExpiry = async (req, res) => {
  try {
    const timeZone = "Asia/Kolkata";
    const today = moment().tz(timeZone);

    const targetDay = today.subtract(6, "months");
    const expiryStDate = targetDay.startOf("day").toDate();
    const expiryDate = targetDay.endOf("day").toDate();

    const userId = "EV900-test-closing-m";

    const oldDeposits = await leaveHistoryModel.find({
      userId,
      leaveType: "on-compensation-off-leave",
      type: "deposit",
      date: { $gte: expiryStDate, $lte: expiryDate },
    });

    let expiredCount = 0;
    const updatedUsers = [];

    for (const deposit of oldDeposits) {
      const usedEntry = await leaveHistoryModel.findOne({
        userId,
        leaveType: "on-compensation-off-leave",
        type: "used",
        leave: { $exists: true },
      });

      if (!usedEntry) continue;

      const leave = await leaveRequestModel.findById(usedEntry.leave);

      if (leave && leave.leaveStatus === "rejected") {
        await createLeaveHistoryFunc({
          userId,
          date: today.toDate(),
          description: "Comp-off expired after 6 months",
          count: 1,
          type: "expired",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated-expiry",
        });

        await shiftInfoModel.updateOne(
          { userId },
          {
            $set: {
              compensatoryoff: Math.max((shift.compensatoryoff || 0) - 1, 0),
              overDueCompOff: (shift.overDueCompOff || 0) + 1,
            },
          },
        );

        expiredCount++;
        updatedUsers.push(userId);
      }
    }

    return res.send(
      successRes(200, "Comp-off expiry processed", {
        expiredCount,
        users: updatedUsers,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, `Server error ${e.message}`));
  }
};

export const overallCompExpiration = async (req, res) => {
  try {
    const sixMonthsAgo = moment().subtract(6, "months").toDate();

    const oldDeposits = await leaveHistoryModel.find({
      type: "deposit",
      leaveType: "on-compensation-off-leave",

      date: { $lte: sixMonthsAgo },
    });
    const expiredDeposits = [];
    const usedDeposits = [];

    for (const deposit of oldDeposits) {
      if (!deposit.validTill) continue;

      const usedRecord = await leaveHistoryModel.findOne({
        userId: deposit.userId,
        type: "used",
        leaveType: "on-compensation-off-leave",
        date: {
          $gte: deposit.date,
          $lte: deposit.validTill,
        },
      });

      if (usedRecord) {
        usedDeposits.push({
          deposit,
          used: usedRecord,
        });
      } else {
        expiredDeposits.push(deposit);
      }
    }

    return successRes2(res, 200, "Overall expiration", {
      data: {
        expiredDeposits,
        usedDeposits,
      },
    });
  } catch (error) {
    return errorRes2(res, 500, `Server error: ${error?.message}`);
  }
};
