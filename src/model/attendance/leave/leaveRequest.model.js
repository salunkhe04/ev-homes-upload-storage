import mongoose from "mongoose";

export const leaveRequestSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      ref: "leaveType",
      // enum: [
      //   "compensatory_off",
      //   "paid_leave",
      //   "unpaid_leave",
      //   "sick_leave",
      //   "casual_leave",
      // ],
    },
    appliedOn: {
      type: Date,
      required: true,
    },
    approveOn: {
      type: Date,
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    leaveReason: {
      type: String,
      required: true,
    },
    approveReason: {
      type: String,
      default: null,
    },
    leaveStatus: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    applicant: {
      type: String,
      ref: "employees",
      required: true,
    },
    approveBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    reportingTo: {
      type: String,
      ref: "employees",
      required: true,
    },
    attachedFile: {
      type: String,
      required: false,
    },
    dayType: {
      type: String,
      default: "full-day",
    },
    currentLevel: {
      type: Number,
      default: 0,
    },
    approvalSteps: [
      {
        level: { type: Number, required: true },
        adminId: { type: String, ref: "employees" },
        status: { type: String, default: "pending" },
        approvalDate: { type: Date, default: null },
        remark: {type: String,  default: null},
      },
    ],
  },
  { timestamps: true }
);

const leaveRequestModel = mongoose.model(
  "leaveRequest",
  leaveRequestSchema,
  "leaveRequests"
);
export default leaveRequestModel;
