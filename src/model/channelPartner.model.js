import mongoose from "mongoose";
const dateOfBirthFormat = /^\d{4}-\d{2}-\d{2}$/;
const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const channelPartnerSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    // personal details
    email: {
      type: String,
      unique: true,
    },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },

    gender: {
      type: String,
      default: "male",
      enum: ["male", "female", "other"],
      message: "Gender must be either male, female, or other.",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },
    countryCode: { type: String, default: "+91" },
    phoneNumber: { type: Number, default: null },
    homeAddress: { type: String, default: null },

    // hmm
    sameAdress: { type: Boolean, default: false },

    // org details
    orgType: { type: String, default: null },
    firmName: { type: String, required: true, default: null },
    firmAddress: { type: String, default: null },
    haveReraRegistration: { type: Boolean, default: false },
    reraNumber: { type: String, default: null },

    // document
    reraCertificate: { type: String, default: null },

    // verification
    isVerified: { type: Boolean, default: false },
    isVerifiedPhone: { type: Boolean, default: false },
    isVerifiedEmail: { type: Boolean, default: false },

    // main**
    maritalStatus: { type: String, default: null },
    onBoarding: { type: String, default: null },
    refreshToken: { type: String, default: null },
    role: {
      type: String,
      default: "channel-partner",
      enum: ["employee", "channel-partner", "customer"],
    },
    profilePic: {
      type: String,
      default: null,
    },
    onBoardingApproval: {
      type: String,
      default: null,
    },
    onBoardingApprovalRemark: {
      type: String,
      default: null,
    },

    onBoardingApprovalDate: {
      type: Date,
      default: null,
    },
    onBoardingDate: {
      type: Date,
      default: null,
    },

    // documents
    documents: [
      {
        type: { type: String, default: null, unique: true },
        number: { type: String, default: null },
        name: { type: String, default: null },
        file: { type: String, default: null },
      },
    ],

    status: {
      type: String,
      default: "active",
    },
    brevoId: {
      type: Number,
    },
  },
  { timestamps: true }
);

const cpModel = mongoose.model(
  "channelPartners",
  channelPartnerSchema,
  "channelPartners"
);
export default cpModel;
