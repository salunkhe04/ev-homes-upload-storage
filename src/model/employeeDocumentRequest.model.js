  import mongoose from "mongoose";
  export const employeeDocumentSchema = new mongoose.Schema(
    {
      appliedDate: {
        type: Date,
        default: null,
      },
      approvalReason: {
        type: String,
        default: null,
      },

      appliedBy: {
        type: String,
        ref: "employees",
        default: null,
      },
      approvedDate: {
        type: Date,
        default: null,
      },
      reportingTo: {
        type: String,
        ref: "employees",
        default: null,
      },
      currentLevel: {
        type: Number,
        default: 0,
      },
      empReqDocuments: [
        {
          typeOfDocument: { type: String, default: null, },
          documentNumber: { type: String, default: null },
          name: { type: String, default: null },
          frontSide: { type: String, default: null },
          backSide:{type:String,default:null},
          status: { type: String, default: "pending" },
        },
      ],  
      approvalSteps: [
        {
          level: { type: Number, required: true },
          adminId: { type: String, ref: "employees" },
          status: { type: String, default: "pending" },
          approvalDate: { type: Date, default: null },
          remark: { type: String, default: null },
        },
      ],
      docReqStatus: {
        type: String,
        default: "pending",
      },
    },
    { timestamps: true }
  );

  const empDocReqModel = mongoose.model(
    "employeeDocReq",
    employeeDocumentSchema,
    "employeeDocReq"
  );

  export default empDocReqModel;
