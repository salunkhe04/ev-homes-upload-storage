import mongoose from "mongoose";

export const warningLetterSchema = new mongoose.Schema(
  {
    givenTo: {
      type: String,
      ref: "employees",
      default: null,
    },
    givenBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    document: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },

    date: {
      type: Date,
      default: Date.now,
    },
    validTill: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const warningLetterModel = mongoose.model(
  "warningLetter",
  warningLetterSchema,
  "warningLetters"
);
export default warningLetterModel;
