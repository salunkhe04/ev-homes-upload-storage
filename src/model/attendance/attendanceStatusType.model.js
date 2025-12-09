import mongoose from "mongoose";

export const attendanceStatusTypeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const attendanceStatusModel = mongoose.model(
  "attendanceStatus",
  attendanceStatusTypeSchema,
  "attendanceStatus"
);

export default attendanceStatusModel;
