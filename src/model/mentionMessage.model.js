import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
      required: true,
    },
    message: {
      type: String,
      default: null,
    },
    mentioned: [
      {
        employee: {
          type: String,
          ref: "employees",
          required: true,
        },
        taggedBy: {
          type: String,
          ref: "employees",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
    seenBy: [
      {
        employee: {
          type: String,
          ref: "employees",
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sentBy: {
      type: String,
      ref: "employees",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

messageSchema.index({ leadId: 1, timestamp: -1 });

const messageModel = mongoose.model(
  "mentions",
  messageSchema,
  "mentionMessages"
);
export default messageModel;
