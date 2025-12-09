import mongoose from "mongoose";

export const auditSectionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    executive: { type: String, required: true, ref: "employees" },
    teamLeaders: [{ type: String, required: true, ref: "employees" }],
  },
  { timestamps: true }
);

const auditSectionModel = mongoose.model(
  "auditSection",
  auditSectionSchema,
  "auditSection"
);
export default auditSectionModel;
