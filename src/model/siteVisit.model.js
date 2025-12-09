import mongoose from "mongoose";
const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const siteVisitSchema = new mongoose.Schema(
  {
    visitType: { type: String, default: "visit" },
    firstName: { type: String, required: true, default: null },
    lastName: { type: String, required: true, default: null },
    verified: { type: Boolean, default: false },
    namePrefix: { type: String, default: "Mr" },
    gender: { type: String, default: "male" },
    phoneNumber: { type: Number, required: true, default: 0 },
    altPhoneNumber: { type: Number, default: null },
    date: { type: Date, default: Date.now },
    countryCode: { type: String, default: "+91" },
    email: {
      type: String,
      default: null,
    },
    residence: { type: String, default: null },
    location: {
      type: String,
      ref: "ourProjects",
      default: null,
    },
    projects: [
      {
        type: String,
        ref: "ourProjects",
      },
    ],
    choiceApt: [
      {
        type: String,
      },
    ],
    source: {
      type: String,
      default: null,
    },
    reference: {
      type: String,
      ref: "reference",
      default: null,
    },
    channelPartner: {
      type: String,
      ref: "channelPartners",
      default: null,
    },
    cpfeedback: {
      type: String,
      default: "",
    },
    cpfeedbackPendingEmailSent: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
      default: "",
    },
    closingManager: {
      type: String,
      ref: "employees",
      default: null,
    },
    callBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    entryBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    attendedBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    closingTeam: [
      {
        type: String,
        ref: "employees",
        default: null,
      },
    ],
    dataEntryBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
      default: null,
    },
    dataAnalyzer: {
      type: String,
      ref: "employees",
      default: null,
    },
    approvalStatus: {
      type: String,
      default: null,
    },
    approvalRemark: {
      type: String,
      default: null,
    },
    approveBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    approvalDate: {
      type: Date,
      default: Date.now,
    },
    virtualMeetingDoc: {
      type: String,
      default: null,
    },
    createdThrough: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    propertyType: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const siteVisitModel = mongoose.model(
  "siteVisits",
  siteVisitSchema,
  "siteVisits"
);
export default siteVisitModel;
