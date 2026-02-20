import attendanceModel from "../model/attendance/attendance.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import {
  attendancePopulateOption,
  employeeShiftInfoPopulateOptions,
  shiftPopulateOptions,
} from "../utils/constant.js";
import XLSX from "xlsx";
import ExcelJS from "exceljs";
import moment from "moment-timezone";

import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import employeeModel from "../model/employee.model.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import attendanceChangesModel from "../model/attendance/attendanceChanges.model.js";
import config from "../config/config.js";
import holidayModel from "../model/attendance/holiday/holidays.model.js";
import { updateOverTimeAndUnderTime } from "./emlpoyeeShiftInfo.controller.js";
import { createLeaveHistoryFunc } from "./leaveHistory.controller.js";
import {
  sendNotificationWithImage,
  sendNotificationWithInfo,
} from "./oneSignal.controller.js";
import oneSignalModel from "../model/oneSignal.model.js";
import { RedisService } from "../app/redis.js";
import leaveHistoryModel from "../model/attendance/leave/leavehistory.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const calculateSeconds = (start, end) => {
  return Math.floor((new Date(end) - new Date(start)) / 1000);
};

export const getPendingCheckout = async (req, res, next) => {
  const id = req.params.id;
  const { status } = req.query; // Get userId from the request params
  // console.log(status);
  try {
    if (!id) return res.send(errorRes(400, "id is required")); // Validate id
    const currentDate = new Date();
    const startOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
    );

    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const filter = {
      userId: id,
      date: { $gte: startOfMonth, $lt: endOfMonth, $lt: startOfToday },
      status: { $ne: "weekoff" /*$ne: "reimbursement"*/ }, // Exclude weekoff and reimbursement statuses
    };
    // console.log(filter);

    const allRecords = await attendanceModel
      .find(filter)
      .populate(attendancePopulateOption);

    const shiftsInfos = await shiftInfoModel
      .find()
      .populate(employeeShiftInfoPopulateOptions);

    let filteredCheckouts = [];
    let lateComerCount = 0;
    let earlyLeaverCount = 0;
    let absentCount = 0;

    // Function to check for late comers
    const checkLateComer = (ele) => {
      if (ele.wlStatus === "grace-time") {
        return false;
      }

      const findShift = shiftsInfos.find(
        (ele2) => ele2.userId?._id === ele.userId?._id,
      );
      if (!findShift) return false;
      // if(!ele.checkInTime) return false;
      const [shiftHour, shiftMinute] = findShift?.shift?.timeIn
        ?.split(":")
        .map(Number);

      const now = moment(ele.checkInTime);
      // console.log(now);

      const timeIn = moment(now).set({
        hour: shiftHour,
        minute: shiftMinute,
        second: 0,
        millisecond: 0,
      });

      // console.log("yeah");
      const timeIn1HrAdd = moment(timeIn).add(1, "hours");

      // console.log(timeIn1HrAdd);

      const diffMinutes = now.diff(timeIn, "minutes");
      const isHeLate = diffMinutes > findShift?.shift.graceTime;
      // console.log(diffMinutes);
      if (isHeLate && now.isBefore(timeIn1HrAdd)) {
        filteredCheckouts.push(ele);

        return true;
      }
      // return isHeLate;
      return false;
    };

    // Function to check for early leavers
    const checkEarlyLeaver = (ele) => {
      const checkOutTime = new Date(ele.checkOutTime);
      const checkInTime = new Date(ele.checkInTime);

      if (!ele.checkOutTime || !ele.checkInTime) return false;
      const timeIn = moment(checkInTime);
      const timeOut = moment(checkOutTime);

      const totalShiftHours = timeOut.diff(timeIn, "hours");

      // console.log(totalShiftHours);
      // Find user's shift info
      const findShift = shiftsInfos.find(
        (shift) => shift.userId?._id === ele.userId?._id,
      );

      if (!findShift || !findShift.shift?.workingHours) return false;

      const requiredShiftHours = findShift.shift.workingHours;

      // console.log(
      //   `Worked: ${ele.day} ${totalShiftHours} hrs | Required: ${requiredShiftHours} hrs`
      // );

      // Check if they left early
      return totalShiftHours < requiredShiftHours;
    };

    // Filter based on status
    // if (status === "lateComer") {
    allRecords.filter((ele) => {
      if (checkLateComer(ele)) {
        lateComerCount++;
        return true;
      }
      return false;
    });
    // }
    if (status === "lateComer") {
      filteredCheckouts = allRecords.filter((ele) => {
        if (checkLateComer(ele)) {
          lateComerCount++;
          return true;
        }
        return false;
      });
    } else if (status === "earlyLeaver") {
      filteredCheckouts = allRecords.filter((ele) => {
        if (checkEarlyLeaver(ele)) {
          earlyLeaverCount++;
          return true;
        }
        return false;
      });
    }
    // else {
    //   // Default: Filter records for late comers and early leavers
    //   filteredCheckouts = allRecords.filter((ele) => {
    //     if (ele.status === "absent") {
    //       absentCount++;
    //       return true;
    //     }

    //     else if (ele.status === "half-day") {
    //       return true;
    //     }

    //     else if (checkLateComer(ele)) {
    //       lateComerCount++;
    //       return true;
    //     }
    //     else if (checkEarlyLeaver(ele)) {
    //       earlyLeaverCount++;
    //       return true;
    //     }
    //     return false;
    //   });
    // }

    return res.send(
      successRes(200, "Pending Checkout Found!", {
        lateComerCount,
        earlyLeaverCount,
        absentCount,
        data: filteredCheckouts,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

export const checkIn = async (req, res) => {
  try {
    const {
      userId,
      checkInLatitude,
      checkInLongitude,
      checkInPhoto,
      checkInAddress,
      checkInTime,
      similarity,
    } = req.body;

    // Validate required fields
    if (!userId || !checkInLatitude || !checkInLongitude || !checkInPhoto) {
      return res.send(errorRes(400, "Missing required fields"));
    }

    let statusWillBe = "active";
    let wlStatusWillBe = null;
    let lateMinutes = 0;
    let earlyMinutes = 0;

    const now =
      checkInTime != null && moment(checkInTime).isValid()
        ? moment(checkInTime)
        : moment();

    const nowStartOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const nowEndOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

    const myLeaves = await shiftInfoModel
      .findOne({ userId: userId })
      .populate(employeeShiftInfoPopulateOptions);

    const haveGraceDays = myLeaves?.totalLateDays <= myLeaves?.shift?.graceDays;

    const timeIn = moment(myLeaves.shift.timeIn, "HH:mm").toDate();
    const diffSeconds = now.diff(timeIn, "seconds"); // Get remaining seconds
    const diffMinutes = now.diff(timeIn, "minutes");
    const diffHours = now.diff(timeIn, "hour");

    const isHeLate = diffMinutes > myLeaves.shift.graceTime;
    const shouldBeAbsent = diffHours > myLeaves.shift.absentHours;
    const isFlexi = myLeaves?.shift?.type?.toLowerCase() === "flexi";

    const haveHoliday = await holidayModel.findOne({
      startDate: { $gte: nowStartOfDay, $lte: nowEndOfDay },
      endDate: { $lte: nowEndOfDay },
    });
    // console.log(haveHoliday);
    if (haveHoliday) {
      wlStatusWillBe = "holiday";
    }
    // if he is late than absent criteria
    if (shouldBeAbsent && isFlexi == false) {
      statusWillBe = "absent";
      await shiftInfoModel.findByIdAndUpdate(myLeaves._id, {
        totalLateDays: myLeaves.totalLateDays + 1,
        currentDate: now,
      });
      lateMinutes = diffMinutes - myLeaves.shift.graceTime;
    }
    // if he is late but not in absent criteria
    else if (isHeLate && isFlexi == false) {
      // if he have grace days (eg.he is not late few days(grace days))
      // if (!haveGraceDays) {
      statusWillBe = "half-day";
      // } else {
      //   wlStatusWillBe = "grace-time";
      // }

      // await shiftInfoModel.findByIdAndUpdate(myLeaves._id, {
      //   totalLateDays: myLeaves.totalLateDays + 1,
      //   currentDate: now,
      // });
      lateMinutes = diffMinutes - myLeaves.shift.graceTime;
    }

    const existingAttendance = await attendanceModel.findOne({
      userId,
      day: now.date(),
      month: now.month() + 1,
      year: now.year(),
    });

    if (existingAttendance) {
      if (
        !existingAttendance.checkInTime ||
        !existingAttendance.checkInLatitude ||
        !existingAttendance.checkInLongitude ||
        !existingAttendance.checkInPhoto
      ) {
        wlStatusWillBe = existingAttendance.wlStatus;

        const updated = await attendanceModel
          .findByIdAndUpdate(existingAttendance._id, {
            checkInLatitude: checkInLatitude,
            checkInLongitude: checkInLongitude,
            checkInAddress: checkInAddress,
            checkInPhoto: checkInPhoto,
            checkInTime: now,
            status: statusWillBe,
            lateMinutes: lateMinutes,
            wlStatus: wlStatusWillBe,
            checkInSimilarity: similarity,
          })
          .populate(attendancePopulateOption);
        try {
          //const dta = await oneSignalModel.find({
          //   $or: [{ docId: "ev201-aktarul-biswas" },{ docId: "ev15-deepak-karki" }],
          // role: teamLeaderResp?.role,
          // });
          // let ids =[]; //dta.map((ele) => ele.playerId);
          // console.log(foundTLPlayerId);
          /* await sendNotificationWithImage({
                playerIds: [...ids],
                title: "check-in",
                message: `check-in by ${updated?.userId?.firstName ?? ""} ${
                  updated?.userId?.lastName ?? ""
                }`,
                imageUrl: "https://cdn.evhomes.tech/bbefe53c-ac69-44d2-a76d-ec9b01a97671-office-software-attendance-management-business-concept-infographics-for-web-banner-calendar-task-list-and-chart-the-user-personal-account-vector.jpg",
              });
          */
        } catch (error) {
          //
        }

        try {
          // day: now.date(),
          await RedisService.delMultipleKeys([
            `all_attendance_list_${userId}`,
            `daily_attendance_list`,
          ]);
        } catch (error) {
          //
        }

        return res.send(
          successRes(
            200,
            statusWillBe === "active"
              ? "Check-in successful"
              : `Marked as ${statusWillBe}`,
            {
              data: updated,
            },
          ),
        );
      }

      return res.send(
        successRes(400, "User has already checked in today", {
          data: existingAttendance,
        }),
      );
    }

    const newAttendance = new attendanceModel({
      userId,
      date: now,
      day: now.date(),
      month: now.month() + 1,
      year: now.year(),
      checkInTime: now,
      checkInLatitude,
      checkInLongitude,
      checkInPhoto,
      checkInAddress,
      status: statusWillBe,
      lateMinutes: lateMinutes,
      wlStatus: wlStatusWillBe,
      checkInSimilarity: similarity,
    });

    await newAttendance.save();
    const newAtt = await attendanceModel
      .findById(newAttendance?._id)
      .populate(attendancePopulateOption);
    try {
      //  const dta = await oneSignalModel.find({
      //            $or: [{ docId: "ev201-aktarul-biswas" },{ docId: "ev15-deepak-karki" }],
      // role: teamLeaderResp?.role,
      //  });
      //   let ids = [];//dta.map((ele) => ele.playerId);
      // console.log(foundTLPlayerId);
      //  await sendNotificationWithImage({
      // playerIds: [...ids],
      //title: "check-in",
      //  message: `check-in by ${newAtt?.userId?.firstName ?? ""} ${
      //   newAtt?.userId?.lastName ?? ""
      //}`,
      //    imageUrl: "https://cdn.evhomes.tech/bbefe53c-ac69-44d2-a76d-ec9b01a97671-office-software-attendance-management-business-concept-infographics-for-web-banner-calendar-task-list-and-chart-the-user-personal-account-vector.jpg",
      //    });
    } catch (error) {
      //
    }
    try {
      //
      await RedisService.delMultipleKeys([
        `all_attendance_list_${userId}`,
        `daily_attendance_list`,
      ]);
    } catch (error) {
      //
    }

    return res.send(
      successRes(
        200,
        statusWillBe === "active"
          ? "Check-in successful"
          : `Marked as ${statusWillBe}`,
        { data: newAtt },
      ),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const checkOut = async (req, res) => {
  try {
    const {
      userId,
      checkOutLatitude,
      checkOutLongitude,
      checkOutPhoto,
      similarity,
      checkOutAddress,
    } = req.body;
    // const now = new Date();

    // const attendance = await attendanceModel
    //   .findOne({
    //     userId,
    //     day: now.getDate(),
    //     month: now.getMonth() + 1,
    //     year: now.getFullYear(),
    //   })
    //   .populate(attendancePopulateOption);

    let now = moment().tz("Asia/Kolkata");

    // If before 5 AM, use previous day
    if (now.hour() < 5) {
      now = now.subtract(1, "day");
    }

    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.date(),
        month: now.month() + 1, // moment month is 0-based
        year: now.year(),
      })
      .populate(attendancePopulateOption);

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    if (attendance.checkOutTime) {
      return res.send(errorRes(400, "User has already checked out"));
    }

    const nowM = moment();
    const nowStartOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const nowEndOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

    const myLeaves = await shiftInfoModel
      .findOne({ userId: userId })
      .populate(employeeShiftInfoPopulateOptions);

    const haveHoliday = await holidayModel.findOne({
      startDate: { $gte: nowStartOfDay, $lte: nowEndOfDay },
      endDate: { $lte: nowEndOfDay },
    });
    // console.log(haveHoliday);

    // const haveGraceDays = myLeaves?.totalLateDays <= myLeaves?.shift?.graceDays;

    // const timeIn = moment(myLeaves.shift.timeIn, "HH:mm").toDate();
    // const diffSeconds = nowM.diff(timeIn, "seconds"); // Get remaining seconds
    // const diffMinutes = nowM.diff(timeIn, "minutes");
    // const diffHours = nowM.diff(timeIn, "hour");

    const activeDuration =
      calculateSeconds(attendance.checkInTime, now) -
      attendance.totalBreakSeconds;
    attendance.checkOutTime = now;
    attendance.checkOutLatitude = checkOutLatitude;
    attendance.checkOutLongitude = checkOutLongitude;
    attendance.checkOutPhoto = checkOutPhoto;
    attendance.totalActiveSeconds = activeDuration;
    attendance.checkOutAddress = checkOutAddress;
    attendance.checkOutSimilarity = similarity;
    // const difference = calculateHoursDifferenceWithTZ(attendance.checkInTime);
    const diffInHours = nowM.diff(attendance.checkInTime, "hour");

    const minWorkHours = myLeaves?.shift?.workingHours;
    const absentHours = myLeaves?.shift?.absentHours;

    if (haveHoliday) {
      attendance.wlStatus = "holiday";
    }

    // console.log(diffInHours);
    if (attendance.status === "half-day" || attendance.status === "absent") {
      // console.log("skipped");
      //skip if already absent/half-day
    } else if (diffInHours < absentHours) {
      attendance.status = "absent";
      // console.log("absent hours");
    } else if (diffInHours > absentHours && diffInHours < minWorkHours) {
      attendance.status = "half-day";
      // console.log("half day hours");
    } else if (diffInHours >= minWorkHours) {
      // console.log("completed min hours");

      attendance.status = "present";
      if (
        attendance.wlStatus === "weekoff" ||
        attendance.status === "weekoff"
      ) {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on weekoff",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      } else if (attendance.wlStatus === "holiday") {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on holiday",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      } else if (
        attendance.wlStatus === "on-paid-leave" ||
        attendance.wlStatus === "on-casual-leave"
      ) {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on leave",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      }
    } else {
      // console.log("else");

      attendance.status = "half-day";
    }
    await attendance.save();
    // try {
    //   await updateOverTimeAndUnderTime(myLeaves, attendance);
    // } catch (error) {
    //   //
    //   console.log(error);
    // }
    try {
      //
      await RedisService.delMultipleKeys([
        `all_attendance_list_${userId}`,
        `daily_attendance_list`,
      ]);
    } catch (error) {
      //
    }

    return res.send(
      successRes(200, "Check-out successful", { data: attendance }),
    );
  } catch (error) {
    // console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const checkOutV2 = async (req, res) => {
  try {
    const {
      userId,
      checkOutLatitude,
      checkOutLongitude,
      checkOutPhoto,
      similarity,
      checkOutAddress,
      checkOutTime,
    } = req.body;
    // const now = new Date();

    // // 1. Fetch today's attendance
    // const attendance = await attendanceModel
    //   .findOne({
    //     userId,
    //     day: now.getDate(),
    //     month: now.getMonth() + 1,
    //     year: now.getFullYear(),
    //   })
    //   .populate(attendancePopulateOption);
    const now =
      checkOutTime != null && moment(checkOutTime).isValid()
        ? moment(checkOutTime)
        : moment();
    const now2 =
      checkOutTime != null && moment(checkOutTime).isValid()
        ? moment(checkOutTime)
        : moment();

    // let now = moment().tz("Asia/Kolkata");

    // If before 5 AM, use previous day
    if (now.hour() < 5) {
      now = now.subtract(1, "day");
    }

    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.date(),
        month: now.month() + 1, // moment month is 0-based
        year: now.year(),
      })
      .populate(attendancePopulateOption);

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    if (attendance.checkOutTime) {
      return res.send(errorRes(400, "User has already checked out"));
    }

    // 2. Date boundaries for holiday check
    const nowM = moment();
    const nowStartOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const nowEndOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

    // 3. Get user shift info
    const myLeaves = await shiftInfoModel
      .findOne({ userId: userId })
      .populate(employeeShiftInfoPopulateOptions);

    const haveHoliday = await holidayModel.findOne({
      startDate: { $gte: nowStartOfDay, $lte: nowEndOfDay },
      endDate: { $lte: nowEndOfDay },
    });

    // 4. Calculate durations
    const activeDuration =
      calculateSeconds(attendance.checkInTime, now) -
      attendance.totalBreakSeconds;
    const activeHours = moment
      .duration(activeDuration, "seconds")
      .asHours()
      .toFixed(2);

    const diffInHours = nowM.diff(attendance.checkInTime, "hour");

    const minWorkHours = myLeaves?.shift?.workingHours;
    const absentHours = myLeaves?.shift?.absentHours;
    const isFlexi = myLeaves?.shift?.type?.toLowerCase() === "flexi";

    // 5. Save checkout info
    attendance.checkOutTime = now2.toDate();
    attendance.checkOutLatitude = checkOutLatitude;
    attendance.checkOutLongitude = checkOutLongitude;
    attendance.checkOutPhoto = checkOutPhoto;
    attendance.totalActiveSeconds = activeDuration;
    attendance.checkOutAddress = checkOutAddress;
    attendance.checkOutSimilarity = similarity;

    // 6. Mark status
    if (haveHoliday) {
      attendance.wlStatus = "holiday";
    }

    if (isFlexi) {
      if (activeHours < absentHours) {
        attendance.status = "absent";
      } else if (activeHours >= absentHours && activeHours < minWorkHours) {
        attendance.status = "half-day";
      } else {
        attendance.status = "present";
      }
    } else {
      if (attendance.status === "half-day" || attendance.status === "absent") {
        // Skip re-calculation if already marked
      } else if (diffInHours < absentHours) {
        attendance.status = "absent";
      } else if (diffInHours >= absentHours && diffInHours < minWorkHours) {
        attendance.status = "half-day";
      } else {
        attendance.status = "present";
      }
    }

    // 7. Compensatory logic if marked present
    if (attendance.status === "present") {
      if (attendance.wlStatus === "weekoff") {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on weekoff",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      } else if (attendance.wlStatus === "holiday") {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on holiday",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      } else if (
        attendance.wlStatus === "on-paid-leave" ||
        attendance.wlStatus === "on-casual-leave"
      ) {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on leave",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      }
    }

    await attendance.save();

    // Optionally update overtime/undertime
    // try {
    //   await updateOverTimeAndUnderTime(myLeaves, attendance);
    // } catch (error) {
    //   console.log(error);
    // }
    try {
      // const dta = await oneSignalModel.find({
      //   $or: [{ docId: "ev201-aktarul-biswas" },{ docId: "ev15-deepak-karki" }],
      // role: teamLeaderResp?.role,
      // });
      // let ids = dta.map((ele) => ele.playerId);
      // console.log(foundTLPlayerId);
      //await sendNotificationWithImage({
      // playerIds: [...ids],
      // title: "check-out",
      //   message: `check-out by ${attendance?.userId?.firstName ?? ""} ${
      //    attendance?.userId?.lastName ?? ""
      //  }`,
      //   imageUrl: "https://cdn.evhomes.tech/bbefe53c-ac69-44d2-a76d-ec9b01a97671-office-software-attendance-management-business-concept-infographics-for-web-banner-calendar-task-list-and-chart-the-user-personal-account-vector.jpg",
      // });
    } catch (error) {
      //
    }
    try {
      //
      await RedisService.delMultipleKeys([
        `all_attendance_list_${userId}`,
        `daily_attendance_list`,
      ]);
    } catch (error) {
      //
    }

    return res.send(
      successRes(200, "Check-out successful", { data: attendance }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const revisedCheckOutV2 = async (req, res) => {
  try {
    const {
      userId,
      checkOutLatitude,
      checkOutLongitude,
      checkOutPhoto,
      similarity,
      checkOutAddress,
      checkOutTime,
    } = req.body;

    let now =
      checkOutTime != null && moment(checkOutTime).isValid()
        ? moment(checkOutTime)
        : moment();
    const now2 =
      checkOutTime != null && moment(checkOutTime).isValid()
        ? moment(checkOutTime)
        : moment();

    // let now = moment().tz("Asia/Kolkata");

    // If before 5 AM, use previous day
    if (now.hour() < 5) {
      now = now.subtract(1, "day");
    }

    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.date(),
        month: now.month() + 1, // moment month is 0-based
        year: now.year(),
      })
      .populate(attendancePopulateOption);

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    if (attendance.checkOutTime) {
      return res.send(errorRes(400, "User has already checked out"));
    }

    // 2. Date boundaries for holiday check
    const nowStartOfDay = now.startOf("day").toDate();
    const nowEndOfDay = now.endOf("day").toDate();

    // 3. Get user shift info
    const myLeaves = await shiftInfoModel
      .findOne({ userId: userId })
      .populate(employeeShiftInfoPopulateOptions);

    if (!myLeaves) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    const haveHoliday = await holidayModel.findOne({
      startDate: { $gte: nowStartOfDay, $lte: nowEndOfDay },
      endDate: { $lte: nowEndOfDay },
    });

    // 4. Calculate durations
    const activeDuration =
      calculateSeconds(attendance.checkInTime, now2) -
      attendance.totalBreakSeconds;
    // const activeHours = moment
    //   .duration(activeDuration, "seconds")
    //   .asHours()
    //   .toFixed(2);

    const activeHours = now2.diff(attendance.checkInTime, "hour", true);

    const minWorkHours = myLeaves?.shift?.workingHours;
    const absentHours = myLeaves?.shift?.absentHours;
    const isFlexi = myLeaves?.shift?.type?.toLowerCase() === "flexi";
    const dept = myLeaves?.department?._id;

    // 5. Save checkout info
    attendance.checkOutTime = now2.toDate();
    attendance.checkOutLatitude = checkOutLatitude;
    attendance.checkOutLongitude = checkOutLongitude;
    attendance.checkOutPhoto = checkOutPhoto;
    attendance.totalActiveSeconds = activeDuration;
    attendance.checkOutAddress = checkOutAddress;
    attendance.checkOutSimilarity = similarity;

    // 6. Mark status
    if (haveHoliday) {
      attendance.wlStatus = "holiday";
    }

    if (isFlexi && dept === "dept-marketing") {
      if (activeHours < absentHours) {
        attendance.status = "absent";
      } else if (activeHours >= absentHours && activeHours < minWorkHours) {
        attendance.status = "half-day";
      } else {
        attendance.status = "present";
      }
    } else if (isFlexi && dept === "dept-it") {
      if (activeHours >= minWorkHours) {
        attendance.status = "present";
      } else {
        attendance.status = "active";
      }
    }

    await attendance.save();

    // 7. Compensatory logic if marked present
    if (attendance.status === "present") {
      if (attendance.wlStatus === "weekoff") {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on weekoff",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      } else if (attendance.wlStatus === "holiday") {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on holiday",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      } else if (
        attendance.wlStatus === "on-paid-leave" ||
        attendance.wlStatus === "on-casual-leave"
      ) {
        myLeaves.compensatoryoff += 1;
        await myLeaves.save();
        await createLeaveHistoryFunc({
          userId: attendance.userId,
          date: attendance.date,
          description: "auto-generated leave present on leave",
          count: 1,
          type: "deposit",
          leaveType: "on-compensation-off-leave",
          deposittype: "auto-generated",
          howManyBefore: myLeaves.compensatoryoff - 1,
        });
      }
    }

    // Optionally update overtime/undertime
    // try {
    //   await updateOverTimeAndUnderTime(myLeaves, attendance);
    // } catch (error) {
    //   console.log(error);
    // }
    try {
      // const dta = await oneSignalModel.find({
      //   $or: [{ docId: "ev201-aktarul-biswas" },{ docId: "ev15-deepak-karki" }],
      // role: teamLeaderResp?.role,
      // });
      // let ids = dta.map((ele) => ele.playerId);
      // console.log(foundTLPlayerId);
      //await sendNotificationWithImage({
      // playerIds: [...ids],
      // title: "check-out",
      //   message: `check-out by ${attendance?.userId?.firstName ?? ""} ${
      //    attendance?.userId?.lastName ?? ""
      //  }`,
      //   imageUrl: "https://cdn.evhomes.tech/bbefe53c-ac69-44d2-a76d-ec9b01a97671-office-software-attendance-management-business-concept-infographics-for-web-banner-calendar-task-list-and-chart-the-user-personal-account-vector.jpg",
      // });
    } catch (error) {
      //
    }
    try {
      //
      await RedisService.delMultipleKeys([
        `all_attendance_list_${userId}`,
        `daily_attendance_list`,
      ]);
    } catch (error) {
      //
    }

    return res.send(
      successRes(200, "Check-out successful", { data: attendance }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Internal Server Error ${error}`));
  }
};

export const getCheckInByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.send(errorRes(401, "userId Required"));

    // const now = new Date();
    // const existingAttendance = await attendanceModel
    //   .findOne({
    //     userId,
    //     day: now.getDate(),
    //     month: now.getMonth() + 1,
    //     year: now.getFullYear(),
    //   })
    //   .populate(attendancePopulateOption);
    // Current time in Asia/Kolkata
    let now = moment().tz("Asia/Kolkata");

    // If before 5 AM, use previous day
    if (now.hour() < 5) {
      now = now.subtract(1, "day");
    }
    // console.log({
    //   userId,
    //   day: now.date(),
    //   month: now.month() + 1, // moment month is 0-based
    //   year: now.year(),
    // });

    const existingAttendance = await attendanceModel
      .findOne({
        userId,
        day: now.date(),
        month: now.month() + 1, // moment month is 0-based
        year: now.year(),
      })
      .populate(attendancePopulateOption);

    if (!existingAttendance)
      return res.send(errorRes(404, "No attendance Found"));

    return res.send(
      successRes(200, "Checked In", {
        data: existingAttendance,
      }),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getCheckInByDate = async (req, res) => {
  const { date, filter, startDate, endDate, department } = req.query;
  try {
    let filterToUse = {};
    let now = new Date();
    // console.log(req.query);

    if (date) {
      now = new Date(date);
    }
    filterToUse = {
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };

    const cached = await RedisService.get("daily_attendance_list", true);
    if (cached != null && !filter && !department) {
      //
      return res.send(
        successRes(200, "Attendance List -cached", {
          ...cached,
        }),
      );
    }
    if (filter === "day") {
      filterToUse = {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      };
    } else if (filter === "week") {
      const startOfWeek = moment(now)
        .tz("Asia/Kolkata")
        .startOf("week")
        .toDate();

      const endOfWeek = moment(now).tz("Asia/Kolkata").endOf("week").toDate();

      filterToUse = {
        day: { $gte: startOfWeek.getDate(), $lte: endOfWeek.getDate() },
        month: startOfWeek.getMonth() + 1,
        year: startOfWeek.getFullYear(),
      };
    } else if (filter === "month") {
      const startOfMonth = moment(now)
        .tz("Asia/Kolkata")
        .startOf("month")
        .toDate();

      filterToUse = {
        month: startOfMonth.getMonth() + 1,
        year: startOfMonth.getFullYear(),
      };
    } else if (filter === "custom") {
      const startOfDate = moment(startDate).tz("Asia/Kolkata").toDate();
      const endOfDate = moment(endDate).tz("Asia/Kolkata").toDate();
      // console.log(startOfDate.getDate());
      // console.log(endOfDate.getDate());
      filterToUse = {
        day: { $gte: startOfDate.getDate(), $lte: endOfDate.getDate() },
        month: {
          $gte: startOfDate.getMonth() + 1,
          $lte: endOfDate.getMonth() + 1,
        },
        year: {
          $gte: startOfDate.getFullYear(),
          $lte: endOfDate.getFullYear(),
        },

        // month: startOfMonth.getMonth() + 1,
        // year: startOfMonth.getFullYear(),
      };
    }

    if (department) {
      //
      const emps = await employeeModel.find(
        { department: department, status: "active" },
        { _id: 1 },
      );
      const ids = emps.map((ele) => ele._id);
      filterToUse = {
        ...filterToUse,
        userId: { $in: ids },
      };
    }

    // console.log(JSON.stringify(filterToUse, null, 2));

    const existingAttendance = await attendanceModel
      .find(filterToUse)
      .populate(attendancePopulateOption);

    const allLeaves = await shiftInfoModel
      .find()
      .populate(employeeShiftInfoPopulateOptions);
    const presentList = existingAttendance.filter(
      (ele) => ele.status === "active" || ele.status === "present",
    );
    const absentList = existingAttendance.filter(
      (ele) => ele.status === "absent",
    );
    const halfDayList = existingAttendance.filter(
      (ele) => ele.status === "half-day",
    );

    const weekOffList = existingAttendance.filter(
      (ele) => ele.status === "weekoff",
    );

    const onLeaveList = existingAttendance.filter(
      (ele) => ele.status === "on-leave",
    );

    const lateComersList = presentList.filter((ele) => {
      // const checkInTime = new Date(ele.checkInTime);
      // const lateThreshold = new Date();
      // lateThreshold.setHours(11, 20, 59); // Set threshold to 11:20 AM
      const now2 = moment(ele.checkInTime);

      const myLeaves = allLeaves.find(
        (ele2) => ele2?.userId?._id === ele?.userId?._id,
      );

      if (!myLeaves) return true;

      // console.log(myLeaves);

      const timeIn = moment(myLeaves?.shift?.timeIn, "HH:mm").toDate();
      const diffMinutes = now2.diff(timeIn, "minutes");

      const isHeLate = diffMinutes > myLeaves?.shift?.graceTime;

      return isHeLate;
      // return checkInTime > lateThreshold;
    });

    // Initialize early leavers list
    const earlyLeaversList = presentList.filter((ele) => {
      const checkOutTime = new Date(ele.checkOutTime);
      const checkInTime = new Date(ele.checkInTime);
      const totalShiftHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      const designation = ele.userId?.designation._id;
      const idsAll = [
        "desg-senior-closing-manager",
        "desg-sales-executive",
        "desg-site-head",
        "desg-data-analyzer",
        "desg-floor-manager",
        "desg-front-desk-executive",
        "desg-senior-sales-manager",
        "desg-sales-manager",
      ];
      const idsIT = ["desg-app-developer", "desg-video-editor"];

      // Define conditions for early leavers
      if (
        (ele.checkOutTime != null &&
          idsAll.includes(designation) &&
          (checkOutTime.getHours() < 21 || totalShiftHours <= 10)) || // Check for 9 PM and 10 hours shift
        (ele.checkOutTime != null &&
          idsIT.includes(designation) &&
          (checkOutTime.getHours() < 19 || totalShiftHours <= 8)) // Check for 7 PM and 8 hours shift
      ) {
        return true;
      }

      return false;
    });
    if (!filter || !department) {
      const cached = await RedisService.set(
        "daily_attendance_list",
        {
          presentCount: presentList.length,
          absentCount: absentList.length,
          weekOffCount: weekOffList.length,
          onLeaveCount: onLeaveList.length,
          lateComersCount: lateComersList.length,
          earlyLeaversCount: earlyLeaversList.length,
          halfDayCount: halfDayList.length,
          data: existingAttendance,
          halfDayList,
          presentList,
          absentList,
          weekOffList,
          onLeaveList,
          lateComersList,
          earlyLeaversList,
        },
        86400,
      );
    }

    return successRes2(res, 200, "Attendance List", {
      presentCount: presentList.length,
      absentCount: absentList.length,
      weekOffCount: weekOffList.length,
      onLeaveCount: onLeaveList.length,
      lateComersCount: lateComersList.length,
      earlyLeaversCount: earlyLeaversList.length,
      halfDayCount: halfDayList.length,
      data: existingAttendance,
      halfDayList,
      presentList,
      absentList,
      weekOffList,
      onLeaveList,
      lateComersList,
      earlyLeaversList,
    });
  } catch (error) {
    console.error(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
};

export const getGraceApplicableRecords = async (req, res) => {
  const { userId, date, filter, startDate, endDate } = req.query;
  try {
    if (!userId) return errorRes2(res, 401, "id required");

    let filterToUse = {
      userId: userId,
    };
    let now = new Date();
    // console.log(req.query);

    if (date) {
      now = new Date(date);
    }
    const startOfMonth = moment(now)
      .tz("Asia/Kolkata")
      // .subtract(1, "months")
      .startOf("month")
      .toDate();
    // console.log(startOfMonth);
    const shiftInfo = await shiftInfoModel
      .findOne({ userId })
      .populate(employeeShiftInfoPopulateOptions);

    if (!shiftInfo) return errorRes2(res, 404, "no shift assigend");

    filterToUse = {
      userId: userId,
      month: startOfMonth.getMonth() + 1,
      year: startOfMonth.getFullYear(),
      // checkInTime:
    };
    if (filter === "custom") {
      const startOfDate = moment(startDate).tz("Asia/Kolkata").toDate();
      const endOfDate = moment(endDate).tz("Asia/Kolkata").toDate();
      // console.log(startOfDate.getDate());
      // console.log(endOfDate.getDate());
      filterToUse = {
        userId: userId,

        day: { $gte: startOfDate.getDate(), $lte: endOfDate.getDate() },
        month: {
          $gte: startOfDate.getMonth() + 1,
          $lte: endOfDate.getMonth() + 1,
        },
        year: {
          $gte: startOfDate.getFullYear(),
          $lte: endOfDate.getFullYear(),
        },

        // month: startOfMonth.getMonth() + 1,
        // year: startOfMonth.getFullYear(),
      };
    }

    // console.log(filterToUse);

    const existingAttendance = await attendanceModel
      .find(filterToUse)
      .populate(attendancePopulateOption);

    const [shiftHour, shiftMinute] = shiftInfo?.shift?.timeIn
      ?.split(":")
      .map(Number);
    const timeZone = "Asia/Kolkata";

    const filteredList = existingAttendance.filter((att) => {
      if (!att.checkInTime || !att.checkOutTime) {
        return false;
      }

      const checkIn = moment(att.checkInTime);
      const checkOut = moment(att.checkOutTime);

      const timeIn = moment(checkIn).set({
        hour: shiftHour,
        minute: shiftMinute,
        second: 59,
        millisecond: 0,
      });

      const timeIn1HrAdd = moment(timeIn).add(1, "hours");

      if (checkIn.isAfter(timeIn1HrAdd)) {
        // console.log(checkIn);
        return false;
      }

      const diffMinutes = checkIn.diff(timeIn, "minutes", true);
      const checkOutDiffHour = checkOut.diff(checkIn, "hours", true);
      if (isNaN(checkOutDiffHour) || isNaN(diffMinutes)) {
        return false;
      }

      const heCompletedWorkHour =
        checkOutDiffHour >= shiftInfo?.shift?.workingHours;
      // console.log(`${checkIn} ${checkOutDiffHour}`);
      // console.log(shiftInfo?.shift?.workingHours - 0.6);
      // console.log(`${checkIn} ${diffMinutes}`);
      const isHeLate = diffMinutes > shiftInfo?.shift?.graceTime;
      // console.log(`${checkIn} ${isHeLate}`);
      // if (
      //   !heCompletedWorkHour &&
      //   checkOutDiffHour >= shiftInfo?.shift?.workingHours - 0.6 &&
      //   att.wlStatus != "grace-time" &&
      //   att.status != "present" &&
      //   att.status != "absent"
      // ) {
      //   // console.log(checkIn);
      //   // console.log(checkOut);
      //   // console.log(checkOutDiffHour);
      //   // console.log(heCompletedWorkHour);
      //   // console.log(shiftInfo?.shift?.workingHours - 0.6);
      //   return true;
      // }
      // console.log(
      //   `diff: ${checkOut.diff(checkIn, "hours")} / ${
      //     shiftInfo?.shift?.workingHours
      //   }`
      // );
      // console.log(`diff: ${diffMinutes} / ${shiftInfo?.shift?.graceTime}`);
      if (isHeLate && heCompletedWorkHour && att.wlStatus != "grace-time") {
        // console.log(`${heCompletedWorkHour}`);
        return true;
      }
      return false;
    });

    return res.send(
      successRes(200, "Attendance List", {
        data: filteredList,
      }),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const applyGraceTime = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(404, "id is required"));
    const attendance = await attendanceModel.findById(id).populate({
      path: "userId",
      select: "firstName lastName employeeId",
      populate: [
        { path: "designation" },
        {
          path: "reportingTo",
          select: "firstName lastName",
          populate: [{ path: "designation" }],
        },
      ],
    });

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found"));
    }

    const employeeShift = await shiftInfoModel.findOne({
      userId: attendance.userId,
    });

    if (!employeeShift) {
      return res.send(errorRes(404, "Employee shift not found"));
    }

    if (employeeShift.graceDays <= 0) {
      return res.send(errorRes(400, "No grace days available"));
    }

    attendance.wlStatus = "grace-time";
    attendance.status = "present";

    await attendance.save();

    employeeShift.graceDays -= 1;
    await employeeShift.save();
    try {
      const cacheDel = await RedisService.delMultipleKeys([
        `employee_shift_info_${employeeShift?._id}`,
        `employee_shift_info_${attendance?.userId}`,
      ]);
    } catch (error) {
      //
    }
    return res.send(
      successRes(200, "Grace time applied successfully", { data: attendance }),
    );
  } catch (e) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const breakStart = async (req, res) => {
  try {
    const { userId } = req.body;

    const now = new Date();
    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
      .populate(attendancePopulateOption);

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    if (attendance.breakStartTime) {
      return res.send(errorRes(400, "Break already started"));
    }

    attendance.breakStartTime = now;
    await attendance.save();

    return res.send(
      successRes(200, "Break started successfully", { data: attendance }),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const breakEnd = async (req, res) => {
  try {
    const { userId } = req.body;

    const now = new Date();
    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
      .populate(attendancePopulateOption);

    if (!attendance || !attendance.breakStartTime) {
      return res.send(errorRes(400, "No active break to end"));
    }

    const breakDuration = calculateSeconds(attendance.breakStartTime, now);
    attendance.totalBreakSeconds += breakDuration;
    attendance.breakStartTime = null;
    await attendance.save();

    return res.send(
      successRes(200, "Break ended successfully", { data: attendance }),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const manualEntry = async (req, res) => {
  try {
    const { userId, startTime, endTime, remarks } = req.body;

    if (!userId || !startTime || !endTime || !remarks) {
      return res.send(errorRes(400, "Missing required fields"));
    }

    const now = new Date();
    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
      .populate(attendancePopulateOption);

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    const manualDuration = calculateSeconds(startTime, endTime);
    attendance.totalActiveSeconds += manualDuration;

    attendance.timeline = attendance.timeline || [];
    attendance.timeline.push({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      remarks,
    });

    await attendance.save();
    return res.send(
      successRes(200, "Manual entry added successfully", { data: attendance }),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const updateTimeLine = async (req, res) => {
  try {
    const { userId, startTime, endTime, remarks } = req.body;

    if (!userId || !startTime || !endTime || !remarks) {
      return res.send(errorRes(400, "Missing required fields"));
    }

    const now = new Date();
    const attendance = await attendanceModel
      .findOne({
        userId,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      })
      .populate(attendancePopulateOption);

    if (!attendance) {
      return res.send(errorRes(404, "Attendance record not found for today"));
    }

    // Add inactive period to timeline
    attendance.timeline = attendance.timeline || [];
    attendance.timeline.push({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      remarks,
    });

    await attendance.save();
    return res.send(
      successRes(200, "Timeline updated successfully", { data: attendance }),
    );
  } catch (error) {
    console.error(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getMyAttendance = async (req, res) => {
  const id = req.params.id;
  const date = req.query.date ?? new Date();
  try {
    if (!id) return res.send(errorRes(40, "id is required"));

    const startOfMonth = moment(date)
      .tz("Asia/Kolkata")
      .startOf("month")
      .toDate();
    const today = moment().tz("Asia/Kolkata").endOf("day").toDate();
    const endOfMonth = moment(date).tz("Asia/Kolkata").endOf("month").toDate();
    const finalEndDate = today < endOfMonth ? today : endOfMonth;

    // console.log(startOfMonth);
    // console.log(endOfMonth);

    const resp = await attendanceModel
      .find({ userId: id, date: { $gte: startOfMonth, $lte: finalEndDate } })
      .sort({ date: -1 })
      .populate(attendancePopulateOption);
    // .populate(attendancePopulateOption);

    return res.send(
      successRes(200, "attendance", {
        data: resp,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const updateAttendanceById = async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  try {
    if (!id) return res.send(errorRes(401, "id is required"));
    if (!body) return res.send(errorRes(401, "updates is required"));
    // console.log(body);
    const resp = await attendanceModel.findById(id);

    if (!resp) return res.send(errorRes(404, "Record not found"));

    let updates = {};
    if (body?.status === "present") {
      updates.status = "present";
    } else if (body?.status === "absent") {
      updates.status = "absent";
      updates.checkInTime = null;
      updates.checkOutTime = null;
    } else if (body?.status === "weekoff") {
      updates.status = "weekoff";
    } else if (body?.status === "half-day") {
      updates.status = "half-day";
    } else if (body?.status === "present-on-weekoff") {
      updates.status = "present";
      updates.wlStatus = "weekoff";
      try {
        await shiftInfoModel.findOneAndUpdate(
          {
            userId: resp?.userId,
          },
          { $inc: { compensatoryoff: 1 } },
          { new: true },
        );
      } catch (error) {
        console.log(error);
      }
    } else if (body?.status === "present-on-paid-leave") {
      updates.status = "present";
      updates.wlStatus = "on-paid-leave";
    } else if (body?.status === "present-on-casual-leave") {
      updates.status = "present";
      updates.wlStatus = "on-casual-leave";
    } else if (body?.status === "present-on-compensatory-off") {
      updates.status = "present";
      updates.wlStatus = "on-compensation-off-leave";
    } else if (body?.status === "present-on-holiday") {
      updates.status = "present";
      updates.wlStatus = "holiday";
      try {
        await shiftInfoModel.findOneAndUpdate(
          {
            userId: resp?.userId,
          },
          { $inc: { compensatoryoff: 1 } },
          { new: true },
        );
      } catch (error) {
        console.log(error);
      }
    } else if (body?.status === "on-paid-leave") {
      updates.status = "on-paid-leave";
      updates.wlStatus = "on-paid-leave";
    } else if (body?.status === "on-casual-leave") {
      updates.status = "on-casual-leave";
      updates.wlStatus = "on-casual-leave";
    } else if (body?.status === "on-compensation-off-leave") {
      updates.status = "on-compensation-off-leave";
      updates.wlStatus = "on-compensation-off-leave";
    }

    if (body.checkInTime && body.status !== "absent") {
      updates.checkInTime = new Date(body.checkInTime);
    }

    if (body.checkOutTime && body.status !== "absent") {
      updates.checkOutTime = new Date(body.checkOutTime);
    }
    // console.log(JSON.stringify(body, null, 2));

    // console.log(JSON.stringify(updates, null, 2));

    const updatedRecord = await attendanceModel
      .findByIdAndUpdate(
        id,
        {
          $set: updates,
        },
        { new: true },
      )
      .populate(attendancePopulateOption);

    if (body.deductType) {
      try {
        const eShiftInfo = await shiftInfoModel.findOne({
          userId: resp?.userId,
        });
        if (eShiftInfo) {
          let leaveUpdate = {};
          if (body?.deductType == "paid-leave") {
            leaveUpdate.paidLeave = eShiftInfo.paidLeave - body.leave ?? null;
          } else if (body?.deductType == "casual-leave") {
            leaveUpdate.casualLeave =
              eShiftInfo.casualLeave - body.leave ?? null;
          } else if (body?.deductType == "compensatory-off") {
            leaveUpdate.compensatoryoff =
              eShiftInfo.compensatoryoff - body.leave ?? null;
          } else if (body?.deductType == "regularization") {
            leaveUpdate.regularization =
              eShiftInfo.regularization - body.regularization ?? null;
          }
          await shiftInfoModel.findByIdAndUpdate(eShiftInfo?._id, {
            $set: leaveUpdate,
          });
          // console.log(body);
        }
      } catch (error) {
        //
        // console.log(error);
      }
    }
    const eShiftInfo = await shiftInfoModel.findOne({
      userId: resp?.userId,
    });

    if (
      body?.status === "present-on-paid-leave" ||
      body?.status === "present-on-casual-leave" ||
      body?.status === "present-on-compensatory-off" ||
      body?.status === "present-on-holiday" ||
      body?.status === "present-on-weekoff"
    ) {
      const attresp = await createLeaveHistoryFunc({
        userId: resp.userId,
        date: resp.date,
        description: body.remark,
        count: 1,
        type: "deposit",
        leaveType: "on-compensation-off-leave",
        deposittype: body.status,
        adminId: body.updatedBy,
        howManyBefore: eShiftInfo?.compensatoryoff - 1,
      });
    } else if (body.deductType != null) {
      const attresp = await createLeaveHistoryFunc({
        userId: resp.userId,
        date: resp.date,
        description: body.remark,
        count: body.leave,
        type: "used",
        leaveType: body.deductType,
        adminId: body.updatedBy,
        howManyBefore: eShiftInfo?.compensatoryoff + 1,
      });
    }

    try {
      await attendanceChangesModel.create({
        changeBy: body?.updatedBy,
        changeFor: resp?.userId,
        before: resp,
        changes: body,
        date: new Date(),
      });
    } catch (error) {
      //
      // console.log(error);
    }

    return res.send(
      successRes(200, "updated Attendance", {
        data: updatedRecord,
      }),
    );
  } catch (e) {
    // console.log(e);

    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getAllMyAttendance = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(40, "id is required"));
    const cached = await RedisService.get(`all_attendance_list_${id}`, true);
    // if (cached != null) {
    //   return res.send(
    //     successRes(200, "attendance - cached", {
    //       data: cached,
    //     })
    //   );
    // }

    const resp = await attendanceModel
      .find({ userId: id })
      .sort({ date: -1 })
      .populate(attendancePopulateOption);
    // .populate(attendancePopulateOption);

    try {
      //
      const cached = await RedisService.set(
        `all_attendance_list_${id}`,
        resp,
        86400,
      );
    } catch (error) {
      //
    }
    return res.send(
      successRes(200, "attendance", {
        data: resp,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const triggerMonthlyCompOff = async (req, res) => {
  const id = req.params.id;

  try {
    const currentDate = moment().tz("Asia/Kolkata");
    const totalDays = currentDate.daysInMonth();

    const myLeaves = await shiftInfoModel
      .findOne({ userId: id })
      .populate(employeeShiftInfoPopulateOptions);
    const minWorkHours = myLeaves?.shift?.workingHours;

    const totalWorkHrs = totalDays * minWorkHours;

    // console.log(totalWorkHrs); // monthly working hrs

    //1. get total attendance of current month
    const resp = await attendanceModel.find({
      userId: id,
      month: currentDate.month() + 1,
    });

    let totalActiveHrs = 0;
    let holidayDays = 0;

    resp.forEach((att) => {
      if (!att.checkInTime || !att.checkOutTime) {
        holidayDays += 1;
        return;
      }
      const checkIntime = moment(att.checkInTime).tz("Asia/Kolkata");
      const checkOutTime = moment(att.checkOutTime).tz("Asia/Kolkata");

      // console.log(checkIntime);
      // console.log(att.checkOutTime);

      const diffInHours = checkOutTime.diff(checkIntime, "hour");
      totalActiveHrs += diffInHours;
    });

    //

    // console.log(`totalActiveHrs ${totalActiveHrs}`);
    // console.log(`holidayDays ${holidayDays}`);

    // console.log(currentDate.daysInMonth());

    return successRes2(res, 200, "Fetched", { data: resp });

    //2. subtract leave , holiday  ..5
    //3. check weekoffs taken, > 4 , no comp off , but > total montly working hrs , from subtracting 2nd cond, i.e. 234  add comp off
  } catch (error) {
    console.log(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getAttendanceOverview = async (req, res) => {
  const id = req.params.id;
  const { date } = req.query;
  try {
    if (!id) return res.send(errorRes(400, "id is required"));

    const currentDate = moment(date).isValid()
      ? moment(date).tz("Asia/Kolkata")
      : moment().tz("Asia/Kolkata");
    // const currentDate = moment().subtract(1, "month").tz("Asia/Kolkata");

    // 30-31 days
    const totalDays = currentDate.daysInMonth();

    const shiftInfo = await shiftInfoModel
      .findOne({ userId: id })
      .populate(employeeShiftInfoPopulateOptions);

    // console.log(shiftInfo);

    if (!shiftInfo?.shift) {
      return res.send(errorRes(404, "Shift info not found"));
    }
    // console.log(shiftInfo);
    const minWorkHours = shiftInfo?.shift?.workingHours;
    const totalWorkingHrsInMonth = totalDays === 31 ? 243 : 234;
    // weekoff should count
    let minWeekoff = 4;
    //
    let holiday = 0;
    let weekoff = 0;
    let leave = 0;
    let presentDays = 0;
    let activeHours = 0;
    let activeMintus = 0;
    let ot = 0;

    const attendanceList = await attendanceModel.find({
      userId: id,
      month: currentDate.month() + 1,
      year: currentDate.year(),
    });

    attendanceList.forEach((att) => {
      //
      const checkIn = moment(att.checkInTime).tz("Asia/Kolkata");
      const checkOut = moment(att.checkOutTime).tz("Asia/Kolkata");

      if (att.status === "weekoff") {
        weekoff += 1;
      }
      if (att.wlStatus === "holiday") {
        holiday += 1;
      }

      if (
        att.status === "on-paid-leave" ||
        att.status === "on-casual-leave" ||
        att.status === "on-compensation-off-leave"
      ) {
        if (att.leaveDuration === 0.5) {
          leave += 0.5;
        } else {
          leave += 1;
        }
      }

      if (!checkIn.isValid() || !checkOut.isValid()) {
        return;
      }
      const actMinutes = checkOut.diff(checkIn, "hour", true);
      // console.log(`${att.day}:- ${actMinutes}`);
      const actMinutess = checkOut.diff(checkIn, "minutes");
      if (shiftInfo.department?._id === "dept-marketing") {
        //
        if (actMinutes > 9) {
          activeHours += 9;
        } else {
          activeHours += actMinutes;
        }
      } else {
        activeHours += actMinutes;
      }
      presentDays += 1;
      activeMintus += actMinutess;
    });

    if (weekoff >= minWeekoff) {
      minWeekoff = weekoff;
    }

    const requiredDays = totalDays - holiday - minWeekoff - leave;
    const reqWorkHours = requiredDays * minWorkHours;
    if (activeHours > reqWorkHours) {
      //
      ot = activeHours - reqWorkHours;
    }

    return successRes2(res, 200, "Fetched Attendance Summary", {
      data: {
        month: currentDate.month() + 1,
        year: currentDate.year(),
        // hours
        requiredHours: reqWorkHours,
        activeHours: Math.floor(activeHours) ?? 0,
        // days
        totalDays,
        requiredDays,
        presentDays,
        present: presentDays,
        holiday,
        weekoff,
        minWeekoff,
        leave,

        // for old not breaking model
        totalWorkingHrsInMonth: reqWorkHours,
        totalWorkingHrs: Math.floor(activeHours) ?? 0,
        activeMintus,
        ot: ot,
      },
    });
  } catch (error) {
    console.log(error);
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const exportAtendance = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // Total days in the month
    const timeZone = "Asia/Kolkata";
    // generateStyledExcel();
    // Fetch attendance records for the current month with populated user details
    const attendanceRecords = await attendanceModel
      .find({
        month: currentMonth,
        year: currentYear,
      })
      .populate(attendancePopulateOption);

    if (attendanceRecords.length === 0) {
      return res.json({ message: "No attendance records found." });
    }

    // Organize attendance data by userId
    const usersAttendance = {};
    for (const record of attendanceRecords) {
      const user = record.userId;

      if (!user || !user._id) {
        continue; // Skip records with missing user data
      }

      if (!usersAttendance[user._id]) {
        usersAttendance[user._id] = {
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            designation: user.designation,
            division: user.division,
            department: user.department,
            employeeId: user.employeeId,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
          },
          days: Array(daysInMonth).fill("A"), // Default all days to "Absent"
          present: 0,
          onleave: 0,
          absent: daysInMonth, // Default all days as absent initially
        };
      }

      const dayIndex = record.day - 1; // Convert day to 0-indexed for the array
      if (record.status === "completed" || record.status === "present") {
        if (usersAttendance[user._id].days[dayIndex] === "A") {
          usersAttendance[user._id].absent -= 1; // Reduce absent count
        }
        usersAttendance[user._id].days[dayIndex] = `P`; // Mark as present

        // usersAttendance[user._id].days[dayIndex] = `P-${moment(
        //   record.checkInTime
        // )
        //   .tz(timeZone)
        //   .format("DD-MM-YYYY HH:mm")}/${moment(record.checkOutTime)
        //   .tz(timeZone)
        //   .format("DD-MM-YYYY HH:mm")}`; // Mark as present

        usersAttendance[user._id].present += 1;
      } else if (record.status === "weekoff") {
        if (usersAttendance[user._id].days[dayIndex] === "A") {
          usersAttendance[user._id].absent -= 1; // Reduce absent count
        }
        usersAttendance[user._id].days[dayIndex] = `WO`; // Mark as present
      } else if (record.status === "on-leave") {
        if (usersAttendance[user._id].days[dayIndex] === "A") {
          usersAttendance[user._id].absent -= 1; // Reduce absent count
          usersAttendance[user._id].onleave += 1; // Reduce absent count
        }
        usersAttendance[user._id].days[dayIndex] = `L`; // Mark as present
      } else if (record.status === "on-leave") {
        if (usersAttendance[user._id].days[dayIndex] === "A") {
          usersAttendance[user._id].absent -= 1; // Reduce absent count
          usersAttendance[user._id].onleave += 1; // Reduce absent count
        }
        usersAttendance[user._id].days[dayIndex] = `L`; // Mark as present
      }
    }

    // Prepare header row for Excel
    const headerRow = [
      "ID",
      "Employee ID",
      "First Name",
      "Last Name",
      "Designation",
      "Division",
      "Department",
    ];
    for (let i = 1; i <= daysInMonth; i++) {
      headerRow.push(`${i}`); // Dynamically create headers for total days in the month
    }
    headerRow.push(
      "Total Present Days",
      "Total Absent Days",
      "Total Leaves Taken",
      "Payable Days",
    );

    // Prepare data rows for Excel
    const excelData = [headerRow];
    Object.entries(usersAttendance).forEach(([userId, attendance], index) => {
      const {
        firstName,
        lastName,
        designation,
        division,
        department,
        employeeId,
        checkInTime,
        checkOutTime,
      } = attendance.user;
      const row = [
        index + 1, // ID
        employeeId,
        firstName,
        lastName,
        designation?.designation,
        division?.division,
        department?.department,
        ...attendance.days,
        attendance.present,
        attendance.absent,
        attendance.onleave,
        attendance.present,
      ];
      excelData.push(row);
    });

    // Create a workbook and add data
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Attendance");

    // Generate Excel file
    const filePath = path.join(__dirname, "detailed_attendance.xlsx");
    XLSX.writeFile(workbook, filePath);
    // console.log(filePath);
    // Send file as a response
    res.download(filePath, "detailed_attendance.xlsx", (err) => {
      if (err) {
        // console.error("File download error:", err);
        res.status(500).json({ message: "Failed to download file." });
      } else {
        // Delete file after download
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error("Error exporting detailed attendance:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const exportAttendance2 = async (req, res) => {
  const { date } = req.query;

  try {
    const currentDate = date ? new Date(date) : new Date();
    // const currentMonth = currentDate.getMonth();
    const currentMonth = currentDate.getMonth() + 1;

    // console.log(currentMonth);
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const timeZone = "Asia/Kolkata";

    const attendanceRecords = await attendanceModel
      .find({
        month: currentMonth,
        year: currentYear,
      })
      .populate(attendancePopulateOption);

    if (attendanceRecords.length === 0) {
      return res.json({ message: "No attendance records found." });
    }
    const shiftsInfos = await shiftInfoModel.find();

    const usersAttendance = {};
    for (const record of attendanceRecords) {
      const user = record.userId;
      if (!user || !user._id) continue;

      if (!usersAttendance[user._id]) {
        const foundShiftInfo = shiftsInfos.find(
          (ele) => ele.userId === user._id,
        );
        usersAttendance[user._id] = {
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            designation: user.designation,
            division: user.division,
            department: user.department,
            employeeId: user.employeeId,
          },
          checkInTime: record.checkInTime,

          checkOutTime: record.checkOutTime,
          days: Array(daysInMonth).fill("A"),
          present: 0,
          holiday: 0,
          onleave: 0,
          onWeekOff: 0,
          compensatoryoff: 0,
          absent: daysInMonth,
          utilisedCasualLeaves: 0,
          utilisedCompensationOff: 0,
          utilisedPaidLeaves: 0,
          utilisedTotalLeaves: 0,
          balanceCompensationOff: foundShiftInfo?.compensatoryoff ?? 0,
          balancePaidLeaves: foundShiftInfo?.paidLeave ?? 0,
          balanceCasualLeaves: foundShiftInfo?.casualLeave ?? 0,
          balanceTotalLeaves: foundShiftInfo?.totalLeaves ?? 0,
        };
      }

      const dayIndex = record.day - 1;
      if (record.status === "completed" || record.status === "present") {
        const timeIn = moment(record.checkInTime).tz(timeZone);
        const timeOut = moment(record.checkOutTime).tz(timeZone);

        const timeInStr = timeIn.format("HH:mm");
        const timeOutStr = timeOut.format("HH:mm");

        const duration = moment.duration(timeOut.diff(timeIn));
        const totalHours = `${Math.floor(
          duration.asHours(),
        )}h ${duration.minutes()}m`;

        if (record.wlStatus === "weekoff") {
          usersAttendance[user._id].days[dayIndex] =
            `P/WO (${timeInStr}-${timeOutStr}, ${totalHours})`;
        } else if (record.wlStatus === "on-paid-leave") {
          usersAttendance[user._id].days[dayIndex] =
            `P(PL) (${timeInStr}-${timeOutStr}, ${totalHours})`;
        } else if (record.wlStatus === "on-casual-leave") {
          usersAttendance[user._id].days[dayIndex] =
            `P(CL) (${timeInStr}-${timeOutStr}, ${totalHours})`;
        } else {
          usersAttendance[user._id].days[dayIndex] =
            `P (${timeInStr}-${timeOutStr}, ${totalHours})`;
        }

        usersAttendance[user._id].present += 1;
        usersAttendance[user._id].absent -= 1;
      } else if (record.status === "weekoff") {
        usersAttendance[user._id].days[dayIndex] = "WO";
        usersAttendance[user._id].absent -= 1;
        usersAttendance[user._id].onWeekOff += 1;
      } else if (record.status === "on-paid-leave") {
        usersAttendance[user._id].days[dayIndex] = "PL";
        usersAttendance[user._id].onleave += 1;
        usersAttendance[user._id].absent -= 1;
        usersAttendance[user._id].utilisedPaidLeaves += 1;
      } else if (record.status === "on-casual-leave") {
        usersAttendance[user._id].days[dayIndex] = "CL";
        usersAttendance[user._id].onleave += 1;
        usersAttendance[user._id].absent -= 1;
        usersAttendance[user._id].utilisedCasualLeaves += 1;
      } else if (record.status === "on-compensation-off-leave") {
        usersAttendance[user._id].days[dayIndex] = "CO";
        usersAttendance[user._id].onleave += 1;
        usersAttendance[user._id].absent -= 1;
        usersAttendance[user._id].utilisedCompensationOff += 1;
      } else if (record.status === "half-day") {
        const timeIn = moment(record.checkInTime).tz(timeZone);
        const timeOut = moment(record.checkOutTime).tz(timeZone);

        const timeInStr = timeIn.format("HH:mm");
        const timeOutStr = timeOut.format("HH:mm");

        const duration = moment.duration(timeOut.diff(timeIn));
        const totalHours = `${Math.floor(
          duration.asHours(),
        )}h ${duration.minutes()}m`;

        usersAttendance[user._id].days[dayIndex] =
          `HD (${timeInStr}-${timeOutStr}, ${totalHours})`;
        usersAttendance[user._id].absent -= 0.5;
        usersAttendance[user._id].present += 0.5;
      } else if (record.status === "holiday") {
        usersAttendance[user._id].days[dayIndex] = "H";
        // usersAttendance[user._id].onleave += 1;
        usersAttendance[user._id].absent -= 1;
        usersAttendance[user._id].holiday += 1;
      }
    }

    // if (record.status === "completed" || record.status === "present") {
    //     if (record.wlStatus === "weekoff") {
    //       usersAttendance[user._id].days[dayIndex] = `P/WO`;

    //       // usersAttendance[user._id].days[dayIndex] = `P/WO - ${moment(
    //       //   record.checkInTime
    //       // )
    //       //   .tz("Asia/Kolkata")
    //       //   .format("hh:mm")}/ ${moment(record.checkOutTime)
    //       //   .tz("Asia/Kolkata")
    //       //   .format("hh:mm")}`;
    //     } else if (record.wlStatus === "on-paid-leave") {
    //       usersAttendance[user._id].days[dayIndex] = "P(PL)";
    //     } else if (record.wlStatus === "on-casual-leave") {
    //       usersAttendance[user._id].days[dayIndex] = "P(CL)";
    //     } else {
    //       usersAttendance[user._id].days[dayIndex] = `P`;

    //       // usersAttendance[user._id].days[dayIndex] = `P - ${moment(
    //       //   record.checkInTime
    //       // )
    //       //   .tz("Asia/Kolkata")
    //       //   .format("hh:mm")}/ ${moment(record.checkOutTime)
    //       //   .tz("Asia/Kolkata")
    //       //   .format("hh:mm")}`;
    //     }
    //     // const checkInTime = record.checkInTime;
    //     // const checkInDate = new Date(checkInTime);
    //     // // Ensure checkInDate is valid
    //     // if (isNaN(checkInDate.getTime())) {
    //     //   console.error(
    //     //     `Invalid check-in time for user ${user._id}: ${checkInTime}`
    //     //   );
    //     //   return;
    //     // }

    //     // const lateThreshold = new Date(checkInTime);
    //     // lateThreshold.setHours(11, 20, 0, 0); // Ensure it's on the same day

    //     // console.log(`${user._id} ${checkInDate} - ${lateThreshold}`);

    //     // const isLateComer = checkInDate > lateThreshold;
    //     // if (isLateComer) {
    //     //   // if (!usersAttendance[user._id].days) {
    //     //   //   usersAttendance[user._id].days = [];
    //     //   // }
    //     //   usersAttendance[user._id].days[dayIndex] = "HD";
    //     // }

    //     // const checkInTime = new Date(usersAttendance[user._id].checkInTime);
    //     // console.log(`${user._id} ${checkInTime}`);
    //     // const lateThreshold = new Date(usersAttendance[user._id].checkInTime);
    //     // lateThreshold.setHours(11, 20, 0); // Set threshold to 11:20 AM
    //     // const isLateComer = checkInTime > lateThreshold;
    //     // if (isLateComer) {
    //     //   usersAttendance[user._id].days[dayIndex] = "HD";
    //     // }

    //     usersAttendance[user._id].present += 1;
    //     usersAttendance[user._id].absent -= 1;
    //   } else if (record.status === "weekoff") {
    //     usersAttendance[user._id].days[dayIndex] = "WO";
    //     usersAttendance[user._id].absent -= 1;
    //     usersAttendance[user._id].onWeekOff += 1;
    //   } else if (record.status === "on-paid-leave") {
    //     usersAttendance[user._id].days[dayIndex] = "PL";
    //     usersAttendance[user._id].onleave += 1;
    //     usersAttendance[user._id].absent -= 1;
    //     usersAttendance[user._id].utilisedPaidLeaves += 1;
    //   } else if (record.status === "on-casual-leave") {
    //     usersAttendance[user._id].days[dayIndex] = "CL";
    //     usersAttendance[user._id].onleave += 1;
    //     usersAttendance[user._id].absent -= 1;
    //     usersAttendance[user._id].utilisedCasualLeaves += 1;
    //   } else if (record.status === "on-compensation-off-leave") {
    //     usersAttendance[user._id].days[dayIndex] = "CO";
    //     usersAttendance[user._id].onleave += 1;
    //     usersAttendance[user._id].absent -= 1;
    //     usersAttendance[user._id].utilisedCompensationOff += 1;
    //   } else if (record.status === "half-day") {
    //     usersAttendance[user._id].days[dayIndex] = "HD";
    //     // usersAttendance[user._id].onleave += 1;
    //     usersAttendance[user._id].absent -= 0.5;
    //     usersAttendance[user._id].present += 0.5;
    //   } else if (record.status === "holiday") {
    //     usersAttendance[user._id].days[dayIndex] = "H";
    //     // usersAttendance[user._id].onleave += 1;
    //     usersAttendance[user._id].absent -= 1;
    //     usersAttendance[user._id].holiday += 1;
    //   }
    // }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Detailed Attendance");

    // Define column headers with styles
    worksheet.columns = [
      { header: "ID", key: "id", width: 5 },
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "First Name", key: "firstName", width: 15 },
      { header: "Last Name", key: "lastName", width: 15 },
      { header: "Designation", key: "designation", width: 20 },
      { header: "Division", key: "division", width: 20 },
      { header: "Department", key: "department", width: 20 },
      ...Array.from({ length: daysInMonth }, (_, i) => ({
        header: `${i + 1}`,
        key: `day${i + 1}`,
        width: 5,
      })),
      { header: "Present Days", key: "present", width: 15 },
      { header: "Week Off", key: "weekOff", width: 15 },
      { header: "Used Leaves", key: "onleave", width: 15 },
      { header: "Holiday", key: "holiday", width: 15 },
      { header: "Absent Days", key: "absent", width: 15 },
      { header: "Utilised CO", key: "utilisedCO", width: 15 },
      { header: "Utilised PL", key: "utilisedPL", width: 15 },
      { header: "Utilised CL", key: "utilisedCL", width: 15 },
      { header: "Balance CO", key: "balanceCO", width: 15 },
      { header: "Balance PL", key: "balancePL", width: 15 },
      { header: "Balance CL", key: "balanceCL", width: 15 },
      { header: "Balance total Leaves", key: "balanceTotalLeaves", width: 15 },
      { header: "Payable Days", key: "payableDays", width: 15 },
      { header: "Tota Days in Month", key: "daysInMonth", width: 15 },
    ];

    // Apply header row styling

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "bffcb3" }, // Light Pink
      };
      cell.font = { bold: true };
    });

    // Add data rows and apply conditional styling
    Object.entries(usersAttendance).forEach(([userId, attendance], index) => {
      const row = worksheet.addRow({
        id: index + 1,
        employeeId: attendance.user.employeeId,
        firstName: attendance.user.firstName,
        lastName: attendance.user.lastName,
        designation: attendance.user.designation?.designation,
        division: attendance.user.division?.division,
        department: attendance.user.department?.department,
        ...Object.fromEntries(
          attendance.days.map((status, i) => [`day${i + 1}`, status]),
        ),
        present: attendance.present,
        weekOff: attendance.onWeekOff,
        onleave: attendance.onleave,
        holiday: attendance.holiday,
        absent: attendance.absent,
        utilisedCO: attendance.utilisedCompensationOff,
        utilisedPL: attendance.utilisedPaidLeaves,
        utilisedCL: attendance.utilisedCasualLeaves,
        balanceCO: attendance.balanceCompensationOff,
        balancePL: attendance.balancePaidLeaves,
        balanceCL: attendance.balanceCasualLeaves,
        balanceTotalLeaves: attendance.balanceTotalLeaves,
        payableDays:
          attendance.present +
          attendance.onWeekOff +
          attendance.onleave +
          attendance.holiday,
        daysInMonth: daysInMonth,
      });

      // Conditional formatting for attendance status
      // row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      //   const status = cell.value;
      //   if (typeof status === "string") {
      //     let color;
      //     switch (status) {
      //       case "P":
      //         color = "90EE90"; // Light Green
      //         break;
      //       case "L":
      //         color = "cd56f5"; // Yellow
      //         break;
      //       case "WO":
      //         color = "fcb447"; // Light Blue
      //         break;
      //       case "A":
      //         color = "fa5770"; // Light Red
      //         break;
      //     }
      //     if (color) {
      //       cell.fill = {
      //         type: "pattern",
      //         pattern: "solid",
      //         fgColor: { argb: color },
      //       };
      //     }
      //   }
      // });
    });

    // Save and send the file
    //constant path
    var fileName = `detailed_attendance_${Date.now()}.xlsx`;
    const cPath = config.STORAGE_ABSOLUTE_PATH
      ? "/var/www/storage/attendance"
      : __dirname;
    const filePath = path.join(cPath, fileName);
    await workbook.xlsx.writeFile(filePath);

    if (config.STORAGE_ABSOLUTE_PATH) {
      return successRes2(res, 200, "export attendance", {
        data: {
          file: `https://cdn.evhomes.tech/attendance/${fileName}`,
        },
      });
    } else {
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=detailed_attendance.xlsx",
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("File download error:", err);
          res.status(500).json({ message: "Failed to download file." });
        } else {
          fs.unlinkSync(filePath);
        }
      });
    }
  } catch (error) {
    console.error("Error exporting detailed attendance:", error);
    res.status(500).json({ message: "Server error." });
  }
};

function roundToHalf(num) {
  const intPart = Math.floor(num);
  const frac = num - intPart;
  const EPS = 1e-9; // avoid floating-point edge issues
  return frac + EPS >= 0.5 ? intPart + 0.5 : intPart;
}

function distributeHours(totalHours) {
  const schedule = [];

  while (totalHours >= 5) {
    if (totalHours >= 9) {
      // Full day
      schedule.push({ type: "full", hours: 9, day: 1 });
      totalHours -= 9;
    } else if (totalHours >= 5) {
      // Half day
      schedule.push({ type: "half", hours: 5, day: 0.5 });
      totalHours -= 5;
    }
  }

  // Anything <5 hours is ignored automatically
  return schedule;
}

// TODO: fix holiday/absent insert check
export const insertDailyAttendance = async () => {
  try {
    // const formattedDate = new Date();
    const formattedDate = moment
      .tz("Asia/Kolkata")
      .startOf("day")
      .add(5, "hours")
      .toDate();

    // console.log(
    //   formattedDate.getDate(),
    //   formattedDate.getMonth() + 1,
    //   formattedDate.getFullYear()
    // );

    const nowStartOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
    const nowEndOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

    const employees = await employeeModel.find({ status: "active" }, "_id");
    const haveHoliday = await holidayModel.findOne({
      startDate: { $gte: nowStartOfDay, $lte: nowEndOfDay },
      endDate: { $lte: nowEndOfDay },
    });

    let resp2 = [];
    await Promise.all(
      employees.map(async (ele) => {
        try {
          // if not then create
          let updates = {
            userId: ele._id,
            date: formattedDate,

            day: formattedDate.getDate(),
            month: formattedDate.getMonth() + 1,
            year: formattedDate.getFullYear(),
            status: haveHoliday ? "holiday" : "absent",

            // Add other default fields if needed
          };
          if (haveHoliday) {
            //
            updates = {
              ...updates,
              wlStatus: "holiday",
              status: "holiday",
            };
          }
          const resp3 = await attendanceModel.findOneAndUpdate(
            {
              userId: ele._id,
              day: formattedDate.getDate(),
              month: formattedDate.getMonth() + 1,
              year: formattedDate.getFullYear(),
              date: formattedDate,
            },
            {
              $setOnInsert: updates,
            },
            {
              new: true,
              upsert: true, // Create the record if it doesn't exist
            },
          );
          resp2.push(resp3);
        } catch (error) {
          // console.error("Error updating attendance:", error);
        }
      }),
    );
    return resp2;
  } catch (error) {
    return error;
  }
};

export const markPendingDailyAttendance = async () => {
  try {
    // const today = new Date();
    const today = moment
      .tz("Asia/Kolkata")
      .startOf("day")
      // .add(5, "hours")
      .toDate();

    const pendingresp = await attendanceModel.updateMany(
      {
        day: today.getDay(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        checkOutTime: null,
      },
      { status: "pending" },
    );

    return pendingresp;
  } catch (error) {
    return error;
  }
};

export const getPreviousRecord = async (req, res) => {
  const userId = req.params.id;
  try {
    const startOfMonth = moment().startOf("month").toDate();

    // console.log(startOfMonth);
    // Start of next month (exclusive upper limit)
    const startOfToday = moment().startOf("day").toDate();
    // console.log(startOfToday);
    const absentRecord = await attendanceModel.find({
      userId: userId,
      date: {
        $gte: startOfMonth,
        $lte: startOfToday,
      },
      $or: [{ status: "absent" }, { status: "active" }, { status: "half-day" }],
    });

    // console.log(absentRecord);
    if (!absentRecord) return res.send(successRes(200, "", { data: null }));

    return res.send(
      successRes(200, "Please update the status in your attendance", {
        data: absentRecord,
      }),
    );
  } catch (e) {
    console.log(e);
    return res.send(errorRes(500, `Server error: ${e}`));
  }
};

async function generateStyledExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Report", {
    properties: { defaultColWidth: 20 },
  });

  // Define Header Row with Styles
  worksheet.columns = [
    { header: "ID", key: "id", width: 5 },
    { header: "Employee Name", key: "name", width: 25 },
    { header: "Designation", key: "designation", width: 20 },
    { header: "Present Days", key: "present", width: 15 },
    { header: "Absent Days", key: "absent", width: 15 },
  ];

  // Style the header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF007ACC" },
    };
    cell.alignment = { horizontal: "center" };
  });

  // Add Data Rows
  const data = [
    {
      id: 1,
      name: "John Doe",
      designation: "Developer",
      present: 20,
      absent: 5,
    },
    {
      id: 2,
      name: "Jane Smith",
      designation: "Designer",
      present: 18,
      absent: 7,
    },
  ];

  data.forEach((item) => {
    worksheet.addRow(item);
  });

  // Style specific cells dynamically
  worksheet.getCell("D2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF92D050" },
  };

  worksheet.getCell("E2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF0000" },
  };

  // Save the file
  const filePath = path.join(__dirname, "Styled_Attendance_Report.xlsx");
  await workbook.xlsx.writeFile(filePath);

  // console.log(`Excel file generated at: ${filePath}`);
}

export const calculateHoursDifferenceWithTZ = (passedDate) => {
  const timeZone = "Asia/Kolkata";

  const now = moment.tz(timeZone); // Current time in specified time zone
  const past = moment.tz(passedDate, timeZone); // Passed date in same time zone

  const diffInHours = now.diff(past, "hours", true);
  return diffInHours;
};

export const insertMonthlyAttendance = async () => {
  try {
    // const formattedDate = new Date();
    const today = moment({ day: 1, month: 0, year: 2026 })
      .tz("Asia/Kolkata")
      .startOf("day");
    const end = moment({ day: 31, month: 0, year: 2026 })
      .tz("Asia/Kolkata")
      .startOf("day");

    const startOfMonth = today.clone().startOf("month");

    const dateArray = [];
    let resp2 = [];

    let currentDate = startOfMonth;

    while (currentDate.isSameOrBefore(end, "day")) {
      dateArray.push(currentDate.toDate()); // Format as needed
      currentDate = currentDate.add(1, "day");
    }

    // console.log(dateArray);
    const employees = await employeeModel.find(
      { _id: "ev68-kashibai-mangoda", status: "active" },
      "_id",
    );

    await Promise.all(
      dateArray.map(async (dateEle) => {
        await Promise.all(
          employees.map(async (ele) => {
            try {
              const resp3 = await attendanceModel.findOneAndUpdate(
                {
                  userId: ele._id,
                  day: dateEle.getDate(),
                  month: dateEle.getMonth() + 1,
                  year: dateEle.getFullYear(),
                },
                {
                  $setOnInsert: {
                    userId: ele._id,
                    date: dateEle,
                    day: dateEle.getDate(),
                    month: dateEle.getMonth() + 1,
                    year: dateEle.getFullYear(),
                    status: "absent",
                    // status: "present",
                    // checkInTime: moment(dateEle)
                    //   .set({ hour: 11, minute: 0 })
                    //   .toDate(),
                    // checkOutTime: moment(dateEle)
                    //   .set({ hour: 20, minute: 0 })
                    //   .toDate(),
                    // Add other default fields if needed
                  },
                },
                {
                  new: true,
                  upsert: true, // Create the record if it doesn't exist
                },
              );
              resp2.push(resp3);
            } catch (error) {
              console.error("Error updating attendance:", error);
            }
          }),
        );
      }),
    );
    // const formattedDate = moment
    //   .tz("Asia/Kolkata")
    //   .startOf("day")
    //   .add(5, "hours")
    //   .toDate();
    // console.log(
    //   formattedDate.getDate(),
    //   formattedDate.getMonth() + 1,
    //   formattedDate.getFullYear()
    // );

    return resp2;
  } catch (error) {
    return error;
  }
};

// generateStyledExcel().catch(console.error);

//

export const getAttendanceOverviewFunc = async ({ id, date }) => {
  try {
    if (!id) throw Error("no id provied");

    const currentDate = moment(date).isValid()
      ? moment(date).tz("Asia/Kolkata")
      : moment().tz("Asia/Kolkata");
    // const currentDate = moment().subtract(1, "month").tz("Asia/Kolkata");

    // 30-31 days
    const totalDays = currentDate.daysInMonth();

    const shiftInfo = await shiftInfoModel
      .findOne({ userId: id })
      .populate(employeeShiftInfoPopulateOptions);

    if (!shiftInfo?.shift) {
      throw Error("Shift info not found");
      // return res.send(errorRes(404, "Shift info not found"));
    }
    // console.log(shiftInfo);
    const minWorkHours = shiftInfo?.shift?.workingHours;
    const totalWorkingHrsInMonth = totalDays === 31 ? 243 : 234;
    // weekoff should count
    let minWeekoff = 4;
    //
    let holiday = 0;
    let weekoff = 0;
    let leave = 0;
    let presentDays = 0;
    let activeHours = 0;
    let activeMintus = 0;
    let halfDays = 0;
    let ot = 0;

    const attendanceList = await attendanceModel.find({
      userId: id,
      month: currentDate.month() + 1,
      year: currentDate.year(),
    });

    attendanceList.forEach((att) => {
      //
      const checkIn = moment(att.checkInTime).tz("Asia/Kolkata");
      const checkOut = moment(att.checkOutTime).tz("Asia/Kolkata");

      if (att.status === "weekoff") {
        weekoff += 1;
      }
      if (att.wlStatus === "holiday") {
        holiday += 1;
      }

      if (
        att.status === "on-paid-leave" ||
        att.status === "on-casual-leave" ||
        att.status === "on-compensation-off-leave"
      ) {
        if (att.leaveDuration === 0.5) {
          leave += 0.5;
        } else {
          leave += 1;
        }
      }

      if (!checkIn.isValid() || !checkOut.isValid()) {
        return;
      }
      const actMinutes = checkOut.diff(checkIn, "hour", true);
      // console.log(`${att.day}:- ${actMinutes}`);
      const actMinutess = checkOut.diff(checkIn, "minutes");
      if (shiftInfo.department?._id === "dept-marketing") {
        //
        if (actMinutes > 9) {
          activeHours += 9;
        } else {
          activeHours += actMinutes;
        }
      } else {
        activeHours += actMinutes;
      }
      presentDays += 1;
      activeMintus += actMinutess;
    });

    if (weekoff >= minWeekoff) {
      minWeekoff = weekoff;
    }

    const requiredDays = totalDays - holiday - minWeekoff - leave;
    const reqWorkHours = requiredDays * minWorkHours;
    if (activeHours > reqWorkHours) {
      //
      ot = activeHours - reqWorkHours;
    }

    return {
      month: currentDate.month() + 1,
      year: currentDate.year(),
      // hours
      requiredHours: reqWorkHours,
      activeHours,
      // days
      totalDays,
      requiredDays,
      presentDays,
      present: presentDays,
      holiday,
      weekoff,
      minWeekoff,
      leave,

      // for old not breaking model
      totalWorkingHrsInMonth: reqWorkHours,
      totalWorkingHrs: Math.floor(activeHours) ?? 0,
      activeMintus,
      ot: ot,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getAttendanceOverviewFuncLocal = ({
  date,
  shiftInfo,
  attendanceList = [],
}) => {
  try {
    if (!shiftInfo) {
      return null;
    }

    const currentDate = moment(date).isValid()
      ? moment(date).tz("Asia/Kolkata")
      : moment().tz("Asia/Kolkata");
    // const currentDate = moment().subtract(1, "month").tz("Asia/Kolkata");

    // 30-31 days
    const totalDays = currentDate.daysInMonth();
    // console.log(shiftInfo?.userId?._id);
    if (!shiftInfo?.shift) {
      return null;
      throw Error("Shift info not found");
      // return res.send(errorRes(404, "Shift info not found"));
    }
    // console.log(shiftInfo);
    const minWorkHours = shiftInfo?.shift?.workingHours;
    const totalWorkingHrsInMonth = totalDays === 31 ? 243 : 234;
    // weekoff should count
    let minWeekoff = 4;
    //
    let holiday = 0;
    let halfDays = 0;
    let weekoff = 0;
    let leave = 0;
    let presentDays = 0;
    let activeHours = 0;
    let activeMintus = 0;
    let ot = 0;

    attendanceList.forEach((att) => {
      //
      const checkIn = moment(att.checkInTime).tz("Asia/Kolkata");
      const checkOut = moment(att.checkOutTime).tz("Asia/Kolkata");
      if (att.status === "weekoff") {
        weekoff += 1;
      } else if (att.wlStatus === "holiday") {
        holiday += 1;
      } else if (
        att.status === "on-paid-leave" ||
        att.status === "on-casual-leave" ||
        att.status === "on-compensation-off-leave"
      ) {
        if (att.leaveDuration === 0.5) {
          leave += 0.5;
        } else {
          leave += 1;
        }
      }

      if (!checkIn.isValid() || !checkOut.isValid()) {
        return;
      }
      const actMinutes = checkOut.diff(checkIn, "hour", true);
      // console.log(`${att.day}:- ${actMinutes}`);
      const actMinutess = checkOut.diff(checkIn, "minutes");
      if (shiftInfo.department?._id === "dept-marketing") {
        //
        if (actMinutes > 9) {
          activeHours += 9;
        } else {
          activeHours += actMinutes;
        }
      } else {
        activeHours += actMinutes;
      }
      presentDays += 1;
      activeMintus += actMinutess;
    });

    if (weekoff >= minWeekoff) {
      minWeekoff = weekoff;
    }

    const requiredDays = totalDays - holiday - minWeekoff - leave;

    const reqWorkHours = requiredDays * minWorkHours;
    if (activeHours > reqWorkHours) {
      //
      ot = activeHours - reqWorkHours;
    }

    return {
      month: currentDate.month() + 1,
      year: currentDate.year(),
      // hours
      requiredHours: reqWorkHours,
      activeHours,
      // days
      totalDays,
      requiredDays,
      presentDays,
      present: presentDays,
      holiday,
      weekoff,
      minWeekoff,
      leave,

      // for old not breaking model
      totalWorkingHrsInMonth: reqWorkHours,
      totalWorkingHrs: Math.floor(activeHours) ?? 0,
      activeMintus,
      ot: ot,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const exportAttendance3 = async (req, res) => {
  const { date } = req.query;
  try {
    // ---------- Date & timezone ----------
    const timeZone = "Asia/Kolkata";
    const currentDate = date
      ? moment(date).tz(timeZone).isValid()
        ? moment(date).tz(timeZone)
        : moment().tz(timeZone)
      : moment().tz(timeZone);

    const currentMonth = currentDate.month() + 1; // 1-based
    const currentYear = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();

    // ---------- Attendance Month ----------
    const atts = await attendanceModel
      .find({
        month: currentMonth,
        year: currentYear,
      })
      .lean()
      .sort({ day: 1 });

    if (!atts.length)
      return res.json({ message: "No attendance records found." });

    const shiftInfoList = await shiftInfoModel
      .find({})
      .populate(employeeShiftInfoPopulateOptions)
      .lean();

    // ---------- Create workbook ----------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Detailed Attendance");

    // row1 spacing
    worksheet.addRow([
      `Attendance List Of ${currentDate.format("DD-MMM-YYYY")}`,
    ]);
    worksheet.mergeCells(1, 1, 2, 7);
    const firstCell = worksheet.getCell(1, 1);
    firstCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    firstCell.font = { bold: true, size: 20 };

    // header rows
    const weekdayRowIndex = 3; // weekday names
    const dayNumberRowIndex = 4; // day numbers (merged)

    // ---------- Fixed headers before days ----------
    const fixedHeaders = [
      "ID",
      "Employee ID",
      "First Name",
      "Last Name",
      "Designation",
      "Division",
      "Department",
    ];

    fixedHeaders.forEach((header, idx) => {
      const col = idx + 1;
      worksheet.mergeCells(weekdayRowIndex, col, dayNumberRowIndex + 1, col);
      const cell = worksheet.getCell(weekdayRowIndex, col);
      cell.value = header;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      worksheet.getColumn(col).width = 15;
    });

    // ---------- Days loop ----------
    const startColForDays = fixedHeaders.length + 1;
    for (let i = 1; i <= daysInMonth; i++) {
      const firstCol = startColForDays + (i - 1) * 2;
      const secondCol = firstCol + 1;

      const mDate = moment.tz(
        { year: currentYear, month: currentMonth - 1, day: i },
        timeZone,
      );
      const weekday = mDate.format("ddd");

      worksheet.mergeCells(
        weekdayRowIndex,
        firstCol,
        weekdayRowIndex,
        secondCol,
      );
      const weekdayCell = worksheet.getCell(weekdayRowIndex, firstCol);
      weekdayCell.value = weekday;
      weekdayCell.alignment = { horizontal: "center", vertical: "middle" };
      weekdayCell.font = { italic: true };
      weekdayCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      worksheet.mergeCells(
        dayNumberRowIndex,
        firstCol,
        dayNumberRowIndex,
        secondCol,
      );
      const dayCell = worksheet.getCell(dayNumberRowIndex, firstCol);
      dayCell.value = `${i}`;
      dayCell.alignment = { horizontal: "center", vertical: "middle" };
      dayCell.font = { bold: true };
      dayCell.border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      const inCell = worksheet.getCell(dayNumberRowIndex + 1, firstCol);
      const outCell = worksheet.getCell(dayNumberRowIndex + 1, secondCol);
      inCell.value = "IN";
      outCell.value = "OUT";
      [inCell, outCell].forEach((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { bold: true };
      });
      inCell.border = {
        left: { style: "thin" },
        top: { style: "thin" },
        bottom: { style: "thin" },
      };
      outCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };

      worksheet.getColumn(firstCol).width = 6;
      worksheet.getColumn(secondCol).width = 6;
    }

    // ---------- Remaining headers ----------
    const afterDaysCol = startColForDays + daysInMonth * 2;
    const remainingHeaders = [
      "Hours",
      "Week Off",
      "Used Leaves",
      "Holiday",
      "Absent Days",
      "Utilised CO",
      "Utilised PL",
      "Utilised CL",
      "Compoff Generated",
      "Balance Leaves",
      "Payable Days",
      "Days in Month",
    ];

    remainingHeaders.forEach((header, idx) => {
      const col = afterDaysCol + idx;
      worksheet.mergeCells(weekdayRowIndex, col, dayNumberRowIndex + 1, col);
      const cell = worksheet.getCell(weekdayRowIndex, col);
      cell.value = header;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      worksheet.getColumn(col).width = 15;
    });

    // ---------- Styling ----------
    [weekdayRowIndex, dayNumberRowIndex, dayNumberRowIndex + 1].forEach(
      (rowIdx) => {
        worksheet.getRow(rowIdx).eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "bffcb3" },
          };
          cell.font = { bold: true };
        });
      },
    );

    // ---------- Populate Employee Data ----------
    const filteredShifts = shiftInfoList.filter(
      (ele) =>
        ele?.userId?.status === "active" &&
        ele?.shift &&
        ele?.userId?.department._id != "dept-it",
    );

    filteredShifts.forEach((shiftInfo, idx) => {
      let payableDays = 0;
      let weekoffDays = 0;
      let presentOnweekoffDays = 0;
      let absentDays = 0;
      let onLeaveDays = 0;
      let holiDays = 0;
      let halfDays = 0;
      let compOffs = 0;
      let paidLeaves = 0;
      let casualLeaves = 0;
      let totalComps = 0;

      const attList =
        atts.filter((att) => att?.userId === shiftInfo?.userId?._id) || [];

      attList.map((ele, i) => {
        // if (i == 14) {
        //   console.log(ele);
        // }
        const date = moment(ele.date);
        const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
        const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");

        if (ele.status === "weekoff") {
          //
          weekoffDays++;
        } else if (ele.status === "on-paid-leave") {
          if (ele.leaveDuration === 0.5) {
            compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            compOffs += 1;
            onLeaveDays += 1;
          }
        } else if (ele.status === "on-casual-leave") {
          if (ele.leaveDuration === 0.5) {
            compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            compOffs += 1;
            onLeaveDays += 1;
          }
        } else if (ele.status === "on-compensation-off-leave") {
          if (ele.leaveDuration === 0.5) {
            compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            compOffs += 1;
            onLeaveDays += 1;
          }
        } else if (ele.status === "half-day") {
          halfDays += 0.5;
        } else if (ele.status === "holiday" || ele.wlStatus === "holiday") {
          holiDays++;
        } else if (ele.status === "absent") {
          if (date.day() === 0) {
            //
            weekoffDays++;
          } else {
            absentDays++;
          }
        } else if (ele.status === "active") {
          if (checkIn.isValid() && !checkOut.isValid()) {
            // payableDays += 0.5;
            halfDays += 0.5;
          }
        } else if (ele.status === "present" && ele.wlStatus === "weekoff") {
          presentOnweekoffDays++;
        }
      });

      const topRowIndex = dayNumberRowIndex + 2 + idx * 2; // IN/OUT row
      const bottomRowIndex = topRowIndex + 1; // Total Hours row

      // Sample row for fixed columns
      const sampleRow = [
        idx + 1,
        shiftInfo?.userId?.employeeId,
        shiftInfo?.userId?.firstName,
        shiftInfo?.userId?.lastName,
        shiftInfo?.userId?.designation?.designation,
        shiftInfo?.userId?.division?.division,
        shiftInfo?.userId?.department?.department,
      ];

      // Add IN/OUT values for each day
      for (let i = 1; i <= daysInMonth; i++) {
        const att = attList.find((a) => a.day === i);
        if (att) {
          const checkIn = moment(att.checkInTime);
          const checkOut = moment(att.checkOutTime);
          if (checkIn.isValid() && checkOut.isValid()) {
            sampleRow.push(checkIn.format("HH:mm"), checkOut.format("HH:mm"));
          } else sampleRow.push("-", "-");
        } else sampleRow.push("-", "-");
      }

      // Remaining summary columns
      const attOverview = getAttendanceOverviewFuncLocal({
        date: currentDate.toDate(),
        shiftInfo,
        attendanceList: attList,
      });
      payableDays =
        attOverview.activeHours - attOverview.requiredHours > 0
          ? daysInMonth
          : attOverview.activeHours / shiftInfo.shift.workingHours;
      // console.log(`${shiftInfo.userId.firstName}`, " ", payableDays);
      if (weekoffDays > 0) {
        payableDays += weekoffDays;
      }
      if (presentOnweekoffDays > 0) {
        payableDays += presentOnweekoffDays;
      }
      if (onLeaveDays > 0) {
        payableDays += onLeaveDays;
      }
      if (holiDays > 0) {
        payableDays += holiDays;
      }
      if (halfDays > 0) {
        payableDays += halfDays;
      }

      if (weekoffDays < 4 && absentDays > 0) {
        //TODO: fixes absent if not weekoff
      }
      if (weekoffDays < 4) {
        //
        totalComps += 4 - weekoffDays;
      }
      payableDays = roundToHalf(payableDays);
      let abs = daysInMonth - payableDays;
      absentDays = roundToHalf(abs < 0 ? 0 : abs);
      const ots = distributeHours(
        attOverview.activeHours - attOverview.requiredHours,
      );
      if (shiftInfo?.userId?.department?._id === "dept-it") {
        ots.map((ele) => {
          totalComps += ele.day;
        });
      }

      const remos = [
        `${Math.floor(attOverview.activeHours)}hr / ${Math.floor(
          attOverview.requiredHours,
        )}hr`,
        weekoffDays,
        onLeaveDays,
        holiDays,
        absentDays, // absent days
        compOffs, // ut - CO
        paidLeaves, // ut - PL
        casualLeaves, // ut - CL
        totalComps, // generated compoff
        shiftInfo.casualLeave +
          shiftInfo.compensatoryoff +
          shiftInfo.paidLeave +
          totalComps, // Balance leaves
        payableDays > daysInMonth ? daysInMonth : payableDays,
        daysInMonth,
      ];

      sampleRow.push(...remos);

      // Insert IN/OUT row
      worksheet.insertRow(topRowIndex, sampleRow);
      worksheet.insertRow(bottomRowIndex, []); // Total hours row

      // Merge fixed columns vertically
      sampleRow.forEach((_, colIdx) => {
        const col = colIdx + 1;
        if (col <= 7 || col > 7 + daysInMonth * 2) {
          worksheet.mergeCells(topRowIndex, col, bottomRowIndex, col);
        }
        const cell = worksheet.getCell(topRowIndex, col);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Merge each day IN/OUT for total hours
      for (let i = 1; i <= daysInMonth; i++) {
        const firstCol = startColForDays + (i - 1) * 2;
        const secondCol = firstCol + 1;
        const att = attList.find((a) => a.day === i);
        worksheet.mergeCells(
          bottomRowIndex,
          firstCol,
          bottomRowIndex,
          secondCol,
        );
        const totalCell = worksheet.getCell(bottomRowIndex, firstCol);

        if (att) {
          const checkIn = moment(att.checkInTime);
          const checkOut = moment(att.checkOutTime);
          if (checkIn.isValid() && checkOut.isValid()) {
            const duration = moment.duration(checkOut.diff(checkIn));
            totalCell.value = `${Math.floor(
              duration.asHours(),
            )}h ${duration.minutes()}m`;
          } else if (att.status === "weekoff") {
            totalCell.value = "WO";
          } else if (att.status === "on-paid-leave") {
            totalCell.value = "PL";
          } else if (att.status === "on-casual-leave") {
            totalCell.value = "CL";
          } else if (att.status === "on-compensation-off-leave") {
            totalCell.value = "CO";
          } else if (att.status === "absent") {
            if (attOverview.activeHours >= attOverview.requiredHours) {
              totalCell.value = "-";
            } else totalCell.value = "A";
          } else totalCell.value = "-";
        } else totalCell.value = "-";

        totalCell.alignment = { horizontal: "center", vertical: "middle" };
        totalCell.font = { bold: true };
        totalCell.border = {
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });

    // ---------- Save & send ----------
    const fileName = `detailed_attendance_${Date.now()}.xlsx`;
    const cPath = config.STORAGE_ABSOLUTE_PATH
      ? `${config.STORAGE_ABSOLUTE_PATH}/attendance`
      : __dirname;
    const filePath = path.join(cPath, fileName);

    await workbook.xlsx.writeFile(filePath);

    if (config.STORAGE_ABSOLUTE_PATH) {
      return successRes2(res, 200, "export attendance", {
        data: { file: `https://cdn.evhomes.tech/attendance/${fileName}` },
      });
    } else {
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("File download error:", err);
          res.status(500).json({ message: "Failed to download file." });
        } else fs.unlinkSync(filePath);
      });
    }
  } catch (error) {
    console.error("Error exporting detailed attendance:", error);
    res.status(500).json({ message: "Server error." });
  }
};

//not using
export const generateCompensatoryOff = async (req, res) => {
  const { date } = req.query;
  const list = [];
  try {
    // ---------- Date & timezone ----------
    const timeZone = "Asia/Kolkata";
    const currentDate = date
      ? moment(date).tz(timeZone).isValid()
        ? moment(date).tz(timeZone)
        : moment().tz(timeZone)
      : moment().tz(timeZone);

    const currentMonth = currentDate.month() + 1; // 1-based
    const currentYear = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();

    // ---------- Attendance Month ----------
    const atts = await attendanceModel
      .find({
        userId: "ev201-aktarul-biswas",
        month: currentMonth,
        year: currentYear,
      })
      .lean()
      .sort({ day: 1 });

    if (!atts.length)
      return res.json({ message: "No attendance records found." });

    const shiftInfoList = await shiftInfoModel
      .find({ userId: "ev201-aktarul-biswas" })
      .populate(employeeShiftInfoPopulateOptions)
      .lean();

    // ---------- Populate Employee Data ----------
    const filteredShifts = shiftInfoList.filter(
      (ele) => ele?.userId?.status === "active" && ele?.shift,
    );

    await Promise.all(
      filteredShifts.map(async (shiftInfo, idx) => {
        let payableDays = 0;
        let weekoffDays = 0;
        let absentDays = 0;
        let onLeaveDays = 0;
        let holiDays = 0;
        let halfDays = 0;
        let compOffs = 0;
        let paidLeaves = 0;
        let casualLeaves = 0;
        let totalComps = 0;

        const attList =
          atts.filter((att) => att?.userId === shiftInfo?.userId?._id) || [];

        attList.map((ele, i) => {
          // if (i == 14) {
          //   console.log(ele);
          // }
          const date = moment(ele.date);
          const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
          const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");

          if (ele.status === "weekoff") {
            //
            weekoffDays++;
          } else if (ele.status === "on-paid-leave") {
            if (ele.leaveDuration === 0.5) {
              compOffs += 0.5;
              onLeaveDays += 0.5;
            } else {
              compOffs += 1;
              onLeaveDays += 1;
            }
          } else if (ele.status === "on-casual-leave") {
            if (ele.leaveDuration === 0.5) {
              compOffs += 0.5;
              onLeaveDays += 0.5;
            } else {
              compOffs += 1;
              onLeaveDays += 1;
            }
          } else if (ele.status === "on-compensation-off-leave") {
            if (ele.leaveDuration === 0.5) {
              compOffs += 0.5;
              onLeaveDays += 0.5;
            } else {
              compOffs += 1;
              onLeaveDays += 1;
            }
          } else if (ele.status === "half-day") {
            halfDays += 0.5;
          } else if (ele.status === "holiday") {
            holiDays++;
          } else if (ele.status === "absent") {
            if (date.day() === 0) {
              //
              weekoffDays++;
            } else {
              absentDays++;
            }
          } else if (ele.status === "active") {
            if (checkIn.isValid() && !checkOut.isValid()) {
              // payableDays += 0.5;
              halfDays += 0.5;
            }
          }
        });

        // Sample row for fixed columns
        const sampleRow = [
          idx + 1,
          shiftInfo?.userId?.employeeId,
          shiftInfo?.userId?.firstName,
          shiftInfo?.userId?.lastName,
          shiftInfo?.userId?.designation?.designation,
          shiftInfo?.userId?.division?.division,
          shiftInfo?.userId?.department?.department,
        ];

        // Add IN/OUT values for each day
        for (let i = 1; i <= daysInMonth; i++) {
          const att = attList.find((a) => a.day === i);
          if (att) {
            const checkIn = moment(att.checkInTime);
            const checkOut = moment(att.checkOutTime);
            if (checkIn.isValid() && checkOut.isValid()) {
              sampleRow.push(checkIn.format("HH:mm"), checkOut.format("HH:mm"));
            } else sampleRow.push("-", "-");
          } else sampleRow.push("-", "-");
        }

        // Remaining summary columns
        const attOverview = getAttendanceOverviewFuncLocal({
          date: currentDate.toDate(),
          shiftInfo,
          attendanceList: attList,
        });
        payableDays = attOverview.activeHours / 9;
        if (weekoffDays > 0) {
          payableDays += weekoffDays;
        }
        if (onLeaveDays > 0) {
          payableDays += onLeaveDays;
        }
        if (halfDays > 0) {
          payableDays += halfDays;
        }

        if (weekoffDays < 4 && absentDays > 0) {
          //TODO: fixes absent if not weekoff
        }
        if (weekoffDays < 4) {
          //

          let alreadyAddedPWO = 0;
          // how many present on weekoff
          const filterPWO = attList.filter(
            (aEle) => aEle.status === "present" && aEle.wlStatus === "weekoff",
          );
          // how many not taken weekoff - including PWO
          let generated = 4 - weekoffDays;
          // check if pwo & already added CO then (alreadyAddedPWO++) & add leave
          await Promise.all(
            filterPWO.map(async (iELE) => {
              //
              try {
                const dt = moment(iELE.date);
                const query = {
                  userId: shiftInfo?.userId?._id,
                  type: "deposit",
                  date: {
                    //
                    $gte: dt.startOf("day").toDate(),
                    $lte: dt.endOf("day").toDate(),
                  },
                };
                // console.log(query);
                // find leaveHistory for this record - date;
                const leaveHist = await leaveHistoryModel.findOne(query);
                // console.log(leaveHist);

                if (!leaveHist) {
                  // if not found add CO + history
                  // const updated = await shiftInfoModel.findByIdAndUpdate(
                  //   shiftInfo._id,
                  //   {
                  //     $inc: { compensatoryoff: 1 },
                  //   },
                  //   { new: true }
                  // );

                  // await createLeaveHistoryFunc({
                  //   userId: shiftInfo?.userId?._id,
                  //   date: currentDate.toDate(),
                  //   description: `auto-generated CO for Present on Weekoff on ${dt.format(
                  //     "DD/MM/YYYY"
                  //   )}`,
                  //   count: 1,
                  //   type: "deposit",
                  //   leaveType: "on-compensation-off-leave",
                  //   deposittype: "auto-generated",
                  //   howManyBefore: updated.compensatoryoff - 1,
                  // });

                  alreadyAddedPWO++;
                  return;
                }

                alreadyAddedPWO++;
              } catch (error) {
                //
                // console.log(
                //   `adding leave eror on PWO ${shiftInfo?.userId?._id}`
                // );
              }
            }),
          );
          // then alreadyAddedPWO - generated = remaining CO add it
          totalComps += alreadyAddedPWO - generated;
          // check if already genrated for that day & minus that day
          if (totalComps > 0) {
            // const updated = await shiftInfoModel.findByIdAndUpdate(
            //   shiftInfo._id,
            //   {
            //     $inc: { compensatoryoff: generated },
            //   },
            //   { new: true }
            // );
            // await createLeaveHistoryFunc({
            //   userId: shiftInfo?.userId?._id,
            //   date: currentDate.toDate(),
            //   description: `auto-generated from Present on Weekoff ${generated}days in ${currentDate.format(
            //     "DD/MM/YYY"
            //   )}`,
            //   count: generated,
            //   type: "deposit",
            //   leaveType: "on-compensation-off-leave",
            //   deposittype: "auto-generated",
            //   howManyBefore: updated.compensatoryoff - 1,
            // });
          }
        }
        payableDays = roundToHalf(payableDays);
        let abs = daysInMonth - payableDays;
        absentDays = roundToHalf(abs < 0 ? 0 : abs);
        if (shiftInfo.userId?.department?._id === "dept-it") {
          const ots = distributeHours(
            attOverview.activeHours - attOverview.requiredHours,
          );

          ots.map((ele) => {
            totalComps += ele.day;
          });
          await Promise.all(
            ots.map(async (ele) => {
              // TODO: create leaveHistory;
              const updated = await shiftInfoModel.findByIdAndUpdate(
                shiftInfo._id,
                {
                  $inc: { compensatoryoff: ele.day },
                },
                { new: true },
              );

              await createLeaveHistoryFunc({
                userId: shiftInfo?.userId?._id,
                date: currentDate.toDate(),
                description: `auto-generated from Overtime hours ${(
                  attOverview.activeHours - attOverview.requiredHours
                ).toFixed(1)}hr`,
                count: ele.day,
                type: "deposit",
                leaveType: "on-compensation-off-leave",
                deposittype: "auto-generated",
                howManyBefore: updated.compensatoryoff - 1,
              });
            }),
          );
        }

        list.push({
          userId: shiftInfo.userId?._id,
          payableDays,
          weekoffDays,
          absentDays,
          onLeaveDays,
          holiDays,
          halfDays,
          compOffs,
          paidLeaves,
          casualLeaves,
          totalComps,
          totalLeaves:
            shiftInfo.casualLeave +
            shiftInfo.compensatoryoff +
            shiftInfo.paidLeave +
            totalComps, // Balance leaves
          payableDays: payableDays > daysInMonth ? daysInMonth : payableDays,
          daysInMonth,
        });
      }),
    );

    return successRes2(res, 200, "generate atts", {
      data: list,
    });
  } catch (error) {
    console.error("Error exporting detailed attendance:", error);
    res.status(500).json({ message: "Server error." });
  }
};

//using now
export const generateCompensatoryOffLatest = async (req, res) => {
  const { date } = req.query;
  const list = [];

  try {
    // ---------- Date & timezone ----------
    const timeZone = "Asia/Kolkata";
    const currentDate = date
      ? moment(date).tz(timeZone).isValid()
        ? moment(date).tz(timeZone)
        : moment().tz(timeZone)
      : moment().tz(timeZone);

    const currentMonth = currentDate.month(); // 1-based
    const currentYear = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();

    // ---------- Attendance Month ----------
    const atts = await attendanceModel
      .find({
        month: currentMonth + 1,
        year: currentYear,
      })
      .lean()
      .sort({ day: 1 });

    if (!atts.length)
      return res.json({ message: "No attendance records found." });

    const shiftInfoList = await shiftInfoModel
      .find({})
      .populate(employeeShiftInfoPopulateOptions)
      .lean();

    // ---------- Filter active employees with valid shift ----------
    const filteredShifts = shiftInfoList.filter(
      (ele) => ele?.userId?.status === "active" && ele?.shift,
    );

    await Promise.all(
      filteredShifts.map(async (shiftInfo, idx) => {
        let payableDays = 0;
        let weekoffDays = 0;
        let absentDays = 0;
        let onLeaveDays = 0;
        let holiDays = 0;
        let halfDays = 0;
        let compOffs = 0;
        let paidLeaves = 0;
        let casualLeaves = 0;
        let totalComps = 0;
        let presentWeekoffDays = 0;

        const attList =
          atts.filter((att) => att?.userId === shiftInfo?.userId?._id) || [];

        // ---------- Process attendance ----------
        attList.map((ele) => {
          const date = moment(ele.date);
          const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
          const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");

          switch (ele.status) {
            case "weekoff":
              weekoffDays++;
              break;

            case "present":
              if (ele.wlStatus === "weekoff") presentWeekoffDays++;
              break;

            case "on-paid-leave":
            case "on-casual-leave":
            case "on-compensation-off-leave":
              compOffs += ele.leaveDuration;
              onLeaveDays += ele.leaveDuration;
              break;

            case "half-day":
              halfDays += 0.5;
              break;

            case "holiday":
              holiDays++;
              break;

            case "absent":
              if (date.day() === 0) weekoffDays++;
              else absentDays++;
              break;

            case "active":
              if (checkIn.isValid() && !checkOut.isValid()) halfDays += 0.5;
              break;
          }
        });

        // ---------- Build sample row (optional) ----------
        const sampleRow = [
          idx + 1,
          shiftInfo?.userId?.employeeId,
          shiftInfo?.userId?.firstName,
          shiftInfo?.userId?.lastName,
          shiftInfo?.userId?.designation?.designation,
          shiftInfo?.userId?.division?.division,
          shiftInfo?.userId?.department?.department,
        ];

        for (let i = 1; i <= daysInMonth; i++) {
          const att = attList.find((a) => a.day === i);
          if (att) {
            const checkIn = moment(att.checkInTime);
            const checkOut = moment(att.checkOutTime);
            if (checkIn.isValid() && checkOut.isValid()) {
              sampleRow.push(checkIn.format("HH:mm"), checkOut.format("HH:mm"));
            } else sampleRow.push("-", "-");
          } else sampleRow.push("-", "-");
        }

        // ---------- Attendance Overview ----------
        const attOverview = getAttendanceOverviewFuncLocal({
          date: currentDate.toDate(),
          shiftInfo,
          attendanceList: attList,
        });

        payableDays = attOverview.activeHours / 9;
        payableDays +=
          weekoffDays + onLeaveDays + halfDays + presentWeekoffDays;
        payableDays = roundToHalf(payableDays);

        let abs = daysInMonth - payableDays;
        absentDays = roundToHalf(abs < 0 ? 0 : abs);
        const lastDayOfMonth = moment(currentDate).endOf("month");

        // ---------- Comp Off generation if weekoff < 4 ----------
        // console.log(weekoffDays);

        if (weekoffDays < 4) {
          let alreadyAddedPWO = 0;
          const presentOnWeekoff = attList.filter(
            (aEle) => aEle.status === "present" && aEle.wlStatus === "weekoff",
          );
          let missingWeekoffs = 4 - weekoffDays;
          // console.log(weekoffDays);
          // console.log(missingWeekoffs);

          // Check PWO entries and add if not found in leave history
          let shouldGenerateCO = false;

          await Promise.all(
            presentOnWeekoff.map(async (dayRecord) => {
              // console.log(dayRecord)
              const dt = moment(dayRecord.date).tz("Asia/Kolkata");
              const query = {
                userId: shiftInfo?.userId?._id,
                type: "deposit",
                date: {
                  $gte: dt.startOf("day").toDate(),
                  $lte: dt.endOf("day").toDate(),
                },
              };
              console.log(query);
              const existingHistory = await leaveHistoryModel.findOne(query);
              console.log(existingHistory);

              if (!existingHistory) {
                shouldGenerateCO = true; // mark once
              } else {
                missingWeekoffs -= 1;
              }
            }),
          );
          console.log(shouldGenerateCO);

          if (shouldGenerateCO && missingWeekoffs > 0) {
            const updated = await shiftInfoModel.findByIdAndUpdate(
              shiftInfo._id,
              { $inc: { compensatoryoff: missingWeekoffs } },
              { new: true },
            );
            await createLeaveHistoryFunc({
              userId: shiftInfo?.userId?._id,
              date: lastDayOfMonth.toDate(),
              description: `Auto-generated ${missingWeekoffs} CO(s) for missing weekoffs in ${currentDate.format(
                "MMMM YYYY",
              )}`,
              count: missingWeekoffs,
              type: "deposit",
              leaveType: "on-compensation-off-leave",
              deposittype: "auto-generated",
              howManyBefore: (updated.compensatoryoff ?? 0) - missingWeekoffs,
            });
            totalComps += missingWeekoffs;
            shouldGenerateCO = true;
          }
        }

        // ---------- Overtime Comp Off for IT Dept ----------
        if (shiftInfo.userId?.department?._id === "dept-it") {
          const ots = distributeHours(
            attOverview.activeHours - attOverview.requiredHours,
          );
          console.log(ots);
          for (const ele of ots) {
            totalComps += ele.day;
            const updated = await shiftInfoModel.findByIdAndUpdate(
              shiftInfo._id,
              { $inc: { compensatoryoff: ele.day } },
              { new: true },
            );

            await createLeaveHistoryFunc({
              userId: shiftInfo?.userId?._id,
              date: currentDate.toDate(),
              description: `Auto-generated from Overtime hours ${(
                attOverview.activeHours - attOverview.requiredHours
              ).toFixed(1)}hr`,
              count: ele.day,
              type: "deposit",
              leaveType: "on-compensation-off-leave",
              deposittype: "auto-generated",
              howManyBefore: (updated.compensatoryoff ?? 0) - 1,
            });
          }
        }

        // ---------- Final push ----------
        list.push({
          userId: shiftInfo.userId?._id,
          payableDays: payableDays > daysInMonth ? daysInMonth : payableDays,
          weekoffDays,
          absentDays,
          onLeaveDays,
          holiDays,
          halfDays,
          compOffs,
          paidLeaves,
          casualLeaves,
          totalComps,
          totalLeaves:
            shiftInfo.casualLeave +
            shiftInfo.compensatoryoff +
            shiftInfo.paidLeave +
            totalComps,
          daysInMonth,
        });
      }),
    );

    return successRes2(res, 200, "Compensatory offs generated successfully", {
      data: list,
    });
  } catch (error) {
    console.error("Error generating compensatory offs:", error);
    return errorRes2(
      res,
      500,
      "Server error while generating compensatory offs",
    );
  }
};

export const exportAttendance3Bak = async (req, res) => {
  const { date } = req.query;
  const id = "ev206-shreya-salun khe";
  try {
    // ---------- Date & timezone ----------
    const timeZone = "Asia/Kolkata";
    const currentDate = date
      ? moment(date).tz(timeZone).isValid()
        ? moment(date).tz(timeZone)
        : moment().tz(timeZone)
      : moment().tz(timeZone);

    const currentMonth = currentDate.month() + 1; // 1-based
    const currentYear = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();

    // ---------- Attendance Month ----------
    const atts = await attendanceModel
      .find({
        userId: id,
        month: currentMonth,
        year: currentYear,
      })
      .sort({ day: 1 });
    if (atts.length === 0) {
      return res.json({ message: "No attendance records found." });
    }

    const shiftInfo = await shiftInfoModel
      .findOne({
        userId: id,
      })
      .populate(employeeShiftInfoPopulateOptions);

    const attOverview = await getAttendanceOverviewFunc({
      id: id,
      date: currentDate.toDate(),
    });

    // ---------- Create workbook ----------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Detailed Attendance");

    // row1 spacing
    worksheet.addRow(["spacing"]);

    // header rows
    const weekdayRowIndex = 2; // weekday names
    const dayNumberRowIndex = 3; // day numbers (merged)

    // ---------- Fixed headers before days ----------
    const fixedHeaders = [
      "ID",
      "Employee ID",
      "First Name",
      "Last Name",
      "Designation",
      "Division",
      "Department",
    ];

    // Fill fixed headers across row 2 & 3
    fixedHeaders.forEach((header, idx) => {
      const col = idx + 1;
      worksheet.mergeCells(weekdayRowIndex, col, dayNumberRowIndex + 1, col);
      const cell = worksheet.getCell(weekdayRowIndex, col);
      cell.value = header;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      worksheet.getColumn(col).width = 15;
    });

    // ---------- Days loop ----------
    const startColForDays = fixedHeaders.length + 1; // e.g. col H

    for (let i = 1; i <= daysInMonth; i++) {
      const firstCol = startColForDays + (i - 1) * 2;
      const secondCol = firstCol + 1;

      // get weekday using moment-timezone
      const mDate = moment.tz(
        { year: currentYear, month: currentMonth - 1, day: i },
        timeZone,
      );
      const weekday = mDate.format("ddd"); // Mon/Tue/Wed

      // merge weekday cells across 2 columns
      worksheet.mergeCells(
        weekdayRowIndex,
        firstCol,
        weekdayRowIndex,
        secondCol,
      );
      const weekdayCell = worksheet.getCell(weekdayRowIndex, firstCol);
      weekdayCell.value = weekday;
      weekdayCell.alignment = { horizontal: "center", vertical: "middle" };
      weekdayCell.font = { italic: true };
      weekdayCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };

      // merge day number row
      worksheet.mergeCells(
        dayNumberRowIndex,
        firstCol,
        dayNumberRowIndex,
        secondCol,
      );
      const dayCell = worksheet.getCell(dayNumberRowIndex, firstCol);
      dayCell.value = `${i}`;
      dayCell.alignment = { horizontal: "center", vertical: "middle" };
      dayCell.font = { bold: true };
      dayCell.border = {
        // top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      const inCell = worksheet.getCell(dayNumberRowIndex + 1, firstCol);
      const outCell = worksheet.getCell(dayNumberRowIndex + 1, firstCol + 1);
      inCell.value = `IN`;
      outCell.value = `OUT`;
      inCell.alignment = { horizontal: "center", vertical: "middle" };
      inCell.font = { bold: true };
      inCell.border = {
        left: { style: "thin" },
        top: { style: "thin" },

        bottom: { style: "thin" },
      };
      outCell.alignment = { horizontal: "center", vertical: "middle" };
      outCell.font = { bold: true };
      outCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };

      // set widths
      worksheet.getColumn(firstCol).width = 6;
      worksheet.getColumn(secondCol).width = 6;
    }

    // ---------- Remaining headers ----------
    const afterDaysCol = startColForDays + daysInMonth * 2;
    const remainingHeaders = [
      "Hours",
      "Week Off",
      "Used Leaves",
      "Holiday",
      "Absent Days",
      "Utilised CO",
      "Utilised PL",
      "Utilised CL",
      "Compoff Generated",
      "Balance Leaves",
      "Payable Days",
      "Days in Month",
    ];

    remainingHeaders.forEach((header, idx) => {
      const col = afterDaysCol + idx;
      worksheet.mergeCells(weekdayRowIndex, col, dayNumberRowIndex + 1, col);
      const cell = worksheet.getCell(weekdayRowIndex, col);
      cell.value = header;
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      worksheet.getColumn(col).width = 15;
    });

    // ---------- Styling ----------
    worksheet.getRow(weekdayRowIndex).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "bffcb3" },
      };
      cell.font = { bold: true };
    });

    worksheet.getRow(dayNumberRowIndex).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "bffcb3" },
      };
      cell.font = { bold: true };
    });

    worksheet.getRow(dayNumberRowIndex + 1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "bffcb3" },
      };
      cell.font = { bold: true };
    });
    // crrent

    // ---
    let payableDays = 0;
    let weekoffDays = 0;
    let absentDays = 0;
    let onLeaveDays = 0;
    let holiDays = 0;
    let halfDays = 0;
    let compOffs = 0;
    let paidLeaves = 0;
    let casualLeaves = 0;
    let totalComps = 0;

    atts.map((ele, i) => {
      if (i == 14) {
        // console.log(ele);
      }
      const date = moment(ele.date);
      const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
      const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");

      if (ele.status === "weekoff") {
        //
        weekoffDays++;
      } else if (ele.status === "on-paid-leave") {
        if (checkIn.isValid() && checkOut.isValid()) {
          // return;
          const actMinutes = checkOut.diff(checkIn, "hour", true);
          if (actMinutes > minWorkHours / 2) {
            paidLeaves += 0.5;
            onLeaveDays += 0.5;
          } else {
            paidLeaves += 1;
            onLeaveDays += 1;
          }
        } else {
          paidLeaves += 1;
          onLeaveDays += 1;
        }
      } else if (ele.status === "on-casual-leave") {
        if (checkIn.isValid() && checkOut.isValid()) {
          // return;
          const actMinutes = checkOut.diff(checkIn, "hour", true);
          if (actMinutes > minWorkHours / 2) {
            casualLeaves += 0.5;
            onLeaveDays += 0.5;
          } else {
            casualLeaves += 1;
            onLeaveDays += 1;
          }
        } else {
          casualLeaves += 1;
          onLeaveDays += 1;
        }
      } else if (ele.status === "on-compensation-off-leave") {
        if (checkIn.isValid() && checkOut.isValid()) {
          // return;
          const actMinutes = checkOut.diff(checkIn, "hour", true);
          if (actMinutes > minWorkHours / 2) {
            compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            compOffs += 1;
            onLeaveDays += 1;
          }
        } else {
          compOffs += 1;
          onLeaveDays += 1;
        }
      } else if (ele.status === "half-day") {
        halfDays++;
      } else if (ele.status === "holiday") {
        holiDays++;
      } else if (ele.status === "absent") {
        if (date.day() === 0) {
          //
          weekoffDays++;
        } else {
          absentDays++;
        }
      }
    });

    // ---
    if (attOverview) {
      const requiredHours = attOverview.requiredHours;
      const completedHours = attOverview.activeHours;
      //
      payableDays += completedHours / 9;

      //
    }
    if (weekoffDays > 0) {
      payableDays += weekoffDays;
    }
    if (onLeaveDays > 0) {
      payableDays += onLeaveDays;
    }
    if (weekoffDays < 4 && absentDays > 0) {
      //TODO: fixes absent if not weekoff
    }
    payableDays = roundToHalf(payableDays);

    // Add sample row (row 4)
    const sampleRow = [
      1,
      shiftInfo?.userId?.employeeId,
      shiftInfo?.userId?.firstName,
      shiftInfo?.userId?.lastName,
      shiftInfo?.userId?.designation?.designation,
      shiftInfo?.userId?.division?.division,
      shiftInfo?.userId?.department?.department,
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const att = atts.find((ele) => ele.day === day);
      if (!att) {
        sampleRow.push("-");
        sampleRow.push("-");
        continue;
      }
      const checkIn = moment(att?.checkInTime);
      const checkOut = moment(att?.checkOutTime);

      if (checkIn.isValid() && checkOut.isValid()) {
        sampleRow.push(checkIn.format("HH:mm")); // IN
        sampleRow.push(checkOut.format("HH:mm")); // OUT
      } else {
        sampleRow.push("-");
        sampleRow.push("-");
      }
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const firstCol = startColForDays + (i - 1) * 2;
      const secondCol = firstCol + 1;
      worksheet.mergeCells(
        dayNumberRowIndex + 2,
        firstCol,
        dayNumberRowIndex + 2,
        secondCol,
      );

      const weekdayCell = worksheet.getCell(dayNumberRowIndex + 2, firstCol);
      const att = atts.find((ele) => ele.day === i);
      const checkIn = moment(att?.checkInTime);
      const checkOut = moment(att?.checkOutTime);
      if (checkIn.isValid() && checkOut.isValid()) {
        const duration = moment.duration(checkOut.diff(checkIn));
        const totalHours = `${Math.floor(
          duration.asHours(),
        )}h ${duration.minutes()}m`;

        weekdayCell.value = totalHours;
      } else {
        if (att.status === "weekoff") {
          weekdayCell.value = "WO";
        } else if (att.status === "absent") {
          weekdayCell.value = "A";
        } else {
          weekdayCell.value = "-";
        }
      }

      weekdayCell.font = { bold: true };
      weekdayCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      weekdayCell.border = {
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
    // function roundToHalf(num) {
    //   return Math.round(num * 2) / 2;
    // }

    absentDays = roundToHalf(daysInMonth - payableDays);
    const ots = distributeHours(
      attOverview.requiredHours - attOverview.activeHours,
    );
    ots.map((ele) => {
      totalComps += ele.day;
    });

    const remos = [
      `${Math.floor(attOverview.activeHours)}hr / ${Math.floor(
        attOverview.requiredHours,
      )}hr`,
      weekoffDays,
      onLeaveDays,
      holiDays,
      absentDays, // absent days
      compOffs, // ut - CO
      paidLeaves, // ut - PL
      casualLeaves, // ut - CL
      totalComps, // generated compoff
      0, // Balance leaves
      payableDays > daysInMonth ? daysInMonth : payableDays,
      daysInMonth,
    ];
    remos.map((ele) => {
      //
      sampleRow.push(ele);
    });

    worksheet.insertRow(dayNumberRowIndex + 2, sampleRow);
    // only merge first 1-7 cell & after daysInMonth cell merge - for sample Row
    // Fill fixed headers across row 2 & 3
    sampleRow.forEach((header, idx) => {
      const col = idx + 1;
      const cell = worksheet.getCell(dayNumberRowIndex + 2, col);

      if (col > 7) {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        return;
      }
      worksheet.mergeCells(
        dayNumberRowIndex + 2,
        col,
        dayNumberRowIndex + 3,
        col,
      );
      cell.value = header;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      worksheet.getColumn(col).width = 15;
    });

    // worksheet.insertRow(dayNumberRowIndex + 3, sampleRow);

    // ---------- Save & send ----------
    const fileName = `detailed_attendance_${Date.now()}.xlsx`;
    const cPath = config.STORAGE_ABSOLUTE_PATH
      ? "/var/www/storage/attendance"
      : __dirname;
    const filePath = path.join(cPath, fileName);

    await workbook.xlsx.writeFile(filePath);

    if (config.STORAGE_ABSOLUTE_PATH) {
      return successRes2(res, 200, "export attendance", {
        data: {
          file: `https://cdn.evhomes.tech/attendance/${fileName}`,
        },
      });
    } else {
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("File download error:", err);
          res.status(500).json({ message: "Failed to download file." });
        } else {
          fs.unlinkSync(filePath);
        }
      });
    }
  } catch (error) {
    console.error("Error exporting detailed attendance:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const generateCompensatoryOffV2 = async (req, res) => {
  const { date } = req.query;
  const list = [];

  try {
    // ---------- Date & timezone ----------
    const timeZone = "Asia/Kolkata";
    const currentDate = date
      ? moment(date).tz(timeZone).isValid()
        ? moment(date).tz(timeZone)
        : moment().tz(timeZone)
      : moment().tz(timeZone);

    const currentMonth = currentDate.month(); // 1-based
    const currentYear = currentDate.year();
    const daysInMonth = currentDate.daysInMonth();
    // ---------- Shiftinfo  ----------

    const shiftInfoList = await shiftInfoModel
      .find({})
      .populate(employeeShiftInfoPopulateOptions)
      .lean();

    // ---------- Attendance Month ----------
    const atts = await attendanceModel
      .find({ month: currentMonth + 1, year: currentYear })
      .lean()
      .sort({ day: 1 });
    const filteredShifts = shiftInfoList.filter(
      (ele) => ele?.userId?.status === "active" && ele?.shift,
    );
    filteredShifts.forEach((shiftInfo, idx) => {
      let payableDays = 0;
      let weekoffDays = 0;
      let presentOnweekoffDays = 0;
      let absentDays = 0;
      let onLeaveDays = 0;
      let holiDays = 0;
      let halfDays = 0;
      let compOffs = 0;
      let paidLeaves = 0;
      let casualLeaves = 0;
      let totalComps = 0;

      const attList =
        atts.filter((att) => att?.userId === shiftInfo?.userId?._id) || [];
      attList.map((ele, i) => {
        // if (i == 14) {
        //   console.log(ele);
        // }
        const date = moment(ele.date);
        const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
        const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");

        if (ele.status === "weekoff") {
          //
          weekoffDays++;
        } else if (ele.status === "on-paid-leave") {
          if (ele.leaveDuration === 0.5) {
            // compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            // compOffs += 1;
            onLeaveDays += 1;
          }
        } else if (ele.status === "on-casual-leave") {
          if (ele.leaveDuration === 0.5) {
            // compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            // compOffs += 1;
            onLeaveDays += 1;
          }
        } else if (ele.status === "on-compensation-off-leave") {
          if (ele.leaveDuration === 0.5) {
            // compOffs += 0.5;
            onLeaveDays += 0.5;
          } else {
            // compOffs += 1;
            onLeaveDays += 1;
          }
        } else if (ele.status === "half-day") {
          halfDays += 0.5;
        } else if (ele.status === "holiday" || ele.wlStatus === "holiday") {
          holiDays++;
        } else if (ele.status === "absent") {
          if (date.day() === 0) {
            //
            weekoffDays++;
          } else {
            absentDays++;
          }
        } else if (ele.status === "active") {
          if (checkIn.isValid() && !checkOut.isValid()) {
            // payableDays += 0.5;
            halfDays += 0.5;
          }
        } else if (ele.status === "present" && ele.wlStatus === "weekoff") {
          presentOnweekoffDays++;
        }
      });

      // Remaining summary columns
      const attOverview = getAttendanceOverviewFuncLocal({
        date: currentDate.toDate(),
        shiftInfo,
        attendanceList: attList,
      });
      payableDays =
        attOverview.activeHours - attOverview.requiredHours > 0
          ? daysInMonth
          : attOverview.activeHours / shiftInfo.shift.workingHours;
      // console.log(`${shiftInfo.userId.firstName}`, " ", payableDays);
      if (weekoffDays > 0) {
        payableDays += weekoffDays;
      }
      if (presentOnweekoffDays > 0) {
        payableDays += presentOnweekoffDays;
      }
      if (onLeaveDays > 0) {
        payableDays += onLeaveDays;
      }
      if (holiDays > 0) {
        payableDays += holiDays;
      }
      if (halfDays > 0) {
        payableDays += halfDays;
      }

      if (weekoffDays < 4 && absentDays > 0) {
        //TODO: fixes absent if not weekoff
      }
      if (weekoffDays < 4) {
        //
        totalComps += 4 - weekoffDays;
      }
      payableDays = roundToHalf(payableDays);
      let abs = daysInMonth - payableDays;
      absentDays = roundToHalf(abs < 0 ? 0 : abs);
      const ots = distributeHours(
        attOverview.activeHours - attOverview.requiredHours,
      );
      if (shiftInfo?.userId?.department?._id === "dept-it") {
        ots.map((ele) => {
          totalComps += ele.day;
        });
      }

      list.push({
        userId: shiftInfo.userId?._id,
        workHours: attOverview.activeHours,
        requiredHours: attOverview.requiredHours,
        payableDays,
        weekoffDays,
        absentDays,
        onLeaveDays,
        holiDays,
        halfDays,
        paidLeaves,
        casualLeaves,
        totalComps,
        ots: ots,
        totalLeaves:
          shiftInfo.casualLeave +
          shiftInfo.compensatoryoff +
          shiftInfo.paidLeave +
          totalComps, // Balance leaves
        payableDays: payableDays > daysInMonth ? daysInMonth : payableDays,
        daysInMonth,
      });

      //
    });
    return successRes2(res, 200, "g", {
      data: list,
    });
  } catch (e) {
    //
    return errorRes2(res, 500, `${e}`);
  }
};
