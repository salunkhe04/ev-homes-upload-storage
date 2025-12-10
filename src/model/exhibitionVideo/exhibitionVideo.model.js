import mongoose from "mongoose";

export const ExhibitionVideoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: Number,
      default: null,
    },
  },

  { timestamps: true }
);

const ExihibitionVideoModel = mongoose.model(
  "exhibitionVideo",
  ExhibitionVideoSchema,
  "exhibitionVideo"
);
export default ExihibitionVideoModel;
