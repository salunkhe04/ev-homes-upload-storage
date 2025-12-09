import mongoose from "mongoose";

const BrokerageCalculationSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    brokerageId: { type: String, required: true, unique: true },
    phone: { type: Number, required: true },
    project: { type: String, ref: "ourProjects", default: null },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
      default: null,
    },
    channelPartner: {
      type: String,
      ref: "channelPartners",
      default: null,
    },
    generatedBy: {
      type: String,
      ref: "employees",
      default: null,
    },

    selectedFlat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
    },
    pdf: { type: String, default: null },
    flatNo: { type: String, default: null },
    floor: { type: Number, default: null },
    buildingNo: { type: Number, default: null },
    number: { type: Number, default: null },

    carpetArea: { type: Number, default: null },
    sellableCarpetArea: { type: Number, default: null },

    totalParking: { type: Number, default: null },
    parkingPrice: { type: Number, default: null },
    developmentPrice: { type: Number, default: null },

    allInclusiveValue: { type: Number, default: null },
    registrationCharges: { type: Number, default: null },
    commissionRate: { type: Number, default: null },
    floorRiseSkip: { type: Number, default: null },
    sellablePercent: { type: Number, default: null },

    // Calculated fields
    agreementValue: { type: Number, default: null },
    parkingCharges: { type: Number, default: null },
    developmentCharges: { type: Number, default: null },
    floorRiseCharges: { type: Number, default: null },
    totalBrokerage: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

export const brokerageModel = mongoose.model(
  "brokerageCalculations",
  BrokerageCalculationSchema
);
