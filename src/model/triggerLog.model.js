import mongoose from "mongoose";

export const triggerLog = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    totalTrigger: { type: Number, default: 0 },
    message: { type: String, default: "" },
    changes: [{ type: mongoose.Schema.Types.ObjectId, ref: "lead" }],
    changesString: { type: String, default: "" },
  },
  { timestamps: true }
);

const triggerHistoryModel = mongoose.model(
  "triggers",
  triggerLog,
  "triggersHistory"
);
export default triggerHistoryModel;
