import mongoose from "mongoose";

export const contestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, default: null },
    phoneNumber: { type: Number, required: true, default: null },
    photoUrl: {
      type: [String],
      default: null,
    },
    thumbnail: { type: String, default: null },
    createId: { type: Boolean, default: false },
    event: {
      type: String,
      ref: "event",
    },
    validTill: {
      type: Date,
    },
    deleteVideoAt: {
      type: Date,
      default: function () {
        let startDate = Date.now();
        let validTillDate = new Date(startDate);
        validTillDate.setHours(validTillDate.getHours() + 47);
        return validTillDate;
      },
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create the model
const contestModel = mongoose.model("Contest", contestSchema, "contests");
export default contestModel;
