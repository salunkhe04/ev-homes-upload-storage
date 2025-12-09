import {
  addMeetingSummary,
  getMeetingSummary,
  getClientMeetingById,
  scheduleMeetingByClient,
} from "../../controller/meetingSummary.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { successRes } from "../../model/response.js";
import { Router } from "express";

const meetingRouter = Router();
meetingRouter.get("/meeting", authenticateToken, getMeetingSummary);
meetingRouter.post("/meeting-add", authenticateToken, addMeetingSummary);
meetingRouter.post(
  "/meeting-add-by-client/:id",
  authenticateToken,
  scheduleMeetingByClient
);
meetingRouter.get(
  "/meeting-client-id/:id",
  authenticateToken,
  getClientMeetingById
);

export default meetingRouter;
