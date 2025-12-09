import { Router } from "express";
import {
  addEligibilityRequest,
  deleteEligibilityRequest,
  deleteEligibiltyRequestById,
  getEligibiltyRequest,
  getEligibiltyRequestById,
  getEligibleCriteria,
  getRequestByAppliedBy,
  updateEligibilityApproval,
  updateExamStatus,
} from "../../controller/eligibilityRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const eligibilityRouter = Router();

eligibilityRouter.get("/eligibility", authenticateToken, getEligibiltyRequest);
eligibilityRouter.get(
  "/eligibility/:id",
  authenticateToken,
  getEligibiltyRequestById
);

eligibilityRouter.get(
  "/eligibility-request/:id",
  authenticateToken,
  getEligibleCriteria
);

eligibilityRouter.post(
  "/add-eligibility-request",
  authenticateToken,
  addEligibilityRequest
);
eligibilityRouter.post(
  "/update-eligibility/:id/:status",
  authenticateToken,
  updateEligibilityApproval
);

eligibilityRouter.get(
  "/get-applied-eligibility/:id",
  authenticateToken,
  getRequestByAppliedBy
);

eligibilityRouter.delete(
  "/delete-eligibility-request/:id",
  authenticateToken,
  deleteEligibilityRequest
);
eligibilityRouter.delete(
  "/eligibility-request/:id",
  authenticateToken,
  deleteEligibiltyRequestById
);

eligibilityRouter.post(
  "/update-exam-status/:id/:status",
  authenticateToken,
  updateExamStatus
);

export default eligibilityRouter;
