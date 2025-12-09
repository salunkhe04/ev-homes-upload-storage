import express from "express";
import {
  addAttendanceStatus,
  deleteAttendanceStatus,
  editAttendanceStatus,
  getAttendanceStatus,
} from "../../controller/attendanceStatus.controller.js";

const attendanceStatusRouter = express.Router();

//get list
attendanceStatusRouter.get("/attendance-status", getAttendanceStatus);

//add
attendanceStatusRouter.post("/attendance-status", addAttendanceStatus);

//edit
attendanceStatusRouter.post("/attendance-status/:id", editAttendanceStatus);

//delete
attendanceStatusRouter.delete("/attendance-status/:id", deleteAttendanceStatus);

export default attendanceStatusRouter;
