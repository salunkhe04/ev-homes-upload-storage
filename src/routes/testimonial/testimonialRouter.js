import { Router } from "express";
import {
  getTestimonial,
  addTestimonial,
  getTestiomonialById,
  addMultipleTestimonial,
  updateLikesOnTestimonial,
  addCommentToTestimonial,
  deleteComment,
  toggleLikeOnComment,
  addReplyToComment,
  deleteReply,
  toggleLikeOnReply,
  incrementViewCount,
  getTestimonialById,
} from "../../controller/testimonial.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const testimonialRouter = Router();
testimonialRouter.get(
  "/testimonial",

  // authenticateToken,

  getTestimonial
);

testimonialRouter.get(
  "/testimonial/:id",

  // authenticateToken,

  getTestimonialById
);

testimonialRouter.post("/add-testimonial", authenticateToken, addTestimonial);

testimonialRouter.post(
  "/add-testimonial-multiple",
  authenticateToken,
  addMultipleTestimonial
);

testimonialRouter.post(
  "/update-likes-testimonial/:id",
  authenticateToken,
  updateLikesOnTestimonial
);

testimonialRouter.post(
  "/testimonials/:id/view",
  authenticateToken,
  incrementViewCount
);

testimonialRouter.get(
  "/testimonial-projects/:projects",
  authenticateToken,
  getTestiomonialById
);

// Comments
testimonialRouter.post("/testimonials/:id/comments", addCommentToTestimonial);
testimonialRouter.delete(
  "/testimonials/:testimonialId/comments/:commentId",
  deleteComment
);
testimonialRouter.put(
  "/testimonials/:testimonialId/comments/:commentId/like",
  toggleLikeOnComment
);

// Replies
testimonialRouter.post(
  "/testimonials/:testimonialId/comments/:commentId/replies",
  addReplyToComment
);
testimonialRouter.delete(
  "/testimonials/:testimonialId/comments/:commentId/replies/:replyId",
  deleteReply
);
testimonialRouter.put(
  "/testimonials/:testimonialId/comments/:commentId/replies/:replyId/like",
  toggleLikeOnReply
);

export default testimonialRouter;
