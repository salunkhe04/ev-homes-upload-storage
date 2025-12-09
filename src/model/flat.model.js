import mongoose from "mongoose";

export const flatListSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  project: { type: String, ref: "ourProjects", default: null },
  type: { type: String, default: null },

  buildingNo: { type: Number, default: null },
  floor: { type: Number, default: null },
  number: { type: Number, default: null },
  flatNo: { type: String, default: null },

  configuration: { type: String, default: null },
  carpetArea: { type: Number, default: null },
  sellableCarpetArea: { type: Number, default: null },
  allInclusiveValue: { type: Number, default: null },

  occupied: { type: Boolean, default: false },
  occupiedBy: { type: String, default: null },

  ssArea: { type: Number, default: null },
  reraArea: { type: Number, default: null },
  balconyArea: { type: Number, default: null },

  msp1: { type: Number, default: 0 },
  msp2: { type: Number, default: 0 },
  msp3: { type: Number, default: 0 },
});
const flatModel = mongoose.model("flat", flatListSchema, "flats");
export default flatModel;
