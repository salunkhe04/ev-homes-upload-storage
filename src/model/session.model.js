import mongoose from "mongoose";

export const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "employees",
      required: true,
    },

    refreshToken: { type: String, required: true },
    role: { type: String, required: true },

    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },

    isRevoked: { type: Boolean, default: false },

    expiresAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },

    deviceName: { type: String, default: null },
    deviceType: { type: String, default: null },
    os: { type: String, default: null },
  },
  { timestamps: true },
);

const sessionModel = mongoose.model("session", SessionSchema, "session");

export default sessionModel;
