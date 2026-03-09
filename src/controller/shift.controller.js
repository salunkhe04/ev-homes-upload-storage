import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import shiftModel from "../model/attendance/shift/shift.model.js";
import employeeModel from "../model/employee.model.js"; // Assuming you have an Employee model
import {
  employeeShiftInfoPopulateOptions,
  shiftPopulateOptions,
} from "../utils/constant.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import attendanceModel from "../model/attendance/attendance.model.js";
import moment from "moment-timezone";

export const getShifts = async (req, res, next) => {
  try {
    const resp = await shiftModel.find().populate(shiftPopulateOptions);

    return res.send(
      successRes(200, "get shifts", {
        data: resp,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addShift = async (req, res, next) => {
  const {
    shiftName,
    type,
    timeIn,
    timeOut,
    workingHours,
    graceTime,
    status,
    multiTimeInOut,
    regularizationDays,
  } = req.body;

  try {
    if (!shiftName) return res.send(errorRes(401, "Shift Name is required"));
    // if (type === undefined || type === null)
    //   return res.send(errorRes(401, "Shift type is required"));
    // if (!timeIn) return res.send(errorRes(401, "timeIn is required"));
    // if (!timeOut) return res.send(errorRes(401, "timeOut is required"));
    // if (!workingHours)
    //   return res.send(errorRes(401, "workingHours is required"));
    // if (!graceTime) return res.send(errorRes(401, "graceTime is required"));

    // Check if shift already exists
    const existingShift = await shiftModel.findOne({ shiftName: shiftName });
    if (existingShift) return res.send(errorRes(401, "Shift Already Exists"));

    // Generate a unique shift ID
    const shiftId = "shift-" + shiftName?.replace(/\s+/g, "-").toLowerCase();

    // Create a new shift
    const newShift = await shiftModel.create({
      _id: shiftId,
      ...req.body,
      shiftName,
      type,
      timeIn,
      timeOut,
      workingHours,
      graceTime: graceTime ?? 0,
      status: status ?? true,
      multiTimeInOut: multiTimeInOut ?? false,
      regularizationDays,
    });

    return res.send(
      successRes(200, "Shift added", {
        data: newShift,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getShiftById = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "Shift ID is required"));

    const shift = await shiftModel.findById(id).populate(shiftPopulateOptions);

    if (!shift) return res.send(errorRes(404, "Shift not found"));

    return res.send(
      successRes(200, "get shift", {
        data: shift,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const deleteShiftById = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) {
      return res.send(errorRes(401, "Shift ID is required"));
    }

    // Find and delete the shift by ID
    const deletedShift = await shiftModel.findByIdAndDelete(id);

    if (!deletedShift) {
      return res.send(errorRes(404, "Shift not found"));
    }

    return res.send(
      successRes(200, "Shift deleted successfully", {
        data: deletedShift,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const editShift = async (req, res, next) => {
  const id = req.params.id;
  const {
    shiftName,
    type,
    timeIn,
    timeOut,
    workingHours,
    graceTime,
    status,
    multiTimeInOut,
    regularizationDays,
  } = req.body;

  try {
    // Validation checks (similar to addShift route)
    if (!shiftName) return res.send(errorRes(401, "Shift Name is required"));
    if (type === undefined || type === null)
      return res.send(errorRes(401, "Shift type is required"));
    if (!timeIn) return res.send(errorRes(401, "timeIn is required"));
    if (!timeOut) return res.send(errorRes(401, "timeOut is required"));
    if (!workingHours)
      return res.send(errorRes(401, "workingHours is required"));
    if (!graceTime) return res.send(errorRes(401, "graceTime is required"));

    // Optionally, check if another shift with the same name already exists (if shiftName should be unique)
    const existingShift = await shiftModel.findOne({ shiftName });
    if (existingShift && existingShift._id !== id) {
      return res.send(errorRes(401, "Shift Name already exists"));
    }

    // Update shift by ID
    const updatedShift = await shiftModel
      .findByIdAndUpdate(
        id,
        {
          shiftName,
          type,
          timeIn,
          timeOut,
          workingHours,
          graceTime,
          status,
          multiTimeInOut,
          regularizationDays,
        },
        { new: true },
      )
      .populate(shiftPopulateOptions);

    if (!updatedShift) {
      return res.send(errorRes(404, "Shift not found"));
    }

    return res.send(
      successRes(200, "Shift updated successfully", { data: updatedShift }),
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const assignShift = async (req, res) => {
  const { shiftId, employeeIds } = req.body;

  if (!shiftId || !employeeIds || !Array.isArray(employeeIds)) {
    return res.json({
      message: "Invalid request data. Shift ID and employee IDs are required.",
    });
  }

  try {
    const shift = await shiftModel
      .findById(shiftId)
      .populate(shiftPopulateOptions);
    if (!shift) {
      return res.json({ message: "Shift not found." });
    }

    const employees = await employeeModel.find({
      _id: { $in: employeeIds },
    });

    if (employees.length !== employeeIds.length) {
      return res.json({
        message: "One or more employee IDs are invalid.",
      });
    }

    shift.employees = [...new Set([...shift.employees, ...employeeIds])];

    await shift.save();

    return res.json({
      message: "Employees assigned to shift successfully.",
      data: shift,
    });
  } catch (error) {
    console.error("Error assigning employees to shift:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Fetch assigned employees for a shift
export const getAssignedEmployees = async (req, res) => {
  const { shiftId } = req.params;

  try {
    const shift = await shiftModel
      .findById(shiftId)
      .populate(shiftPopulateOptions);
    if (!shift) {
      return res.json({ message: "Shift not found." });
    }

    return res.json({
      message: "Assigned employees retrieved successfully.",
      data: shift.employees,
    });
  } catch (error) {
    console.error("Error fetching assigned employees:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Add employees to a shift
export const addEmployeesToShift = async (req, res) => {
  const { shiftId } = req.params;
  const { employeeIds } = req.body;

  if (!Array.isArray(employeeIds)) {
    return res.json({
      message: "Invalid request data. Employee IDs must be an array.",
    });
  }

  try {
    const shift = await shiftModel.findById(shiftId);

    if (!shift) return res.json(errorRes(404, "Shift not found."));

    const updatedShift = await shiftModel
      .findByIdAndUpdate(shiftId, {
        $set: {
          employees: employeeIds,
        },
      })
      .populate(shiftPopulateOptions);

    await Promise.all(
      employeeIds.map(async (eId) => {
        try {
          await shiftInfoModel.updateOne(
            { userId: eId },
            {
              _id: "shift-info-" + eId?.replace(/\s+/g, "-").toLowerCase(),
              shift: shiftId,
            },
            { upsert: true },
          );
        } catch (error) {
          //
        }
      }),
    );

    return res.send(
      successRes(200, "Employees added to shift successfully.", {
        data: updatedShift,
      }),
    );
  } catch (error) {
    console.error("Error adding employees to shift:", error);
    return res.status(500).json(errorRes(500, "Internal server error."));
  }
};

// Remove an employee from a shift
export const removeEmployeeFromShift = async (req, res) => {
  const { shiftId, employeeId } = req.params;

  try {
    const shift = await shiftModel.findById(shiftId);
    if (!shift) {
      return res.json({ message: "Shift not found." });
    }

    const employeeIndex = shift.employees.indexOf(employeeId);
    if (employeeIndex !== -1) {
      shift.employees.splice(employeeIndex, 1);
      await shift.save();
      return res.json({
        message: "Employee removed from shift successfully.",
        data: shift,
      });
    } else {
      return res.json({ message: "Employee not found in this shift." });
    }
  } catch (error) {
    console.error("Error removing employee from shift:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export const addWeekOffAttendance = async (req, res) => {
  try {
    const { month, year } = req.body;

    const shift = await shiftInfoModel
      .findOne({ userId: "ev000-test-dum" })
      .populate(employeeShiftInfoPopulateOptions);

    if (!shift) {
      return errorRes2(res, 400, "Shift not found");
    }

    const weekOffDay = shift.weekOffDay;

    const startOfMonth = moment(`${year}-${month}`)
      .tz("Asia/Kolkata")
      .startOf("month");

    console.log(startOfMonth);

    const endOfMonth = moment(`${year}-${month}`)
      .tz("Asia/Kolkata")
      .endOf("month");

    const dates = [];
    let current = startOfMonth;

    while (current.isSameOrBefore(endOfMonth)) {
      if (current.format("dddd") === weekOffDay) {
        dates.push(current.toDate());
      }
      current.add(1, "day");
    }

    console.log(dates);

    for (const d of dates) {
        const m = moment(d);
      await attendanceModel.create({
        userId: "ev000-test-dum",
        date: d,
        year: year,
        day: d.getDate(),
        month: month,
        wlStatus: "weekoff",
        status: "weekoff",
      });
    }

    return successRes2(res, 200, "Week off attendance added", {
      data: dates,
      length: dates.length,
    });
  } catch (error) {
    console.log(error);
    return errorRes2(res, 500, "server");
  }
};
