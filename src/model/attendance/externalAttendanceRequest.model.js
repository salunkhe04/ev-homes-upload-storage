import mongoose from "mongoose";
export const externalAttReqSchema = new mongoose.Schema(
  {
    //
    teamLeader: { type: String, ref: "employees", required: true },
    user: { type: String, ref: "employees", required: true },
    reason: { type: String, required: true },
    date: { type: Date, required: true },
    type: { type: String, required: true, enum: ["check-in", "check-out"] },
    //
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    attachment: { type: String, default: null },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

const extAttReqModel = mongoose.model(
  "extAttendanceRequest",
  externalAttReqSchema,
  "extAttendanceRequest"
);

export default extAttReqModel;
