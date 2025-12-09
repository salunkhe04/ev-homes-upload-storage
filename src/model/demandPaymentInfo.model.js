import mongoose from "mongoose";

// default entry is 'reportingTo' if steps are empty
const demandPaymentInfoSchema = new mongoose.Schema({
  booking: {
    type: String,
    required: true,
    ref: "postSaleLead",
  },
  project: {
    type: String,
    required: true,
    ref: "ourProjects",
  },
  flatNo: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  slab: {
    type: String,
    required: true,
  },
  receiptNo: {
    type: String,
    default: null,
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  netAmount: {
    type: Number,
    default: 0,
  },
  cgstAmount: {
    type: Number,
    default: 0,
  },
  tdsAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  allInclusiveAmount: {
    type: Number,
    default: 0,
  },

  demandHandOver: {
    type: Boolean,
    default: false,
  },
});

const demandPaymentInfoModel = mongoose.model(
  "demandPaymentInfo",
  demandPaymentInfoSchema
);
export default demandPaymentInfoModel;
