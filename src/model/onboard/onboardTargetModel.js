import mongoose from "mongoose";

export const onboardTargetSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      default: 0,
    },
    // acutal - achieved pending etc
    target: {
      type: Number,
      default: 0,
    },
    achieved: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Number,
      default: 0,
    },
    // just for additonal
    date: {
      type: Date,
      default: Date.now,
    },
    // for future recordss
    onboards: [
      {
        type: String,
        ref: "CpOnBoarding",
        default: null,
      },
    ],
  },
  { timestamps: true }
);
onboardTargetSchema.index({ month: 1, year: 1 }, { unique: true });

const onboardTargetModel = mongoose.model(
  "onboardingTarget",
  onboardTargetSchema
);

export default onboardTargetModel;
