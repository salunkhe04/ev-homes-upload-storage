import mongoose from "mongoose";

export const leadAssignment = new mongoose.Schema(
  {
    firstTeamLeader: {
      type: String,
      ref: "employees",
    },

    assignedLeads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lead",
      },
    ],
    index: {
      type: Number,
      default: 0,
    },
  },

  { timestamps: true }
);

const leadAssignmentModel = mongoose.model(
  "leadAssignment",
  leadAssignment,
  "leadAssignment"
);
// const leadModelV2 = mongoose.model("lead", leadSchema, "leads");
export default leadAssignmentModel;
