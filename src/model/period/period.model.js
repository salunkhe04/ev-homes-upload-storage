import mongoose from "mongoose";
import moment from "moment-timezone";

export const periodSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      enum: ["sample-period", "ranking-period"],
    },
    startDate: { type: Date, required: true }, // Monday date (00:00)
    endDate: { type: Date, required: true }, // Sunday date (23:59:59)
  },
  { timestamps: true }
);

// Pre-save middleware to set Monday–Sunday range in ISO format
periodSchema.pre("validate", function (next) {
  if (!this.startDate) {
    const tz = "Asia/Kolkata"; // Change as needed

    // Find Monday 00:00 in local timezone
    const monday = moment.tz(tz).startOf("day").day(1); // Monday
    if (moment.tz(tz).day() < 1) {
      // If today is Sunday (0), go back to last Monday
      monday.subtract(7, "days");
    }

    const sunday = moment(monday).add(6, "days").endOf("day");

    // Store in UTC so MongoDB handles correctly
    this.startDate = monday.toDate();
    this.endDate = sunday.toDate();
  }
  next();
});

// Ensure unique week + period type
periodSchema.index({ period: 1, startDate: 1, endDate: 1 }, { unique: true });

const periodModel = mongoose.model("period", periodSchema);

export default periodModel;
