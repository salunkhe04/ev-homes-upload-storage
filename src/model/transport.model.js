import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vehicle",
      default: null,
    },
    clientName: { type: String, default: null },
    numberOfPassengers: { type: Number, default: 0 },
    clientPhone: { type: Number, default: null },
    countryCode: { type: String, default: "+91" },
    clientEmail: { type: String, default: null },
    isOccupied: { type: Boolean, default: false },
    manager: { type: String, ref: "employees", default: null },
    smanagerList: [{ type: String, ref: "employees", default: null }],
    pickupLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "geofence",
      default: null,
    }, 
    
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "geofence",
      default: null,
    },
    stage: { type: String, default: "approval" },
    approvalStatus: { type: String, default: "pending" },
    jurneyStatus: { type: String, default: "pending" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    approvalBy: { type: String, ref: "employees", default: null },
    timeline: [{ type: mongoose.Schema.Types.Mixed, default: null }],
  },
  { timestamps: true }
);

const TransportModel = mongoose.model(
  "transports",
  transportSchema,
  "transports"
);
export default TransportModel;
