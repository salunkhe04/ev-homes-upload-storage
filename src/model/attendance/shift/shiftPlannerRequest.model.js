import mongoose from "mongoose";

export const shiftPlannerSchema = new mongoose.Schema(
  {
    appliedBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    appliedDate: {
      type: Date,
      default: null,
    },
    approvedDate: {
      type: Date,
      default: null,
    },
   requestStatus: {
      type: String,
      default: null,
    },

    requestedShift: {
      type: String,
      ref: "Shift",
    },
    requestedShiftDate: {
      type: Date,
      default: null,
    },
    requestedShiftEndDate:{
      type:Date,
      default:null,
    },
        numberOfDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    approveBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    approvalReason: {
      type: String,
      default: null,
    },
    reportingTo: {
      type: String,
      ref: "employees",
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

const shiftPlannerModel = mongoose.model(
  "shiftPlanner",
  shiftPlannerSchema,
  "shiftPlanner"
);
export default shiftPlannerModel;
