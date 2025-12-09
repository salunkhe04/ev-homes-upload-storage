import mongoose from "mongoose";

export const requirementSchema = new mongoose.Schema(
  {
    requirement: { type: String, required: true, default: null },
  },
  { timestamps: true }
);

const reqModel = mongoose.model(
  "requirement",
  requirementSchema,
  "requirements"
);
export default reqModel;
