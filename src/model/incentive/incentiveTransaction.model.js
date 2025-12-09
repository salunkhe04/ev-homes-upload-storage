import mongoose from "mongoose";

export const IncentiveTransactionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    //         booking                 cancelled
    // uid - mb/book/DK/25-26/1 or mb/DK/cancelled/25-26/1
    bookingId: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      ref: "employee",
    },
    // potential / earned
    earnType: {
      type: String,
      required: true,
    },
    // deposit/withdraw
    transactionType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    // date of transaction
    date: {
      type: Date,
      default: Date.now,
    },
    // booking ref for that perticular booking
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      default: null,
    },
    // remark for transaction i.e. payout remark / booking potential remark /
    remark: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const incentiveTransactionModel = mongoose.model(
  "incentiveTransaction",
  IncentiveTransactionSchema,
  "incentiveTransaction"
);
export default incentiveTransactionModel;
