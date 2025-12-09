import mongoose from "mongoose";

export const commercialProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, default: null },
    showCaseImage: { type: String, default: null },
    shortCode: { type: String, default: null },
    list: [
      {
        type: { type: String, default: null },
        floor: { type: Number, default: null },
        number: { type: Number, default: null },
        occupied: { type: Boolean, default: false },
        bookingDate: {
          type: Date,
          default: null,
        },
        teamLeader: {
          type: String,
          ref: "employees",
        },
        buildingNo: {
          type: Number,
          default: null,
        },
      },
    ],
  },

  { timestamps: true }
);

const commercialProjModel = mongoose.model(
  "commercialProject",
  commercialProjectSchema,
  "commercialProject"
);
export default commercialProjModel;
