import mongoose from "mongoose";
export const couponScehma = new mongoose.Schema(
  {
    id: {
      type: String,
      default: null,
    },
    codeName: {
      type: String,
    },
    codeValue: {
      type: Number,
      default: null,
    },
    disPercentage: {
      type: String,
      default: null,
    },

    startDate: {
      type: Date,
    },
    validTill: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create the model
const couponModel = mongoose.model("Coupon", couponScehma, "Coupon");
export default couponModel;

//estimate id model
