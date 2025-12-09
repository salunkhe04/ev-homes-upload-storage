import mongoose from "mongoose";

const slabSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  index: { type: Number, default: null },
  name: { type: String, default: null },
  remark: { type: String, default: null },
  percent: { type: Number, default: null },
  completed: { type: Boolean, default: false },
  completedOn: { type: Date, default: null },
  architectCertificate: { type: String, default: null },
});

export const slabInfoSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    project: { type: String, ref: "ourProjects", required: true },
    // address: { type: String, default: "" },
    currentSlab: { type: String, default: null },
    slabs: [slabSchema],
  },
  { timestamps: true }
);

const slabModel = mongoose.model("slab", slabInfoSchema, "slabs");
export default slabModel;
