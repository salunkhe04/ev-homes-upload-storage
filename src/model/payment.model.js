import mongoose from "mongoose";
const dateOfAmtReceive = /^\d{4}-\d{2}-\d{2}$/;
export const paymentSchema = new mongoose.Schema(
  {
    // BOOKING/GST/TDS/TOKEN/ETC
    paymentType: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },

    projects: {
      type: String,
      default: null,
      ref: "ourProjects",
    },
    project: {
      type: String,
      default: null,
      ref: "ourProjects",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    slab: {
      type: String,
      default: null,
    },
    customerName: {
      type: String,
      default: null,
    },
    carpetArea: {
      type: String,
      default: "",
    },
    address1: {
      type: String,
      default: "",
    },
    address2: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    pincode: {
      type: Number,
      default: 0,
    },
    countryCode: { type: String, default: "+91" },
    phoneNumber: {
      type: Number,
      default: 0,
    },
    dateOfAmtReceive: {
      type: String,
      default: "1999-01-01",
    },
    receiptNo: {
      type: String,
      default: "",
    },
    account: {
      type: String,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "",
    },
    transactionId: {
      type: String,
      default: null,
    },
    flatNo: { type: String, default: null },
    amtReceived: {
      type: Number,
      default: 0,
    },
    allinclusiveamt: {
      type: Number,
      default: 0,
    },
    bookingAmt: {
      type: Number,
      default: 0,
    },
    stampDuty: {
      type: Number,
      default: 0,
    },
    tds: { type: Number, default: 0 },
    chequeReturned: { type: Date, default: null },
    chequeRedeposit: { type: Date, default: null },
    cgst: { type: Number, default: 0 },
    buildingNo: { type: Number, default: null },
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("payments", paymentSchema, "payments");
export default paymentModel;
