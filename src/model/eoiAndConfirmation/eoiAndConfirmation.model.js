import mongoose from "mongoose";

export const eoiConfSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: null, //id of  (tl-with-estId)
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
    eoi: {
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
    },
    // confirmation
    confirmation: {
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
    },
    //
  },
  { timestamps: true }
);

// Create the model
const eoiConfModel = mongoose.model(
  "eoiAndConfirmation",
  eoiConfSchema,
  "eoiAndConfirmation"
);
export default eoiConfModel;

//estimate id model
