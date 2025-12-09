import mongoose from "mongoose";

export const shiftSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    shiftName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    timeIn: {
      type: String,
      default:null,
      // required: true,
    },
    timeOut: {
      type: String,
      // required: true,
      default:null,

    },
    multiTimeInOut: {
      type: Boolean,
    },
    workingHours: {
      type: Number,
      required: true,
    },
    graceTime: {
      type: Number,
      default: 0,
    },
    graceDays: {
      type: Number,
      default: 0,
    },
    absentHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "active",
    },
    employees: [
      {
        type: String,
        ref: "employees",
      },
    ],
    regularizationDays: {
      type: Number,
      default: 0,
    },
    
  },
  { timestamps: true }
);

const shiftModel = mongoose.model("Shift", shiftSchema, "shifts");
export default shiftModel;
