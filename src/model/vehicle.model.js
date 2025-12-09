import mongoose from "mongoose";
import { type } from "os";

export const vehicleSchema = new mongoose.Schema({
  vehicleName: {
    type: String,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    default: null,
  },
  vehicleNoPhoto: {
    type: String,
    default: null,
  },
  driverFirstName: {
    type: String,
    default: null,
  },
  driverLastName: {
    type: String,
    default: null,
  },
  driverPhoneNo: {
    type: Number,
    default: null,
  },
  driverImage: {
    type: String,
    default: null,
  },
  status: {
    type: Boolean,
    default: null,
  },
});

// Create the model
const vehicleModel = mongoose.model("vehicle", vehicleSchema, "vehicle");
export default vehicleModel;
