import mongoose from "mongoose";

export const ourProjectsSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    showCaseImage: { type: String, required: true },
    logo: { type: String, default: null },
    shareLink: { type: String, default: null },
    shortCode: { type: String, default: null },
    carouselImages: [{ type: String, required: true }],
    flatList: [
      {
        type: { type: String, default: null },
        floor: { type: Number, default: null },
        number: { type: Number, default: null },
        flatNo: { type: String, default: null },
        configuration: { type: String, default: null },
        carpetArea: { type: Number, default: null },
        sellableCarpetArea: { type: Number, default: null },
        allInclusiveValue: { type: Number, default: null },
        occupied: { type: Boolean, default: false },
        hold: { type: Boolean, default: false },
        // available: { type: Boolean, default: true },
        occupiedBy: { type: String, default: null },
        buildingNo: { type: Number, default: null },

        ssArea: { type: Number, default: null },
        reraArea: { type: Number, default: null },
        balconyArea: { type: Number, default: null },

        msp1: { type: Number, default: 0 },
        msp2: { type: Number, default: 0 },
        msp3: { type: Number, default: 0 },
        incentive: { type: Number, default: 0 },
        floorPlan: { type: String, default: null },
      },
    ],
    parkingList: [
      {
        floor: { type: Number, default: null },
        floorName: { type: String, default: null },
        number: { type: Number, default: null },
        parkingNo: { type: String, default: null },
        occupied: { type: Boolean, default: false },
        occupiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "postSaleLead",
          default: null,
        },
      },
    ],
    contactNumber: { type: Number, default: null },
    countryCode: { type: String, default: "+91" },
    locationLink: { type: String, default: null },
    locationName: { type: String, required: true, default: null },
    brochure: { type: String, default: null },
    webhookZappier: { type: String, default: null },
    govAccount: {
      accountNo: { type: String, default: null },
      ifsc: { type: String, default: null },
      micr: { type: String, default: null },
      bankName: { type: String, default: null },
      branch: { type: String, default: null },
    },
    businessAccount: {
      accountNo: { type: String, default: null },
      ifsc: { type: String, default: null },
      micr: { type: String, default: null },
      bankName: { type: String, default: null },
      branch: { type: String, default: null },
    },
    amenities: [
      {
        image: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],
    configurations: [
      {
        carpetArea: { type: String, required: true },
        configuration: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        reraId: { type: String, required: true },
      },
    ],
  },
  { strict: false }
);
const ourProjectModel = mongoose.model(
  "ourProjects",
  ourProjectsSchema,
  "ourProjects"
);
export default ourProjectModel;
