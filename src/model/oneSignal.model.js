import mongoose from "mongoose";

export const oneSignalUserSchema = new mongoose.Schema(
  {
    docId: { type: String, required: true },
    role: { type: String, required: true },
    playerId: { type: String, required: true },
  },
  { timestamps: true }
);

const oneSignalModel = mongoose.model(
  "oneSignalUsers",
  oneSignalUserSchema,
  "oneSignalUsers"
);
export default oneSignalModel;
