import mongoose from "mongoose";
export const cpOnBoardingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: Number,
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    firmName: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    zone: {
      type: String,
      default: null,
    },
    homeAddress: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    firmAddress: {
      type: String,
      default: null,
    },
    reraNo: {
      type: String,
      default: null,
    },
    reraCertificate: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    onBoardedBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    channelPartner: {
      type: String,
      ref: "channelPartners",
      default: null,
    },
  },
  { timestamps: true }
);

// Create the model
const CpOnBoardingModel = mongoose.model(
  "CpOnBoarding",
  cpOnBoardingSchema,
  "CpOnBoarding"
);
export default CpOnBoardingModel;
