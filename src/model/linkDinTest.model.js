import mongoose from "mongoose";

const { Schema } = mongoose;
const { Mixed } = Schema.Types;

export const linkDinTestSchema = new Schema(
  {
    phoneNumber: { type: Mixed, default: null }, // can store map, string, object, number, etc.
    data: { type: Mixed, default: null }, // can store map, string, object, number, etc.
    raw: { type: Mixed, default: null }, // can store map, string, object, number, etc.
  },
  { timestamps: true }
);

const linkDintestModel = mongoose.model("linkDinTest", linkDinTestSchema);

export default linkDintestModel;
