import mongoose from "mongoose";

export const meetingRequest = new mongoose.Schema(
  {
    teamLeader: {
      type: String,
      ref: "employees",
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "lead",
    },
    date: {
      type: Date,
      default: null,
    },
    upload: {
      type: String,
      default: null,
    },
    bookingStatus: {
      type: String,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    clientFirstName: {
      type: String,
      default: null,
    },
    clientLastName: {
      type: String,
      default: null,
    },
    clientPhone: {
      type: Number,
      default: null, // Use String for phone numbers to handle formats like +91, etc.
    },
    clientEmail: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const meetingRequestModel = mongoose.model(
  "meetingRequest",
  meetingRequest,
  "meetingRequest"
);
export default meetingRequestModel;
