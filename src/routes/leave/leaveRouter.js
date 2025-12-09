import { Router } from "express";
import {
  getLeave,
  getLeaveById,
  addLeave,
  updateLeave,
  deleteLeave,
} from "../../controller/leave.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const levRouter = Router();
levRouter.get("/leave", authenticateToken, getLeave);
levRouter.get("/leave/:id", authenticateToken, getLeaveById);
levRouter.post("/leave-add", authenticateToken, addLeave);
levRouter.post("/leave-update/:id", authenticateToken, updateLeave);
levRouter.delete("/leave/:id", authenticateToken, deleteLeave);

export default levRouter;
