import mongoose from "mongoose";

export const attendanceChangesTypeSchema = new mongoose.Schema(
  {
    before: { type: Object, default: null },
    changes: { type: Object, default: null },
    changeBy: { type: String, ref: "employees", default: null },
    changeFor: { type: String, ref: "employees", default: null },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const attendanceChangesModel = mongoose.model(
  "attendanceChanges",
  attendanceChangesTypeSchema,
  "attendanceChanges"
);

export default attendanceChangesModel;
