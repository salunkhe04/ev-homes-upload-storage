import mongoose from "mongoose";

export const estimateGenerateSchema = new mongoose.Schema(
  {
    estID: {
      type: String,
      default: null, //id of estimator (tl-with-estId)
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
      default: null,
    },
    slab: {
      type: String,
      default: null,
    },
    slabPercentage: {
      type: Number,
      default: null,
    },
    project: {
      type: String,
      ref: "ourProjects",
    },
    flatNo: {
      type: String,
      default: null,
    },
    floor: {
      type: Number,
      default: null,
    },
    number: {
      type: Number,
      default: null,
    },
    buildingNo: {
      type: Number,
      default: null,
    },

    configuration: {
      type: String,
      default: null,
    },
    carpetArea: {
      type: Number,
      default: null,
    },
    reraArea: {
      type: Number,
      default: null,
    },
    ssArea: {
      type: Number,
      default: null,
    },
    balconyArea: {
      type: Number,
      default: null,
    },
    allInclusiveValue: {
      type: Number,
      default: null,
    },
    agreementValue: {
      type: Number,
      default: null,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    discountedAgreementValue: {
      type: Number,
      default: null,
    },

    discountedGstValue: {
      type: Number,
      default: null,
    },
    discountedPayable: {
      type: Number,
      default: null,
    },
    payableBookingValue: {
      type: Number,
      default: null,
    },
    totalPayableValue: {
      type: Number,
      default: null,
    },
    generatedBy: {
      type: String,
      ref: "employees",
    },
    finalEstDoc: {
      type: String,
      default: null,
    },
    document: {
      type: String,
      default: null,
    },
    physicalDocument: {
      type: String,
      default: null,
    },
    physicalPrice: {
      type: Number,
      default: null,
    },
    estimateDate: {
      type: Date,
      default: null,
    },
    parking: {
      type: Number,
      default: null,
    },
    qrscan: {
      type: String,
      default: null,
    },
    stampDutyAmount: {
      type: Number,
      default: null,
    },
    gstAmount: {
      type: Number,
      default: null,
    },
    stampDutyPercentage: {
      type: Number,
      default: null,
    },
    discountStampDuty: {
      type: Number,
      default: null,
    },
    finalAgreementValue: {
      type: Number,
      default: null,
    },
    finalStamp: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      default: null,
    },
    company: {
      type: String,
      default: null,
    },

    statusChangedDate: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
    teamLeader: {
      type: String,
      ref: "employees",
    },
    finalDocumentCreated: [
      {
        index: {
          type: Number,
          default: null,
        },
        status: {
          type: String,
          default: null,
        },
        statusChangedDate: {
          type: Date,
          default: null,
        },
        reason: {
          type: String,
          default: null,
        },
        documentAgreementValue: {
          type: Number,
          default: null,
        },
        gstAmount: {
          type: Number,
          default: null,
        },
        stampDuty: {
          type: Number,
          default: null,
        },
        physicalAmount: {
          type: Number,
          default: null,
        },
        documentCreatedDate: {
          type: Date,
          default: null,
        },
        documentUrl: {
          type: String,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create the model
const estimateGeneratedModel = mongoose.model(
  "estimateGenerated",
  estimateGenerateSchema,
  "estimateGenerated"
);
export default estimateGeneratedModel;

//estimate id model
