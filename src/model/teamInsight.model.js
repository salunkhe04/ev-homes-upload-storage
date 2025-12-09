import mongoose from "mongoose";

export const teamInsightSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    teamName: {
      type: String,
      default: null,
    },

    reportingTo: {
      type: String,
      ref: "employees",
    },
    crew: [
      {
        teamMember: { type: String, ref: "employees" },
      },
    ],
    totalTasks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const teamInsightModel = mongoose.model(
  "teamInsight",
  teamInsightSchema,
  "teamInsight"
);
export default teamInsightModel;
