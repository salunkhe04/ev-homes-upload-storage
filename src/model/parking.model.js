import mongoose from "mongoose";

export const parkingSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    project: { type: String, ref: "ourProjects", default: null },
    floor: { type: Number, default: null },
    floorName: { type: String, default: null },
    number: { type: Number, default: null },
    buildingNo: { type: Number, default: null },
    parkingNo: { type: String, default: null },
    occupied: { type: Boolean, default: false },
    occupiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      default: null,
    },
  },
  { timestamps: true },
);
const parkingModel = mongoose.model("parking", parkingSchema, "parkings");
export default parkingModel;
