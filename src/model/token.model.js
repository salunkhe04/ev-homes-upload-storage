import mongoose from "mongoose";

export const blockedTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    type: { type: String, required: true },
    // validity: { type: Date, default: null },
  },
  { timestamps: true }
);

const blockedTokenModel = mongoose.model(
  "blockedTokens",
  blockedTokenSchema,
  "blockedTokens"
);
export default blockedTokenModel;
