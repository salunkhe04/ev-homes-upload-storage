import mongoose from "mongoose";
export const assetlistSchema = new mongoose.Schema(
  {
    accessory: {
      type: String,
      required: true,
      ref: "accessory",
    },
    code: {
      type: String,
      default: null,
    },
    brand: {
        type: String,
        default: null,
      },
    status: {
        type: String,
        default: null,
      },
    condition: {
        type: String,
        default: null,
      },
    specification: {
        type: String,
        default: null,
      },
    description: {
        type: String,
        default: null,
      },
  },
  {timestamps:true}
);

const assetlistModel = mongoose.model(
  "assetlist",
  assetlistSchema,
  "assetlist"
);

export default assetlistModel;
