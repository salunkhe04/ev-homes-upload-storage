import mongoose from "mongoose";

const designTaskSchema = new mongoose.Schema(
  {
    assignTo: {
      type: String,
      required: true,
      ref: "employees",
    },
    assignBy: {
      type: String,
      required: true,
      ref: "employees",
    },
    // task details
    title: { type: String, default: "" },
    details: { type: String, default: "" },
    // any images screenshot to explain
    referenceImages: [String],
    //
    assignDate: { type: Date, default: Date.now },
    deadline: { type: Date, default: null },
    //
    completedDate: { type: Date, default: null },
    // main status -
    status: {
      type: String,
      enum: [
        "completed",
        "not-completed",
        "pendency",
        "pendency-rejected",
        "submission-rejected",

        "pendency-request",
        "submission-request",
      ],
      default: "not-completed",
    },
    //
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },

    // approval - pendancy
    pendency: {
      //
      appliedDate: { type: Date, default: null },
      reason: { type: String, default: null },
      status: { type: String, default: null },
      // any images screenshot to explain
      attachments: [String],
      approveBy: { type: String, ref: "employees", default: null },
      approvalDate: { type: Date, default: null },
      approvalReason: { type: String, default: null },
    },
    // approval - complition
    approval: {
      //
      appliedDate: { type: Date, default: null },
      reason: { type: String, default: null },
      status: { type: String, default: null },
      // any images screenshot to explain
      attachments: [String],
      approveBy: { type: String, ref: "employees", default: null },
      approvalDate: { type: Date, default: null },
      approvalReason: { type: String, default: null },
    },

    // for reminder
    reminderDate: { type: Date, default: null },
    reminderDescription: { type: String, default: null },
    // for when what happen in this
    timeline: [{ type: mongoose.Schema.Types.Mixed, default: null }],
  },
  { timestamps: true }
);

const designTaskModel = mongoose.model(
  "designTasks",
  designTaskSchema,
  "designTasks"
);
export default designTaskModel;
