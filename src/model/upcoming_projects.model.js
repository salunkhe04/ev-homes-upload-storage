import mongoose from "mongoose";
// const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const upcomingSchema = new mongoose.Schema({
  name: { type: String, default: null },
  location: { type: String, default: null },
  showcaseimage: { type: String, default: null },
  image: { type: String, default: null },
  offer: { type: Boolean, default: false },
  offerDetails: { type: String, default: null },
});

const upcomingModel = mongoose.model(
  "upcomingProjects",
  upcomingSchema,
  "upcomingProjects"
);
export default upcomingModel;
