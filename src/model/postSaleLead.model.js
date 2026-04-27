import mongoose from "mongoose";
const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const applicantSchema = new mongoose.Schema({
  prefix: { type: String, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  address: { type: String, default: null },
  addressLine1: { type: String, default: null },
  addressLine2: { type: String, default: null },
  city: { type: String, default: null },
  pincode: { type: String, default: null },
  countryCode: { type: String, default: "+91" },
  phoneNumber: { type: Number, default: null },
  dob: { type: Date, default: null },
  email: {
    type: String,
    default: null,
    // validate: {
    //   validator: function (value) {
    //     return emailFormat.test(value);
    //   },
    //   message: (props) => `${props.value} is not a valid email.`,
    // },
  },
  kyc: {
    verified: { type: Boolean, default: false },
    addhar: {
      verified: { type: Boolean, default: false },
      document: { type: String, default: null },
      document2: { type: String, default: null },
      documentNumber: { type: String, default: null },
      remark: { type: String, default: "" },
      type: { type: String, default: "aadhar" },
    },
    pan: {
      verified: { type: Boolean, default: false },
      document: { type: String, default: null },
      documentNumber: { type: String, default: null },

      remark: { type: String, default: "" },
      type: { type: String, default: "pan" },
    },
    other: {
      verified: { type: Boolean, default: false },
      document: { type: String, default: null },
      documentNumber: { type: String, default: null },

      remark: { type: String, default: "" },
      type: { type: String, default: "" },
    },
  },
});

const callHistorySchema = new mongoose.Schema({
  caller: {
    type: String,
    ref: "employees",
  },
  callDate: {
    type: Date,
    default: Date.now,
  },
  stage: {
    type: String,
    default: null,
  },
  remark: {
    type: String,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },
  document: {
    type: String,
    default: null,
  },
  recording: {
    type: String,
    default: null,
  },
});

const documentSchema = new mongoose.Schema({
  typeOfDoc: {
    type: String,
    default: null,
  },
  docUrl: {
    type: String,
    default: null,
  },
  uploadedBy: {
    type: String,
    ref: "employees",
    default: null,
  },
  date: {
    type: Date,
    default: null,
  },
});

const paymentDetailSchema = new mongoose.Schema({
  label: {
    type: String,
    default: null,
  },
  paymentAmount: {
    type: Number,
    default: null,
  },
  paymentDueDate: {
    type: Date,
    default: null,
  },
  receivedStatus: {
    type: Boolean,
    default: false,
  },
  paymentReceivedDate: {
    type: Date,
    default: null,
  },
  attachment: [
    {
      document: {
        type: String,
        default: null,
      },
    },
  ],
  remark: {
    type: String,
    default: null,
  },
  receivedAmount: {
    type: Number,
    default: null,
  },
});

const parkingHistorySchema = new mongoose.Schema({
  id: { type: String, default: null },
  floor: { type: Number, default: null },
  number: { type: Number, default: null },
  parkingNo: { type: String, default: null },
  buildingNo: { type: Number, default: null },
  type: { type: String, default: null },
  date: { type: Date, default: null },
});

export const postSaleLeadSchema = new mongoose.Schema(
  {
    unitNo: { type: String, required: true, default: null },
    floor: { type: Number, default: null },
    buildingNo: { type: Number, default: null },
    number: { type: Number, default: null },
    project: {
      type: String,
      required: true,
      default: null,
      ref: "ourProjects",
    },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    requirement: { type: String, default: null },
    countryCode: { type: String, default: "+91" },
    phoneNumber: { type: Number, default: null },
    address: { type: String, default: null },
    email: {
      type: String,
      default: null,

      // validate: {
      //   validator: function (value) {
      //     return emailFormat.test(value);
      //   },
      //   message: (props) => `${props.value} is not a valid email.`,
      // },
    },
    carpetArea: { type: Number, default: null },
    flatCost: { type: Number, default: null },
    closingManager: {
      type: String,
      ref: "employees",
      default: null,
    },
    postSaleExecutive: { type: String, ref: "employees", default: null },
    closingManagerTeam: [
      {
        type: String,
        ref: "employees",
        default: null,
      },
    ],
    postSaleAssignTo: [
      {
        type: String,
        ref: "employees",
        default: null,
      },
    ],
    applicants: [applicantSchema],
    bookingStatus: {
      type: { type: String, default: null },
      account: { type: String, default: null },
      amount: { type: String, default: null },
    },
    preRegistrationCheckList: {
      tenPercentRecieved: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      stampDuty: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      gst: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      noc: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      tds: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      legalCharges: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      kyc: {
        recieved: { type: String, default: "no" },
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
      agreement: {
        prepared: { type: Boolean, default: false },
        handOver: {
          status: { type: String, default: "no" },
          document: { type: String, default: null },
          remark: { type: String, default: "" },
        },
        document: {
          verified: { type: Boolean, default: false },
          document: { type: String, default: null },
          remark: { type: String, default: "" },
        },
      },
    },
    disbursementRecord: [
      {
        value: { type: Number, default: null },
        percent: { type: Number, default: null },
        recievedAmount: { type: Number, default: null },
        gst: { type: Number, default: null },
        remark: { type: String, default: "" },
      },
    ],
    date: { type: Date, default: Date.now },
    allInclusiveAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    stampDutyAmount: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    flatCost: { type: Number, default: 0 },
    registrationDone: { type: Boolean, default: false },
    registrationDoneDate: { type: Date, default: null },
    status: { type: String, default: "booked" },
    bookingCancelRemark: { type: String, default: null },
    bookingCancelDate: { type: Date, default: null },
    bookingFormFront: { type: String, default: null },
    bookingFormBack: { type: String, default: null },
    bookingPdf: { type: String, default: null },
    currentSlab: { type: String, default: null },
    addressLine1: { type: String, default: null },
    addressLine2: { type: String, default: null },
    city: { type: String, default: null },
    pincode: { type: String, default: null },
    callHistory: [callHistorySchema],
    uploadedDocuments: [documentSchema],
    parking: [
      {
        id: { type: String, default: null },
        floor: { type: Number, default: null },
        number: { type: Number, default: null },
        parkingNo: { type: String, default: null },
        buildingNo: { type: Number, default: null },
      },
    ],
    parkingHistory: [parkingHistorySchema],

    agreementValue: {
      type: Number,
      default: null,
    },
    stampDutyValue: {
      type: Number,
      default: null,
    },
    gstValue: {
      type: Number,
      default: null,
    },
    roundedAgreementValue: {
      type: Number,
      default: null,
    },
    roundedStampDutyValue: {
      type: Number,
      default: null,
    },
    roundedGstValue: {
      type: Number,
      default: null,
    },
    adjustedStampDutyAmt: {
      type: Number,
      default: null,
    },
    roundedAdjustedStampDuty: {
      type: Number,
      default: null,
    },
    totalValue: {
      type: Number,
      default: null,
    },
    costSheetUrl: {
      type: String,
      default: null,
    },
    floorRise: {
      type: Number,
      default: null,
    },
    pricingRemark: {
      type: String,
      default: null,
    },
    paymentOneAmt: {
      type: Number,
      default: null,
    },

    paymentTwoAmt: {
      type: Number,
      default: null,
    },
    paymentThreeAmt: {
      type: Number,
      default: null,
    },
    paymentFourAmt: {
      type: Number,
      default: null,
    },
    paymentOneDueDate: {
      type: Date,
      default: null,
    },
    paymentTwoDueDate: {
      type: Date,
      default: null,
    },
    paymentThreeDueDate: {
      type: Date,
      default: null,
    },
    paymentFourDueDate: {
      type: Date,
      default: null,
    },
    paymentScheme: {
      type: String,
      default: null,
    },
    paymentDetailSchema: [paymentDetailSchema],
    sellableCarpetArea: {
      type: Number,
      default: null,
    },
    configuration: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const postSaleLeadModel = mongoose.model(
  "postSaleLead",
  postSaleLeadSchema,
  "postSaleLeads",
);
export default postSaleLeadModel;
