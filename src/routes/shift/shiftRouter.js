import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addShift,
  getShiftById,
  getShifts,
  deleteShiftById,
  editShift,
  assignShift,
  getAssignedEmployees,
  addEmployeesToShift,
  removeEmployeeFromShift,
  addWeekOffAttendance,
} from "../../controller/shift.controller.js";
const shiftRouter = Router();

shiftRouter.get("/shifts", authenticateToken, getShifts);
shiftRouter.post("/add-shift", authenticateToken, addShift);
shiftRouter.get("/shift/:id", authenticateToken, getShiftById);
shiftRouter.delete("/shift/:id", authenticateToken, deleteShiftById);
shiftRouter.post("/shift-update/:id", authenticateToken, editShift);
shiftRouter.post("/assign-employees-to-shift", authenticateToken, assignShift);
shiftRouter.get("/shift-assigned/:id", authenticateToken, getAssignedEmployees);

shiftRouter.post(
  "/shift/:shiftId/add-employees",
  authenticateToken,
  addEmployeesToShift,
);
shiftRouter.delete(
  "/shift/:shiftId/remove-employee/:employeeId",
  authenticateToken,
  removeEmployeeFromShift,
);

shiftRouter.post("/weekoff-attendance", addWeekOffAttendance);

export default shiftRouter;
