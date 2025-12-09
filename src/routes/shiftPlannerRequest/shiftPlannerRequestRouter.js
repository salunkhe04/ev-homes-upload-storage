import { Router } from "express";
import {
  delteShiftPlanner,
  getPlannerRequestsByAppliedBy,
  getPlannerRequestsByAppliedByApproved,
  getReportingToShiftPlanner,
  getShiftPByMultiDays,
  getShiftPlannerByDate,
  getShiftPlannerRequests,
  planShift,
  updateShiftPlanApproval,
} from "../../controller/shiftPlannerRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const shiftPlannerRequest = Router();

shiftPlannerRequest.get(
  "/shift-planner",
  authenticateToken,
  getShiftPlannerRequests
);
shiftPlannerRequest.get(
  "/planner-request-by-id/:id",
  authenticateToken,
  getPlannerRequestsByAppliedBy
);
shiftPlannerRequest.get(
  "/planner-request-by-approved/:id",
  authenticateToken,
  getPlannerRequestsByAppliedByApproved
);
shiftPlannerRequest.get(
  "/planner-request-by-date/:id",
  authenticateToken,
  getShiftPlannerByDate
);
shiftPlannerRequest.get(
  "/planner-request-by-applied/:id",
  authenticateToken,
  getShiftPByMultiDays
);

shiftPlannerRequest.get(
  "/shift-planner-reporting/:id",
  authenticateToken,
  getReportingToShiftPlanner
);
shiftPlannerRequest.post(
  "/update-approval-status/:id/:status",
  authenticateToken,
  updateShiftPlanApproval
);
shiftPlannerRequest.post(
  "/add-shift-request/:id",
  authenticateToken,
  planShift
);
shiftPlannerRequest.delete(
  "/delete-shift-request/:id",
  authenticateToken,
  delteShiftPlanner
);

export default shiftPlannerRequest;
