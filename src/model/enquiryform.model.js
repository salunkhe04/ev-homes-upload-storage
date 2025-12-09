import mongoose from "mongoose";
const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const enquiryformSchema = new mongoose.Schema({
  date: { type: Date, default: null },
  clientName: { type: String, default: null },
  cpphonenumber: { type: Number, default: null },
  enquiryabout: {
    type: String,
    default: "Enquiry About",
    enum: ["Tagging Status", "Project Information", "Other"],
  },
  channelPartner: {
    type: String,
    default: null,
    ref: "channelPartners"
  },
});

const enquiryformModel = mongoose.model("enquiryform", enquiryformSchema, "enquiryform");

export default enquiryformModel;