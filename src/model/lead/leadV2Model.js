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
  //
  startDate: {
    type: Date,
    default: null,
  },
  validTill: {
    type: Date,
    default: null,
  },
  // for internal -transfer 3 days
  internalDeadline: {
    type: Date,
    default: null,
  },
  internalDate: {
    type: Date,
    default: null,
  },

  internalCallDone: {
    type: Boolean,
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
  { timestamps: true },
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

const callHistorySchema = new mongoose.Schema(
  {
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
    notes: [
      {
        note: { type: String, default: null },
        date: { type: Date, default: Date.now },
        channelPartner: { type: String, ref: "channelPartners", default: null },
      },
    ],
    edited: {
      type: Boolean,
      default: null,
    },
  },
  { timestamps: true },
);

const channelPartnerHistory = new mongoose.Schema(
  {
    channelPartner: {
      type: String,
      ref: "channelPartners",
      // required: true,
      // unique: true,
    },
    status: { type: String, default: null },
    stage: { type: String, default: null },
    date: {
      type: Date, // this actual lead given date
      default: null,
    },
    startDate: {
      type: Date, // this tagging start if(any)
      default: null,
    },
    validTill: {
      type: Date, // this tagging end if(any)
      default: null,
    },
    approval: approvalSchema,
  },
  { timestamps: true },
);

const lostSchema = new mongoose.Schema({
  employee: {
    type: String,
    ref: "employees",
    // required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  remark: { type: String, default: null },
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
    prefix: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    address: { type: String, default: null },
    leadType: { type: String, default: "cp" },
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
    countryCode: { type: String, default: "+91" },
    phoneNumber: { type: Number, default: null, unique: true },
    altPhoneNumber: { type: Number, default: null },
    remark: { type: String, default: null },
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

    firstVisit: {
      type: Boolean,
      default: false,
    },

    visitDate: {
      type: Date,
      default: null,
    },
    revisitDate: {
      type: Date,
      default: null,
    },
    bookingDate: {
      type: Date,
      default: null,
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

    task: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "task",
        default: null,
      },
      assignTo: {
        type: String,
        default: null,
        ref: "employees",
      },
      assignBy: {
        type: String,
        default: null,
        ref: "employees",
      },
      type: { type: String, default: null },
      assignDate: { type: Date, default: null },
      deadline: { type: Date, default: null },
      completedDate: { type: Date, default: null },
      details: { type: String, default: null },
      completed: { type: Boolean, default: false },
      transferTaskFrom: { type: String, ref: "employees", default: null },
      phoneNumber: { type: Number, default: null },
    },
    // bookings: [
    //   {
    //     _id: { type: String, default: null },
    //     firstName: { type: String, default: null },
    //     lastName: { type: String, default: null },
    //     countryCode: { type: String, default: "+91" },
    //     phoneNumber: { type: Number, default: null },
    //     unitNo: { type: String, default: null },
    //     floor: { type: Number, default: null },
    //     buildingNo: { type: Number, default: null },
    //     number: { type: Number, default: null },
    //     bookingStatus: { type: String, default: null },
    //     registrationDone: { type: Boolean, default: false },
    //     project: {
    //       type: String,
    //       default: null,
    //       ref: "ourProjects",
    //     },
    //     closingManager: {
    //       type: String,
    //       ref: "employees",
    //       default: null,
    //     },
    //     bookingDate: { type: Date, default: null },
    //     bookingCancelDate: { type: Date, default: null },
    //     channelPartner: { type: String, ref: "channelPartners", default: null },
    //     informedStatus: {
    //       type: Boolean,
    //       default: false,
    //     },
    //   },
    // ],

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
    cycleHistoryNew: [cycleSchema],
    callHistory: [callHistorySchema],
    followupHistory: [callHistorySchema],
    channelPartnerHistory: [channelPartnerHistory],
    lostHistory: [lostSchema],
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
    createdThrough: {
      type: String,
      default: null,
    },
    mergeHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isBulkLead: {
      type: Boolean,
      default: false,
    },
    cpNoteResolved: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: null,
    },
    informedStatus: {
      type: Boolean,
      default: false,
    },
    occupation: {
      type: String,
      default: null,
    },
    linkedIn: {
      type: String,
      default: null,
    },
    uploadedLinkedIn: {
      type: String,
      default: null,
    },
    additionLinRemark: {
      type: String,
      default: null,
    },
    isCountable: {
      type: Boolean,
      default: false,
    },
    isCountableVisit: {
      type: Boolean,
      default: false,
    },
    isCountableBooking: {
      type: Boolean,
      default: false,
    },
    brevoCpTaggingRemovedFromList: {
      type: Boolean,
      default: false,
    },

    propertyType: {
      type: String,
      default: null,
      enum: ["residential", "commercial"],
    },
    feedbackGraceTime: {
      type: Date,
      default: Date.now,
    },
    leadFrom: {
      type: String,
      default: null,
      enum: ["exhibition-2025"],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    disabledDate: {
      type: Date,
      default: null,
    },
    disabledRemark: {
      type: String,
      default: null,
    },
    clientType: {
      type: String,
      default: null,
      enum: ["is-channel-partner", "blacklisted-client", "lost"],
    },
    totalCalls: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const leadModelV2 = mongoose.model("lead", leadSchema, "leads");
// const leadModelV2 = mongoose.model("lead", leadSchema, "leads");
export default leadModelV2;
