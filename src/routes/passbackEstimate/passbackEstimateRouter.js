import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addPassbackEstimate,
  getByChannelPartner,
  getPassbackEstimate,
  getPassbackEstimateById,
  getPassEstimateByLead,
  updatePassbackStatus,
} from "../../controller/passbackEstimate.controller.js";

const passbackEstimateRouter = Router();

passbackEstimateRouter.get("/passback", authenticateToken, getPassbackEstimate);
passbackEstimateRouter.get(
  "/passback-id/:id",
  authenticateToken,
  getPassbackEstimateById
);
passbackEstimateRouter.post(
  "/passback-add",
  authenticateToken,
  addPassbackEstimate
);
passbackEstimateRouter.post(
  "/passback-update/:id/:requestStatus",
  authenticateToken,
  updatePassbackStatus
);
passbackEstimateRouter.get(
  "/passback-cp/:id",
  authenticateToken,
  getByChannelPartner
);
passbackEstimateRouter.get(
  "/passback-lead/:id",
  authenticateToken,
  getPassEstimateByLead
);

export default passbackEstimateRouter;
