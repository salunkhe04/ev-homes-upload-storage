import mongoose from "mongoose";
export const upcomingProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  logo: { type: String, default: null },
  shortCode: { type: String, default: null },
  address: { type: String, default: null },
  locationLink: { type: String, default: null },
  locationName: { type: String, default: null },
  offers: { type: Boolean, default: false },
  offerDetails: { type: String, default: null },
});

const upcomingProjectModel = mongoose.model(
  "upcomingProject",
  upcomingProjectSchema,
  "upcomingProject"
);

export default upcomingProjectModel;
