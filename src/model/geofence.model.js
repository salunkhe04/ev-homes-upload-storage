import mongoose from "mongoose";

export const geofenceSchema = new mongoose.Schema({
//   _id: {
//     type: String,
//     required: true,
//   },
//   location: { type: String, default: "" },
  address: { type: String, default: "" },
  name: { type: String, default: "" },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  radius: { type: Number, default: null },
  status: { type: String, default: ""},
  locationLink: { type: String, default: null },
});
const geofenceModel = mongoose.model("geofence", geofenceSchema, "geofence");
export default geofenceModel;