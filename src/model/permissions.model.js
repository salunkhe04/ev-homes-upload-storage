import mongoose from "mongoose";

export const permissionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    permission: { type: String, required: true },
    requiredPermission: { type: String, default: null },
    remark: { type: String, default: null },
  },
  { timestamps: true }
);

const permissionModel = mongoose.model(
  "permissions",
  permissionSchema,
  "permissions"
);

export default permissionModel;
