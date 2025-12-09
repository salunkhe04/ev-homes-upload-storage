import mongoose from "mongoose";

const demandSchema = new mongoose.Schema(
  {
    project: {
      type: String,
      required: true,
      ref: "ourProjects",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      default: null,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payments",
      default: null,
    },
    floor: {
      type: String,
      default: null,
    },
    number: {
      type: String,
      default: null,
    },
    flatNo: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    // Address fields
    addressLine1: {
      type: String,
      default: null,
    },
    addressLine2: {
      type: String,
      default: null,
    },
    landmark: {
      type: String,
      default: null,
    },
    pincode: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    // Additional name field
    additionalName: {
      type: String,
      default: null,
    },
    // Amounts before and after due date
    payableNetAmountBeforeDueDate: {
      type: Number, // Ensuring consistency in number type
      default: null,
    },
    payableNetAmountAfterDueDate: {
      type: Number,
      default: null,
    },
    payableGstAmountBeforeDueDate: {
      type: Number,
      default: null,
    },
    payableGstAmountAfterDueDate: {
      type: Number,
      default: null,
    },
    payableTotalAmountBeforeDueDate: {
      type: Number,
      default: null,
    },
    payableTotalAmountAfterDueDate: {
      type: Number,
      default: null,
    },

    subject: {
      type: String,
      default: null,
    },
    body: {
      type: String,
      default: null,
    },
    document: {
      type: String,
      default: null,
    },
    ref: {
      type: String,
      default: null,
    },
    refId: {
      type: String,
      default: null,
    },
    slab: {
      type: String,
      default: null,
    },
    // Received amounts
    receivedNetAmount: {
      type: Number,
      default: null,
    },
    receivedGstAmount: {
      type: Number,
      default: null,
    },
    receivedTotalAmount: {
      type: Number,
      default: null,
    },
    // Dates for received amounts
    receivedNetAmountDate: {
      type: Date,
      default: null,
    },
    receivedGstAmountDate: {
      type: Date,
      default: null,
    },
    receivedTotalAmountDate: {
      type: Date,
      default: null,
    },
    isHandedOver: { type: Boolean, default: false },
    handoverDate: { type: Date, default: null },
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payments",
        default: null,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create the model
const Demand = mongoose.model("Demand", demandSchema, "demands");
export default Demand;
