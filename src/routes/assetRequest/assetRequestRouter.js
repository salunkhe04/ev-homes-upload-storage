import { Router } from "express";
import {
  addassetRequest,
  getMyassetRequest,
  getassetRequest,
  getassetRequestById,
  getReportingToassetRequest,
  updateassetRequestStatus,
  onRejectOrApproveassetRequest,
  deleteassetRequest,
} from "../../controller/assetRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const assetRequestRouter = Router();
assetRequestRouter.get("/get-assetRequest", authenticateToken, getassetRequest);
assetRequestRouter.get(
  "/get-assetRequest-id/:id",
  authenticateToken,
  getMyassetRequest
);
assetRequestRouter.get(
  "/get-reporting-assetRequest-id/:id",
  authenticateToken,
  getReportingToassetRequest
);
assetRequestRouter.get(
  "/get-assetRequest-by-id/:id",
  authenticateToken,
  getassetRequestById
);
assetRequestRouter.post(
  "/add-assetRequest",
  authenticateToken,
  addassetRequest
);
assetRequestRouter.post(
  "/update-assetRequest/:id",
  authenticateToken,
  updateassetRequestStatus
);
assetRequestRouter.post(
  "/assetRequest-requests/:id/:status",
  authenticateToken,
  onRejectOrApproveassetRequest
);
assetRequestRouter.delete(
  "/assetRequest/:id",
  authenticateToken,
  deleteassetRequest
);

export default assetRequestRouter;
