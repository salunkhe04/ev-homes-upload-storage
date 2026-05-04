import mongoose from "mongoose";

export const employeeShiftInfoSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      ref: "employees",
    },
    shift: { type: String, ref: "Shift", default: null },
    faceId: { type: String, ref: "faceId", default: null },
    currentDate: { type: Date, default: Date.now },
    totalLateDays: { type: Number, default: 0 },
    totalLeaves: { type: Number, default: 0 },
    graceDays: { type: Number, default: 0 },
    paidLeave: { type: Number, default: 0 },
    casualLeave: { type: Number, default: 0 },
    compensatoryoff: { type: Number, default: 0 },
    regularization: { type: Number, default: 0 },
    undertime: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    payable: { type: Boolean, default: false },
    department: { type: String, ref: "departments" },
    overDueCompOff: { type: Number, default: 0 },
    weekOffDay: { type: String, default: null },
    sickLeave: { type: Number, default: 0 },


  },
  { timestamps: true },
);
employeeShiftInfoSchema.index({ userId: 1 }, { unique: true });
// const shiftInfoModel = mongoose.model(
//   "employeeShiftInfo",
//   employeeShiftInfoSchema,
//   "employeeShiftInfosTest"
// );

const shiftInfoModel = mongoose.model(
  "employeeShiftInfo",
  employeeShiftInfoSchema,
  "employeeShiftInfos",
);
export default shiftInfoModel;
