import mongoose from "mongoose";

const TimelineSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },

    // 🔑 Idempotency key from agent
    blockUid: { type: String, required: true },

    start: { type: Date, required: true },
    end: { type: Date, required: true },

    state: {
      type: String,
      enum: ["WORK", "IDLE", "MEETING", "BREAK"],
      required: true,
    },

    // Manual intent (tray)
    mode: {
      type: String,
      enum: ["WORK", "MEETING", "BREAK"],
      default: "WORK",
    },

    process: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },

    duration: { type: Number, required: true },
    approved: { type: String, default: null },
    remark: {
      type: String,
      default: null,
    },

    approvedBy: {
      type: String, // managerId
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },

    applyDate: {
      type: Date,
      default: null,
    },

    approvalRemark: {
      type: String,
      default: null,
    },
    approvalSync: {
      type: Boolean,
      default: null,
    },
  },
  { timestamps: true },
);

// ✅ Correct idempotency guarantee
TimelineSchema.index({ agentId: 1, blockUid: 1 }, { unique: true });

const timelineTracker = mongoose.model("TrackerTimeline", TimelineSchema);
export default timelineTracker;
