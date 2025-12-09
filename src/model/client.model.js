import mongoose from "mongoose";
const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const clientSchema = new mongoose.Schema(
  {
    profilePic: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    email: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: "male",
      enum: ["male", "female", "other"],
    },
    isVerifiedPhone: { type: Boolean, default: false },
    isVerifiedEmail: { type: Boolean, default: false },
    phoneNumber: { type: Number, required: true, unique: true },
    countryCode: { type: Number, default: "+91" },
    altPhoneNumber: { type: Number, required: false },
    address: { type: String, required: false, default: null },
    password: { type: String, required: true, minlength: 6 },
    projects: {
      type: String,
      default: null,
      ref: "ourProjects",
    },
    closingManager: {
      type: String,
      ref: "employees",
      default: null,
    },
    choiceApt: [
      {
        type: String,
        default: null,
        // enum: ["1RK", "1BHK", "2BHK", "3BHK", "Jodi"],
      },
    ],
    role: {
      type: String,
      // required: true,
      default: "customer",
      enum: ["employee", "channel-partner", "customer"],
    },
  },
  { timestamps: true }
);

const clientModel = mongoose.model("clients", clientSchema, "clients");
export default clientModel;
