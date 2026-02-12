import mongoose from "mongoose";

const TimelineActivitySchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true, unique: true },
    userId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    // Manual intent (tray)
    mode: String,
    activity: String,
    process: String,
    title: String,
    screenshotUrl: String,
    webcamUrl: String,
  },
  { timestamps: true },
);

const timeTrackerActivityModel = mongoose.model(
  "TimeTrackerActivity",
  TimelineActivitySchema,
);
export default timeTrackerActivityModel;
