import mongoose from "mongoose";

export const attendanceSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "employees",
    required: true,
  },
  date: {
    type: Date,
    default: null,
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 10,
  },
  status: {
    type: String,
    // enum: [
    //   "absent",
    //   "present",
    //   "weekoff",
    //   "on-leave",
    //   "in-break",
    //   "in-meeting",
    //   "completed",
    // ],
    default: "absent",
  },
  wlStatus: {
    type: String,
    // enum: [
    //   "weekoff",
    //   "on-leave",
    // ],
    default: null,
  },
  checkInTime: {
    type: Date,
    default: null,
  },
  checkInAddress: {
    type: String,
    default: null,
  },
  checkInLatitude: {
    type: Number,
    default: null,
  },
  checkInLongitude: {
    type: Number,
    default: null,
  },
  checkInPhoto: {
    type: String,
    default: null,
  },
  checkOutTime: {
    type: Date,
    default: null,
  },
  checkOutAddress: {
    type: String,
    default: null,
  },
  checkOutLatitude: {
    type: Number,
    default: null,
  },
  checkOutLongitude: {
    type: Number,
    default: null,
  },
  checkOutPhoto: {
    type: String,
    default: null,
  },
  totalActiveSeconds: {
    type: Number,
    default: 0,
  },
  totalBreakSeconds: {
    type: Number,
    default: 0,
  },
  overtimeSeconds: {
    type: Number,
    default: 0,
  },
  overtimeMinutes: {
    type: Number,
    default: 0,
  },
  lateMinutes: {
    type: Number,
    default: 0,
  },
  checkInSimilarity: {
    type: Number,
    default: null,
  },
  checkOutSimilarity: {
    type: Number,
    default: null,
  },

  earlyMinutes: {
    type: Number,
    default: 0,
  },
  leaveDuration: {
    type: Number,
    default: null,
  },

  breakStartTime: {
    type: Date,
    default: null,
  },
  breakEndTime: {
    type: Date,
    default: null,
  },
  lastUpdatedTime: {
    type: Date,
    default: Date.now,
  },
  timeline: [
    {
      event: {
        type: String,
        enum: [
          "check-in",
          "check-out",
          "break-start",
          "break-end",
          "inactive",
          "meeting",
          "manual-entry",
        ],
        required: true,
      },
      timestamp: {
        type: Date,
        required: true,
        default: Date.now,
      },
      timestampEnd: {
        type: Date,
        required: true,
        default: null,
      },
      durationSeconds: {
        type: Number,
        default: null,
      },
      remark: {
        type: String,
        default: null,
      },
      photo: {
        type: String,
        default: null,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },
  ],
});
attendanceSchema.index(
  { userId: 1, day: 1, month: 1, year: 1 },
  { unique: true }
);

const attendanceModel = mongoose.model("Attendance", attendanceSchema);
export default attendanceModel;
