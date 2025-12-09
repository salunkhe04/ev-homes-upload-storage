import mongoose from "mongoose";

const approvalStepSchema = new mongoose.Schema({
  role: { type: String, default: null }, // role - reportingTo,etc
  adminId: { type: String, ref: "employees", default: null }, 
  remark: { type: String, default: null},
  paidBy: { type: String, default: null},
});

// default entry is 'reportingTo' if steps are empty
const approvalConfigSchema = new mongoose.Schema({
  requestType: {
    type: String,
    required: true,
    /*enum: ["weekoff", "leave"], */
  }, // Type of request
  steps: {
    type: [approvalStepSchema],
    default: [{ role: "reportingTo" }], // Default
  },
});

const approvalStepModel = mongoose.model(
  "approvalConfig",
  approvalConfigSchema
);
export default approvalStepModel;
