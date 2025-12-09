//TODO: faceIds model
import mongoose from "mongoose";
export const faceIdSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      ref: "employees",
    },
    faceId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      default: "pending-approval",
    },
    preLoadedFace: {
      type: String,
      default: null,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    approveBy: {
      type: String,
      ref: "employees",
      default: null,
    },

    approvalRemark: {
      type: String,
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const faceIdModel = mongoose.model("faceId", faceIdSchema, "faceIds");
export default faceIdModel;
