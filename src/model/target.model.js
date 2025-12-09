import mongoose from "mongoose";

const targetSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      ref: "employees",
    },
    target: { type: Number, required: true, min: 0 },
    achieved: { type: Number, required: true, min: 0 },
    extraAchieved: { type: Number, default: 0, min: 0 },
    carryForward: { type: Number, default: 0, min: 0 },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: new Date().getFullYear() + 10,
    },
    previousCarryForwardUsed: { type: Boolean, default: false },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "postSaleLead",
      },
    ],
  },
  { timestamps: true }
);

targetSchema.index({ staffId: 1, month: 1, year: 1 }, { unique: true });

const TargetModel = mongoose.model("target", targetSchema, "targets");
export default TargetModel;
