import { response } from "express";
import mongoose from "mongoose";

export const feedbackEnquirySchema = new mongoose.Schema(
  {
    date: { type: Date, default: null },
    enquiryabout: {
      type: String,
      default: "Enquiry About",
    },
    leads: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "lead",
    },
    channelPartner: {
      type: String,
      default: null,
      ref: "channelPartners",
    },
    response: {
      type: String,
      default: null,
    },
    employees: {
      type: String,
      ref: "employees",
    },
  },
  { timestamps: true }
);

const feedbackEnquiryModel = mongoose.model(
  "feedbackenquiry",
  feedbackEnquirySchema,
  "feedbackenquiry"
);

export default feedbackEnquiryModel;
