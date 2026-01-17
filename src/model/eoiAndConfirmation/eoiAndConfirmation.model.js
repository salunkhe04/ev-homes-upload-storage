import mongoose from "mongoose";

const eoiSchem = new mongoose.Schema({
  id: {
    type: String,
    default: null,
  },

  generatedBy: {
    type: String,
    ref: "employees",
    default: null,
  },
  paymentType: {
    type: String,
    default: null,
  },
  document: {
    type: String,
    default: null,
  },

  handOver: {
    type: Boolean,
    default: false,
  },
  handOverDate: {
    type: Date,
    default: null,
  },

  date: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  handOverBy: {
    type: String,
    ref: "employees",
    default: null,
    // required: true,
  },
});

const confSchem = new mongoose.Schema({
  id: {
    type: String,
    default: null,
  },
  generatedBy: {
    type: String,
    ref: "employees",
    default: null,
    // required: true,
  },
  paymentType: {
    type: String,
    default: null,
  },

  document: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    default: null,
  },
  handOver: {
    type: Boolean,
    default: false,
  },
  handOverDate: {
    type: Date,
    default: null,
  },
  handOverBy: {
    type: String,
    ref: "employees",
    default: null,
    // required: true,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },
});

export const eoiConfSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: null, //id of  (EOI/DD-MM-YY/001)
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
      default: null,
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      //   default: null,
      required: true,
    },
    // project info
    project: {
      type: String,
      ref: "ourProjects",
    },
    flatNo: {
      type: String,
      default: null,
    },
    buildingNo: {
      type: Number,
      default: null,
    },
    // project info
    // not sellable area
    carpetArea: {
      type: Number,
      default: null,
    },
    areaInSqmtr: {
      type: Number,
      default: null,
    },
    // eoi
    eoi: eoiSchem,
    // confirmation
    confirmation: confSchem,
    //
    eoiList: [eoiSchem],
    confirmationList: [confSchem],
  },
  { timestamps: true }
);

// Create the model
const eoiConfModel = mongoose.model(
  "eoiAndConfirmation",
  eoiConfSchema,
  "eoiAndConfirmationTests"
);
export default eoiConfModel;

//estimate id model
