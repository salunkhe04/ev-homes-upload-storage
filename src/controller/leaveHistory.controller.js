import employeeModel from "../model/employee.model.js";
import leaveHistoryModel from "../model/attendance/leave/leavehistory.model.js";
import { errorRes, successRes } from "../model/response.js";
import { leaveHistoryPopulateOptions } from "../utils/constant.js";
import moment from "moment-timezone";
import shiftModel from "../model/attendance/shift/shift.model.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";

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
    // console.log(error);
    return res.send(errorRes(500, error));
  }
};

export const getLeaveHistoryById = async (req, res, next) => {
  const id = req.params.id;

  try {
    const emp = await employeeModel.findById(id);
    // console.log(emp);

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
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

//comp - off expiry
export const compOffExpiry = async (req, res) => {
  try {
    const timeZone = "Asia/Kolkata";
    const today = moment().tz(timeZone);

    // const targetDate = today.subtract(6, "months");

    console.log(today);

    const startOfDay = today.startOf("day").toDate();

    const endOfDay = today.endOf("day").toDate();

    console.log("star", startOfDay);
    console.log("endOfDay", endOfDay);

    const expiredCompOffs = await leaveHistoryModel.find({
      leaveType: "on-compensation-off-leave",
      validTill: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
    const updatedUsers = [];
    // for (const user of expiredCompOffs) {
    //   const { userId } = user;

    //   await createLeaveHistoryFunc({
    //     userId,
    //     date: today.toDate(),
    //     description: "Comp-off expired after 6 months",
    //     count: 1,
    //     type: "expired",
    //     leaveType: "on-compensation-off-leave",
    //     deposittype: "auto-generated",
    //   });

    //   const shift = await shiftInfoModel.findOne({ userId });

    //   console.log(shift);

    //   if (!shift) continue;

    //   const currentCompOff = shift.compensatoryoff || 0;
    //   const currentOverDue = shift.overDueCompOff || 0;

    //   const updatedCompOff = Math.max(currentCompOff - 1, 0);
    //   const updatedOverDue = currentOverDue + 1;

    //   const resp = await shiftInfoModel.updateOne(
    //     { userId },
    //     {
    //       $set: {
    //         compensatoryoff: updatedCompOff,
    //         overDueCompOff: updatedOverDue,
    //       },
    //     },
    //   );

    //   const updatedShift = await shiftInfoModel.findOne({ userId });
    //   updatedUsers.push(updatedShift);
    // }

    return res.send(
      successRes(200, "Comp-off expiry processed", {
        length: updatedUsers.length,
        data: updatedUsers,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, `Server error ${e}`));
  }
};
