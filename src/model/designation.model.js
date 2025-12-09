import mongoose from "mongoose";

export const designationSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    designation: { type: String, required: true, unique: true },
  }
  // {timestamps:true}
);

const designationModel = mongoose.model(
  "designations",
  designationSchema,
  "designations"
);
export default designationModel;
