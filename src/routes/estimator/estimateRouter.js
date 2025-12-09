import { Router } from "express";
import {
  createEstimate,
  getEstimatesByTeamLeader,
  updateTeamLeaderCount,
} from "../../controller/estimator.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const estimateRouter = Router();
estimateRouter.get(
  "/estimate-tl/:id",
  authenticateToken,
  getEstimatesByTeamLeader
);
estimateRouter.get(
  "/update-estimate-tl/:id",
  authenticateToken,
  updateTeamLeaderCount
);

estimateRouter.post("/estimate", authenticateToken, createEstimate);
export default estimateRouter;
