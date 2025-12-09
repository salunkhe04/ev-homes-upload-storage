import mongoose from "mongoose";
const dateOfBirthFormat = /^\d{4}-\d{2}-\d{2}$/;
const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordFormat = /^\d+$/;

export const employeeSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    prefix: { type: String, default: null },

    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return emailFormat.test(value);
        },
        message: (props) => `${props.value} is not a valid email.`,
      },
    },
    profilePic: { type: String, default: null },

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: { type: String, default: null },
    middleName: { type: String, default: null },

    lastName: { type: String, default: null },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
      message: "Gender must be either male, female, or other.",
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      // required: true,
      default: null,
      // validate: {
      //   validator: function (value) {
      //     // Check if the date matches the YYYY-MM-DD format
      //     return dateOfBirthFormat.test(value);
      //   },
      //   message: (props) =>
      //     `${props.value} is not a valid date of birth. Use YYYY-MM-DD format.`,
      // },
    },

    leavedDate: {
      type: String,
      default: null,
      // validate: {
      //   validator: function (value) {
      //     // Check if the date matches the YYYY-MM-DD format
      //     return dateOfBirthFormat.test(value);
      //   },
      //   message: (props) =>
      //     `${props.value} is not a valid date of birth. Use YYYY-MM-DD format.`,
      // },
    },
    address: { type: String, default: null },
    bloodGroup: { type: String, default: null },
    maritalStatus: { type: String, default: null },
    isVerifiedPhone: { type: Boolean, default: false },
    isVerifiedEmail: { type: Boolean, default: false },
    department: {
      type: String,
      required: true,
      ref: "departments",
    },
    designation: {
      type: String,
      required: true,
      ref: "designations",
    },
    division: {
      type: String,
      required: true,
      ref: "divisions",
    },
    reportingTo: {
      type: String,
      ref: "employees",
      default: null,
    },
    countryCode: { type: String, default: "+91" },
    phoneNumber: { type: Number, required: true, default: null },
    isVerified: { type: Boolean, required: true, default: false },
    status: { type: String, default: "active" },
    remark: { type: String, default: "" },
    refreshToken: { type: String, default: null },
    role: {
      type: String,
      // required: true,
      default: "employee",
      enum: ["employee", "channel-partner", "customer"],
    },
    personalDocument: [
      {
        typeOfDocument: { type: String, default: null, unique: true },
        documentNumber: { type: String, default: null },
        name: { type: String, default: null },
        file: { type: String, default: null },
        frontSide: { type: String, default: null },
        backSide: { type: String, default: null },
      },
    ],
    mpin: { type: String, default: null },
    mpinChangeDate: { type: Date, default: null },
    scale: {
      type: String,
      ref: "scale",
      default: null,
    },
    incentive: {
      type: String,
      ref: "incentive",
      default: null,
    },
    experienceStatus: {
      type: String,
      default: null,
    },
    shifInfo: {
      type: String,
      ref: "employeeShiftInfo",
      default: null,
    },
    permissions: [String],
  },
  { timestamps: true }
);

const employeeModel = mongoose.model("employees", employeeSchema, "employees");
export default employeeModel;
