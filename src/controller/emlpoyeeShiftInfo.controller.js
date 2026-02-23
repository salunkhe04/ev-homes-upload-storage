import { errorRes, successRes } from "../model/response.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import { employeeShiftInfoPopulateOptions } from "../utils/constant.js";
import attendanceModel from "../model/attendance/attendance.model.js";
import shiftModel from "../model/attendance/shift/shift.model.js";
import moment from "moment-timezone";
import employeeModel from "../model/employee.model.js";
import { RedisService } from "../app/redis.js";
import logger from "../utils/logger.js";

export const getShiftInfos = async (req, res, next) => {
  try {
    const resp = await shiftInfoModel
      .find()
      .populate(employeeShiftInfoPopulateOptions);

    return res.send(
      successRes(200, "get FaceIds", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addShiftInfo = async (req, res, next) => {
  const {
    userId,
    shift,
    faceId,
    currentDate,
    totalLateDays,
    totalLeaves,
    paidLeave,
    casualLeave,
    componsitionOff,
  } = req.body;

  try {
    if (!userId) return res.send(errorRes(401, "userId is required"));

    // Check if shift already exists
    const oldShift = await shiftInfoModel.findOne({ userId });

    if (oldShift) return res.send(errorRes(401, "Shift Info Already Exist"));

    const newShiftInfoId =
      "shift-info-" + userId?.replace(/\s+/g, "-").toLowerCase();

    // Create a new shift with calculated shift hours
    const newFaceId = await shiftInfoModel.create({
      ...req.body,
      _id: newShiftInfoId,
    });

    const createdShiftInfo = await shiftInfoModel
      .findById(newFaceId._id)
      .populate(employeeShiftInfoPopulateOptions);

    const cacheNew = await RedisService.setMultipleKeys(
      [
        `employee_shift_info_${userId}`,
        `employee_shift_info_${createdShiftInfo?._id}`,
      ],
      createdShiftInfo,
      172800
    ); // 48 hr cache

    return res.send(
      successRes(200, "Shift Info added", {
        data: createdShiftInfo,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getShiftInfoById = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));
    const cached = await RedisService.get(`employee_shift_info_${id}`, true);
    if (cached != null) {
      //
      return res.send(
        successRes(200, "get shift info - cached", {
          data: cached,
        })
      );
    }

    const resp = await shiftInfoModel
      .findById(id)
      .populate(employeeShiftInfoPopulateOptions);

    const cacheNew = await RedisService.setMultipleKeys(
      [`employee_shift_info_${id}`, `employee_shift_info_${resp.userId}`],
      resp,
      172800
    ); // 48 hr cache

    return res.send(
      successRes(200, "get shift info", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getShiftInfoByUserId = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));
    const cached = await RedisService.get(`employee_shift_info_${id}`, true);
    // if (cached != null) {
    //   //
    //   return res.send(
    //     successRes(200, "get shift info - cached", {
    //       data: cached,
    //     })
    //   );
    // }

    const resp = await shiftInfoModel
      .findOne({ userId: id })
      .populate(employeeShiftInfoPopulateOptions);

    const cacheNew = await RedisService.setMultipleKeys(
      [`employee_shift_info_${id}`, `employee_shift_info_${resp._id}`],
      resp,
      172800
    ); // 48 hr cache

    return res.send(
      successRes(200, "get shift info", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const updateShiftInfo = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const {
    currentDate,
    totalLateDays,
    totalLeaves,
    paidLeave,
    casualLeave,
    compensatoryoff,
  } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));

    const updatedShiftInfo = await shiftInfoModel
      .findByIdAndUpdate(
        id,
        {
          currentDate,
          totalLateDays,
          totalLeaves,
          paidLeave,
          casualLeave,
          compensatoryoff,
        },
        { new: true }
      )
      .populate(employeeShiftInfoPopulateOptions);
    if (!updateShiftInfo)
      return res.send(errorRes(402, `shiftInfo cannot be updated `));

    const cacheDel = await RedisService.delMultipleKeys([
      `employee_shift_info_${id}`,
      `employee_shift_info_${updatedShiftInfo?.userId}`,
    ]);

    return res.send(
      successRes(200, `shiftInfo updated successfully `, {
        data: updatedShiftInfo,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const updateShift = async (req, res) => {
  const body = req.body;
  const id = req.params.id; // employee _id;
  const { shift } = body;

  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const emp = await employeeModel.findById(id);
    if (!emp) return res.send(errorRes(404, "Employee not found"));
    const newShift = await shiftModel.findById(shift);

    const existingShiftInfo = await shiftInfoModel.findOne({ userId: emp._id });

    const previousShiftId = existingShiftInfo?.shift;

    // Update employeeShiftInfo
    const updatedShiftInfo = await shiftInfoModel
      .findOneAndUpdate(
        { userId: emp._id },
        { shift: newShift ? newShift._id : null },
        { new: true, upsert: true }
      )
      .populate(employeeShiftInfoPopulateOptions);

    if (!updatedShiftInfo)
      return res.send(errorRes(402, `shiftInfo cannot be updated`));

    if (previousShiftId && (!newShift || newShift._id !== previousShiftId)) {
      await shiftModel.findByIdAndUpdate(previousShiftId, {
        $pull: { employees: emp._id },
      });
    }

    if (newShift) {
      await shiftModel.findByIdAndUpdate(newShift._id, {
        $addToSet: { employees: emp._id },
      });
    } else {
      await shiftModel.updateMany(
        { employees: emp._id },
        { $pull: { employees: emp._id } }
      );
    }

    const cacheDel = await RedisService.delMultipleKeys([
      `employee_shift_info_${id}`,
      `employee_shift_info_${updatedShiftInfo?._id}`,
    ]);

    return res.send(
      successRes(200, `shiftInfo updated successfully`, {
        data: updatedShiftInfo,
      })
    );
  } catch (e) {
    logger.error(e);
    return res.send(errorRes(500, e));
  }
};

export const resetGraceAndRegularization = async () => {
  try {
    const resp = await shiftInfoModel
      .find()
      .populate(employeeShiftInfoPopulateOptions);
    let changes = [];
    await Promise.all(
      resp.map(async (ele) => {
        try {
          await shiftInfoModel.findByIdAndUpdate(ele?._id, {
            $set: {
              regularization: ele?.shift?.regularizationDays,
              graceDays: ele?.shift?.graceDays,
            },
          });
          changes.push({
            userId: ele?.userId?._id,
            regul: ele?.regularization,
            grace: ele?.graceDays,
            updatedRegu: ele?.shift?.regularizationDays,
            updatedGraceDays: ele?.shift?.graceDays,
          });
        } catch (error) {
          logger.error(error);
        }
      })
    );

    return true;
  } catch (error) {
    return error;
  }
  return false;
};

export const storeOverTime = async (req, res) => {
  const userId = req.params.id;

  try {
    if (!userId) return res.send(errorRes(400, "userId is required"));

    const shiftInfo = await shiftInfoModel
      .findOne({ userId })
      .populate(employeeShiftInfoPopulateOptions);

    if (!shiftInfo) return res.send(errorRes(404, "Shift info not found"));

    // const shift = await shiftModel.findById(shiftInfo.shift);
    // if (!shift) return res.send(errorRes(404, "Shift not found"));
    const shift = shiftInfo.shift;
    const shiftHours = shift.workingHours;
    // logger.info(shiftHours);

    const today = new Date();
    const attendance = await attendanceModel.findOne({
      userId,
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    });

    if (!attendance || !attendance?.checkInTime || !attendance?.checkOutTime) {
      return res.send(
        errorRes(404, "Valid attendance record not found for today")
      );
    }
    const timeIn = moment(shift.timeIn, "HH:mm").toDate();
    const timeOut = moment(shift.timeOut, "HH:mm");

    // logger.info(timeIn);
    let inTime = moment(attendance.checkInTime);
    if (inTime.isBefore(timeIn)) {
      inTime = timeIn;
    }
    // logger.info(inTime);
    const outTime = moment(attendance.checkOutTime);
    // logger.info(outTime);
    const actualworkedHours = timeOut.diff(timeIn, "minutes", true);
    const workedHours = outTime.diff(inTime, "minutes", true);

    let undertime = actualworkedHours - workedHours;

    if (undertime <= 0) {
      undertime = 0;
    }
    // logger.info(` un ${undertime}`);

    // logger.info(`aws ${actualworkedHours}`);

    // logger.info(`ws ${workedHours}`);
    // logger.info(`ws ${workedHours - actualworkedHours}`);

    let overtime = workedHours - actualworkedHours;
    if (shiftInfo.payable === true) {
      if (overtime < 60) {
        overtime = 0;
      } else {
        overtime = Math.floor(overtime / 60) * 60;
      }

      // if (workedHours > shiftHours) {
      //   overtime = workedHours - shiftHours;
      // }
    }

    if (shiftInfo.payable === false) {
      if (overtime <= 30) {
        overtime = 0;
      } else {
        overtime = overtime - 30;
      }
    }

    shiftInfo.overtime = parseFloat(overtime.toFixed(2));
    shiftInfo.undertime = parseFloat(undertime.toFixed(2));
    await shiftInfo.save();

    return res.send(
      successRes(200, "Overtime stored", { data: { overtime, undertime } })
    );
  } catch (e) {
    logger.error(e);
    return res.send(errorRes(500, `Server error: ${e.message}`));
  }
};

export const updateOverTimeAndUnderTime = async (shiftInfo1, attendance) => {
  try {
    const shiftInfo = await shiftInfoModel
      .findById(shiftInfo1?._id)
      .populate(employeeShiftInfoPopulateOptions);

    if (!shiftInfo) return { overtime: 0, undertime: 0 };

    const shift = shiftInfo.shift;
    const shiftHours = shift.workingHours;
    // logger.info(shiftHours);

    if (!attendance || !attendance?.checkInTime || !attendance?.checkOutTime) {
      return { overtime: 0, undertime: 0 };
    }
    const timeIn = moment(shift.timeIn, "HH:mm").toDate();
    const timeOut = moment(shift.timeOut, "HH:mm");

    // logger.info(timeIn);
    let inTime = moment(attendance.checkInTime);
    if (inTime.isBefore(timeIn)) {
      inTime = timeIn;
    }
    const outTime = moment(attendance.checkOutTime);
    const actualworkedHours = timeOut.diff(timeIn, "minutes", true);
    const workedHours = outTime.diff(inTime, "minutes", true);

    let undertime = actualworkedHours - workedHours;

    if (undertime <= 0) {
      undertime = 0;
    }

    let overtime = workedHours - actualworkedHours;
    if (shiftInfo.payable === true) {
      if (overtime < 60) {
        overtime = 0;
      } else {
        overtime = Math.floor(overtime / 60) * 60;
      }
    }

    if (shiftInfo.payable === false) {
      if (overtime <= 30) {
        overtime = 0;
      } else {
        overtime = overtime - 30;
      }
    }

    shiftInfo.overtime = parseFloat(overtime.toFixed(2));
    shiftInfo.undertime = parseFloat(undertime.toFixed(2));
    await shiftInfo.save();

    return { overtime, undertime };
  } catch (e) {
    logger.error(e);
    return { overtime: 0, undertime: 0 };
  }
};
