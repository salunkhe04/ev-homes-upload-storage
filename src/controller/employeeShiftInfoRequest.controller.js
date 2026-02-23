import { errorRes, successRes } from "../model/response.js";
import employeeShiftInfoRequestModel from "../model/attendance/shift/employeeShiftInfoRequest.model.js";
import { employeeShiftInfoRequestPopulateOptions } from "../utils/constant.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import { createLeaveHistoryFunc } from "./leaveHistory.controller.js";
import logger from "../utils/logger.js";

export const getShiftInfosRequest = async (req, res, next) => {
  try {
    const resp = await employeeShiftInfoRequestModel
      .find()
      .populate(employeeShiftInfoRequestPopulateOptions);

    return res.send(
      successRes(200, "get ShiftInfo request", {
        data: resp,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getShiftInfoRequestById = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const resp = await employeeShiftInfoRequestModel
      .find({ userId: id })
      .populate(employeeShiftInfoRequestPopulateOptions);

    return res.send(
      successRes(200, "get shift info", {
        data: resp,
      }),
    );
  } catch (error) {
    logger.error(error);
    // logger.info(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addShiftInfoRequest = async (req, res, next) => {
  const {
    date,
    userId,
    shift,
    totalLeaves,
    paidLeave = 0,
    paidLeaveremark,
    casualLeave = 0,
    casualLeaveremark,
    compensatoryoff = 0,
    compensatoryoffremark,
    remark,
  } = req.body;
  const user = req.user;
  try {
    if (!userId) return res.send(errorRes(401, "userId is required"));

    // Create a new shift with calculated shift hours
    const newemployeeShiftInfoRequest =
      await employeeShiftInfoRequestModel.create({
        ...req.body,
      });
    // logger.info(req.body);
    // logger.info("pass1");
    const employeeShiftInfoRequest = await employeeShiftInfoRequestModel
      .findById(newemployeeShiftInfoRequest._id)
      .populate(employeeShiftInfoRequestPopulateOptions);
    // logger.info("pass2");
    try {
      const lastShift = await shiftInfoModel.findOne({ userId: userId });
      // logger.info(lastShift);

      const success = await shiftInfoModel.findByIdAndUpdate(lastShift._id, {
        $set: {
          casualLeave: lastShift.casualLeave + casualLeave,
          paidLeave: lastShift.paidLeave + paidLeave,
          compensatoryoff: lastShift.compensatoryoff + compensatoryoff,
        },
      });
      if (paidLeave > 0) {
        const resp = await createLeaveHistoryFunc({
          date: date,
          description: paidLeaveremark,
          count: paidLeave,
          userId: userId,
          type: "deposit",
          leaveType: "on-paid-leave",
          deposittype: "manual-leave",
          adminId: user._id,
          howManyBefore: lastShift.paidLeave,
        });
      }

      if (casualLeave > 0) {
        const resp = await createLeaveHistoryFunc({
          date: date,
          description: casualLeaveremark,
          count: casualLeave,
          userId: userId,
          type: "deposit",
          leaveType: "on-casual-leave",
          deposittype: "manual-leave",
          adminId: user._id,
          howManyBefore: lastShift.casualLeave,
        });
      }

      if (compensatoryoff > 0) {
        const resp = await createLeaveHistoryFunc({
          date: date,
          description: compensatoryoffremark,
          count: compensatoryoff,
          userId: userId,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "manual-leave",
          adminId: user._id,
          howManyBefore: lastShift.compensatoryoff,
        });
      }
      // logger.info(success);
    } catch (error) {
      logger.error(error);
      //
      // logger.info(error);
    }
    return res.send(
      successRes(200, "Shift Info added", {
        data: employeeShiftInfoRequest,
      }),
    );
  } catch (error) {
    logger.error(error);
    // logger.info(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
