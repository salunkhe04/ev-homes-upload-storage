import mongoose from "mongoose";

export const IncentiveSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: "employees",
    },
    scale: {
      type: String,
      ref: "scale",
    },
    lifeTimeEarning: {
      type: Number,
      default: 0,
    },
    potential: {
      type: Number,
      default: 0,
    },
    earned: {
      type: Number,
      default: 0,
    },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "postSaleLead" }],
  },
  { timestamps: true }
);

const incentiveModel = mongoose.model(
  "incentive",
  IncentiveSchema,
  "incentive"
);
export default incentiveModel;
