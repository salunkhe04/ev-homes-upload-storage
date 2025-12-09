import { Router } from "express";
import {
  addRegularization,
  getMyRegularization,
  getRegularization,
  getRegularizationById,
  getReportingToRegularization,
  updateRegularizationApproval,
  deleteRegularization,
} from "../../controller/regularization.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const regularizationRouter = Router();
regularizationRouter.get(
  "/get-regularization",
  authenticateToken,
  getRegularization
);
regularizationRouter.post(
  "/add-regularization",
  authenticateToken,
  addRegularization
);
regularizationRouter.get(
  "/get-regularization-id/:id",
  authenticateToken,
  getRegularizationById
);

regularizationRouter.get(
  "/get-my-regularization/:id",
  authenticateToken,
  getMyRegularization
);
//what

regularizationRouter.get(
  "/get-reporting-regularization/:id",
  authenticateToken,
  getReportingToRegularization
);

regularizationRouter.post(
  "/update-regularization-approval/:id",
  authenticateToken,
  updateRegularizationApproval
);

regularizationRouter.delete(
  "/regularization/:id",
  authenticateToken,
  deleteRegularization
);

export default regularizationRouter;
