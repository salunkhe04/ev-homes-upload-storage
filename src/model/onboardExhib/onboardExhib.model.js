import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema({
  caller: {
    type: String,
    ref: "employees",
    // required: true,
  },
  callDate: {
    type: Date,
    default: Date.now,
  },
  document: {
    type: String,
    default: null,
  },
  // feedback
  feedback: {
    type: String,
    default: null,
  },
  // lead stage -> / Just-curious /in-progress/supposed-to-visit/visit-done/revisit-done/booked/lost
  stage: {
    type: String,
    default: null,
  },
  // client status -> /interested/not-interested/DND/Moderate
  interestedStatus: {
    type: String,
    default: null,
  },
  // cold / warm / hot
  tag: {
    type: String,
    default: null,
  },
  interestedVisit: {
    type: Boolean,
    default: null,
  },
  reminderType: {
    type: String,
    default: null,
  },
});

const attendedSchema = new mongoose.Schema({
  attendedBy: {
    type: String,
    ref: "employees",
    // required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },

  feedback: {
    type: String,
    default: null,
  },
});

export const onboardSchemaIndex = new mongoose.Schema(
  {
    id: { type: Number, default: null },
    name: { type: String, required: true },
    phoneNumber: { type: Number, default: null },
    altPhoneNumber: { type: Number, default: null },
    email: { type: String, default: null },
    address: { type: String, default: null },
    linkdinUrl: { type: String, default: null },
    linkdinPhoto: { type: String, default: null },
    trueCallerPhoto: { type: String, default: null },
    feedback: { type: String, default: null },
    feedback2: { type: String, default: null },
    entered: { type: Boolean, default: null },
    closingManager: { type: String, ref: "employees", default: null },
    projects: [{ type: String, ref: "ourProjects", default: null }],
    requirements: [{ type: String, default: null }],
    callHistory: [callHistorySchema],
    attendedHistory:[attendedSchema],
  },
  { timestamps: true },
);

const onboarExhibModel = mongoose.model("onboardExhib", onboardSchemaIndex);

export default onboarExhibModel;
