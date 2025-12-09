import mongoose from "mongoose";
export const employeeShiftInfoRequestSchema = new mongoose.Schema(
  {
    date: { 
      type: Date,
    },
  
      userId: {
        type: String,
        // required: true,
        ref: "employees",
      },
      shift: { type: String, ref: "employeeShiftInfo", default: null },
      totalLeaves: { type: Number, default: 0 },
      paidLeave: { type: Number, default: 0 },
      paidLeaveremark: { type: String, default: null, },
      casualLeave: { type: Number, default: 0 },
      casualLeaveremark: { type: String, default: null, },
      compensatoryoff: { type: Number, default: 0 },
      compensatoryoffremark: { type: String, default: null, },
      remark: { type: String, default: null, },
  },
  {timestamps:true}
);

const employeeShiftInfoRequestModel = mongoose.model(
  "employeeShiftInfoRequest",
  employeeShiftInfoRequestSchema,
  "employeeShiftInfoRequest"
);

export default employeeShiftInfoRequestModel;
