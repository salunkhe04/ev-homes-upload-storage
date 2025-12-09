import mongoose from "mongoose";
export const deletedVisitSchema = new mongoose.Schema(
  {
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    userId: { type: String, default: null },
  },
  { timestamps: true }
);

const deletedVisitModel = mongoose.model("deletedVisits", deletedVisitSchema);

export default deletedVisitModel;
