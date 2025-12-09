import {
  addMeetingRequest,
  getMeetingRequest,
  getMeetinRequestById,
} from "../../controller/meetingRequest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { successRes } from "../../model/response.js";
import { Router } from "express";

const meetingRequestRouter = Router();
meetingRequestRouter.get(
  "/meetingRequest",
  authenticateToken,
  getMeetingRequest
);
meetingRequestRouter.get(
  "/meetingRequest-id/:id",
  authenticateToken,
  getMeetinRequestById
);
meetingRequestRouter.post(
  "/meetingRequest-add",
  authenticateToken,
  addMeetingRequest
);

export default meetingRequestRouter;
