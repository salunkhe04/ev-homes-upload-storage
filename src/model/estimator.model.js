import mongoose from "mongoose";

export const estimateSchema = new mongoose.Schema(
    {
      
      teamLeader: {
        type: "String",
        ref:"employees",
      },
      count: {
        type: Number,
      },
      generatedDate: {
        type: Date,
      },
    },
    { timestamps: true }
  );
  
  const estModel = mongoose.model("EstID", estimateSchema, "EstID");
  export default estModel;