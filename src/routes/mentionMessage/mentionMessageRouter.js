import { Router } from "express";
import {
  createNewMessage,
  getMentionedMessages,
  markAllMessagesAsSeen,
  markMessageAsSeen,
} from "../../controller/mentionMessages.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const mentionMessageRouter = Router();

// get messages
mentionMessageRouter.get(
  "/mentioned-messages",
  authenticateToken,
  getMentionedMessages
);

//add new message
mentionMessageRouter.post(
  "/add-mentioned-message",
  authenticateToken,
  createNewMessage
);

//mark as seen
mentionMessageRouter.patch(
  "/mark-seen-mentioned-message",
  authenticateToken,
  markMessageAsSeen
);

//mark as seen for that lead
mentionMessageRouter.patch(
  "/mark-seen-all-mentioned-message",
  authenticateToken,
  markAllMessagesAsSeen
);

export default mentionMessageRouter;
