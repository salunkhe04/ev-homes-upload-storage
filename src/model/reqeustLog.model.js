import mongoose from "mongoose";

export const requestLogSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: "employee", default: null },
    role: { type: String, default: null },
    ip: { type: String, default: null },
    hostname: { type: String, default: null },
    host: { type: String, default: null },
    method: { type: String, default: null },
    url: { type: String, default: null },
    params: { type: Object, default: null },
    body: { type: Object, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const requestLogModel = mongoose.model(
  "requestLog",
  requestLogSchema,
  "requestLogs"
);
export default requestLogModel;
