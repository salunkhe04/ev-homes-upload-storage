import mongoose from "mongoose";

export const eligibilityRequestSchema = new mongoose.Schema(
  {
    // id: {
    //   type: String,
    //   default: null,
    // },
    scale: {
      type: String,
      ref: "scale",
    },

    appliedBy: {
      type: String,
      ref: "employees",
      unique: true,
      default: null,
    },
    approvalBy: {
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
    approvalReason: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
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
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "exam",
      default: null,
    },
    scheduleExam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "examAnswer",
      default: null,
    },

    examConductedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: null,
    },
    hasCompliance: {
      type: Boolean,
      default: null,
    },
    attemptsTaken: {
      type: Number,
      default: 0,
    },
    allowedAttempts: {
      type: Number,
      default: 8,
    },
    mockAttempt: {
      type: Number,
      default: 0,
    },
    typeOfAttempt: {
      type: String,
      default: null,
    },
    examAttempts: [
      {
        attemptNumber: { type: Number, default: 0 },
        exam: { type: mongoose.Schema.Types.ObjectId, ref: "exam" },
        examAnswer: { type: mongoose.Schema.Types.ObjectId, ref: "examAnswer" },
        marksObtained: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const eligibilityModel = mongoose.model(
  "eligibilityRequest",
  eligibilityRequestSchema,
  "eligibilityRequest"
);

export default eligibilityModel;
