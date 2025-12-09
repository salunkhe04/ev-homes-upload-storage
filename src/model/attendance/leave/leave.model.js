import mongoose from "mongoose";

export const leaveTypeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      //   required: true,
    },
    leave: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const leaveTypeModel = mongoose.model(
  "leaveType",
  leaveTypeSchema,
  "leaveTypes"
);
export default leaveTypeModel;
