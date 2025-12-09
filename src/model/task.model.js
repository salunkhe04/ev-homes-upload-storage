import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
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
    assignDate: { type: Date, default: Date.now() },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "lead",
    },
    visit: {
      type: String,
      default: null,
      ref: "siteVisits",
    },
    booking: {
      type: String,
      default: null,
      ref: "postSaleLead",
    },
    name: { type: String, default: "" },
    details: { type: String, default: "" },
    remark: { type: String, default: "" },
    type: { type: String, required: true, default: null },
    completed: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    completedDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    reminderDate: { type: Date, default: null },
    // for reminder due etc
    reminderDueDate: { type: Date, default: null },
    reminderCompleted: { type: Boolean, default: false },
    //
    remindMe: { type: Boolean, default: false },
    reminderType: { type: String, default: null },
    reminderDescription: { type: String, default: null },
    //
    transferTaskFrom: { type: String, ref: "employees" },
    transferReason: { type: String, default: null },
    transferDate: { type: Date, default: Date.now() },
    //
    feedbackPendingEmailSent: { type: Boolean, default: false },
    //denormalized lead
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    phoneNumber: { type: Number, default: null },
    cycleDate: { type: Date, default: null },
    timeLine: [
      {
        assignTo: { type: String, ref: "employees" },
        assignBy: { type: String, ref: "employees" },
        transferTaskFrom: { type: String, ref: "employees" },
        completed: { type: Boolean, default: false },
        completedDate: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);

const taskModel = mongoose.model("task", taskSchema, "tasks");
export default taskModel;
