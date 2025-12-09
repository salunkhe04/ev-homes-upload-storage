import mongoose from "mongoose";

export const paymentv2Schema = new mongoose.Schema(
  {
    paymentMode: {
      type: String,
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      default: null,
    },
    demand: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Demand",
    },
    slab: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    receiptNo: {
      type: String,
      default: "",
    },
    account: {
      type: String,
      default: "",
    },
    transactionId: {
      type: String,
      default: null,
    },
    booking: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    tds: {
      type: Number,
      default: 0,
    },
    stampDuty: {
      type: Number,
      default: 0,
    },
    chequeReturned: { type: Date, default: null },
    chequeRedeposit: { type: Date, default: null },
  },
  { timestamps: true }
);

const paymentV2Model = mongoose.model(
  "paymentv2",
  paymentv2Schema,
  "paymentRecords"
);
export default paymentV2Model;
