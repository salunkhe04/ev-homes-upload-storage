import mongoose from "mongoose";

export const displaySlotsSchema  = new mongoose.Schema(
  {
    _id: { type: String, default: "main" }, // singleton id "main"
    counter: { type: Number, default: 0 },  // monotonic creation counter
    slots: [{ type: mongoose.Schema.Types.ObjectId, ref: "onboardExhib", default: null }] // length up to 6
  },
  { timestamps: true }
);

const displaySlotModel = mongoose.model("DisplaySlots", displaySlotsSchema);

export default displaySlotModel;
