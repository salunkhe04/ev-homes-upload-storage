import express from "express";
import attendanceModel from "../../model/attendance/attendance.model.js";
import {
  applyGraceTime,
  breakEnd,
  breakStart,
  calculateHoursDifferenceWithTZ,
  checkIn,
  checkOut,
  checkOutV2,
  exportAtendance,
  exportAttendance2,
  exportAttendance3,
  generateCompensatoryOff,
  generateCompensatoryOffLatest,
  generateCompensatoryOffV2,
  getAllMyAttendance,
  getAttendanceOverview,
  getAttendanceOverviewFunc,
  getCheckInByDate,
  getCheckInByUserId,
  getGraceApplicableRecords,
  getMyAttendance,
  getPendingCheckout,
  getPreviousRecord,
  insertDailyAttendance,
  insertMonthlyAttendance,
  manualEntry,
  revisedCheckOutV2,
  RevisedCompensatoryOff,
  triggerMonthlyCompOff,
  updateAttendanceById,
  updateTimeLine,
} from "../../controller/attendance.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import moment from "moment-timezone";
import { Parser } from "json2csv";
import employeeModel from "../../model/employee.model.js";
import {
  attendancePopulateOption,
  employeePopulateOptions,
} from "../../utils/constant.js";
import XLSX from "xlsx";
import ExcelJS from "exceljs";
import { errorRes2, successRes2 } from "../../model/response.js";
import leaveRequestModel from "../../model/attendance/leave/leaveRequest.model.js";
import attendanceLogModel from "../../model/attendance/attendanceLog.model.js";
import logger from "../../utils/logger.js";

const attendanceRouter = express.Router();

// Utility function to calculate total seconds between two dates
attendanceRouter.get(
  "/checkout-pending/:id",
  authenticateToken,
  getPendingCheckout,
);

// Check-In Endpoint
attendanceRouter.post("/check-in", authenticateToken, checkIn);

// Check-In Endpoint
attendanceRouter.get(
  "/get-check-in/:id",
  authenticateToken,
  getCheckInByUserId,
);

// Check-In Endpoint
attendanceRouter.get(
  "/get-check-in-by-date",
  authenticateToken,
  getCheckInByDate,
);

// Check-In Endpoint
attendanceRouter.get(
  "/get-grace-applicable-records",
  authenticateToken,
  getGraceApplicableRecords,
);

attendanceRouter.post(
  "/apply-grace-time/:id",
  authenticateToken,
  applyGraceTime,
);

// Break Start Endpoint
attendanceRouter.post("/break-start", authenticateToken, breakStart);

// Break End Endpoint
attendanceRouter.post("/break-end", authenticateToken, breakEnd);

// Check-Out Endpoint
attendanceRouter.post("/check-out", authenticateToken, revisedCheckOutV2);
// attendanceRouter.post("/check-out", authenticateToken, checkOutV2);

attendanceRouter.post("/trigger-monthly-comp-off/:id", triggerMonthlyCompOff);

attendanceRouter.get("/monthly-attendance-overview/:id", getAttendanceOverview);

// Manual Entry Endpoint
attendanceRouter.post("/manual-entry", authenticateToken, manualEntry);

attendanceRouter.post("/update-timeline", authenticateToken, updateTimeLine);

attendanceRouter.get(
  "/attendance/:id",

  // authenticateToken,

  getMyAttendance,
);

attendanceRouter.post(
  "/update-attendance-with-remark/:id",
  authenticateToken,
  updateAttendanceById,
);

attendanceRouter.get(
  "/attendance-all/:id",
  authenticateToken,
  getAllMyAttendance,
);

attendanceRouter.get(
  "/export-attendance",
  authenticateToken,
  // exportAtendance
  exportAttendance3,
);

attendanceRouter.get(
  "/export-attendance-2",
  authenticateToken,
  exportAttendance3,
);
attendanceRouter.get(
  "/export-attendance-3",
  // authenticateToken,
  exportAttendance3,
);

attendanceRouter.get(
  "/generate-comp-of-monthly",
  // authenticateToken,
  generateCompensatoryOffLatest,
);


attendanceRouter.get(
  "/revised-comp-of-monthly",
  // authenticateToken,
  RevisedCompensatoryOff,
);
attendanceRouter.get(
  "/generate-comp-of-monthly-latest",
  // authenticateToken,
  generateCompensatoryOffV2,
);

attendanceRouter.get(
  "/absence-record/:id",
  authenticateToken,

  getPreviousRecord,
);

attendanceRouter.post("/attendance-log-update", async (req, res) => {
  const data = req.body;
  try {
    const resp = await attendanceLogModel.create({ ...data });
    return successRes2(res, 200, "success", { data: resp });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `${error}`);
  }
});

attendanceRouter.get("/attendance-logs", async (req, res) => {
  const { startDate, endDate, query = "", action } = req.query;
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    // logger.info(req.query);

    let start =
      startDate && moment(startDate).isValid()
        ? moment(startDate).tz("Asia/Kolkata").startOf("day").toDate()
        : null;
    let end =
      endDate && moment(endDate).isValid()
        ? moment(endDate).tz("Asia/Kolkata").endOf("day").toDate()
        : null;
    // logger.info(start);
    // logger.info(end);

    let searchFilter = {
      $or: [{ userId: { $regex: query, $options: "i" } }].filter(Boolean),
      ...(action ? { action: action } : {}),
      ...(start != null && end != null
        ? { timestamp: { $gte: start, $lte: end } }
        : {}),
    };

    // logger.info(searchFilter);
    const resp = await attendanceLogModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });
    //
    const totalItems = await attendanceLogModel.countDocuments(searchFilter);

    const totalPages = Math.ceil(totalItems / limit);

    return successRes2(res, 200, "attendance logs success", {
      page,
      limit,
      totalPages,
      totalItems,
      data: resp,
    });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `${error}`);
  }
});

attendanceRouter.post("/attendance-difference", async (req, res) => {
  const { checkInTime } = req.body;

  const difference = calculateHoursDifferenceWithTZ(checkInTime);
  res.json({ data: difference });
});

attendanceRouter.post("/attendance-fill", async (req, res) => {
  try {
    const resp = await insertDailyAttendance();
    return res.send({
      total: resp?.length,
      data: resp,
    });
  } catch (error) {
    logger.info(error);
    return res.send(error);
  }
});

attendanceRouter.post("/attendance-fill-month", async (req, res) => {
  try {
    const resp = await insertMonthlyAttendance();
    return res.send({
      total: resp?.length,
      data: resp,
    });
  } catch (error) {
    logger.info(error);
    return res.send(error);
  }
});

attendanceRouter.post("/attendance-add-date", async (req, res) => {
  try {
    const resp = await attendanceModel.find();
    const dates = await Promise.all(
      resp.map(async (ele) => {
        if (!ele.date) {
          await attendanceModel.findByIdAndUpdate(ele._id, {
            date: new Date(ele.year, ele.month - 1, ele.day, 9, 0),
          });
          ele.date = new Date(ele.year, ele.month - 1, ele.day, 9, 0);
        }
        return ele;
      }),
    );
    return res.send({
      total: resp?.length,
      data: dates,
    });
  } catch (error) {
    logger.info(error);
    return res.send(error);
  }
});

attendanceRouter.post("/attendance-comp-off-fix", async (req, res) => {
  try {
    const resp = await attendanceModel.find({
      day: 18,
      month: 4,
      year: 2025,
      wlStatus: "holiday",
      $and: [
        {
          status: { $ne: "absent" },
        },
        {
          status: { $ne: null },
        },
      ],
    });
    // await Promise.all(
    //   resp.map(async (ele) => {
    //     const foundShift = await shiftInfoModel.findOne({ userId: ele.userId });
    //     await shiftInfoModel.findByIdAndUpdate(foundShift._id, {
    //       compensatoryoff: foundShift.compensatoryoff + 1,
    //     });
    //   })
    // );
    res.send({
      total: resp.length,
      data: resp,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

attendanceRouter.get("/attendance-ot-count", async (req, res) => {
  const date = new Date();
  const {
    id,
    month = date.getMonth() + 1,
    year = date.getFullYear(),
  } = req.query;

  try {
    if (!id) return errorRes2(res, 401, "params required");

    const resp = await attendanceModel
      .find({ month, year, userId: id })
      .populate(attendancePopulateOption);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const fullName = `${resp[0]?.userId?.firstName ?? ""} ${
      resp[0]?.userId?.lastName ?? ""
    }`.trim();
    const thisMonthYear = moment(resp[0]?.date ?? "")
      .format("MMM YY")
      .trim();
    const thisMonthYearDash = moment(resp[0]?.date ?? "")
      .format("MMM-YY")
      .trim();

    // Title row
    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = `${fullName} - ${thisMonthYear}`;
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // Header row
    const headers = [
      "Sr",
      "Date",
      "Check-In",
      "Check-Out",
      "Status",
      "Total Work Hour",
      "OT",
      "OT Minutes",
    ];
    const headerRow = worksheet.getRow(2);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    headerRow.commit();

    let totalOTMinutes = 0;

    resp.forEach((ele, i) => {
      const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
      const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");
      const date = moment(ele.date).tz("Asia/Kolkata");

      let totalWorkHourFormatted = "--";
      let OTFormatted = "--";
      let checkInFormatted = "--";
      let checkOutFormatted = "--";
      let dateFormatted = "--";
      let OTMins = 0;

      if (checkIn.isValid() && checkOut.isValid()) {
        const totalMinutes = checkOut.diff(checkIn, "minutes");
        const workHours = Math.floor(totalMinutes / 60);
        const workMinutes = totalMinutes % 60;

        totalWorkHourFormatted = `${workHours}hr${
          workMinutes > 0 ? ` ${workMinutes}m` : ""
        }`;

        const baseMinutes = 540; // 9hr
        const grace = 10;
        let otMinutes = 0;

        if (totalMinutes >= baseMinutes + grace) {
          otMinutes = totalMinutes - baseMinutes;
          OTMins = otMinutes;
        }

        const otHours = Math.floor(otMinutes / 60);
        const otRemainingMinutes = otMinutes % 60;

        if (otMinutes > 0) {
          OTFormatted = `${otHours}hr${
            otRemainingMinutes > 0 ? ` ${otRemainingMinutes}m` : ""
          }`;
          totalOTMinutes += otMinutes;
          // logger.info(
          //   `✔️ Added OT for ${date.format(
          //     "YYYY-MM-DD"
          //   )} = ${otMinutes} minutes`
          // );
        } else {
          OTFormatted = "--";
        }

        checkInFormatted = checkIn.format("hh:mm a");
        checkOutFormatted = checkOut.format("hh:mm a");
      } else {
        // logger.info(
        //   `⚠️ Skipped invalid check-in/out on ${date.format("YYYY-MM-DD")}`
        // );
      }

      if (date.isValid()) {
        dateFormatted = date.format("DD-MM-YYYY");
      }

      const status =
        ele.status === "on-compensation-off-leave" ? "comp-off" : ele.status;

      const row = worksheet.addRow([
        i + 1,
        dateFormatted,
        checkInFormatted,
        checkOutFormatted,
        status,
        totalWorkHourFormatted,
        OTFormatted,
        OTMins,
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    worksheet.columns.forEach((col, i) => {
      col.width = headers[i].length + 6;
    });

    const totalOTHours = Math.floor(totalOTMinutes / 60);
    const totalOTRemMin = totalOTMinutes % 60;
    const otFormatted = `${totalOTHours}hr${
      totalOTRemMin > 0 ? ` ${totalOTRemMin}m` : ""
    }`;

    const summaryRow = worksheet.getRow(resp.length + 3);
    worksheet.mergeCells(`A${resp.length + 3}:F${resp.length + 3}`);
    summaryRow.getCell(1).value = "Total OT";
    summaryRow.getCell(7).value = otFormatted;
    summaryRow.getCell(8).value = totalOTMinutes;

    summaryRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${id}_${thisMonthYearDash}_attendance.xlsx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    return res.send(buffer);
  } catch (error) {
    logger.info("Excel export error:", error);
    res.status(500).send("Failed to generate attendance report.");
  }
});

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

attendanceRouter.get("/attendance-ot-count-2", async (req, res) => {
  const date = new Date();
  const {
    id,
    month = date.getMonth() + 1,
    year = date.getFullYear(),
  } = req.query;

  try {
    let newDate = moment().set({
      month: month - 1,
      // day: date.getDate(),
      year: year,
    });
    if (!id) return errorRes2(res, 401, "params required");

    const resp = await attendanceModel
      .find({ month, year, userId: id })
      .populate(attendancePopulateOption);

    const attOverview = await getAttendanceOverviewFunc({
      id: id,
      date: newDate.toDate(),
    });

    if (!attOverview)
      return errorRes2(res, 401, "no attendance Overview found");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const fullName = `${resp[0]?.userId?.firstName ?? ""} ${
      resp[0]?.userId?.lastName ?? ""
    }`.trim();
    const thisMonthYear = moment(resp[0]?.date ?? "")
      .format("MMM YY")
      .trim();
    const thisMonthYearDash = moment(resp[0]?.date ?? "")
      .format("MMM-YY")
      .trim();

    // Title row
    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = `${fullName} - ${thisMonthYear}`;
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // Header row
    const headers = [
      "Sr",
      "Date",
      "Check-In",
      "Check-Out",
      "Status",
      "Total Work Hour",
      "Completion",
      "OT",
      "OT Minutes",
    ];
    const headerRow = worksheet.getRow(2);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    headerRow.commit();

    let totalOTMinutes = 0;
    let overallMinutes = 0;

    resp.forEach((ele, i) => {
      const checkIn = moment(ele.checkInTime).tz("Asia/Kolkata");
      const checkOut = moment(ele.checkOutTime).tz("Asia/Kolkata");
      const date = moment(ele.date).tz("Asia/Kolkata");

      let totalWorkHourFormatted = "--";
      let OTFormatted = "--";
      let checkInFormatted = "--";
      let checkOutFormatted = "--";
      let dateFormatted = "--";
      let OTMins = 0;
      let compliton = "--";
      if (checkIn.isValid() && checkOut.isValid()) {
        const totalMinutes = checkOut.diff(checkIn, "minutes");
        const workHours = Math.floor(totalMinutes / 60);
        const workMinutes = totalMinutes % 60;

        totalWorkHourFormatted = `${workHours}hr${
          workMinutes > 0 ? ` ${workMinutes}m` : ""
        }`;

        const baseMinutes = 540; // 9hr
        const grace = 10;
        let otMinutes = 0;
        overallMinutes += totalMinutes;

        if (totalMinutes >= baseMinutes + grace) {
          otMinutes = totalMinutes - baseMinutes;
          OTMins = otMinutes;
        }

        const otHours = Math.floor(otMinutes / 60);
        const otRemainingMinutes = otMinutes % 60;

        if (otMinutes > 0) {
          OTFormatted = `${otHours}hr${
            otRemainingMinutes > 0 ? ` ${otRemainingMinutes}m` : ""
          }`;
          totalOTMinutes += otMinutes;
          // logger.info(
          //   `✔️ Added OT for ${date.format(
          //     "YYYY-MM-DD"
          //   )} = ${otMinutes} minutes`
          // );
        } else {
          OTFormatted = "--";
        }

        checkInFormatted = checkIn.format("hh:mm a");
        checkOutFormatted = checkOut.format("hh:mm a");
        //
        const overallHours = Math.floor(overallMinutes / 60);
        compliton = `${overallHours}hr / ${attOverview.requiredHours}hr`;

        //
      }
      // else if (checkIn.isValid() && !checkOut.isValid()) {
      //   // for missing checkout -half day - 5hr
      //   overallMinutes += 300;
      //   const overallHours = Math.floor(overallMinutes / 60);

      //   compliton = `${overallHours}hr / ${attOverview.requiredHours}hr`;
      // }
      else {
        // logger.info(
        //   `⚠️ Skipped invalid check-in/out on ${date.format("YYYY-MM-DD")}`
        // );
      }

      if (date.isValid()) {
        dateFormatted = date.format("DD-MM-YYYY");
      }

      let status =
        ele.status === "active"
          ? "half-day"
          : ele.status === "on-compensation-off-leave"
            ? "comp-off"
            : ele.status;

      if (date.day() === 0 && ele.status === "absent") {
        status = "weekoff";
      }

      if (status === "absent" || status === "active" || status === "half-day") {
        status = "--";
      }

      const row = worksheet.addRow([
        i + 1,
        dateFormatted,
        checkInFormatted,
        checkOutFormatted,
        status,
        totalWorkHourFormatted,
        compliton,
        OTFormatted,
        OTMins,
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    worksheet.columns.forEach((col, i) => {
      col.width = headers[i].length + 6;
    });

    const totalOTHours = Math.floor(totalOTMinutes / 60);
    const totalOTRemMin = totalOTMinutes % 60;
    const otFormatted = `${totalOTHours}hr${
      totalOTRemMin > 0 ? ` ${totalOTRemMin}m` : ""
    }`;

    const overallHours = Math.floor(overallMinutes / 60);

    const summaryRow = worksheet.getRow(resp.length + 3);
    worksheet.mergeCells(`A${resp.length + 3}:E${resp.length + 3}`);
    summaryRow.getCell(1).value = "Total OT";
    summaryRow.getCell(6).value = `${overallHours}hr`;
    summaryRow.getCell(7).value = "";
    summaryRow.getCell(8).value = otFormatted;
    summaryRow.getCell(9).value = totalOTMinutes;
    summaryRow.getCell(10).value = overallMinutes;

    summaryRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const idk = distributeHours(
      attOverview.activeHours - attOverview.requiredHours,
    );
    // logger.info(idk);

    const overViewRow = worksheet.getRow(resp.length - 3);
    const overViewRow1 = worksheet.getRow(resp.length - 4);
    worksheet.mergeCells(`K${resp.length - 4}:M${resp.length - 4}`);
    overViewRow1.getCell(11).value = "Comp-off Generated";
    overViewRow1.getCell(11).font = { bold: true };
    overViewRow1.getCell(11).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    overViewRow1.getCell(11).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    overViewRow.getCell(11).value = "Sr.";
    overViewRow.getCell(12).value = "Hours";
    overViewRow.getCell(13).value = "Days";

    idk.forEach((ele, i) => {
      // pick the row number dynamically
      const rowNumber = resp.length - 2 + i; // adjust as needed
      // const rowNumber = resp.length + 5 + i + 1; // adjust as needed
      const row = worksheet.getRow(rowNumber);

      row.getCell(11).value = i + 1; // column K
      row.getCell(12).value = `${ele.hours}hr`; // column L
      row.getCell(13).value = ele.type === "half" ? 0.5 : 1; // column M

      // styling each cell
      [11, 12, 13].forEach((col) => {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      row.commit();
    });

    const rowNumber = resp.length + idk.length - 2; // adjust as needed
    // const rowNumber = resp.length + 5 + i + 1; // adjust as needed
    let totalComps = 0;
    idk.map((ele) => {
      totalComps += ele.day;
      // if ((ele.type = "half-day")) {
      //   totalComps += 0.5;
      // } else {
      //   totalComps += 1;
      // }
    });
    const rowFinal = worksheet.getRow(rowNumber);
    worksheet.mergeCells(`K${rowNumber}:L${rowNumber}`);
    rowFinal.getCell(11).value = "Total OT";
    rowFinal.getCell(13).value = `${totalComps} Days`;
    rowFinal.getCell(11).font = { bold: true };
    rowFinal.getCell(11).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    rowFinal.getCell(11).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    rowFinal.getCell(13).font = { bold: true };
    rowFinal.getCell(13).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    rowFinal.getCell(13).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    overViewRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${id}_${thisMonthYearDash}_attendance.xlsx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    return res.send(buffer);
  } catch (error) {
    logger.info("Excel export error:", error);
    res.status(500).send("Failed to generate attendance report.");
  }
});

attendanceRouter.get("/attendance-week-check", async (req, res) => {
  try {
    const today = moment();
    const startOfWeek = moment().startOf("isoWeek");

    res.send({
      today: today,
      startOfWeek: startOfWeek,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

attendanceRouter.get("/dummy-attendance-sept", async (req, res) => {
  try {
    const timezone = "Asia/Kolkata";
    const now = moment().tz(timezone);
    const year = now.year();
    const month = now.month(); // 0-indexed
    const daysInMonth = now.daysInMonth();

    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment.tz({ year, month, day }, timezone).hour(11);

      // Sunday check (0 = Sunday)
      if (date.day() === 0) {
        result.push({
          month: date.month() + 1,
          day: date.date(),
          year: date.year(),

          date: date.toDate(),
          checkInTime: null,
          checkOutTime: null,
          status: "absent",
          userId: "ev000-test-dum",
        });
      } else {
        const startDate = date.clone().hour(11).minute(0).second(0);
        const endDate = date.clone().hour(21).minute(0).second(0);

        result.push({
          month: date.month() + 1,
          day: date.date(),
          year: date.year(),
          date: date.toDate(),
          checkInTime: startDate.toDate(),
          checkOutTime: endDate.toDate(),
          status: "present",
          userId: "ev000-test-dum",
        });
      }
    }

    await attendanceModel.insertMany(result);

    res.send(result);
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

attendanceRouter.get("/employee-6month", async (req, res) => {
  const now = moment().tz("Asia/Kolkata");
  const sixMonthAgo = moment().tz("Asia/Kolkata").subtract(6, "month");

  try {
    const resp = await employeeModel
      .find({
        // joiningDate: { $lt: sixMonthAgo },
        division: { $ne: "div-vashi-sector-17" },
        $or: [
          { designation: "desg-senior-closing-manager" },
          { designation: "desg-floor-manager" },

          { designation: "desg-site-head" },
          { designation: "desg-sales-executive" },
          { designation: "desg-front-desk-executive" },
          { designation: "desg-data-analyzer" },
          { designation: "desg-senior-sales-manager" },
          { designation: "desg-sales-manager" },
        ],
        status: "active",
      })
      .populate(employeePopulateOptions);

    // const resp = await attendanceModel.find({
    //   month: 4,
    //   year: 2025,
    //   userId: "ev201-aktarul-biswas",
    // });

    const list = [];
    resp.map((ele) => {
      const joiningDate = moment(ele.joiningDate)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY");
      const dateOfBirth = moment(ele.dateOfBirth)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY");
      const totalYear = now.diff(joiningDate, "year", true);
      list.push({
        employeeId: ele.employeeId,
        name: `${ele.firstName ?? ""} ${ele.lastName ?? ""}`,
        designation: `${ele.designation.designation ?? ""}`,
        department: `${ele.department.department ?? ""}`,
        joiningDate,
        dateOfBirth,
        totalYear,
        bloodGroup: ele.bloodGroup ?? "",
      });
    });
    const fields = Object.keys(list[0]); // or manually define like ['_id', 'title', 'assignTo']
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(list);

    res.header("Content-Type", "text/csv");
    res.attachment("emp_list_6m_above.csv");
    return res.send(csv);

    // await Promise.all(
    //   resp.map(async (ele) => {
    //     const foundShift = await shiftInfoModel.findOne({ userId: ele.userId });
    //     await shiftInfoModel.findByIdAndUpdate(foundShift._id, {
    //       compensatoryoff: foundShift.compensatoryoff + 1,
    //     });
    //   })
    // );
    res.send({
      total: list.length,
      data: list,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});

attendanceRouter.get("/attendance-leave-dur-update", async (req, res) => {
  try {
    const attsLeaves = await attendanceModel.find({
      //
      $or: [
        {
          status: RegExp("paid", "i"),
        },
        {
          status: RegExp("comp", "i"),
        },
        {
          status: RegExp("casual", "i"),
        },
      ],
    });
    const leaveRequests = await leaveRequestModel.find({});

    await Promise.all(
      attsLeaves.map(async (ele) => {
        //
        const attDate = moment(ele.date);
        const foundLv = leaveRequests.find((ale) => {
          const start = moment(ale.startDate);
          const end = moment(ale.endDate);
          if (
            attDate.isBetween(start, end.endOf("day"), null, "[]") &&
            ale.applicant === ele.userId
          ) {
            return true;
          }
          return false;
        });
        if (foundLv) {
          //
          // logger.info(foundLv.dayType);
          await attendanceModel.findByIdAndUpdate(ele._id, {
            leaveDuration: foundLv.dayType === "half-day" ? 0.5 : 1,
          });
        }
        try {
          //
        } catch (error) {
          logger.info(error);
          //
        }
      }),
    );

    res.send({
      totalLeave: leaveRequests.length,
      total: attsLeaves.length,
    });
  } catch (error) {
    logger.info(error);
    res.send(error);
  }
});
export default attendanceRouter;
