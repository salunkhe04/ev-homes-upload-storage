import { Router } from "express";
import {
  getLeave,
  addLeave,
  updateLeaveStatus,
  getMyLeave,
  getApplyLeave,
  onRejectOrApproveLeave,
  deleteLeaveRequest,
} from "../../controller/leaveRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const leaveRequestRouter = Router();

leaveRequestRouter.get("/get-my-leave/:id", authenticateToken, getMyLeave);
leaveRequestRouter.get("/get-leave", authenticateToken, getLeave);
leaveRequestRouter.get(
  "/get-reporting-leave/:id",
  authenticateToken,
  getApplyLeave
);
leaveRequestRouter.post("/add-leave", authenticateToken, addLeave);
leaveRequestRouter.post(
  "/update-leave/:id",
  authenticateToken,
  updateLeaveStatus
);

leaveRequestRouter.post(
  "/leave-requests/:id/:status",
  authenticateToken,
  onRejectOrApproveLeave
);

leaveRequestRouter.delete(
  "/leave-requests/:id",
  authenticateToken,
  deleteLeaveRequest
);
export default leaveRequestRouter;
