import mongoose from "mongoose";
export const appDevTaskSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      default: null,
    },
    assignBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    deadlineDate: {
      type: Date,
      default: null,
    },
    taskSub: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    assignTo: {
      type: String,
      ref: "employees",
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    remark: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const appDevModel = mongoose.model(
  "appDevTask",
  appDevTaskSchema,
  "appDevTask"
);

export default appDevModel;
