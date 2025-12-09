import { Router } from "express";
import {
  addFeedbackEnquiry,
  getFeedbackEnquiry,
  getFeedbackEnquiryById,
} from "../../controller/feedbackEnquiry.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const feedbackEnquiryRouter = Router();
feedbackEnquiryRouter.get(
  "/feedback-enquiry",
  authenticateToken,
  getFeedbackEnquiry
);

feedbackEnquiryRouter.get(
  "/feedback-enquiry-id/:id",
  authenticateToken,
  getFeedbackEnquiryById
);

feedbackEnquiryRouter.post(
  "/feedback-enquiry-add/:id",
  authenticateToken,
  addFeedbackEnquiry
);

export default feedbackEnquiryRouter;
