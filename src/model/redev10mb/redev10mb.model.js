import mongoose from "mongoose";
export const redev10MbSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: null,
    },
    name: { type: String, default: null },
    countryCode: { type: String, default: "+91" },
    phoneNumber: { type: Number, default: null, unique: true },
  },
  { timestamps: true },
);

const rededv10mbModel = mongoose.model(
  "redev10mb",
  redev10MbSchema,
  "redev10mb",
);

export default rededv10mbModel;
