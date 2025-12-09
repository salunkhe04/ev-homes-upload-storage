import mongoose from "mongoose";
export const instReelSchema = new mongoose.Schema(
  {
    thumbnail: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: null },
    like: { type: Number, default: 0 },
    date: { type: String, default: Date.now },
  },
  { timestamps: true }
);

const instaReelModel = mongoose.model("instaReel", instReelSchema, "instareel");

export default instaReelModel;
