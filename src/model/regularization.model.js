import mongoose from "mongoose";
export const regularizationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    regularizationDate: {
      type: Date,
    },
    appliedOn: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      required: true,
    },
    approveReason: {
      type: String,
      default: "pending",
    },
    regularizationStatus: {
      type: String,
      default: "pending",
    },
    applyBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    reportingTo: {
      type: String,
      ref: "employees",
      default: null,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
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
        remark: { type: String, default: null },
      },
    ],
    attachment: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const regularizationModel = mongoose.model(
  "regularization",
  regularizationSchema,
  "regularization"
);

export default regularizationModel;
