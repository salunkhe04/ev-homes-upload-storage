import mongoose from "mongoose";

export const passbackEstimateSchema = new mongoose.Schema(
  {
    estimate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "estimateGenerated",
      default: null,

    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
      default: null,
    },
    requestedBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    requestStatus: {
      type: String,
      default: "pending",
      
    },
    requestDate: {
      type: Date,
      default: null,
    },
    requestRemark: {
      type: String,
      default: null,
    },
    allInclusiveAmt: {
      type: Number,
      default: null,
    },
    disAllInclusiveAmt: {
      type: Number,
      default: null,
    },
    stampDutyAmt: {
      type: Number,
      default: null,
    },
    gstAmt: {
      type: Number,
      default: null,
    },
    totalPayableAmt: {
      type: Number,
      default: null,
    },
    channelPartner: {
      type: String,
      default: null,
      ref: "channelPartners",
    },
    cpApprovedDate: {
      type: Date,
      default: null,
    },
    cpRemark: {
      type: String,
      default: null,
    },
    customerExpectedAmt: {
      type: Number,
      default: null,
    },
    brokPercent: {
      type: Number,
      default: null,
    },
   
  },
  { timestamps: true }
);

const passbackEstimateModel = mongoose.model(
  "passbackEstimate",
  passbackEstimateSchema,
  "passbackEstimate"
);
export default passbackEstimateModel;
