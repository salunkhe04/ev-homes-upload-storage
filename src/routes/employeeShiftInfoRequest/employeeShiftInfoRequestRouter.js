import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addShiftInfoRequest,
  getShiftInfosRequest,
  getShiftInfoRequestById,
} from "../../controller/employeeShiftInfoRequest.controller.js";
import employeeShiftInfoRequestModel from "../../model/attendance/shift/employeeShiftInfoRequest.model.js";

const shiftInfoRequestRouter = Router();
shiftInfoRequestRouter.get(
  "/shift-infos-request",
  authenticateToken,
  getShiftInfosRequest
);
shiftInfoRequestRouter.post(
  "/add-shift-info-request",
  authenticateToken,
  addShiftInfoRequest
);
shiftInfoRequestRouter.get(
  "/shift-infos-request/:id",
  authenticateToken,
  getShiftInfoRequestById
);

export default shiftInfoRequestRouter;
