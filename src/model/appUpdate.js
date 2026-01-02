import mongoose from "mongoose";

export const appUpdateSchema = new mongoose.Schema(
  {
    appName: { type: String, default: null },
    downloadUrl: { type: String, default: null },
    versionNumber: { type: Number, default: null },
    versionCode: { type: String, default: null },
    description: { type: String, default: null },
    critical: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const appUpdateModel = mongoose.model("appVersionUpdates", appUpdateSchema);
export default appUpdateModel;
