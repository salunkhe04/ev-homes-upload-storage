import mongoose from "mongoose";

export const whatsnewSchema = new mongoose.Schema({
  imagesId:{ type: mongoose.Schema.Types.ObjectId,},
  imageName: { type: String, default: null },
  showCaseImage: { type: String, default: null },
},{timestamps:true});

const whatsnewModel = mongoose.model("whatsnew", whatsnewSchema, "whatsnew");
export default whatsnewModel;
