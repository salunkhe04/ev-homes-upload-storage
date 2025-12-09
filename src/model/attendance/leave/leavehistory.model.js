import mongoose from "mongoose";

export const leaveHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "employees",
      default: null,
    },
    leaveType: {
      type: String,
      default: null,
    },
    deposittype: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: null,
    },
    count: {
      type: Number,
      default: null,
    },
    howManyBefore: {
      type: Number,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    validTill: {
      type: Date,
      default: null,
    },
    usedOn: {
      type: String,
      default: null,
    },
    adminId: {
      type: String,
      ref: "employees",
      default: null,
    },
    leave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "leaveRequest",
      default: null,
    },
    regularization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "regularization",
      default: null,
    },
  },
  { timestamps: true }
);

const leaveHistoryModel = mongoose.model(
  "leaveHistory",
  leaveHistorySchema,
  "leaveHistory"
);
export default leaveHistoryModel;
