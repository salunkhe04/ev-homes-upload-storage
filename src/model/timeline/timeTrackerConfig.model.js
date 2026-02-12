import mongoose from "mongoose";

const TimeTrackerConfSchema = new mongoose.Schema(
  {
    agentId: { type: String, default: null },
    userId: { type: String, required: true, index: true, unique: true },
    idleThreshold: { type: Number, default: 120 },
    minuteGap: { type: Number, default: 120 },
    shiftStart: { type: Number, default: 9 }, // 9am
    shiftEnd: { type: Number, default: 23 }, // 11pm
    canTakeBreak: { type: Boolean, default: true },
    canUseMeeting: { type: Boolean, default: true },
    monitorInterval: { type: Number, default: 30 }, // 30 sec
    role: { type: String, default: "user" },
  },
  { timestamps: true },
);

const timeTrackerConfModel = mongoose.model(
  "TimeTrackerConfig",
  TimeTrackerConfSchema,
);
export default timeTrackerConfModel;
