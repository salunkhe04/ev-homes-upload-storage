import mongoose from "mongoose";
// const emailFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const cycle = {
  stage: {
    type: String,
    default: null,
  },
  currentOrder: {
    type: Number,
    default: 1,
  },
  currentDays: {
    type: Number,
    default: 14,
  },
  teamLeader: {
    type: String,
    ref: "employees",
    default: null,
  },
  startDate: {
    type: Date,
    default: null,
  },
  validTill: {
    type: Date,
    default: null,
  },
  nextTeamLeader: {
    type: String,
    ref: "employees",
    default: null,
  },
};
const cycleSchema = new mongoose.Schema(
  {
    ...cycle,
  },
  { timestamps: true }
);

const approvalSchema = new mongoose.Schema({
  employee: {
    type: String,
    ref: "employees",
    // required: true,
  },
  approvedAt: {
    type: Date,
    default: Date.now,
  },
  remark: { type: String, default: null },
});
const updateSchema = new mongoose.Schema({
  employee: {
    type: String,
    ref: "employees",
    // required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  changes: { type: String, default: "" },
  remark: { type: String, default: null },
});
// const callHistorySchema = new mongoose.Schema({
//   caller: {
//     type: String,
//     ref: "employees",
//     // required: true,
//   },
//   callDate: {
//     type: Date,
//     default: Date.now,
//   },
//   remark: {
//     type: String,
//     default: null,
//   },
//   feedback: {
//     type: String,
//     default: null,
//   },
//   document: {
//     type: String,
//     default: null,
//   },
//   recording: {
//     type: String,
//     default: null,
//   },
//   stage: {
//     type: String,
//     default: null,
//   },
//   interestedStatus: {
//     type: String,
//     default: null,
//   },
// });

const callHistorySchema = new mongoose.Schema({
  caller: {
    type: String,
    ref: "employees",
    // required: true,
  },
  callDate: {
    type: Date,
    default: Date.now,
  },
  document: {
    type: String,
    default: null,
  },
  recording: {
    type: String,
    default: null,
  },
  // Call Status
  remark: {
    type: String,
    default: null,
  },
  // feedback
  feedback: {
    type: String,
    default: null,
  },
  // lead stage -> / Just-curious /in-progress/supposed-to-visit/visit-done/revisit-done/booked/lost
  stage: {
    type: String,
    default: null,
  },
  // client status -> /interested/not-interested/DND/Moderate
  interestedStatus: {
    type: String,
    default: null,
  },
  // cold / warm / hot
  tag: {
    type: String,
    default: null,
  },
  interestedVisit: {
    type: Boolean,
    default: null,
  },
  reminderType: {
    type: String,
    default: null,
  },
});

const channelPartnerHistory = new mongoose.Schema({
  channelPartner: {
    type: String,
    ref: "channelPartners",
    required: true,
  },
  stage: { type: String, default: null },
  startDate: {
    type: Date,
    default: null,
  },
  validTill: {
    type: Date,
    default: null,
  },
});

export const leadSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: null,
    },
    project: [
      {
        type: String,
        ref: "ourProjects",
        // required: true,
      },
    ],
    requirement: [
      {
        type: String,
        // required: true,
      },
    ],
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    address: { type: String, default: null },
    leadType: { type: String, default: "channel-partner" },
    reference: {
      type: String,
      ref: "reference",
      default: null,
    },
    channelPartner: {
      type: String,
      ref: "channelPartners",
      default: null,
    },
    dataAnalyzer: {
      type: String,
      ref: "employees",
      default: null,
    },
    teamLeader: {
      type: String,
      ref: "employees",
      default: null,
    },
    preSalesExecutive: {
      type: String,
      ref: "employees",
      default: null,
    },
    salesExecutive: {
      type: String,
      ref: "employees",
      default: null,
    },
    salesManager: {
      type: String,
      ref: "employees",
      default: null,
    },
    countryCode: { type: String, default: "+91" },
    phoneNumber: { type: Number, default: null, unique: true },
    altPhoneNumber: { type: Number, default: null },
    remark: { type: String, default: null },
    leadType: { type: String, default: "cp" },
    stage: { type: String, default: "approval" },
    startDate: {
      type: Date,
      // required: true,
      default: Date.now,
    },
    validTill: {
      type: Date,
      // required: true,
      default: function () {
        let startDate = this.startDate || Date.now();
        let validTillDate = new Date(startDate);
        validTillDate.setDate(validTillDate.getDay() + 59);
        return validTillDate;
      },
    },
    previousValidTill: {
      type: Date,
      default: null,
    },
    approvalStatus: {
      type: String,
      default: "pending",
    },
    approvalRemark: {
      type: String,
      default: "",
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    visitStatus: {
      type: String,
      default: "pending",
    },
    visitRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "siteVisits",
      default: null,
    },
    taskRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "task",
      default: null,
    },
    revisitStatus: {
      type: String,
      default: "pending",
    },
    revisitRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "siteVisits",
      default: null,
    },
    bookingStatus: {
      type: String,
      default: "pending",
    },
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postSaleLead",
      default: null,
    },
    followupStatus: {
      type: String,
      default: "pending",
    },
    contactedStatus: {
      type: String,
      default: "pending",
    },
    interestedStatus: {
      type: String,
      default: null,
      default: "just-curious", // hot/warm/cold/just-curious
    },
    clientInterestedStatus: {
      type: String,
      default: null, // interested/not-interested
    },
    clientStatus: {
      type: String,
      default: "none",
    },
    clientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clients",
      default: null,
    },
    status: {
      type: String,
      default: "pending",
    },
    siteVisitInterested: {
      type: Boolean,
      default: false,
    },
    siteVisitInterestedDate: {
      type: Date,
      default: null,
    },
    cycle: cycleSchema,
    approvalHistory: [approvalSchema],
    updateHistory: [updateSchema],
    cycleHistory: [cycleSchema],
    callHistory: [callHistorySchema],
    followupHistory: [callHistorySchema],
    channelPartnerHistory: channelPartnerHistory,
    virtualMeetingDoc: {
      type: String,
      default: null,
    },
    leadAssignedEmailSent: {
      type: Boolean,
      default: false,
    },
    feedbackPendingEmailSent: {
      type: Boolean,
      default: false,
    },
    hideStatusDate: {
      type: Date,
      default: null,
    },
    hideStatus: {
      type: Boolean,
      default: false,
    },
    hideRemark: {
      type: String,
      default: null,
    },
    nameRemark: {
      type: String,
      default: null,
    },
    createdThrough: {
      type: String,
      default: null,
    },
  },

  { timestamps: true }
);

const leadModel = mongoose.model("leads", leadSchema, "leads");
export default leadModel;
