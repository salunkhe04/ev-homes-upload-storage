import mongoose from "mongoose";
export const reimbursementSchema = new mongoose.Schema(
  {
    reimbursementDate: {
      type: Date,
    },
    appliedOn: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    aproveReason: {
      type: String,
      default: "pending",
    },
    reimbursementStatus: {
      type: String,
      default: "pending",
    },
    applyBy: {
      type: String,
      ref: "employees",
      default: null,
    },
    reportingTo: {
      type: String,
      ref: "employees",
      default: null,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    attachment: {
      type: String,
    },
    attachment2: {
      type: String,
    },
    type: {
      type: String,
    },
    adminId: {
       type: String, 
       ref: "employees", 
       default: null
     },
    amount: { 
      type: String, 
     },
    currentLevel: {
      type: Number,
      default: 0,
    },
   
    paidBy: {
      type: String,
      default: null,
    },
    approvalSteps: [
      {
        level: { type: Number, required: true },
        adminId: { type: String, ref: "employees" },
        status: { type: String, default: "pending" },
        approvalDate: { type: Date, default: null },
        remark: {type: String,  default: null},
      },
    ],
  },
  {timestamps:true}
);

const reimbursementModel = mongoose.model(
  "reimbursement",
  reimbursementSchema,
  "reimbursement"
);

export default reimbursementModel;
