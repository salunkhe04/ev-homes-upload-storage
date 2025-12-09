import mongoose from "mongoose";

export const holidaySchema = new mongoose.Schema(
  {
   
    holiday: { type: String, required: true },
    status: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    days: { type: Number, default: null },
    description: { type: String, default: null },
  }

);

const holidayModel = mongoose.model(
  "holiday",
  holidaySchema,
  "holidays"
);
export default holidayModel;
