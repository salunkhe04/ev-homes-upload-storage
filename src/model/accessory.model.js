import mongoose from "mongoose";
export const accessorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      //   required: true,
    },
    accessory: { type: String, required: true },
    // quantity: {
    //   type: Number,
    //   default: 0,
    // },
    // description: {
    //    type: String,
    //    default: null
    //  },
  },
  { timestamps: true }
);

const accessoryModel = mongoose.model(
  "accessory",
  accessorySchema,
  "accessory"
);

export default accessoryModel;
