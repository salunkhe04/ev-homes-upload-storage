import { Router } from "express";
import {
  addEmpDocRequest,
  deleteDocReq,
  getEmpDocRequests,
  getEmpDocRequestsbyId,
  getMyEmpRequests,
  onRejectOrApproveDocReq,
} from "../../controller/employeeDocumentRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const empDocReqRouter = Router();

empDocReqRouter.get("/emp-doc-request", authenticateToken, getEmpDocRequests);
empDocReqRouter.post(
  "/add-emp-doc-request",
  authenticateToken,
  addEmpDocRequest
);
empDocReqRouter.get(
  "/emp-request/:id",
  authenticateToken,
  getEmpDocRequestsbyId
);
empDocReqRouter.delete("/delete-request/:id", authenticateToken, deleteDocReq);
empDocReqRouter.get("/emp-my-request/:id", authenticateToken, getMyEmpRequests);

empDocReqRouter.post(
  "/emp-request-approve/:id/:status",
  authenticateToken,
  onRejectOrApproveDocReq
);

export default empDocReqRouter;
