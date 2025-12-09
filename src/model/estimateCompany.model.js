import mongoose from "mongoose";

export const estimateCompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: null },
  },
  { timestamps: true }
);

const estCompanyModel = mongoose.model(
  "estCompany",
  estimateCompanySchema,
  "estCompany"
);
export default estCompanyModel;
