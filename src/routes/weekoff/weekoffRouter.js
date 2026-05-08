import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addweekoff,
  deleteWeekoff,
  getMyWeekOffs,
  getReportingToWeekOffs,
  getWeekOffById,
  getWeekOffs,
  onRejectOrApproveWeekoff,
  updateStartOftheWeek,
  updateWeekOffStatus,
  updateWeekoffApproval,
} from "../../controller/weekoff.controller.js";
import { getWeek } from "date-fns";
const weekoffRouter = Router();
// weekoffRouter.get("/weekoff",authenticateToken,getweekoff);
weekoffRouter.post("/add-weekoff", authenticateToken, addweekoff);

weekoffRouter.get("/get-weekoff", authenticateToken, getWeekOffs);

weekoffRouter.get("/get-my-weekoff/:id", authenticateToken, getMyWeekOffs);

weekoffRouter.get(
  "/get-reporting-weekoff/:id",
  authenticateToken,
  getReportingToWeekOffs
);
weekoffRouter.get("/get-weekoff/:id", authenticateToken, getWeekOffById);

weekoffRouter.post("/weekoff/:id", authenticateToken, updateWeekOffStatus);

weekoffRouter.post(
  "/weekoff-update-approval/:id",
  authenticateToken,
  updateWeekoffApproval
);

//approve or reject weekoff
weekoffRouter.post(
  "/weekoff-requests/:id/:status",
  // authenticateToken,

  onRejectOrApproveWeekoff
);

weekoffRouter.post(
  "/weekoff-requests-add-start-of-week",
  authenticateToken,
  updateStartOftheWeek
);

weekoffRouter.delete("/weekoff-requests/:id", authenticateToken, deleteWeekoff);

export default weekoffRouter;
