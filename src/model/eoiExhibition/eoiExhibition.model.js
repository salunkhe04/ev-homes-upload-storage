import mongoose from "mongoose";

export const EoiExhibitionSchema = new mongoose.Schema(
  {
    closingManager: {
      type: String,
      ref: "employees",
      default: null,
    },
    project: {
      type: String,
      required: true,
      default: null,
      ref: "ourProjects",
    },

    unitNo: { type: String, required: true, default: null },
    floor: { type: Number, default: null },
    buildingNo: { type: Number, default: null },
    number: { type: Number, default: null },
    eoiAmount: { type: Number, default: null },
    countryCode: { type: String, default: "+91" },

    //applicant 1 details
    phoneNumber: { type: Number, required: true, default: null },

    firstNameApp1: { type: String, default: null },
    lastNameApp1: { type: String, default: null },
    addressApp1: { type: String, default: null },
    cityApp1: { type: String, default: null },
    pincodeApp1: { type: String, default: null },
    emailApp1: {
      type: String,
      default: null,
    },
    aadharNumApp1: { type: Number, default: null },
    panNumApp1: { type: String, default: null },

    //applicant 2 details
    firstNameApp2: { type: String, default: null },
    lastNameApp2: { type: String, default: null },
    addressApp2: { type: String, default: null },
    cityApp2: { type: String, default: null },
    pincodeApp2: { type: String, default: null },
    phoneNumberApp2: { type: Number, default: null },
    emailApp1: {
      type: String,
      default: null,
    },
    aadharNumApp2: { type: Number, default: null },
    panNumApp2: { type: String, default: null },

    isKycReceived: { type: Boolean, default: false },
    physicalEoiUrl: {
      type: String,
      default: null,
    },
    document: {
      type: String,
      default: null,
    },
    entryBy: {
      type: String,
      ref: "employees",
      default: null,
    },
  },

  { timestamps: true }
);

const eoiExhibitionModel = mongoose.model(
  "eoiExhibition",
  EoiExhibitionSchema,
  "eoiExhibition"
);
export default eoiExhibitionModel;
