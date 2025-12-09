import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    ref: "ourProjects",
  },
  target: {
    type: Number,
  },
  booking: {
    type: Number,
    default: 0,
  },
  registration: {
    type: Number,
    default: 0,
  },
});

export const OverallTarget = new mongoose.Schema(
  {
    staffId: {
      type: String,
      ref: "employees",
    },
    target: {
      type: Number,
      default: 0,
    },
    quarter: {
      type: Number,
    },
    year: {
      type: Number,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    currentDate: {
      type: Date,
      default: Date.now,
    },
    booking: [
      {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "postSaleLead",
      },
    ],
    registration: [
      {
        type: mongoose.Schema.Types.ObjectId,
        // required: true,
        ref: "postSaleLead",
      },
    ],
    projectWise: [ProjectSchema],
  },
  { timestamps: true }
);

OverallTarget.index(
  { staffId: 1, startDate: 1, endDate: 1, year: 1 },
  { unique: true }
);

const revisedTargetModel = mongoose.model(
  "bookingTarget",
  OverallTarget,
  "bookingTarget"
);
export default revisedTargetModel;
