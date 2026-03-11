// export const respCode = {
//   CP_ALREADY_EXIST: "channel-partner-already-exist",
//   CP_NOT_FOUND: "channel-partner-not-found",
//   CP_NOT_VERIFIED: "channel-partner-not-verified",
//   CP_VERIFIED: "channel-partner-verified",
//   CP_REGISTERED: "channel-partner-registered",
//   LOGIN_SUCCESS: "login-successful",
//   LOGIN_FAILED: "login-failed",
//   OTP_RESENT_SUCCESS: "otp-resent-success",
//   INVALID_OTP_SUCCESS: "otp-resent-invalid",
//   OTP_MATCHED: "otp-resent-matched",
//   OTP_SENT_SUCCESS: "otp-sent-success",
//   PASSWORD_RESET_SUCCESS: "password-reset-success",
//   FIELDS_EMPTY: "field-is-empty",
//   PASSWORD_NOT_MATCHED: "password-not-matched",
//   PASSWORD_MIN_LENGTH_ERROR: "password-min-length-error",
// };

import { se } from "date-fns/locale";
import { populate } from "dotenv";

export const errorMessage = {
  EMP_NOT_FOUND:
    "We were unable to find an employee associated with the provided information.",
  EMP_INFO_UPDATED:
    "Successfully updated the employee details for the specified information.",
  EMP_DELETED:
    "Employee information has been successfully removed for the given ID.",
  EMP_EMAIL_EXIST: "An employee with this email address is already registered.",
  EMP_REGISTER_SUCCESS: "Your registration as an employee is complete.",
  EMP_EMAIL_NOT_EXIST:
    "The email address does not match any registered employee.",
  INVALID_PASS: "The passwords do not match. Please try again.",
  EMP_LOGIN_SUCCESS: "Welcome back! You have logged in successfully.",
};

export const employeePopulateOptions = [
  {
    path: "designation",
    select: "designation",
  },
  {
    path: "department",
    select: "department",
  },
  {
    path: "division",
    select: "division",
  },
  {
    path: "reportingTo",
    select: "firstName lastName profilePic employeeId",
    populate: [
      { path: "designation" },
      { path: "department" },
      { path: "division" },
    ],
  },
  {
    path: "incentive",
    select: "-bookings",
    populate: [
      {
        path: "scale",
      },
      {
        path: "userId",
        select: "firstName lastName employeeId ",
      },
    ],
  },
  // didnt populated due to slow performance
  // {
  //   path: "shifInfo",
  //   populate: [
  //     {
  //       path: "userId",
  //       select: "firstName lastName employeeId",
  //       populate: [
  //         { path: "designation" },
  //         {
  //           path: "reportingTo",
  //           select: "firstName lastName",
  //           populate: [{ path: "designation" }],
  //         },
  //       ],
  //     },
  //     {
  //       path: "shift",
  //       select: "-employees",
  //     },
  //     {
  //       path: "faceId",
  //       // select: "-preLoadedFace",
  //       populate: [
  //         {
  //           path: "userId",
  //           select: "firstName lastName",
  //         },
  //         {
  //           path: "approveBy",
  //           select: "firstName lastName",
  //         },
  //       ],
  //     },
  //   ],
  // },
];

export const clientPopulateOptions = [
  {
    path: "projects",
    select: "name",
  },
  {
    path: "projects",
    select: "name",
  },
  {
    path: "closingManager",
    select: "-password -refreshToken",
    populate: [
      { path: "designation" },
      { path: "department" },
      { path: "division" },
    ],
  },
];

export const leadPopulateOptions = [
  {
    path: "channelPartner",
    select: "-password -refreshToken",
  },
  {
    path: "project",
    select: "name",
  },
  {
    path: "teamLeader",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycle.teamLeader",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycle.nextTeamLeader",
    select: "firstName lastName email",
  },

  {
    path: "dataAnalyzer",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  //not used
  // {
  //   path: "preSalesExecutive",
  //   select: "firstName lastName",
  //   populate: [
  //     { path: "designation" },
  //     {
  //       path: "reportingTo",
  //       select: "firstName lastName",
  //       populate: [{ path: "designation" }],
  //     },
  //   ],
  // },
  {
    path: "approvalHistory.employee",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "updateHistory.employee",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycleHistory.nextTeamLeader",
    select: "firstName lastName email",
  },

  {
    path: "cycleHistory.teamLeader",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycleHistoryNew.teamLeader",
    select: "firstName lastName",
  },

  {
    path: "callHistory.caller",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
  {
    path: "callHistory.notes.channelPartner",
    select: "firmName firstName lastName",
  },

  {
    path: "visitRef",
    populate: [
      { path: "projects", select: "name" },
      { path: "location", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "attendedBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataEntryBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "closingTeam",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "revisitRef",
    populate: [
      { path: "projects", select: "name" },
      { path: "location", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "attendedBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataEntryBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "closingTeam",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "bookingRef",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleAssignTo",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "callHistory.caller",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "taskRef",
    populate: [
      // {
      //   path: "lead",
      //   populate: leadPopulateOptions,
      // },
      {
        path: "assignBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "assignTo",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "transferTaskFrom",
        select: "firstName lastName",
      },
    ],
  },
  {
    path: "channelPartnerHistory.channelPartner",
    select: "firstName lastName firmName",
  },
];

export const leadTaskPopulateOptions = [
  {
    path: "channelPartner",
    select: "-password -refreshToken",
  },
  {
    path: "project",
    select: "name",
  },
  {
    path: "teamLeader",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycle.teamLeader",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "dataAnalyzer",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  //not used
  // {
  //   path: "preSalesExecutive",
  //   select: "firstName lastName",
  //   populate: [
  //     { path: "designation" },
  //     {
  //       path: "reportingTo",
  //       select: "firstName lastName",
  //       populate: [{ path: "designation" }],
  //     },
  //   ],
  // },
  {
    path: "approvalHistory.employee",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },

  {
    path: "cycleHistory.teamLeader",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "callHistory.caller",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
  {
    path: "visitRef",
    populate: [
      { path: "projects", select: "name" },
      { path: "location", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "attendedBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataEntryBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "closingTeam",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "revisitRef",
    populate: [
      { path: "projects", select: "name" },
      { path: "location", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "attendedBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataEntryBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "closingTeam",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "bookingRef",

    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleAssignTo",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "callHistory.caller",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },

  {
    path: "channelPartnerHistory.channelPartner",
    select: "firstName lastName firmName",
  },
];

export const leadPopulateOptions2 = [
  {
    path: "channelPartner",
    select: "-password -refreshToken",
  },
  {
    path: "project",
    select: "name",
  },
  {
    path: "teamLeader",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycle.teamLeader",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "dataAnalyzer",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "preSalesExecutive",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalHistory.employee",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "updateHistory.employee",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "cycleHistory.teamLeader",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "callHistory.caller",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
  {
    path: "visitRef",
    populate: [
      { path: "projects", select: "name" },
      { path: "location", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "attendedBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataEntryBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "closingTeam",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "revisitRef",
    populate: [
      { path: "projects", select: "name" },
      { path: "location", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "attendedBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataEntryBy",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "closingTeam",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "bookingRef",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
];

export const meetingPopulateOptions = [
  {
    path: "project",
    select: "name",
  },
  {
    path: "place",
  },
  {
    path: "customer",
    select: "-password",
    populate: [
      { path: "projects", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },

          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "meetingWith",
    select: "firstName lastName",
    populate: [
      { path: "designation" },

      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "postSaleBooking",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "lead",
    populate: [
      {
        path: "channelPartner",
        select: "-password -refreshToken",
      },
      {
        path: "project",
        select: "name",
      },
      {
        path: "teamLeader",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "cycle.teamLeader",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "dataAnalyzer",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "preSalesExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "approvalHistory.employee",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "updateHistory.employee",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "callHistory.caller",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const meetingRequestPopulateOptions = [
  {
    path: "teamLeader",
    select: "firstName lastName",
  },
  {
    path: "lead",
    select: "firstName lastName phoneNumber email project teamLeader",
    populate: [
      {
        path: "project",
        select: "name",
      },
      {
        path: "teamLeader",
        select: "firstName lastName",
      },
      // {
      //   path: "callHistory.caller",
      //   select: "firstName lastName",
      // },
      // {
      //     path: "approvalHistory.employee",
      //     select: "firstName lastName",
      //   },
      //   {
      //     path: "updateHistory.employee",
      //     select: "firstName lastName",
      //   },
    ],
  },
];

export const paymentPopulateOptions = [
  {
    path: "projects",
    select: "name",
  },
  // {
  //   path: "slab",
  //   select: "",
  //   populate: [
  //     { path: "projects",select:"name" },

  //   ],
  // },
];

export const leaveHistoryPopulateOptions = [
  {
    path: "userId",
    select: "firstName lastName",
  },
  {
    path: "adminId",
    select: "firstName lastName",
  },
  {
    path: "leave",
    select: "appliedOn leaveReason leaveStatus startDate endDate",
  },
  {
    path: "regularization",
    select: "regularizationDate reason regularizationStatus regularizationDate",
  },
];

export const postSalePopulateOptions = [
  { path: "project", select: "name shortCode" },
  {
    path: "closingManager",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "postSaleExecutive",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "postSaleAssignTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "callHistory.caller",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
  {
    path: "uploadedDocuments.uploadedBy",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
];

export const siteVisitPopulateOptions = [
  { path: "projects", select: "name" },
  { path: "location", select: "name address" },
  {
    path: "closingManager",
    select: "firstName lastName",
    // populate: [
    //   { path: "designation" },
    //   {
    //     path: "reportingTo",
    //     select: "firstName lastName",
    //     populate: [{ path: "designation" }],
    //   },
    // ],
  },
  {
    path: "attendedBy",
    select: "firstName lastName",
    // populate: [
    // { path: "designation" },
    // {
    //   path: "reportingTo",
    //   select: "firstName lastName",
    //   populate: [{ path: "designation" }],
    // },
    // ],
  },
  {
    path: "dataEntryBy",
    select: "firstName lastName",
    // populate: [
    //   { path: "designation" },
    // {
    //   path: "reportingTo",
    //   select: "firstName lastName",
    //   populate: [{ path: "designation" }],
    // },
    // ],
  },
  {
    path: "callBy",
    select: "firstName lastName",
  },
  {
    path: "closingTeam",
    select: "firstName lastName",
    // populate: [
    //   { path: "designation" },
    // {
    //   path: "reportingTo",
    //   select: "firstName lastName",
    //   populate: [{ path: "designation" }],
    // },
    // ],
  },
  {
    path: "channelPartner",
    select: "firstName lastName firmName",
  },
  {
    path: "dataAnalyzer",
    select: "firstName lastName",
  },
  {
    path: "approveBy",
    select: "firstName lastName",
  },
  {
    path: "entryBy",
    select: "firstName lastName",
  },
];

export const taskPopulateOptions = [
  {
    path: "lead",
    populate: leadPopulateOptions,
  },
  {
    path: "assignBy",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "assignTo",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "transferTaskFrom",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const taskReminderPopulateOptions = [
  {
    path: "lead",
    select: "firstName lastName phoneNumber taskRef hideStatus",
  },
  {
    path: "assignBy",
    select: "firstName lastName email",
  },
  {
    path: "assignTo",
    select: "firstName lastName email",
  },
];

export const auditSectionPopulateOption = [
  {
    path: "executive",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "teamLeaders",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const attendancePopulateOption = [
  {
    path: "userId",
    select: "firstName lastName employeeId",
    populate: [
      { path: "designation" },
      { path: "division" },
      { path: "department" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const tansportPopulateOptions = [
  {
    path: "vehicle",
  },
  {
    path: "pickupLocation",
  },
  {
    path: "destination",
  },
  {
    path: "manager",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "smanagerList",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const leaveRequestPopulateOptions = [
  {
    path: "leaveType",
  },
  {
    path: "applicant",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const weekOffRequestPopulateOptions = [
  {
    path: "applyBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const regularizationPopulateOptions = [
  {
    path: "applyBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "attendance",
    populate: [
      {
        path: "userId",
        select: "firstName lastName employeeId",
        populate: [
          { path: "designation" },
          { path: "division" },
          { path: "department" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const reimbursementPopulateOptions = [
  {
    path: "applyBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "attendance",
    populate: [
      {
        path: "userId",
        select: "firstName lastName employeeId",
        populate: [
          { path: "designation" },
          { path: "division" },
          { path: "department" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const shiftPlannerRequestPopulateOptions = [
  {
    path: "appliedBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approveBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "requestedShift",
    populate: [
      {
        path: "employees",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const assetRequestPopulateOptions = [
  {
    path: "applyBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "accessory",
  },
];

export const visitNotificationImage =
  "https://cdn.evhomes.tech/6f309fa3-eabd-4d01-a809-97c9aae6e663-25827748_architects_doing_the_building_plan_00.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaWxlbmFtZSI6IjZmMzA5ZmEzLWVhYmQtNGQwMS1hODA5LTk3YzlhYWU2ZTY2My0yNTgyNzc0OF9hcmNoaXRlY3RzX2RvaW5nX3RoZV9idWlsZGluZ19wbGFuXzAwLnBuZyIsImlhdCI6MTczNTg5MzgwM30.Oj7sRiQRJhBW5G4kU9JNtsyONainESjcv6vGo0HHYBI";

export const slabPopulateOptions = [
  {
    path: "project",
    // select: "name",
  },
  // {
  //   path: "bookingRef",
  //   populate: [
  //     { path: "project", select: "name" },
  //     {
  //       path: "closingManager",
  //       select: "firstName lastName",
  //       populate: [
  //         { path: "designation" },
  //         {
  //           path: "reportingTo",
  //           select: "firstName lastName",
  //           populate: [{ path: "designation" }],
  //         },
  //       ],
  //     },
  //     {
  //       path: "postSaleExecutive",
  //       select: "firstName lastName",
  //       populate: [
  //         { path: "designation" },
  //         {
  //           path: "reportingTo",
  //           select: "firstName lastName",
  //           populate: [{ path: "designation" }],
  //         },
  //       ],
  //     },
  //   ],
  // },
];

export const teamSectionPopulateOptions = [
  { path: "designations" },
  {
    path: "members",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const shiftPopulateOptions = [
  {
    path: "employees",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const employeeShiftInfoPopulateOptions = [
  {
    path: "userId",
    select: "firstName lastName employeeId status",
    populate: [
      { path: "designation" },
      { path: "division" },
      { path: "department" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "shift",
    select: "-employees",
    // populate: [
    //   {
    //     path: "employees",
    //     select: "firstName lastName",
    //     populate: [
    //       { path: "designation" },
    //       {
    //         path: "reportingTo",
    //         select: "firstName lastName",
    //         populate: [{ path: "designation" }],
    //       },
    //     ],
    //   },
    // ],
  },
  {
    path: "faceId",
    select: "-preLoadedFace",
    populate: [
      {
        path: "userId",
        select: "firstName lastName",
      },
      {
        path: "approveBy",
        select: "firstName lastName",
      },
    ],
  },
  {
    path: "department",
    select: "department",
  },
];

export const faceIdPopulations = [
  {
    path: "userId",
    select: "firstName lastName",
  },
  {
    path: "approveBy",
    select: "firstName lastName",
  },
];
export const approvalStepPopulations = [
  {
    path: "steps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const demandPopulationOptions = [
  {
    path: "project",
  },
  {
    path: "booking",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleAssignTo",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "callHistory.caller",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "payments",
    populate: [
      {
        path: "projects",
        select: "name",
      },
    ],
  },
];

export const employeeShiftInfoRequestPopulateOptions = [
  {
    path: "userId",
    select: "firstName lastName employeeId",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },

  {
    path: "shift",

    populate: [
      {
        path: "userId",
        select: "firstName lastName employeeId",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "shift",
        populate: [
          {
            path: "employees",
            select: "firstName lastName",
            populate: [
              { path: "designation" },
              {
                path: "reportingTo",
                select: "firstName lastName",
                populate: [{ path: "designation" }],
              },
            ],
          },
        ],
      },
      {
        path: "faceId",
      },
    ],
  },
];

export const estimateGeneratedPopulateOptions = [
  {
    path: "lead",
    select:
      "firstName lastName teamLeader phoneNumber address leadType channelPartner",

    populate: [
      {
        path: "channelPartner",
        select: "firmName",
      },
      {
        path: "project",
        select: "name logo",
      },
      {
        path: "teamLeader",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },

      // {
      //   path: "taskRef",
      //   populate: [
      //     // {
      //     //   path: "lead",
      //     //   populate: leadPopulateOptions,
      //     // },
      //     {
      //       path: "assignBy",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "assignTo",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //   ],
      // },
      // {
      //   path: "dataAnalyzer",
      //   select: "firstName lastName",
      //   populate: [
      //     { path: "designation" },
      //     {
      //       path: "reportingTo",
      //       select: "firstName lastName",
      //       populate: [{ path: "designation" }],
      //     },
      //   ],
      // },
      // {
      //   path: "preSalesExecutive",
      //   select: "firstName lastName",
      //   populate: [
      //     { path: "designation" },
      //     {
      //       path: "reportingTo",
      //       select: "firstName lastName",
      //       populate: [{ path: "designation" }],
      //     },
      //   ],
      // },
      // {
      //   path: "approvalHistory.employee",
      //   select: "firstName lastName",
      //   populate: [
      //     { path: "designation" },
      //     {
      //       path: "reportingTo",
      //       select: "firstName lastName",
      //       populate: [{ path: "designation" }],
      //     },
      //   ],
      // },
      // {
      //   path: "updateHistory.employee",
      //   select: "firstName lastName",
      //   populate: [
      //     { path: "designation" },
      //     {
      //       path: "reportingTo",
      //       select: "firstName lastName",
      //       populate: [{ path: "designation" }],
      //     },
      //   ],
      // },
      // {
      //   path: "callHistory.caller",
      //   select: "firstName lastName",
      //   populate: [{ path: "designation" }],
      // },
      // {
      //   path: "visitRef",
      //   populate: [
      //     { path: "projects", select: "name" },
      //     { path: "location", select: "name" },
      //     {
      //       path: "closingManager",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "attendedBy",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "dataEntryBy",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "closingTeam",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //   ],
      // },
      // {
      //   path: "revisitRef",
      //   populate: [
      //     { path: "projects", select: "name" },
      //     { path: "location", select: "name" },
      //     {
      //       path: "closingManager",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "attendedBy",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "dataEntryBy",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "closingTeam",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //   ],
      // },
      // {
      //   path: "bookingRef",
      //   populate: [
      //     { path: "project", select: "name" },
      //     {
      //       path: "closingManager",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //     {
      //       path: "postSaleExecutive",
      //       select: "firstName lastName",
      //       populate: [
      //         { path: "designation" },
      //         {
      //           path: "reportingTo",
      //           select: "firstName lastName",
      //           populate: [{ path: "designation" }],
      //         },
      //       ],
      //     },
      //   ],
      // },
    ],
  },
  ,
  { path: "project", select: "name logo" },
  { path: "coupon", select: "codeName codeValue disPercentage" },
  {
    path: "generatedBy",
    select: "firstName lastName email",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const passbackEstimatePopulateOptions = [
  {
    path: "lead",
    select: "firstName lastName phoneNumber  channelPartner",
    populate: [
      {
        path: "channelPartner",
        select: "firmName firstName lastName",
      },
    ],
  },
  {
    path: "requestedBy",
    select: "firstName lastName employeeId",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "estimate",
    populate: [
      { path: "lead", select: "firstName lastName phoneNumber" },
      { path: "slab" },
      { path: "project", select: "name" },
      { path: "generatedBy", select: "firstName lastName employeeId" },
      { path: "teamLeader", select: "firstName lastName employeeId" },
      { path: "coupon", select: "codeName codeValue disPercentage" },
    ],
  },
  {
    path: "channelPartner",
    select: "firmName firstName lastName",
  },
];

export const appDevTaskPopulateOption = [
  {
    path: "assignBy",
    select: "firstName lastName employeeId",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "assignTo",
    select: "firstName lastName employeeId",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const messagePopulationOptions = [
  { path: "mentioned.employee", select: "firstName lastName" },
  { path: "mentioned.taggedBy", select: "firstName lastName" },
  { path: "seenBy.employee", select: "firstName lastName" },
  { path: "sentBy", select: "firstName lastName" },
];

export const warnLetterPopulations = [
  {
    path: "givenTo",
    select: "firstName lastName email",
  },
  {
    path: "givenBy",
    select: "firstName lastName email",
  },
];

export const incentivePopulations = [
  {
    path: "userId",
    select: "firstName lastName email profilePic employeeId designation",
    populate: [{ path: "designation" }],
  },
  {
    path: "scale",
  },
  {
    path: "bookings",
    select: "_id",
    select:
      "-postSaleExecutive -preRegistrationCheckList -postSaleAssignTo -callHistory -parking -applicants -closingManagerTeam",
    populate: [
      { path: "project", select: "name " },
      {
        path: "closingManager",
        select: "firstName lastName",
        // populate: [
        //   { path: "designation" },
        //   {
        //     path: "reportingTo",
        //     select: "firstName lastName",
        //     populate: [{ path: "designation" }],
        //   },
        // ],
      },
      {
        path: "postSaleExecutive",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "postSaleAssignTo",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      {
        path: "callHistory.caller",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const eligibilityRequestPopulate = [
  {
    path: "scale",
  },
  {
    path: "appliedBy",
    select:
      "firstName lastName email profilePic employeeId designation incentive",
    populate: [
      { path: "designation" },
      {
        path: "incentive",
        populate: [
          {
            path: "scale",
          },
          {
            path: "userId",
            select: "firstName lastName employeeId ",
          },
        ],
      },
    ],
  },
  {
    path: "approvalBy",
    select: "firstName lastName email profilePic employeeId designation",
    populate: [{ path: "designation" }],
  },
  { path: "exam" },
  {
    path: "scheduleExam",
    populate: [
      { path: "eligibilityRequest", select: "_id" },
      {
        path: "appliedBy",
        select: "firstName lastName",
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "examAttempts",
    populate: [{ path: "exam" }, { path: "examAnswer" }],
  },
];

export const eligibilityAnswerPopulate = [
  // {
  //   path:"exam",

  // },
  {
    path: "eligibilityRequest",
    select: "scale exam",
    populate: [
      { path: "exam" },
      {
        path: "scale",
      },
    ],
  },
];

export const brokeragePopulate = [
  {
    path: "project",
    select: "name",
  },
  {
    path: "channelPartner",
    select: "firmName",
  },
  {
    path: "generatedBy",
    select: "firstName lastName",
  },
  {
    path: "lead",
    select: "firstName lastName phoneNumber teamLeader",
    populate: [{ path: "teamLeader", select: "firstName lastName" }],
  },
];

export const cponboardPopulate = [
  {
    path: "onBoardedBy",
    select: "firstName lastName",
  },
];

export const cponboardTargetPopulate = [
  {
    path: "onboards",
  },
];

export const revisedTargetPopulate = [
  {
    path: "staffId",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
  { path: "projectWise.projectId", select: "name" },
];

export const empDocRequestPopulate = [
  {
    path: "appliedBy",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "reportingTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "approvalSteps.adminId",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const rankingTurnPopulate = [
  {
    path: "period",
  },
  {
    path: "ranking.user",
    select: "firstName lastName",
  },

  // { path: "projectWise.projectId", select: "name" },
];

export const teamInsightPopulate = [
  {
    path: "reportingTo",
    select: "firstName lastName employeeId reportingTo",
    populate: [
      {
        path: "reportingTo",
        select: "firstName lastName",
      },
    ],
  },
  {
    path: "crew.teamMember",
    select: "firstName lastName employeeId",
  },
];

export const extAttReqPopulateOptions = [
  {
    path: "teamLeader",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },

  {
    path: "user",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
];

export const demandPopulationOptionsv2 = [
  {
    path: "project",
    select: "name",
  },
  {
    path: "booking",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
        populate: [
          { path: "designation" },
          {
            path: "reportingTo",
            select: "firstName lastName",
            populate: [{ path: "designation" }],
          },
        ],
      },
      // {
      //   path: "postSaleExecutive",
      //   select: "firstName lastName",
      //   populate: [
      //     { path: "designation" },
      //     {
      //       path: "reportingTo",
      //       select: "firstName lastName",
      //       populate: [{ path: "designation" }],
      //     },
      //   ],
      // },
      // {
      //   path: "postSaleAssignTo",
      //   select: "firstName lastName",
      //   populate: [
      //     { path: "designation" },
      //     {
      //       path: "reportingTo",
      //       select: "firstName lastName",
      //       populate: [{ path: "designation" }],
      //     },
      //   ],
      // },
      // {
      //   path: "callHistory.caller",
      //   select: "firstName lastName",
      //   populate: [{ path: "designation" }],
      // },
    ],
  },
  {
    path: "payments",
    populate: [
      {
        path: "projects",
        select: "name",
      },
    ],
  },
];

export const postSalePopulateOptionsv2 = [
  {
    path: "project",
    select: "name shortCode address businessAccount govAccount",
  },
  {
    path: "closingManager",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "postSaleExecutive",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "postSaleAssignTo",
    select: "firstName lastName",
    populate: [
      { path: "designation" },
      {
        path: "reportingTo",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      },
    ],
  },
  {
    path: "callHistory.caller",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
  {
    path: "uploadedDocuments.uploadedBy",
    select: "firstName lastName",
    populate: [{ path: "designation" }],
  },
];

export const eoiConfirmationPopulations = [
  {
    path: "eoi.generatedBy",
    select: "firstName lastName",
  },
  {
    path: "confirmation.generatedBy",
    select: "firstName lastName",
  },
  {
    path: "project",
    select: "name shortCode address businessAccount govAccount",
  },

  {
    path: "booking",
    select: "applicants project unitNo buildingNo",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
      },
    ],
  },
  {
    path: "lead",
    select: "firstName lastName phoneNumber teamLeader",
    populate: [
      {
        path: "teamLeader",
        select: "firstName lastName",
      },
    ],
  },
  // {
  //   path: "eoiList.generatedBy",
  //   select: "firstName lastName",
  // },
  // {
  //   path: "confirmationList.generatedBy",
  //   select: "firstName lastName",
  // },
];

export const eoiExhibitionPopulations = [
  {
    path: "entryBy",
    select: "firstName lastName",
  },
  {
    path: "closingManager",
    select: "firstName lastName",
  },
  {
    path: "project",
    select: "name shortCode address businessAccount govAccount",
  },
];

export const onBoardExhibPopulations = [
  {
    path: "projects",
    select: "name shortCode address businessAccount govAccount",
  },

  {
    path: "closingManager",
    select: "firstName lastName",
  },
];

export const designTaskPopulateOptions = [
  {
    path: "assignBy",
    select: "firstName lastName email",
  },
  {
    path: "assignTo",
    select: "firstName lastName email",
  },
  {
    path: "pendency.approveBy",
    select: "firstName lastName email",
  },
  {
    path: "approval.approveBy",
    select: "firstName lastName email",
  },
  {
    path: "transferTaskFrom",
    select: "firstName lastName",
  },
];

export const leadPopulateOptionsv3 = [
  {
    path: "channelPartner",
    select: "firmName",
  },
  {
    path: "project",
    select: "name",
  },

  {
    path: "bookingRef",
    select: "project closingManager unitNo number floor buildingNo",
    populate: [
      { path: "project", select: "name" },
      {
        path: "closingManager",
        select: "firstName lastName",
      },
    ],
  },
];
