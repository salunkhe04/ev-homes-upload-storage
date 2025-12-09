import mongoose from "mongoose";

export const storageSchema = new mongoose.Schema(
  {
    downloadUrl: { type: String, required: true },
    originalname: { type: String, required: true },
    encoding: { type: String, required: true },
    mimetype: { type: String, required: true },
    destination: {
      type: String,
      required: true,
    },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    token: { type: String, required: true },
  },
  { timestamps: true }
);

const storageModel = mongoose.model("storage", storageSchema, "storage");
export default storageModel;
