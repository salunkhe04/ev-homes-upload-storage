import mongoose from "mongoose";
export const assetRequestSchema = new mongoose.Schema(
  {
    assetRequestDate: {
      type: Date,
    },
    appliedOn: {
      type: Date,
      required: true,
    },
    accessory: {
      type: String,
      required: true,
      ref: "accessory",
    },
    quantity: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    attachment: {
      type: String,
      default: null,
    },

    aproveReason: {
      type: String,
      default: "pending",
    },
    assetRequestStatus: {
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
    // attendance: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Attendance",
    //   default: null,
    // },
    // adminId: {
    //    type: String,
    //    ref: "employees",
    //    default: null
    //  },
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

const assetRequestModel = mongoose.model(
  "assetRequest",
  assetRequestSchema,
  "assetRequest"
);

export default assetRequestModel;
