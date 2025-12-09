import mongoose from "mongoose";

export const meetingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  place: {
    type: String,
    ref: "geofence",
    default: null,
  },
  purpose: {
    type: String,
    default: null,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "clients",
    default: null,
  },
  project: {
    type: String,
    default: null,
    ref: "ourProjects",
  },
  meetingWith: {
    type: String,
    default: null,
    ref: "employees",
  },
  customerRemark: {
    type: String,
    default: null,
  },
  summary: {
    type: String,
    default: null,
  },
  meetingRemark: {
    type: String,
    default: null,
  },
  meetingInProgress: {
    type: Boolean,
    default: false,
  },
  meetingEnd: {
    type: Date,
    default: null,
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "lead",
    default: null,
  },
  postSaleBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "postSaleLead",
    default: null,
  },
});

const meetingModel = mongoose.model("meeting", meetingSchema, "meeting");
export default meetingModel;
