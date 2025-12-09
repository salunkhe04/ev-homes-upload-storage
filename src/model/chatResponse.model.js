import mongoose from "mongoose";

const chatResponseSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    type: { type: String, default: null },
    isBot: { type: Boolean, default: true },
    message: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    email: { type: String, default: null },
    response: { type: mongoose.Schema.Types.Mixed, default: null },
    options: [{ type: mongoose.Schema.Types.Mixed, default: null }],
  },
  { timestamps: true }
);

const ChatResponseModel = mongoose.model(
  "ChatResponse",
  chatResponseSchema,
  "chatResponse"
);
export default ChatResponseModel;
