import mongoose from "mongoose";
export const weekoffSchema = new mongoose.Schema(
  {
    startOfWeek: {
      type: Date,
      default: null,
    },
    weekoffDate: {
      type: Date,
      required: true,
    },
    appliedOn: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "weekoff",
    },
    aproveReason: {
      type: String,
      default: "pending",
    },
    weekoffStatus: {
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
  },
  { timestamps: true }
);

const weekoffModel = mongoose.model("weekoff", weekoffSchema, "weekoff");
export default weekoffModel;
