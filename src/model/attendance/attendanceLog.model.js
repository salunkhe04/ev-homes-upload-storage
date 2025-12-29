import mongoose from "mongoose";

export const attendanceLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },

  action: { type: String, required: true },
  status: { type: String, required: true },
  reason: { type: String },
  message: { type: String },

  latitude: Number,
  longitude: Number,
  accuracy: Number,
  insideGeofence: Boolean,
  photoUrl: String, // after upload (S3 / local)
  timestamp: { type: Date, required: true },
  day: Number,
  month: Number,
  year: Number,
});
const attendanceLogModel = mongoose.model("AttendanceLog", attendanceLogSchema);
export default attendanceLogModel;
