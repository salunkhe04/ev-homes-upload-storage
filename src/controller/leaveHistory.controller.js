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

export const overallCompExpiration = async (req, res) => {
  try {
    const sixMonthsAgo = moment().subtract(6, "months").toDate();

    const oldDeposits = await leaveHistoryModel.find({
      type: "deposit",
      leaveType: "on-compensation-off-leave",
      validTill: { $lt: new Date() },
      // date: { $lte: sixMonthsAgo },
    });
    const expiredDeposits = [];
    const usedDeposits = [];
    const comparedDeposits = [];

    for (const deposit of oldDeposits) {
      // if (!deposit.validTill) continue;

      const usedRecord = await leaveHistoryModel.findOne({
        userId: deposit.userId,
        type: "used",
        leaveType: "on-compensation-off-leave",
        date: {
          $gt: deposit.date,
          $lt: deposit.validTill,
        },
        _id: { $nin: comparedDeposits },
      });

      if (usedRecord) {
        comparedDeposits.push(usedRecord._id);
        usedDeposits.push({
          deposit,
          used: usedRecord,
        });
      } else {
        expiredDeposits.push({
          deposit,
        });
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

export const updateValidTillDates = async (req, res) => {
  try {
    const sixMonthsAgo = moment().subtract(6, "months").toDate();

    const oldDeposits = await leaveHistoryModel.find({
      type: "deposit",
      leaveType: "on-compensation-off-leave",

      // date: { $lte: sixMonthsAgo },
    });
    const expiredDeposits = [];
    const usedDeposits = [];

    for (const deposit of oldDeposits) {
      // if (!deposit.validTill) continue

      console.log(deposit._id);

      let sixMonths = moment(deposit.date)
        .tz("Asia/Kolkata")
        .add(180, "days")
        .toDate();

      const usedRecord = await leaveHistoryModel.findOneAndUpdate(
        {
          _id: deposit._id,
        },
        {
          $set: {
            validTill: sixMonths,
            // remaining: deposit.count,
          },
        },
      );

      if (usedRecord) {
        usedDeposits.push({
          used: usedRecord,
        });
      }
    }

    return successRes2(res, 200, "Overall expiration", {
      data: {
        usedDeposits,
        length: usedDeposits.length,
      },
    });
  } catch (error) {
    return errorRes2(res, 500, `Server error: ${error?.message}`);
  }
};

export const overallCompExpirationFunct = async () => {
  try {
    const shift = await shiftInfoModel.find();
    const userIds = shift.map((e) => e.userId);

    const oldDeposits = await leaveHistoryModel.find({
      userId: { $in: userIds },
      type: "deposit",
      leaveType: "on-compensation-off-leave",
      validTill: { $lt: new Date() },
      // date: { $lte: sixMonthsAgo },
      expired: false,
    }).sort({date:1});
    const expiredDeposits = [];
    const usedDeposits = [];
    const comparedDeposits = [];

    for (const deposit of oldDeposits) {
      if (!deposit?.validTill) continue;

      const usedRecord = await leaveHistoryModel.findOne({
        userId: deposit.userId,
        type: "used",
        leaveType: "on-compensation-off-leave",
        date: {
          $gt: deposit.date,
          $lt: deposit.validTill,
        },
        expired: false,
        count: deposit.count,
      }).sort({date:1});

      if (usedRecord) {
        // comparedDeposits.push(usedRecord._id);
        usedDeposits.push({
          deposit,
          used: usedRecord,
        });
        await leaveHistoryModel.findByIdAndUpdate(usedRecord._id, {
          $set: {
            expired: true,
          },
        });
      } else {
        expiredDeposits.push({
          deposit,
        });
        //

        await leaveHistoryModel.findByIdAndUpdate(deposit._id, {
          $set: {
            expired: true,
          },
        });
        const foundShift = await shiftInfoModel.findOne({
          userId: deposit.userId,
        });
        if (!foundShift) continue;

        if (foundShift.compensatoryoff <= 0) continue;

        await shiftInfoModel.findOneAndUpdate(
          { userId: deposit.userId },
          {
            //
            compensatoryoff: foundShift.compensatoryoff - deposit.count,
            overDueCompOff: foundShift.overDueCompOff + deposit.count,
          },
        );
      }
    }

    // return successRes2(res, 200, "Overall expiration", {
    
    return {
      expiredDeposits,
      usedDeposits,
    };
    // });
  } catch (error) {
    console.log(error);
    return {};
    // return errorRes2(res, 500, `Server error: ${error?.message}`);
  }
};
// for leave history single entry days
function distributeDays(totalDays) {
  const schedule = [];

  while (totalDays > 0) {
    if (totalDays >= 1) {
      schedule.push({ day: 1 });
      totalDays -= 1;
    } else if (totalDays >= 0.5) {
      schedule.push({ day: 0.5 });
      totalDays -= 0.5;
    } else {
      break; // ignore anything less than 0.5
    }
  }

  return schedule;
}

export const updateCompOffHistory = async (req, res) => {
  try {
    // take all comp off record
    const leaveHistory = await leaveHistoryModel
      .find({
        leaveType: { $ne: "on-compensation-off-leave" },
      })
      .lean();
    const singleEntries = [];
    const multiEntries = [];

    await Promise.all(
      leaveHistory.map(async (e) => {
        //1

        if (e.count === 1) {
          singleEntries.push(e); // 913 single entrues // 125 muliti
        } else {
          let entries = distributeDays(e.count);
          //
          const { _id, ...rest } = e;

          for (const multi of entries) {
            multiEntries.push({
              ...rest,
              count: multi.day,
            });
          }
        }
      }),
    );
    const finalEntries = [...singleEntries, ...multiEntries];

    const result = await leaveHistoryModel.aggregate([
      {
        $match: {
          leaveType: { $ne: "on-compensation-off-leave" },
        },
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" },
        },
      },
    ]);
    // await leaveHistoryModelTest.insertMany(finalEntries);

    return successRes2(res, 200, "Overall expiration", {
      data: {
        result,
        singlelength: singleEntries.length,
        multiEntrieslength: multiEntries.length,
        singleEntries,
        multiEntries,
      },
    });
  } catch (error) {
    return errorRes2(res, 500, `Server error: ${error?.message}`);
  }
};
