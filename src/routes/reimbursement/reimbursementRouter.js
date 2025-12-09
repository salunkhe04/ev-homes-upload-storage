import { Router } from "express";
import {
  addReimbursement,
  getMyReimbursement,
  getReimbursement,
  getReimbursementById,
  getReportingToReimbursement,
  updateReimbursementStatus,
  onRejectOrApproveReimbursement,
  deleteReimbursement,
} from "../../controller/reimbursement.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const reimbursementRouter = Router();
reimbursementRouter.get(
  "/get-reimbursement",
  authenticateToken,
  getReimbursement
);
reimbursementRouter.get(
  "/get-reimbursement-id/:id",
  authenticateToken,
  getMyReimbursement
);
reimbursementRouter.get(
  "/get-reporting-reimbursement-id/:id",
  authenticateToken,
  getReportingToReimbursement
);
reimbursementRouter.get(
  "/get-reimbursement-by-id/:id",
  authenticateToken,
  getReimbursementById
);
reimbursementRouter.post(
  "/add-reimbursement",
  authenticateToken,
  addReimbursement
);
reimbursementRouter.post(
  "/update-reimbursement/:id",
  authenticateToken,
  updateReimbursementStatus
);
reimbursementRouter.post(
  "/reimbursement-requests/:id/:status",
  authenticateToken,
  authenticateToken,
  onRejectOrApproveReimbursement
);
reimbursementRouter.delete(
  "/reimbursement/:id",
  authenticateToken,
  authenticateToken,
  deleteReimbursement
);

export default reimbursementRouter;
