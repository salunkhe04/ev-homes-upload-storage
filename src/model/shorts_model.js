import mongoose from "mongoose";

const shortsSchema = new mongoose.Schema(
  {
    project: { type: String, ref: "ourProjects" },
    shorts: [
      {
        thumbNail: { type: String, default: null },
        video: { type: String, default: null },
      },
    ],
  },
  { timestamps: true }
);

const shortsModel = mongoose.model("shorts", shortsSchema, "shorts");
export default shortsModel;
