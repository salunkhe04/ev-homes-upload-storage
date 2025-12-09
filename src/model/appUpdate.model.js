import mongoose from "mongoose";

export const appUpdateSchema = new mongoose.Schema(
  {
    description: { type: String, default: null },
    version: { type: String, default: null },
    downloadLink: { type: String, default: null },
  },
  { timestamps: true }
);

const appUpdateModel = mongoose.model("AppUpdate", appUpdateSchema);
export default appUpdateModel;
