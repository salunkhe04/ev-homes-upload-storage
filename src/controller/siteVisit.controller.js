import siteVisitModel from "../model/siteVisit.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import axios from "axios";
import employeeModel from "../model/employee.model.js";
import otpModel from "../model/otp.model.js";
import { encryptPassword, generateOTP } from "../utils/helper.js";
import leadModel from "../model/lead/lead.model.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
import oneSignalModel from "../model/oneSignal.model.js";
import clientModel from "../model/client.model.js";
import {
  employeePopulateOptions,
  siteVisitPopulateOptions,
  visitNotificationImage,
} from "../utils/constant.js";
import { addContact, sendEmail, sendMultipleEmail } from "../utils/brevo.js";
import {
  cpFeedbackPendingTemplate,
  forgotPasswordTemplete,
  siteVisitOtpTemplete,
  siteVisitOtpTempleteV2,
  siteVisitOtpTempleteV3,
  visitSummaryTemplate,
  visitTemplate,
  visitTemplateV2,
  visitTemplateV3,
} from "../templates/html_template.js";
import moment from "moment-timezone";
import ourProjectModel from "../model/ourProjects.model.js";
import cpModel from "../model/channelPartner.model.js";
import { start } from "repl";
import taskModel from "../model/task.model.js";
import path from "path";
import leadModelV2 from "../model/lead/leadV2Model.js";

Date.prototype.addDays = function (days) {
  const date = new Date(this); // Copy the current date
  date.setDate(this.getDate() + days); // Add the days
  return date;
};
const zone = "Asia/Kolkata"; // or whatever timezone you're working with

export const getSiteVisits = async (req, res) => {
  try {
    const respSite = await siteVisitModel
      .find({
        $or: [
          {
            approvalStatus: { $ne: "rejected" },
          },
          {
            approvalStatus: { $ne: "pending" },
          },
        ],
      })
      .populate(siteVisitPopulateOptions);

    return res.send(
      successRes(200, "Get Site Visit", {
        data: respSite,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};

export const getSiteVisitsById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respSite = await siteVisitModel
      .findById(id)
      .populate(siteVisitPopulateOptions);

    if (!respSite)
      return res.send(
        successRes(404, `Site visit not found with id:${id}`, {
          data: respSite,
        }),
      );
    return res.send(
      successRes(200, "lead by id", {
        data: respSite,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};

export const getSiteVisitByPhoneNumber = async (req, res) => {
  const phoneNumber = req.params.phoneNumber.toString();
  try {
    if (!phoneNumber) return res.send(errorRes(403, "id is required"));

    const respSite = await siteVisitModel
      .findOne({ phoneNumber: phoneNumber })
      .populate(siteVisitPopulateOptions);

    if (!respSite)
      return res.send(
        successRes(404, `Site vist not found with id:${phoneNumber}`, {
          data: respSite,
        }),
      );
    return res.send(
      successRes(200, "lead by id", {
        data: respSite,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};

export const getSiteVisitHistoryByPhone = async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  try {
    if (!phoneNumber) return res.send(errorRes(403, "id is required"));

    const respSite = await siteVisitModel
      .find({ phoneNumber: phoneNumber })
      .populate(siteVisitPopulateOptions)
      .sort({ date: 1 });

    if (!respSite)
      return res.send(
        successRes(404, `Site vist not found with id:${phoneNumber}`, {
          data: respSite,
        }),
      );
    return res.send(
      successRes(200, "lead by id", {
        data: respSite,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};

// export const searchSiteVisits = async (req, res, next) => {
//   try {
//     console.log("entered");
//     let query = req.query.query || "";
//     let page = parseInt(req.query.page) || 1;
//     let limit = parseInt(req.query.limit) || 10;

//     let startDate = req.query.startDate;
//     let endDate = req.query.endDate;
//     let date = req.query.date; // New date parameter

//     let skip = (page - 1) * limit;
//     console.log(startDate);
//     console.log(endDate);
//     console.log(date); // Log the date parameter

//     const isNumberQuery = !isNaN(query);
//     let visitType = null;
//     let status = req.query.status?.toLowerCase();

//     let dateFilter = {};
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       start.setUTCHours(0, 0, 0, 0);

//       const end = new Date(endDate);
//       end.setUTCHours(23, 59, 59, 999);

//       dateFilter = { date: { $gte: start, $lte: end } };
//       console.log("Applying Date Filter:", dateFilter);
//     }

//     // New date filtering logic using if statements
//     if (date) {
//       const today = new Date();
//       let  start = new Date(today), end = new Date(today);

//       if (date.toLowerCase() === 'today') {
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//         dateFilter = { date: { $gte: start, $lte: end } };
//       } else if (date.toLowerCase() === 'yesterday') {
//         start.setUTCDate(today.getUTCDate() - 1);
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//         end.setUTCDate(end.getUTCDate() - 1);
//         dateFilter = { date: { $gte: start, $lte: end } };
//       } else if (date.toLowerCase() === 'last-7-days') {
//         start.setUTCDate(today.getUTCDate() - 7);
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//         dateFilter = { date: { $gte: start, $lte: end } };
//       } else if (date.toLowerCase() === 'last-30-days') {
//         start.setUTCDate(today.getUTCDate() - 30);
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//         dateFilter = { date: { $gte: start, $lte: end } };
//       } else {
//         console.log("Invalid date filter provided");
//       }
//       console.log(start);
//       console.log(end);

//     }

//     // console.log(dateFilter);
//     if (status === "visit") {
//       visitType = { visitType: "visit" };
//     } else if (status === "revisit") {
//       visitType = { visitType: "revisit" };
//     } else if (status === "virtual-meeting") {
//       visitType = { visitType: "virtual-meeting" };
//     }

//     let searchFilter = {
//       ...(visitType != null ? visitType : null),
//       ...dateFilter,
//       $or: [
//         { firstName: { $regex: query, $options: "i" } },
//         { lastName: { $regex: query, $options: "i" } },
//         isNumberQuery
//           ? {
//               $expr: {
//                 $regexMatch: {
//                   input: { $toString: "$phoneNumber" },
//                   regex: query,
//                 },
//               },
//             }
//           : null,
//         { email: { $regex: query, $options: "i" } },
//         { source: { $regex: query, $options: "i" } },
//       ].filter(Boolean), // Remove any null values
//     };

//     // Perform the search with pagination
//     const respSite = await siteVisitModel
//       .find(searchFilter)
//       .skip(skip)
//       .limit(limit)
//       .sort({ date: -1 })
//       .populate(siteVisitPopulateOptions);

//     // Count the total items matching the filter
//     const totalItems = await siteVisitModel.countDocuments(searchFilter);

//      const today = new Date();
//     const startOfToday = new Date(today.setUTCHours(0, 0, 0, 0));
//     const endOfToday = new Date(today.setUTCHours(23, 59, 59, 999));

//   const totalSiteVisits = await siteVisitModel.countDocuments({
//     ...dateFilter,
//   date: { $gte: startOfToday, $lte: endOfToday },
//   visitType: { $exists: true },  // Ensures visitType is present
//   $or: [
//     { source: "cp" },
//     { source: "walk-in" },
//     { visitType: "revisit" },
//     {visitType:"visit"},
//     { visitType: "virtual-meeting" },
//   ]
// });

//     // console.log(startOfToday);
//     // console.log(endOfToday);

//     const visit= await siteVisitModel.countDocuments({
//       ...dateFilter,
//       date: { $gte: startOfToday, $lte: endOfToday },
//       source:{$eq: "cp"},
//       visitType:{$eq:"visit"}
//     });

//   const visit2= await siteVisitModel.countDocuments({
//     ...dateFilter,
//       date: { $gte: startOfToday, $lte: endOfToday },
//       source:{$eq: "walk-in"},
//       $or:[
//       { visitType:{$eq:"visit"},} ,
//       { visitType:{$eq:"revisit"},}

//       ]
//     });

//     const revisit= await siteVisitModel.countDocuments({
//       ...dateFilter,
//       date: { $gte: startOfToday, $lte: endOfToday },
//       visitType:{$eq:"revisit"},
//       source:{$eq: "walk-in"},
//     });

//     const virtualMeeting= await siteVisitModel.countDocuments({
//        ...dateFilter,
//       date: { $gte: startOfToday, $lte: endOfToday },
//       visitType:{$eq:"virtual-meeting"},

//     });

//     const totalPages = Math.ceil(totalItems / limit);

//     return res.send(
//       successRes(200, "get site visits", {
//         page,
//         limit,
//         totalPages,
//         totalItems,
//         totalSiteVisits,
//         visit, //cp
//         visit2,// walk-in
//         revisit,
//         virtualMeeting,
//         data: respSite,
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// };

export const searchSiteVisits = async (req, res, next) => {
  try {
    // console.log("entered");
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    let date = req.query.date; // New date parameter

    let skip = (page - 1) * limit;
    // console.log(startDate);
    // console.log(endDate);
    // console.log(req.query); // Log the date parameter

    const isNumberQuery = !isNaN(query);
    let visitType = null;
    let status = req.query.status?.toLowerCase();

    let todayM = moment();
    let start = moment(todayM);
    let end = moment(todayM);
    let dateFilter = {};

    if (date) {
      if (date.toLowerCase() === "today") {
        dateFilter.date = {
          $gte: moment().startOf("day").toDate(),
          $lte: moment().endOf("day").toDate(),
        };
      } else if (date.toLowerCase() === "yesterday") {
        dateFilter.date = {
          $gte: moment().subtract(1, "day").startOf("day").toDate(),
          $lte: moment().subtract(1, "day").endOf("day").toDate(),
        };
      } else if (date.toLowerCase() === "last-7-days") {
        dateFilter.date = {
          $gte: moment().subtract(7, "days").startOf("day").toDate(),
          $lte: moment().endOf("day").toDate(),
        };
      } else if (date.toLowerCase() === "last-30-days") {
        dateFilter.date = {
          $gte: moment().subtract(30, "days").startOf("day").toDate(),
          $lte: moment().endOf("day").toDate(),
        };
      }
    } else if (startDate && endDate) {
      dateFilter.date = {
        $gte: moment(startDate).startOf("day").toDate(),
        $lte: moment(endDate).endOf("day").toDate(),
      };
      // console.log(JSON.stringify(dateFilter));
    }

    // Set visitType based on status
    if (status === "visit") {
      visitType = { visitType: "visit" };
    } else if (status === "revisit") {
      visitType = { visitType: "revisit" };
    } else if (status === "virtual-meeting") {
      visitType = { visitType: "virtual-meeting" };
    }

    let searchFilter = {
      ...(visitType != null ? visitType : null),
      ...dateFilter,
      approvalStatus: { $ne: "rejected" },
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { source: { $regex: query, $options: "i" } },
        // {
        //   approvalStatus: { $ne: "rejected" },
        // },
        // {
        //   approvalStatus: { $ne: "pending" },
        // },
      ].filter(Boolean), // Remove any null values
    };

    // Perform the search with pagination
    const respSite = await siteVisitModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 })
      .populate(siteVisitPopulateOptions);

    // Count the total items matching the filter
    const totalItems = await siteVisitModel.countDocuments(searchFilter);

    // Count based on the date filter
    const totalSiteVisits = await siteVisitModel.countDocuments({
      ...dateFilter,
      // visitType: { $exists: true,$ne: "tagging-over" },

      visitType: { $in: ["revisit", "visit", "virtual-meeting"] },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const totalVisits = await siteVisitModel.countDocuments({
      ...dateFilter,
      // visitType: { $exists: true,$ne: "tagging-over" }, // Ensures visitType is present
      visitType: { $eq: "visit" },
      approvalStatus: { $ne: "rejected" },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const cpvisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      visitType: { $eq: "visit" },

      source: { $eq: "cp" },

      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });
    // console.log(start);
    // console.log(end);
    const cpRevisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      visitType: { $eq: "revisit" },
      approvalStatus: { $ne: "rejected" },
      source: { $eq: "cp" },

      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const internalLeadsVisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      visitType: { $eq: "visit" },
      approvalStatus: { $ne: "rejected" },
      source: { $eq: "internal-lead" },

      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const internalLeadsRevisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "revisit" },
      approvalStatus: { $ne: "rejected" },
      source: { $eq: "internal-lead" },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const walkInVisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      // $or: [
      //   {
      //     source: { $eq: "walk-in" },
      //   },
      //   // {
      //   //   source: { $eq: "Walk-in" },
      //   // },
      // ],
      source: { $eq: "walk-in" },
      visitType: { $eq: "visit" },
      approvalStatus: { $ne: "rejected" },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const walkInRevisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      visitType: { $eq: "revisit" },
      approvalStatus: { $ne: "rejected" },
      source: { $eq: "walk-in" },

      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
    });

    const revisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "revisit" },
      approvalStatus: { $ne: "rejected" },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],
      // $or: [
      //   { source: { $eq: "walk-in" } },
      //   // { source: { $eq: "Walk-in" } },
      //   // { source: { $eq: "CP" } },
      //   { source: { $eq: "cp" } },
      //   { source: { $eq: "internal-lead" } },
      // ],
    });

    const virtualMeeting = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "virtual-meeting" },
      approvalStatus: { $ne: "rejected" },
      $or: [
        { approvalStatus: "approved" },
        { approvalStatus: null }, // this matches actual null values
      ],

      // visitType:{ $ne: "tagging-over"} ,
    });

    // const internalLead= await siteVisitModel.countDocuments({

    //   ...dateFilter,
    //   source: { $eq: "internal-lead" },
    //   $or:[
    //     {
    //       visitType: { $eq: "virtual-meeting" },
    //     },
    //     {
    //       visitType: { $eq: "visit" },
    //     },
    //     {
    //       visitType: { $eq: "revisit" },
    //     },{

    //     visitType:{ $ne: "tagging-over"} ,
    //     }

    //   ]
    // });

    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get site visits", {
        page,
        limit,
        totalPages,
        totalItems,
        totalSiteVisits,
        totalVisits,
        walkInVisit,
        cpvisit,
        visit: cpvisit,
        visit2: walkInVisit,
        internalLeadsVisit,
        revisit,
        cpRevisit,
        walkInRevisit,
        internalLeadsRevisit,
        virtualMeeting,
        // internalLead,
        data: respSite,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

export const getClosingManagerSiteVisitById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.send(errorRes(401, "Id required"));

    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1; // Start from page 1
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    const isNumberQuery = !isNaN(query);

    let visitType = null;
    let status = req.query.status?.toLowerCase();

    if (status == "visit") {
      visitType = { visitType: "visit" };
    } else if (status == "revisit") {
      visitType = { visitType: "revisit" };
    } else if (status == "virtual-meeting") {
      visitType = { visitType: "virtual-meeting" };
    } else if (status == "walk-in") {
      visitType = { source: "walk-in" };
    }

    let searchFilter = {
      ...(visitType != null ? visitType : null),
      closingManager: { $eq: id },
      approvalStatus: { $ne: "rejected" },
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        // {
        //   approvalStatus: { $ne: "rejected" },
        // },
        // {
        //   approvalStatus: { $ne: "pending" },
        // },
      ].filter(Boolean),
    };
    const resp = await siteVisitModel
      .find(searchFilter)
      .sort({ date: -1 })

      .skip(skip)
      .limit(limit)
      .populate(siteVisitPopulateOptions);

    // Count the total items matching the filter
    const totalItems = await siteVisitModel.countDocuments(searchFilter); // Count with the same filter
    // const registrationDone = await siteVisitModel.countDocuments({
    //   bookingStatus: "Registration Done",
    // });
    // const eoiRecieved = await postSaleLeadModel.countDocuments({
    //   bookingStatus: "EOI Recieved",
    // });
    // const cancelled = await postSaleLeadModel.countDocuments({
    //   bookingStatus: "Cancelled",
    // });
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get site visit leads", {
        page,
        limit,
        totalItems,
        totalPages,
        data: resp,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

// export const getTeamMemberSiteVisitById = async (req, res, next) => {
//   const id = req.params.id;
//   try {
//     const respTeamMember = await employeeModel.findById(id);
//     const teamLeaderId = respTeamMember.reportingTo;

//     if (!id) return res.send(errorRes(401, "Id required"));

//     let query = req.query.query || "";
//     let page = parseInt(req.query.page) || 1; // Start from page 1
//     let limit = parseInt(req.query.limit) || 10;
//     let skip = (page - 1) * limit;
//     let startDate = req.query.startDate;
//     let endDate = req.query.endDate;
//     const isNumberQuery = !isNaN(query);

//     let visitType = null;
//     let status = req.query.status?.toLowerCase();
//     let dateFilter = {};
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       start.setUTCHours(0, 0, 0, 0);

//       const end = new Date(endDate);
//       end.setUTCHours(23, 59, 59, 999);

//       dateFilter = { date: { $gte: start, $lte: end } };

//       console.log("Applying Date Filter:", dateFilter.toString);
//     }
//     console.log(dateFilter);

//     if (status == "visit") {
//       visitType = { visitType: "visit" };
//     } else if (status == "revisit") {
//       visitType = { visitType: "revisit" };
//     } else if (status == "virtual-meeting") {
//       visitType = { visitType: "virtual-meeting" };
//     } else if (status == "walk-in") {
//       visitType = { source: "Walk-in" };
//     }

//     let searchFilter = {
//       ...(visitType != null ? visitType : null),
//       ...dateFilter,
//       closingManager: { $eq: teamLeaderId },
//       $or: [
//         { firstName: new RegExp(query, "i") },
//         { lastName: new RegExp(query, "i") },
//         { email: new RegExp(query, "i") },
//         isNumberQuery
//           ? {
//               $expr: {
//                 $regexMatch: {
//                   input: { $toString: "$phoneNumber" },
//                   regex: query,
//                 },
//               },
//             }
//           : null,
//       ].filter(Boolean),
//     };
//     const resp = await siteVisitModel
//       .find(searchFilter)
//       .sort({ date: -1 })

//       .skip(skip)
//       .limit(limit)
//       .populate(siteVisitPopulateOptions);

//     // Count the total items matching the filter
//     const totalItems = await siteVisitModel.countDocuments(searchFilter); // Count with the same filter
//     // const registrationDone = await siteVisitModel.countDocuments({
//     //   bookingStatus: "Registration Done",
//     // });
//     // const eoiRecieved = await postSaleLeadModel.countDocuments({
//     //   bookingStatus: "EOI Recieved",
//     // });
//     // const cancelled = await postSaleLeadModel.countDocuments({
//     //   bookingStatus: "Cancelled",
//     // });
//     const totalPages = Math.ceil(totalItems / limit);

//     return res.send(
//       successRes(200, "get site visit leads", {
//         page,
//         limit,
//         totalItems,
//         totalPages,
//         data: resp,
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// };

export const getTeamMemberSiteVisitById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const respTeamMember = await employeeModel.findById(id);
    const teamLeaderId = respTeamMember.reportingTo;

    if (!id) return res.send(errorRes(401, "Id required"));

    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1; // Start from page 1
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    const isNumberQuery = !isNaN(query);

    let visitType = null;
    let status = req.query.status?.toLowerCase();

    if (status == "visit") {
      visitType = { visitType: "visit" };
    } else if (status == "revisit") {
      visitType = { visitType: "revisit" };
    } else if (status == "virtual-meeting") {
      visitType = { visitType: "virtual-meeting" };
    } else if (status == "walk-in") {
      visitType = { source: "walk-in" };
    }

    let searchFilter = {
      ...(visitType != null ? visitType : null),
      closingManager: { $eq: teamLeaderId },
      approvalStatus: { $ne: "rejected" },
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        // {
        //   approvalStatus: { $ne: "rejected" },
        // },
        // {
        //   approvalStatus: { $ne: "pending" },
        // },
      ].filter(Boolean),
    };
    const resp = await siteVisitModel
      .find(searchFilter)
      .sort({ date: -1 })

      .skip(skip)
      .limit(limit)
      .populate(siteVisitPopulateOptions);

    // Count the total items matching the filter
    const totalItems = await siteVisitModel.countDocuments(searchFilter); // Count with the same filter
    // const registrationDone = await siteVisitModel.countDocuments({
    //   bookingStatus: "Registration Done",
    // });
    // const eoiRecieved = await postSaleLeadModel.countDocuments({
    //   bookingStatus: "EOI Recieved",
    // });
    // const cancelled = await postSaleLeadModel.countDocuments({
    //   bookingStatus: "Cancelled",
    // });
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get site visit leads", {
        page,
        limit,
        totalItems,
        totalPages,
        data: resp,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

//merged team member and closing manager
export const getSiteVisitByPermission = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.send(errorRes(401, "Id required"));
    // let closingManagerId;
    let query = req.query.query || "";

    let visitType = null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const isNumberQuery = !isNaN(query);
    const status = req.query.status?.toLowerCase();

    const employee = await employeeModel
      .findById(id)
      .populate(employeePopulateOptions);

    if (!employee) return res.send(errorRes(404, "Employee not found"));

    const designation = employee.designation?._id?.toLowerCase();

    // if (designation === "desg-senior-closing-manager") {
    //   // If user is closing manager, use their own ID
    //   closingManagerId = employee._id;

    // } else {
    //   // Otherwise, use their reportingTo ID
    //   if (!employee.reportingTo)
    //     return res.send(errorRes(400, "Reporting manager not found"));
    //   closingManagerId = employee.reportingTo._id;
    // }

    let closingManagerId = employee._id;

    if (
      designation === "desg-senior-closing-manager" ||
      designation === "desg-site-head"
    ) {
      // Use their own ID
      closingManagerId = employee._id;
    } else {
      // Use reporting manager's ID
      if (!employee.reportingTo) {
        return res.send(errorRes(400, "Reporting manager not found"));
      }
      closingManagerId = employee.reportingTo._id;
    }

    //     console.log(closingManagerId);
    // console.log(designation);
    // Filters

    if (status == "visit") {
      visitType = { visitType: "visit" };
    } else if (status == "revisit") {
      visitType = { visitType: "revisit" };
    } else if (status == "virtual-meeting") {
      visitType = { visitType: "virtual-meeting" };
    } else if (status == "walk-in") {
      visitType = { source: "walk-in" };
    }

    // Search filter
    const searchFilter = {
      ...(visitType != null ? visitType : null),
      closingManager: closingManagerId,
      approvalStatus: { $ne: "rejected" },
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
      ].filter(Boolean),
    };

    const resp = await siteVisitModel
      .find(searchFilter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate(siteVisitPopulateOptions);

    const totalItems = await siteVisitModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "Fetched site visits", {
        page,
        limit,
        totalItems,
        totalPages,
        data: resp,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

// //complete merged
// export const getCompleteMerged = async (req, res, next) => {
//   try {
//     const id = req.query.id;
//     let closingManagerId=null ;// Now from query, not params
//     // if (!id) return res.send(errorRes(400, "ID is required"));

//     // const employee = await employeeModel
//     //   .findById(id)
//     //   .populate(employeePopulateOptions);

//     // if (!employee) return res.send(errorRes(404, "Employee not found"));

//     // const designation = employee.designation?._id?.toLowerCase();

//     // let closingManagerId = employee._id;

//     if (id) {
//       const employee = await employeeModel
//         .findById(id)
//         .populate(employeePopulateOptions);
//       if (!employee) return res.send(errorRes(404, "Employee not found"));

//       const designation = employee.designation?._id?.toLowerCase();

//       closingManagerId = employee._id;
//       if (
//         designation !== "desg-senior-closing-manager" &&
//         designation !== "desg-site-head"
//       ) {
//         if (!employee.reportingTo)
//           return res.send(errorRes(400, "Reporting manager not found"));
//         closingManagerId = employee.reportingTo._id;
//       }
//     }

//     const query = req.query.query || "";
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const status = req.query.status?.toLowerCase();
//     const isNumberQuery = !isNaN(query);

//     const today = new Date();
//     let start = new Date(today);
//     let end = new Date(today);
//     let dateFilter = {};

//     const date = req.query.date;
//     const startDate = req.query.startDate;
//     const endDate = req.query.endDate;

//     if (date) {
//       if (date === "today") {
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//       } else if (date === "yesterday") {
//         start.setUTCDate(today.getUTCDate() - 1);
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCDate(today.getUTCDate() - 1);
//         end.setUTCHours(23, 59, 59, 999);
//       } else if (date === "last-7-days") {
//         start.setUTCDate(today.getUTCDate() - 7);
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//       } else if (date === "last-30-days") {
//         start.setUTCDate(today.getUTCDate() - 30);
//         start.setUTCHours(0, 0, 0, 0);
//         end.setUTCHours(23, 59, 59, 999);
//       }
//       dateFilter = { date: { $gte: start, $lte: end } };
//     } else if (startDate && endDate) {
//       start = new Date(startDate);
//       start.setUTCHours(0, 0, 0, 0);
//       end = new Date(endDate);
//       end.setUTCHours(23, 59, 59, 999);
//       dateFilter = { date: { $gte: start, $lte: end } };
//     }

//     let visitTypeFilter = {};
//     if (status === "visit") {
//       visitTypeFilter = { visitType: "visit" };
//     } else if (status === "revisit") {
//       visitTypeFilter = { visitType: "revisit" };
//     } else if (status === "virtual-meeting") {
//       visitTypeFilter = { visitType: "virtual-meeting" };
//     } else if (status === "walk-in") {
//       visitTypeFilter = { source: "walk-in" };
//     }

//     const searchFilter = {
//       ...visitTypeFilter,
//       ...dateFilter,
//       closingManager: closingManagerId,
//       approvalStatus: { $ne: "rejected" },
//       $or: [
//         { firstName: { $regex: query, $options: "i" } },
//         { lastName: { $regex: query, $options: "i" } },
//         { email: { $regex: query, $options: "i" } },
//         { source: { $regex: query, $options: "i" } },
//         isNumberQuery
//           ? {
//               $expr: {
//                 $regexMatch: {
//                   input: { $toString: "$phoneNumber" },
//                   regex: query,
//                 },
//               },
//             }
//           : null,
//       ].filter(Boolean),
//     };

//     const siteVisits = await siteVisitModel
//       .find(searchFilter)
//       .skip(skip)
//       .limit(limit)
//       .sort({ date: -1 })
//       .populate(siteVisitPopulateOptions);

//     const totalItems = await siteVisitModel.countDocuments(searchFilter);
//     const totalPages = Math.ceil(totalItems / limit);

//     // Optional stats (same logic reused)
//     const commonMatch = {
//       closingManager: closingManagerId,
//       ...dateFilter,
//       $or: [
//         { approvalStatus: "approved" },
//         { approvalStatus: null },
//       ],
//     };

//     const [
//       totalSiteVisits,
//       totalVisits,
//       cpVisit,
//       cpRevisit,
//       internalVisit,
//       internalRevisit,
//       walkInVisit,
//       walkInRevisit,
//       revisit,
//       virtualMeeting,
//     ] = await Promise.all([
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: { $in: ["revisit", "visit", "virtual-meeting"] },
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "visit",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "visit",
//         source: "cp",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "revisit",
//         source: "cp",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "visit",
//         source: "internal-lead",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "revisit",
//         source: "internal-lead",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "visit",
//         source: "walk-in",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "revisit",
//         source: "walk-in",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "revisit",
//       }),
//       siteVisitModel.countDocuments({
//         ...commonMatch,
//         visitType: "virtual-meeting",
//       }),
//     ]);

//     return res.send(
//       successRes(200, "Fetched site visits", {
//         page,
//         limit,
//         totalItems,
//         totalPages,
//         data: siteVisits,
//         totalSiteVisits,
//         totalVisits,
//         cpVisit,
//         cpRevisit,
//         internalVisit,
//         internalRevisit,
//         walkInVisit,
//         walkInRevisit,
//         revisit,
//         virtualMeeting,
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// };

export const addSiteVisits = async (req, res) => {
  const body = req.body;
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    residence,
    projects,
    choiceApt,
    source,
    closingManager,
    closingTeam,
    teamLeader,
    lead,
    visitType,
    virtualMeetingDoc,
    location,
  } = body;
  // console.log(body);

  try {
    if (!body) return res.send(errorRes(403, "Data is required"));
    if (!firstName) return res.send(errorRes(403, "First name is required"));
    if (!lastName) return res.send(errorRes(403, "Last name is required"));
    // if (!residence) return res.send(errorRes(403, "Residence is required"));
    if (!projects) return res.send(errorRes(403, "Project is required"));
    if (!phoneNumber)
      return res.send(errorRes(403, "Phone number is required"));
    if (!closingManager) res.send(errorRes(403, "Closing Manager is required"));
    // if(!closingTeam) res.send(errorRes(403,"Closing Team is required"));
    if (!choiceApt)
      return res.send(errorRes(403, "Choice of Apartment is required"));

    // console.log(body.date);
    // console.log(new Date().toISOString());
    // body.date = null;
    const today = new Date();

    const newSiteVisit = await siteVisitModel.create({
      ...body,
      // date: new Date(),
      virtualMeetingDoc: virtualMeetingDoc,
      entryBy: user?._id, //log
    });

    await newSiteVisit.save();
    const existingClient = await clientModel.findOne({
      phoneNumber: phoneNumber,
    });
    if (!existingClient) {
      try {
        const hashPassword = await encryptPassword(phoneNumber.toString());
        const newClient = new clientModel({
          firstName,
          lastName,
          email,
          phoneNumber,
          projects: location,
          address: residence,
          closingManager,
          choiceApt,
          password: hashPassword,
        });
        await newClient.save();
      } catch (error) {
        // console.log(error);
      }
    }
    //  if (!id) return res.send(errorRes(403, "id is required"));
    const populateNewSiteVisit = await siteVisitModel
      .findById(newSiteVisit?._id)
      .populate(siteVisitPopulateOptions);
    // if lead id provided
    if (lead != null) {
      // console.log("lead id is not null");

      const foundLead = await leadModelV2.findById(lead);

      if (foundLead) {
        const taggingOver = moment(foundLead.validTill)
          .tz(zone)
          .isBefore(moment.tz(zone));

        // return res.send(errorRes(404, "no lead found with id"));
        // if (visitType === "booked") {
        //   foundLead.bookingStatus = "booked";
        //   foundLead.bookingRef = bookingRef;
        //   await foundLead.save();
        // }
        // console.log("lead is not null");

        if (visitType === "visit") {
          foundLead.visitStatus = "visited";
          foundLead.stage = "revisit";
          foundLead.visitRef = populateNewSiteVisit._id;
          foundLead.cycle.stage = "revisit";
          foundLead.cycle.currentDays = 29;
          foundLead.cycle.validTill = new Date().addDays(30);
          const totalRemainingDays = Math.floor(
            (new Date(foundLead.validTill) - today) / (1000 * 60 * 60 * 24),
          );
          if (!taggingOver) {
            if (totalRemainingDays <= 29) {
              const availableDays = 30 - totalRemainingDays;
              // Logic for leads with 29 or fewer remaining days
              foundLead.validTill = new Date(foundLead.validTill).addDays(
                availableDays,
              );
            }
          }
          await foundLead.save();
          const foundTLPlayerId = await oneSignalModel.findOne({
            docId: foundLead?.channelPartner,
            // role: teamLeaderResp?.role,
          });

          if (foundTLPlayerId) {
            const dta = await oneSignalModel.find({
              $or: [
                { docId: "ev89-narayan-jha" },
                { docId: "ev88-pavan-ale" },
                { docId: foundLead.teamLeader },
              ],
              // role: teamLeaderResp?.role,
            });
            let ids = dta.map((ele) => ele.playerId);
            // console.log(foundTLPlayerId);
            if (!taggingOver) {
              ids.push(foundTLPlayerId?.playerId);
            }
            await sendNotificationWithImage({
              playerIds: [...ids],
              title: "Visit Done",
              message: `Visit done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }`,
              imageUrl: visitNotificationImage,
              data: {
                type: "lead",
                id: foundLead?._id,
                role: "channel-partner",
              },
            });
            // console.log("pass sent notification");
          }
        }

        if (visitType === "virtual-meeting") {
          foundLead.visitStatus = "virtual-meeting";
          foundLead.stage = "revisit";
          foundLead.visitRef = populateNewSiteVisit._id;
          foundLead.cycle.stage = "revisit";
          foundLead.cycle.currentDays = 29;
          foundLead.cycle.validTill = new Date().addDays(30);
          foundLead.virtualMeetingDoc = virtualMeetingDoc;
          const totalRemainingDays = Math.floor(
            (new Date(foundLead.validTill) - today) / (1000 * 60 * 60 * 24),
          );
          if (!taggingOver) {
            if (totalRemainingDays <= 29) {
              const availableDays = 30 - totalRemainingDays;
              // Logic for leads with 29 or fewer remaining days
              foundLead.validTill = new Date(foundLead.validTill).addDays(
                availableDays,
              );
            }
          }

          await foundLead.save();
          const foundTLPlayerId = await oneSignalModel.findOne({
            docId: foundLead?.channelPartner,
            // role: teamLeaderResp?.role,
          });

          if (foundTLPlayerId) {
            const dta = await oneSignalModel.find({
              $or: [
                { docId: "ev89-narayan-jha" },
                { docId: "ev88-pavan-ale" },
                { docId: foundLead.teamLeader },
              ],
              // role: teamLeaderResp?.role,
            });
            let ids = dta.map((ele) => ele.playerId);
            // console.log(foundTLPlayerId);
            if (!taggingOver) {
              ids.push(foundTLPlayerId?.playerId);
            }
            await sendNotificationWithImage({
              playerIds: [...ids],
              title: "Virtual Meeting Done",
              message: `Virtual meeting done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }`,
              imageUrl: visitNotificationImage,
              data: {
                type: "lead",
                id: foundLead?._id,
                role: "channel-partner",
              },
            });
            // console.log("pass sent notification");
          }
        }

        if (visitType === "revisit") {
          foundLead.revisitStatus = "revisited";
          foundLead.stage = "booking";
          foundLead.revisitRef = populateNewSiteVisit._id;
          foundLead.cycle.stage = "booking";
          foundLead.cycle.currentDays = 29;
          foundLead.cycle.validTill = new Date().addDays(30);

          await foundLead.save();
          const foundTLPlayerId = await oneSignalModel.findOne({
            docId: foundLead?.channelPartner,
            // role: teamLeaderResp?.role,
          });

          if (foundTLPlayerId) {
            const dta = await oneSignalModel.find({
              $or: [
                { docId: "ev89-narayan-jha" },
                { docId: "ev88-pavan-ale" },
                { docId: foundLead.teamLeader },
              ],
              // role: teamLeaderResp?.role,
            });
            let ids = dta.map((ele) => ele.playerId);
            // console.log(foundTLPlayerId);
            if (!taggingOver) {
              ids.push(foundTLPlayerId?.playerId);
            }

            await sendNotificationWithImage({
              playerIds: [...ids],
              title: "Revisit Done",
              message: `Revisit done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }`,
              imageUrl: visitNotificationImage,
              data: {
                type: "lead",
                id: foundLead?._id,
                role: "channel-partner",
              },
            });
            // console.log("pass sent notification");
          }
        }
        // if (visitType === "called") {
        //   foundLead.contactedStatus = "contacted";
        //   // foundLead.revisitRef = populateNewSiteVisit._id;
        //   await foundLead.save();
        // }
      }
    } else {
      // if lead id is there but not found then check by phone number
      // console.log("lead is null");

      const foundLead = await leadModelV2.findOne({
        phoneNumber: phoneNumber,
        approvalStatus: { $ne: "pending" },
      });
      if (foundLead) {
        const taggingOver = moment(foundLead.validTill)
          .tz(zone)
          .isBefore(moment.tz(zone));

        if (visitType === "visit") {
          foundLead.visitStatus = "visited";
          foundLead.stage = "revisit";
          foundLead.visitRef = populateNewSiteVisit._id;
          foundLead.cycle.stage = "revisit";
          foundLead.cycle.currentDays = 29;
          foundLead.cycle.validTill = new Date().addDays(30);
          const totalRemainingDays = Math.floor(
            (new Date(foundLead.validTill) - today) / (1000 * 60 * 60 * 24),
          );
          if (!taggingOver) {
            if (totalRemainingDays <= 29) {
              const availableDays = 30 - totalRemainingDays;
              // Logic for leads with 29 or fewer remaining days
              foundLead.validTill = new Date(foundLead.validTill).addDays(
                availableDays,
              );
            }
          }

          await foundLead.save();
          const foundTLPlayerId = await oneSignalModel.findOne({
            docId: foundLead?.channelPartner,
            // role: teamLeaderResp?.role,
          });

          if (foundTLPlayerId) {
            const dta = await oneSignalModel.find({
              $or: [
                { docId: "ev89-narayan-jha" },
                { docId: "ev88-pavan-ale" },
                { docId: foundLead.teamLeader },
              ],
              // role: teamLeaderResp?.role,
            });
            let ids = dta.map((ele) => ele.playerId);
            // console.log(foundTLPlayerId);
            if (!taggingOver) {
              ids.push(foundTLPlayerId?.playerId);
            }

            await sendNotificationWithImage({
              playerIds: [...ids],
              title: "Site Visit Done!",
              message: `Site visit is done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }`,
              imageUrl: visitNotificationImage,
              data: {
                type: "lead",
                id: foundLead?._id,
                role: "channel-partner",
              },
            });
            // console.log("pass sent notification");
          }
        }

        if (visitType === "virtual-meeting") {
          foundLead.visitStatus = "virtual-meeting";
          foundLead.stage = "revisit";
          foundLead.visitRef = populateNewSiteVisit._id;
          foundLead.cycle.stage = "revisit";
          foundLead.cycle.validTill = new Date().addDays(30);
          foundLead.virtualMeetingDoc = virtualMeetingDoc;
          foundLead.cycle.currentDays = 29;
          const totalRemainingDays = Math.floor(
            (new Date(foundLead.validTill) - today) / (1000 * 60 * 60 * 24),
          );
          if (!taggingOver) {
            if (totalRemainingDays <= 29) {
              const availableDays = 30 - totalRemainingDays;
              // Logic for leads with 29 or fewer remaining days
              foundLead.validTill = new Date(foundLead.validTill).addDays(
                availableDays,
              );
            }
          }

          await foundLead.save();
          const foundTLPlayerId = await oneSignalModel.findOne({
            docId: foundLead?.channelPartner,
            // role: teamLeaderResp?.role,
          });

          if (foundTLPlayerId) {
            const dta = await oneSignalModel.find({
              $or: [
                { docId: "ev89-narayan-jha" },
                { docId: "ev88-pavan-ale" },
                { docId: foundLead.teamLeader },
              ],
              // role: teamLeaderResp?.role,
            });
            let ids = dta.map((ele) => ele.playerId);
            // console.log(foundTLPlayerId);
            if (!taggingOver) {
              ids.push(foundTLPlayerId?.playerId);
            }

            await sendNotificationWithImage({
              playerIds: [...ids],
              title: "virtual meeting",
              message: `virtual meeting for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }`,
              imageUrl: visitNotificationImage,
              data: {
                type: "lead",
                id: foundLead?._id,
                role: "channel-partner",
              },
            });
            // console.log("pass sent notification");
          }
        }

        if (visitType === "revisit") {
          foundLead.revisitStatus = "revisited";
          foundLead.stage = "booking";
          foundLead.revisitRef = populateNewSiteVisit._id;
          foundLead.cycle.stage = "booking";
          foundLead.cycle.currentDays = 29;
          foundLead.cycle.validTill = new Date().addDays(30);

          await foundLead.save();
          const foundTLPlayerId = await oneSignalModel.findOne({
            docId: foundLead?.channelPartner,
            // role: teamLeaderResp?.role,
          });

          if (foundTLPlayerId) {
            const dta = await oneSignalModel.find({
              $or: [
                { docId: "ev89-narayan-jha" },
                { docId: "ev88-pavan-ale" },
                { docId: foundLead.teamLeader },
              ],
              // role: teamLeaderResp?.role,
            });
            let ids = dta.map((ele) => ele.playerId);
            // console.log(foundTLPlayerId);
            if (!taggingOver) {
              ids.push(foundTLPlayerId?.playerId);
            }

            await sendNotificationWithImage({
              playerIds: [...ids],
              title: "Revisit Done",
              message: `Revisit done for ${foundLead.firstName ?? ""} ${
                foundLead.lastName ?? ""
              }`,
              imageUrl: visitNotificationImage,
              data: {
                type: "lead",
                id: foundLead?._id,
                role: "channel-partner",
              },
            });
            // console.log("pass sent notification");
          }
        }
        // if (visitType === "called") {
        //   foundLead.contactedStatus = "contacted";
        //   // foundLead.revisitRef = revisitRef;
        //   await foundLead.save();
        // }
      }
    }
    // if not lead id provided && lead type is not cp
    if (!lead) {
      // console.log("lead is null");

      const startDate = new Date();
      const validTill = new Date(startDate);
      const validTillbefore = new Date(startDate);

      validTillbefore.setDate(validTillbefore.getDate() + 15);
      validTill.setDate(validTill.getDate() + 30);

      if (
        source?.toLowerCase() === "walk-in" ||
        source?.toLowerCase() === "internal-lead"
      ) {
        const foundLead = await leadModelV2.create({
          leadType: source?.toLowerCase(),
          firstName: firstName,
          address: residence,
          email: email,
          lastName: lastName,
          project: projects,
          requirement: choiceApt,
          phoneNumber: phoneNumber,
          teamLeader: closingManager,
          visitRef: newSiteVisit?._id,
          visitStatus: visitType + "ed",
          stage: "revisit",
          cycle: {
            nextTeamLeader: null,
            stage: "revisit",
            currentOrder: 1,
            teamLeader: closingManager,
            startDate: startDate,
            validTill: validTill,
            currentDays: 29,
          },
          // cycleHistory: [
          //   {
          //     nextTeamLeader: null,
          //     stage: "visit",
          //     currentOrder: 1,
          //     teamLeader: closingManager,
          //     startDate: startDate,
          //     validTill: validTillbefore,
          //   },
          // ],
        });
        const foundTLPlayerId = await oneSignalModel.findOne({
          docId: closingManager,
          // role: teamLeaderResp?.role,
        });

        if (foundTLPlayerId) {
          // console.log(foundTLPlayerId);
          const dta = await oneSignalModel.find({
            $or: [{ docId: "ev89-narayan-jha" }, { docId: "ev88-pavan-ale" }],
            // role: teamLeaderResp?.role,
          });
          let ids = dta.map((ele) => ele.playerId);
          // console.log(foundTLPlayerId);

          await sendNotificationWithImage({
            playerIds: [foundTLPlayerId?.playerId, ...ids],
            title: "You've Got a new walk-in Lead!",
            message: `A new lead has been assigned to you. Check the details and make contact to move things forward.`,
            imageUrl: visitNotificationImage,
            data: {
              type: "lead",
              id: foundLead?._id,
              role: "employee",
              designation: "desg-sales-executive",
            },
          });
          // console.log("pass sent notification");
        }
      }
    }
    try {
      var subject = "";
      if (populateNewSiteVisit.source?.toLowerCase() === "cp") {
        subject = `Client Just Visited the Sales Lounge through Channel Partner (${
          populateNewSiteVisit.channelPartner?.firmName ?? ""
        })`;
      } else if (populateNewSiteVisit.source?.toLowerCase() === "walk-in") {
        subject = `A Walk-in Client Just Visited the Sales Lounge`;
      } else if (
        populateNewSiteVisit.source?.toLowerCase() === "virtual-meeting"
      ) {
        subject = `Client Virtual Meeting Completed for Channel Partner (${
          populateNewSiteVisit.channelPartner?.firmName ?? ""
        }) via ${populateNewSiteVisit.closingManager?.firstName} ${
          populateNewSiteVisit.closingManager?.lastName
        } Team`;
      }

      await sendMultipleEmail(
        ["ricki@evgroup.co.in"],
        subject,
        visitTemplate(
          subject,
          `${populateNewSiteVisit?.firstName ?? " "} ${
            populateNewSiteVisit?.lastName ?? " "
          }`,
          `${populateNewSiteVisit?.countryCode ?? " "} ${
            populateNewSiteVisit?.phoneNumber ?? " "
          }`,
          `${
            populateNewSiteVisit.projects?.map((ele) => ele.name).join(",") ??
            " "
          }`,
          `${
            populateNewSiteVisit.choiceApt?.map((ele) => ele).join(",") ?? " "
          }`,
          `${
            populateNewSiteVisit.closingTeam
              ?.map((ele) => ele?.firstName)
              .join(",") ?? " "
          }`,
          `${populateNewSiteVisit.closingManager?.firstName ?? " "} ${
            populateNewSiteVisit.closingManager?.lastName ?? " "
          }`,
          populateNewSiteVisit.visitType,
        ),
        [],
        ["evhomes.operations@evgroup.co.in", "deepak@evgroup.co.in"],
      );
    } catch (error) {
      // console.log(error);
    }

    return res.send(
      successRes(200, `Client added successfully: ${firstName} ${lastName}`, {
        data: populateNewSiteVisit,
      }),
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const addLeadFromSiteVisit = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(401, "id required"));

    // console.log("lead is null");

    const respId = await siteVisitModel.findById(id);

    if (!respId) return res.send(errorRes(401, "visit not found"));

    const startDate = new Date(respId.date);
    const validTill = new Date(startDate);
    // const validTillbefore = new Date(startDate);

    // validTillbefore.setDate(validTillbefore.getDate() + 15);
    validTill.setDate(validTill.getDate() + 30);

    const foundLead = await leadModelV2.create({
      leadType: respId.source?.toLowerCase(),
      firstName: respId.firstName,
      address: respId.residence,
      email: respId.email,
      lastName: respId.lastName,
      project: respId.projects,
      requirement: respId.choiceApt,
      phoneNumber: respId.phoneNumber,
      teamLeader: respId.closingManager,
      visitRef: respId?._id,
      visitStatus: respId.visitType + "ed",
      stage: "revisit",
      cycle: {
        stage: "revisit",
        currentOrder: 1,
        teamLeader: respId.closingManager,
        startDate: startDate,
        validTill: validTill,
        currentDays: 29,
      },
      // cycleHistory: [
      //   {
      //     nextTeamLeader: null,
      //     stage: "visit",
      //     currentOrder: 1,
      //     teamLeader: closingManager,
      //     startDate: startDate,
      //     validTill: validTillbefore,
      //   },
      // ],
    });
    return res.send(successRes(200, "", { data: foundLead }));
  } catch (e) {
    return res.send(errorRes(500, e));
  }
};
export const generateSiteVisitOtp = async (req, res, next) => {
  const {
    project,
    firstName,
    lastName,
    phoneNumber,
    closingManager,
    email,
    lead,
  } = req.body;
  let url;
  try {
    const user = await employeeModel.findById(closingManager);
    const findOldOtp = await otpModel.findOne({
      $or: [{ phoneNumber: phoneNumber }, { email: email }],
    });
    const getProjectWebhook = await ourProjectModel
      .findById(project)
      .select("webhookZappier name showCaseImage");

    let baseUrl = "https://hooks.zapier.com/hooks/catch/9993809/25xnarr";

    if (getProjectWebhook.webhookZappier) {
      baseUrl = getProjectWebhook.webhookZappier;
    }

    if (findOldOtp) {
      url = `${baseUrl}?phoneNumber=${encodeURIComponent(
        `+91${phoneNumber}`,
      )}&name=${firstName} ${lastName}&project=${project}&closingManager=${
        user?.firstName
      } ${user?.lastName}&otp=${findOldOtp.otp}`;
      console.log(url);
      try {
              const resp = await axios.post(url);
      if (email && email != "noemailprovided2026625@gmail.com") {
        try {
          await sendMultipleEmail(
            [email],
            `Welcome to EV Homes – Please Confirm Your Visit`,
            siteVisitOtpTempleteV3({
              name: `${firstName} ${lastName}`,
              otp: findOldOtp.otp,
              location: getProjectWebhook?.name,
              imageUrl: getProjectWebhook?.showCaseImage,
            }),
            [],
          );
          try {
            //ninesq= 13/ 10mb = 5/
            if (
              getProjectWebhook?._id === "project-ev-9-square-vashi-sector-9" &&
              email
            ) {
              // console.log("entered 9 square");
              await addContact({
                listIds: [13],
                email: email,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: `+91${phoneNumber}`,
              });
            }
            if (
              getProjectWebhook?._id ===
                "project-ev-10-marina-bay-vashi-sector-10" &&
              email
            ) {
              // console.log("entered 10 marina");

              await addContact({
                listIds: [5],
                email: email,
                firstName: firstName,
                lastName: lastName,
                phoneNumber: `+91${phoneNumber}`,
              });
            }
          } catch (error) {
            //
            console.log(error);
          }
        } catch (error) {
          console.log(error);
        }
      }

      } catch (error) {
        // 
        console.log(error);
      }
      // console.log(resp);
      return res.send(
        successRes(200, "otp Sent to Client", {
          data: findOldOtp,
        }),
      );
    }

    const newOtp = generateOTP(6);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: user?._id,
      email: email ?? "noemailprovided2026625@gmail.com",
      phoneNumber: phoneNumber,
      type: "site-visit-entry",
      message: "Site Visit Verification Code",
    });

    const savedOtp = await newOtpModel.save();
    url = `${baseUrl}?phoneNumber=${encodeURIComponent(
      `+91${phoneNumber}`,
    )}&name=${firstName} ${lastName}&project=${project}&closingManager=${
      user?.firstName
    } ${user?.lastName}&otp=${newOtp}`;

    try {
          const resp = await axios.post(url);
    // console.log(resp);
    if (email && email != "noemailprovided2026625@gmail.com") {
      try {
        await sendMultipleEmail(
          [email],
          `Welcome to EV Homes – Please Confirm Your Visit`,
          siteVisitOtpTempleteV2({
            name: `${firstName} ${lastName}`,
            otp: newOtp,
            location: getProjectWebhook?.name,
            imageUrl: getProjectWebhook?.showCaseImage,
          }),
          [],
        );
      } catch (error) {
        console.log(error);
      }
    }

    } catch (error) {
      console.log(error);
    }


    return res.send(
      successRes(200, "otp Sent to Client", {
        data: savedOtp,
      }),
    );
  } catch (error) {
    return errorRes2(res, 500, `${error}`);
  }
};

export const verifySiteVisitOtp = async (req, res, next) => {
  const { phoneNumber, otp, email } = req.body;
  try {
    if (!otp) return res.send(errorRes(401, "Invalid Otp"));

    const otpExist = await otpModel.findOne({
      $or: [{ phoneNumber: phoneNumber }, { email: email }],
    });

    if (!otpExist) return res.send(errorRes(404, "Otp is Expired"));

    if (otp != otpExist.otp)
      return res.send(errorRes(401, "Otp Didn't matched"));

    await otpExist.deleteOne();

    return res.send(
      successRes(200, "otp Verified Successfully", {
        data: true,
      }),
    );
  } catch (error) {
    return next(error);
  }
};
export const updateSiteVisits = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  // console.log(body);
  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!body) return res.send(errorRes(403, "Data is required"));

    if (!body) return res.send(errorRes(403, "Data is required"));

    const updatedSite = await siteVisitModel
      .findByIdAndUpdate(
        id,
        {
          ...body,
        },
        { new: true },
      )
      .populate(siteVisitPopulateOptions);

    if (!updatedSite)
      return res.send(errorRes(404, `Site not found with ID: ${id}`));

    return res.send(
      successRes(200, `Site Visit updated successfully`, {
        data: updatedSite,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const deleteSiteVisits = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));

    const deletedSite = await siteVisitModel.findByIdAndDelete(id);

    if (!deletedSite)
      return res.send(errorRes(404, `Site not found with ID: ${id}`));

    return res.send(
      successRes(200, `Site deleted successfully with ID: ${id}`, {
        data: deletedSite,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const addSiteVisitsManual = async (data) => {
  const body = data;
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    residence,
    projects,
    choiceApt,
    source,
    closingManager,
    closingTeam,
    teamLeader,
    lead,
    visitType,
    virtualMeetingDoc,
    location,
  } = body;

  try {
    // console.log("pass 1");
    const newSiteVisit = await siteVisitModel.create({
      ...body,
    });

    await newSiteVisit.save();

    const hashPassword = await encryptPassword(phoneNumber.toString());
    const newClient = await clientModel.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      projects: location,
      address: residence,
      closingManager,
      choiceApt,
      password: hashPassword,
    });
    await newClient.save();
    //  if (!id) return res.send(errorRes(403, "id is required"));
    const populateNewSiteVisit = await siteVisitModel
      .findById(newSiteVisit?._id)
      .populate(siteVisitPopulateOptions);

    // if (lead != null) {
    //   const foundLead = await leadModel.findById(lead);

    //   if (foundLead) {
    //     // return res.send(errorRes(404, "no lead found with id"));
    //     // if (visitType === "booked") {
    //     //   foundLead.bookingStatus = "booked";
    //     //   foundLead.bookingRef = bookingRef;
    //     //   await foundLead.save();
    //     // }

    //     if (visitType === "visited") {
    //       foundLead.visitStatus = "visited";
    //       foundLead.stage = "revisit";
    //       foundLead.visitRef = populateNewSiteVisit._id;
    //       foundLead.cycle.stage = "revisit";
    //       foundLead.cycle.validTill = new Date().addDays(30);
    //       await foundLead.save();
    //     }

    //     if (visitType === "virtual-meeting") {
    //       foundLead.visitStatus = "virtual-meeting";
    //       foundLead.stage = "revisit";
    //       foundLead.visitRef = populateNewSiteVisit._id;
    //       foundLead.cycle.stage = "revisit";
    //       foundLead.cycle.validTill = new Date().addDays(30);
    //       foundLead.virtualMeetingDoc = virtualMeetingDoc;

    //       await foundLead.save();
    //     }

    //     if (visitType === "revisited") {
    //       foundLead.revisitStatus = "revisited";
    //       foundLead.stage = "booking";
    //       foundLead.revisitRef = populateNewSiteVisit._id;
    //       foundLead.cycle.validTill = new Date().addDays(180);

    //       await foundLead.save();
    //     }
    //     if (visitType === "called") {
    //       foundLead.contactedStatus = "contacted";
    //       // foundLead.revisitRef = populateNewSiteVisit._id;
    //       await foundLead.save();
    //     }
    //   }
    // } else {
    //   const foundLead = await leadModel.findOne({
    //     phoneNumber: phoneNumber,
    //     approvalStatus: { $ne: "pending" },
    //   });
    //   if (foundLead) {
    //     if (visitType === "visited") {
    //       foundLead.visitStatus = "visited";
    //       foundLead.stage = "revisit";
    //       foundLead.visitRef = populateNewSiteVisit._id;
    //       foundLead.cycle.stage = "revisit";
    //       foundLead.cycle.validTill = new Date().addDays(30);

    //       await foundLead.save();
    //     }

    //     if (visitType === "virtual-meeting") {
    //       foundLead.visitStatus = "virtual-meeting";
    //       foundLead.stage = "revisit";
    //       foundLead.visitRef = populateNewSiteVisit._id;
    //       foundLead.cycle.stage = "revisit";
    //       foundLead.cycle.validTill = new Date().addDays(30);
    //       foundLead.virtualMeetingDoc = virtualMeetingDoc;

    //       await foundLead.save();
    //     }

    //     if (visitType === "revisited") {
    //       foundLead.revisitStatus = "revisited";
    //       foundLead.stage = "booking";
    //       foundLead.revisitRef = populateNewSiteVisit._id;
    //       foundLead.cycle.validTill = new Date().addMonths(5);

    //       await foundLead.save();
    //     }
    //     if (visitType === "called") {
    //       foundLead.contactedStatus = "contacted";
    //       // foundLead.revisitRef = revisitRef;
    //       await foundLead.save();
    //     }
    //   }
    // }
    const startDate = new Date(body.date);
    const validTill = new Date(startDate);
    const validTillbefore = new Date(startDate);

    validTillbefore.setDate(validTillbefore.getDate() + 15);
    validTill.setDate(validTill.getDate() + 30);

    // if (source?.toLowerCase() === "walk-in") {
    //   await leadModel.create({
    //     leadType: source?.toLowerCase(),
    //     firstName: firstName,
    //     address: residence,
    //     email: email,
    //     lastName: lastName,
    //     project: projects,
    //     requirement: choiceApt,
    //     phoneNumber: phoneNumber,
    //     teamLeader: closingManager,
    //     visitRef: newSiteVisit?._id,
    //     visitStatus: visitType,
    //     stage: "revisit",
    //     cycle: {
    //       nextTeamLeader: null,
    //       stage: "revisit",
    //       currentOrder: 1,
    //       teamLeader: closingManager,
    //       startDate: startDate,
    //       validTill: validTill,
    //     },
    //     cycleHistory: [
    //       {
    //         nextTeamLeader: null,
    //         stage: "visit",
    //         currentOrder: 1,
    //         teamLeader: closingManager,
    //         startDate: startDate,
    //         validTill: validTillbefore,
    //       },
    //     ],
    //   });
    //   const foundTLPlayerId = await oneSignalModel.findOne({
    //     docId: closingManager,
    //     // role: teamLeaderResp?.role,
    //   });

    //   if (foundTLPlayerId) {
    //     // console.log(foundTLPlayerId);

    //     await sendNotificationWithImage({
    //       playerIds: [foundTLPlayerId.playerId],
    //       title: "You've Got a new walk-in Lead!",
    //       message: `A new lead has been assigned to you. Check the details and make contact to move things forward.`,
    //       imageUrl:
    //         visitNotificationImage,
    //     });
    //     // console.log("pass sent notification");
    //   }
    // }

    return "ok";
  } catch (error) {
    // console.log(error);
    return error;
  }
};
export const getTodayVisitSummary = async () => {
  try {
    const timeZone = "Asia/Kolkata";

    const startOf11am = moment()
      .tz(timeZone)
      // .subtract(1, "day")
      .startOf("day")
      .add(11, "hour")
      .toDate();

    const endOf10pm = moment()
      .tz(timeZone)
      // .subtract(1, "day")
      .startOf("day")
      .add(22, "hour")
      .toDate();

    const todayDate = moment()
      .tz(timeZone)
      // .subtract(1, "day")
      .format("DD MMM yy");

    const teamLeaders = [
      "ev15-deepak-karki",
      "ev69-vicky-mane",
      "ev70-jaspreet-arora",
      "ev54-ranjna-gupta",
    ];

    const visitSummary = await siteVisitModel.aggregate([
      {
        $match: {
          $and: [
            {
              date: { $gte: startOf11am, $lte: endOf10pm },
            },
            {
              approvalStatus: { $ne: "rejected" },
            },
            {
              approvalStatus: { $ne: "pending" },
            },
          ],
        },
      },
      {
        $group: {
          _id: null,
          //totalVisits
          totalVisits: {
            $sum: 1,
          },
          visits: {
            $sum: {
              $cond: [{ $eq: ["$visitType", "visit"] }, 1, 0],
            },
          },
          revisits: {
            $sum: {
              $cond: [{ $eq: ["$visitType", "revisit"] }, 1, 0],
            },
          },
          virtualMeetings: {
            $sum: {
              $cond: [{ $eq: ["$visitType", "virtual-meeting"] }, 1, 0],
            },
          },
          walkins: {
            $sum: {
              $cond: [{ $eq: ["$source", "walk-in"] }, 1, 0],
            },
          },

          //cp visits
          cpVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "cp"] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          cpVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "cp"] },
                    { $eq: ["$visitType", "visit"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          cpRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "cp"] },
                    { $eq: ["$visitType", "revisit"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          //cp visits by teams
          deepakTeamCpVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[0]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "cp"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          vickyManeTeamCpVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[1]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "cp"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          jaspreetTeamCpVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[2]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "cp"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ranjnaTeamCpVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[3]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "cp"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          //internal lead visits
          internalVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "internal-lead"] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          internalVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "internal-lead"] },
                    { $eq: ["$visitType", "visit"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          internalRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "internal-lead"] },
                    { $eq: ["$visitType", "revisit"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          //internal visits by teams
          deepakTeamInternalVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[0]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "internal-lead"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          vickyManeTeamInternalVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[1]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "internal-lead"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          jaspreetTeamInternalVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[2]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "internal-lead"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ranjnaTeamInternalVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[3]] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "internal-lead"] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          //Walkins visits
          walkinVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "walk-in"] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          walkinVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "walk-in"] },
                    { $eq: ["$visitType", "visit"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          walkinRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$source", "walk-in"] },
                    { $eq: ["$visitType", "revisit"] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          //project visits
          nineSquareVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$location", "project-ev-9-square-vashi-sector-9"],
                    },
                    {
                      $eq: ["$visitType", "virtual-meeting"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          marinaBayVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$location",
                        "project-ev-10-marina-bay-vashi-sector-10",
                      ],
                    },
                    {
                      $eq: ["$visitType", "virtual-meeting"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          malibuVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$location",
                        "project-ev23-malibu-west-koparkhairne-2024",
                      ],
                    },
                    {
                      $eq: ["$visitType", "virtual-meeting"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          heartCityVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$location", "project-ev-heart-city-mosare-2025"],
                    },
                    {
                      $eq: ["$visitType", "virtual-meeting"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          nineSquareVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$location", "project-ev-9-square-vashi-sector-9"],
                    },
                    {
                      $eq: ["$visitType", "visit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          marinaBayVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$location",
                        "project-ev-10-marina-bay-vashi-sector-10",
                      ],
                    },
                    {
                      $eq: ["$visitType", "visit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          malibuVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$location",
                        "project-ev23-malibu-west-koparkhairne-2024",
                      ],
                    },
                    {
                      $eq: ["$visitType", "visit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          heartCityVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$location", "project-ev-heart-city-mosare-2025"],
                    },
                    {
                      $eq: ["$visitType", "visit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          //project revisits
          nineSquareRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$location", "project-ev-9-square-vashi-sector-9"],
                    },
                    {
                      $eq: ["$visitType", "revisit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          marinaBayRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$location",
                        "project-ev-10-marina-bay-vashi-sector-10",
                      ],
                    },
                    {
                      $eq: ["$visitType", "revisit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          malibuRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        "$location",
                        "project-ev23-malibu-west-koparkhairne-2024",
                      ],
                    },
                    {
                      $eq: ["$visitType", "revisit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          heartCityRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$location", "project-ev-heart-city-mosare-2025"],
                    },
                    {
                      $eq: ["$visitType", "revisit"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          totalTeamCallingVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$closingManager", teamLeaders] },
                    { $eq: ["$visitType", "visit"] },
                    { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          //visits
          deepakTeamVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[0]] },
                    { $eq: ["$visitType", "visit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          vickyManeTeamVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[1]] },
                    { $eq: ["$visitType", "visit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          jaspreetTeamVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[2]] },
                    { $eq: ["$visitType", "visit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ranjnaTeamVisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[3]] },
                    { $eq: ["$visitType", "visit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          //revisits
          deepakTeamRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[0]] },
                    { $eq: ["$visitType", "revisit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          vickyManeTeamRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[1]] },
                    { $eq: ["$visitType", "revisit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          jaspreetTeamRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[2]] },
                    { $eq: ["$visitType", "revisit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ranjnaTeamRevisits: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[3]] },
                    { $eq: ["$visitType", "revisit"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          //virtual-meeting
          deepakTeamVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[0]] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                    { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          vickyManeTeamVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[1]] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                    { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          jaspreetTeamVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[2]] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                    // { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ranjnaTeamVirtualMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$closingManager", teamLeaders[3]] },
                    { $eq: ["$visitType", "virtual-meeting"] },
                    { $ne: ["$source", "walk-in"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalVisits: 1,
          visits: 1,
          revisits: 1,
          virtualMeetings: 1,
          walkins: 1,
          walkinVirtualMeetings: 1,
          walkinVisits: 1,
          walkinRevisits: 1,

          cpVisits: 1,
          cpRevisits: 1,
          cpVirtualMeetings: 1,
          nineSquareVisits: 1,
          marinaBayVisits: 1,
          malibuVisits: 1,
          heartCityVisits: 1,

          nineSquareRevisits: 1,
          marinaBayRevisits: 1,
          malibuRevisits: 1,
          heartCityRevisits: 1,

          totalTeamCallingVisits: 1,
          deepakTeamVisits: 1,
          vickyManeTeamVisits: 1,
          jaspreetTeamVisits: 1,
          ranjnaTeamVisits: 1,
          deepakTeamRevisits: 1,
          vickyManeTeamRevisits: 1,
          jaspreetTeamRevisits: 1,
          ranjnaTeamRevisits: 1,
          deepakTeamVirtualMeetings: 1,
          vickyManeTeamVirtualMeetings: 1,
          jaspreetTeamVirtualMeetings: 1,
          ranjnaTeamVirtualMeetings: 1,
          internalVirtualMeetings: 1,
          internalVisits: 1,
          internalRevisits: 1,
          nineSquareVirtualMeetings: 1,
          marinaBayVirtualMeetings: 1,
          malibuVirtualMeetings: 1,
          heartCityVirtualMeetings: 1,
        },
      },
    ]);

    // const maxCpVisits = await siteVisitModel.aggregate([
    //   {
    //     $match: {
    //       date: { $gte: startOf11am, $lte: endOf10pm },
    //       source: "cp",
    //       visitType: "visit",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$_id", // Assuming `cpId` is the unique identifier for CPs
    //       cpName: { $first: "$channelPartner" }, // Get CP Name if available
    //       totalVisits: { $sum: 1 }, // Count total visits for each CP
    //     },
    //   },
    //   {
    //     $sort: { totalVisits: -1 }, // Sort by highest visits
    //   },
    //   { $limit: 1 }, // Get the top CP
    // ]);

    const maxCpVisits = await siteVisitModel.aggregate([
      {
        $match: {
          $and: [
            {
              date: { $gte: startOf11am, $lte: endOf10pm },
            },
            {
              approvalStatus: { $ne: "rejected" },
            },
            {
              approvalStatus: { $ne: "pending" },
            },
            {
              source: "cp",
            },
          ],
          // visitType: "visit",
        },
      },
      {
        $group: {
          _id: "$channelPartner", // Group by CP ID
          totalVisits: { $sum: 1 }, // Count visits per CP
        },
      },
      {
        $sort: { totalVisits: -1 }, // Sort by highest visits
      },
    ]);

    // Find the highest visit count
    const highestVisitCount =
      maxCpVisits.length > 0 ? maxCpVisits[0].totalVisits : 0;

    // Filter only CPs with the highest visit count
    const highestCpVisits = maxCpVisits.filter(
      (cp) => cp.totalVisits === highestVisitCount,
    );
    // console.log(highestCpVisits);
    // Populate CP details from cpModel
    const populatedCpVisits = await cpModel
      .find({
        _id: { $in: highestCpVisits.map((cp) => cp?._id) },
      })
      .select("firmName"); // Only fetch firmName
    // console.log(populatedCpVisits);

    // Merge firmName into the result
    const cpNamesList =
      highestCpVisits
        .map((cp) => {
          const firm = populatedCpVisits.find((f) => f?._id === cp?._id);
          return firm
            ? `${firm.firmName}(${cp.totalVisits})`
            : `(${cp.totalVisits})`;
        })
        .join(", ") || "NA";

    const counts =
      visitSummary.length > 0
        ? visitSummary[0]
        : { totalVisits: 0, revisits: 0 };

    //   const maxCpVisitsBy =
    // maxCpVisits.length > 0 ? maxCpVisits[0]?.cpName : { maxCpVisits: null };

    // const findCp = await cpModel.findById(maxCpVisitsBy);

    const datas = {
      date: todayDate,
      ...counts,
      maxCpVisitsBy: cpNamesList,
    };

    const respEmail = await sendMultipleEmail(
      ["ricki@evgroup.co.in"],
      `Visit Summary ${datas.date}`,
      visitSummaryTemplate({
        date: datas.date,
        totalVisits: datas.totalVisits,

        cpVirtualMeetings: datas.cpVirtualMeetings,
        cpVisits: datas.cpVisits,
        cpRevisits: datas.cpRevisits,

        internalVirtualMeetings: datas.internalVirtualMeetings,
        internalVisits: datas.internalVisits,
        internalRevisits: datas.internalRevisits,

        walkinVirtualMeetings: datas.walkinVirtualMeetings,
        walkinVisits: datas.walkinVisits,
        walkinRevisits: datas.walkinRevisits,

        nineSquareVirtualMeetings: datas.nineSquareVirtualMeetings,
        nineSquareVisits: datas.nineSquareVisits,
        nineSquareRevisits: datas.nineSquareRevisits,

        marinaBayVirtualMeetings: datas.marinaBayVirtualMeetings,
        marinaBayVisits: datas.marinaBayVisits,
        marinaBayRevisits: datas.marinaBayRevisits,

        malibuVirtualMeetings: datas.malibuVirtualMeetings,
        malibuVisits: datas.malibuVisits,
        malibuRevisits: datas.malibuRevisits,

        heartCityVirtualMeetings: datas.heartCityVirtualMeetings,
        heartCityVisits: datas.heartCityVisits,
        heartCityRevisits: datas.heartCityRevisits,

        deepakVisits: datas.deepakTeamVisits,
        deepakRevisits: datas.deepakTeamRevisits,
        deepakVirtualMeetings: datas.deepakTeamVirtualMeetings,

        vickyManeVisits: datas.vickyManeTeamVisits,
        vickyManeRevisits: datas.vickyManeTeamRevisits,
        vickyManeVirtualMeetings: datas.vickyManeTeamVirtualMeetings,

        jaspreetVisits: datas.jaspreetTeamVisits,
        jaspreetRevisits: datas.jaspreetTeamRevisits,
        jaspreetVirtualMeetings: datas.jaspreetTeamVirtualMeetings,

        ranjnaVisits: datas.ranjnaTeamVisits,
        ranjnaRevisits: datas.ranjnaTeamRevisits,
        ranjnaVirtualMeetings: datas.ranjnaTeamVirtualMeetings,

        maxVisitCpName: datas.maxCpVisitsBy,
      }),
      [],
      ["evhomes.operations@evgroup.co.in", "deepak@evgroup.co.in"],
    );

    return datas;
  } catch (error) {
    // console.error(error);
    return { totalVisits: 0, revisits: 0 };
  }
};

// export const getTodayVisitSummary = async () => {
//   try {
//     const timeZone = "Asia/Kolkata";

//     const startOf11am = moment()
//       .tz(timeZone)
//       .startOf("day")
//       .add(11, "hour")
//       .toDate();

//     const endOf10pm = moment()
//       .tz(timeZone)
//       .startOf("day")
//       .add(22, "hour")
//       .toDate();

//     const todayVisits = await siteVisitModel.find({
//       date: { $gte: startOf11am, $lte: endOf10pm },
//     });

//     return todayVisits;
//   } catch (error) {
//     return [];
//   }
// };

export const addSiteVisitV2 = async (req, res) => {
  const body = req.body;
  const {
    firstName,
    lastName,
    phoneNumber,
    projects,
    choiceApt,
    closingManager,
    lead,
  } = body;
  const user = req.user; //user onl
  console.log(user);

  console.log(body);

  try {
    if (!body) {
      return res.send(errorRes(403, "Data is required"));
    }
    if (!firstName) {
      return res.send(errorRes(403, "First name is required"));
    }
    if (!lastName) {
      return res.send(errorRes(403, "Last name is required"));
    }
    // if (!residence) return res.send(errorRes(403, "Residence is required"));
    if (!projects) {
      return res.send(errorRes(403, "Project is required"));
    }

    if (!phoneNumber) {
      return res.send(errorRes(403, "Phone number is required"));
    }
    if (!closingManager) {
      return res.send(errorRes(403, "Closing Manager is required"));
    }
    // if(!closingTeam) res.send(errorRes(403,"Closing Team is required"));
    if (!choiceApt) {
      return res.send(errorRes(403, "Choice of Apartment is required"));
    }

    const today = new Date();
    let foundLead;
    if (lead != null) {
      foundLead = await leadModelV2.findById(lead);
    } else {
      foundLead = await leadModelV2.findOne({
        $or: [{ phoneNumber }, { altPhoneNumber: phoneNumber }],
      });
    }

    const newSiteVisit = await siteVisitModel.create({
      ...body,
      dataAnalyzer: foundLead?.dataAnalyzer,
      approvalStatus: "pending",
      entryBy: user?._id,
    });

    const populateNewSiteVisit = await siteVisitModel
      .findById(newSiteVisit?._id)
      .populate(siteVisitPopulateOptions);

    const foundPlayers = await oneSignalModel.find({
      docId: {
        $in: ["ev89-narayan-jha", "ev88-pavan-ale"],
      },
      // role: teamLeaderResp?.role,
    });
    // console.log(foundPlayers);
    if (foundPlayers.length > 0) {
      let ids = foundPlayers.map((ele) => ele.playerId);
      // console.log(foundTLPlayerId);

      await sendNotificationWithImage({
        playerIds: ids,
        title: "You've Got a new visit",
        message: `A new visit has been assigned to you. Check the details`,
        imageUrl: visitNotificationImage,
        data: {
          type: "visit",
          route: `/visit-details/${populateNewSiteVisit?._id}`,
          // id: foundLead?._id,
          // role: "employee",
          // designation: "desg-sales-executive",
        },
      });
    }

    return res.send(
      successRes(200, `Visit sent for Verification to Sourcing Manager`, {
        data: populateNewSiteVisit,
      }),
    );
  } catch (error) {
    // console.log(error);
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const searchSiteVisitDTA = async (req, res, next) => {
  try {
    // console.log("entered");
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    let date = req.query.date; // New date parameter

    let skip = (page - 1) * limit;
    // console.log(startDate);
    // console.log(endDate);
    // console.log(date); // Log the date parameter

    const isNumberQuery = !isNaN(query);
    let statusToFind = {};
    let status = req.query.status?.toLowerCase();

    let today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    let dateFilter = {
      ...(date ? { date: { $gte: start, $lte: end } } : {}),
    };

    if (!date && !startDate && !endDate) {
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
    }

    // New date filtering logic using if statements
    if (date) {
      if (date.toLowerCase() === "today") {
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
      } else if (date.toLowerCase() === "yesterday") {
        start.setUTCDate(today.getUTCDate() - 1);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
        end.setUTCDate(end.getUTCDate() - 1);
      } else if (date.toLowerCase() === "last-7-days") {
        start.setUTCDate(today.getUTCDate() - 7);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
      } else if (date.toLowerCase() === "last-30-days") {
        start.setUTCDate(today.getUTCDate() - 30);
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(23, 59, 59, 999);
      } else {
        // console.log("Invalid date filter provided");
      }
      // dateFilter;
      // console.log("Applying Date Filter:", dateFilter);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      dateFilter;
      // console.log("Applying Date Filter:", dateFilter);
    }

    // Set visitType based on status
    if (status === "visit") {
      statusToFind = { visitType: "visit" };
    } else if (status === "revisit") {
      statusToFind = { visitType: "revisit" };
    } else if (status === "virtual-meeting") {
      statusToFind = { visitType: "virtual-meeting" };
    } else if (status === "pending") {
      statusToFind = { approvalStatus: "pending" };
    } else if (status === "rejected") {
      statusToFind = { approvalStatus: "rejected" };
    } else if (status === "approved") {
      statusToFind = { approvalStatus: "approved" };
    }

    let searchFilter = {
      ...(statusToFind != null ? statusToFind : null),
      ...dateFilter,
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        isNumberQuery
          ? {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$phoneNumber" },
                  regex: query,
                },
              },
            }
          : null,
        { email: { $regex: query, $options: "i" } },
        { source: { $regex: query, $options: "i" } },
      ].filter(Boolean), // Remove any null values
    };

    // Perform the search with pagination
    const respSite = await siteVisitModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 })
      .populate(siteVisitPopulateOptions);

    // Count the total items matching the filter
    const totalItems = await siteVisitModel.countDocuments();

    // Count based on the date filter
    const totalSiteVisits = await siteVisitModel.countDocuments({
      ...dateFilter,
      $or: [
        { visitType: "revisit" },
        { visitType: "visit" },
        { visitType: "virtual-meeting" },
      ],
    });

    const totalVisits = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "visit" },
    });

    const cpvisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      visitType: { $eq: "visit" },

      $or: [
        {
          source: { $eq: "cp" },
        },
        // {
        //   source: { $eq: "internal-lead" },
        // },
      ],
    });

    const cpRevisit = await siteVisitModel.countDocuments({
      ...dateFilter,

      visitType: { $eq: "revisit" },

      $or: [
        {
          source: { $eq: "cp" },
        },
      ],
    });

    const internalLeadsVisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "visit" },
      $or: [
        {
          source: { $eq: "internal-lead" },
        },
      ],
    });

    const internalLeadsRevisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "revisit" },
      $or: [
        {
          source: { $eq: "internal-lead" },
        },
      ],
    });

    const walkInVisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      source: { $eq: "walk-in" },
      visitType: { $eq: "visit" },
    });

    const walkInRevisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "revisit" },
      $or: [
        {
          source: { $eq: "walk-in" },
        },
      ],
    });

    const revisit = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "revisit" },
    });

    const virtualMeeting = await siteVisitModel.countDocuments({
      ...dateFilter,
      visitType: { $eq: "virtual-meeting" },
    });

    const approvedCount = await siteVisitModel.countDocuments({
      approvalStatus: "approved",
    });

    const pendingCount = await siteVisitModel.countDocuments({
      approvalStatus: "pending",
    });
    const rejectedCount = await siteVisitModel.countDocuments({
      approvalStatus: "rejected",
    });

    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get site visits", {
        page,
        limit,
        totalPages,
        totalItems,
        totalSiteVisits,
        totalVisits,
        walkInVisit,
        cpvisit,
        visit: cpvisit,
        visit2: walkInVisit,
        internalLeadsVisit,
        revisit,
        cpRevisit,
        walkInRevisit,
        internalLeadsRevisit,
        virtualMeeting,
        approvedCount,
        pendingCount,
        rejectedCount,
        data: respSite,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

//visit approval done -- (create client id pendind if not exist)
export const siteVisitApproval = async (req, res, next) => {
  const id = req.params.id;
  const { remark, status, userId } = req.body;
  const user = req.user;
  // console.log(req.body);
  // console.log(user);

  try {
    const resp = await siteVisitModel.findById(id);

    if (!resp) return errorRes2(res, 404, "visit not found");

    const today = new Date();

    const updatedVisit = await siteVisitModel
      .findByIdAndUpdate(id, {
        approvalStatus: status,
        approvalRemark: remark,
        approvalDate: new Date(),
        approveBy: user?._id ?? userId,
      })
      .populate(siteVisitPopulateOptions);

    if (!status?.toLowerCase() === "rejected") {
      return successRes2(res, 200, "Visit Rejected", { data: updatedVisit });
    }
    // get lead by id if exist
    let foundLead = await leadModelV2.findOne({
      $or: [
        { _id: updatedVisit.lead },
        { phoneNumber: updatedVisit.phoneNumber },
      ],
    });
    // console.log(foundLead);
    try {
      if (!foundLead && updatedVisit.source?.toLowerCase() != "cp") {
        let updates = {
          leadType: updatedVisit.source?.toLowerCase(),
          firstName: updatedVisit.firstName,
          lastName: updatedVisit.lastName,
          address: updatedVisit.residence,
          email: updatedVisit.email,
          project: updatedVisit.projects,
          requirement: updatedVisit.choiceApt,
          phoneNumber: updatedVisit.phoneNumber,
          teamLeader: updatedVisit.closingManager,
          dataAnalyzer: updatedVisit.approveBy?._id,
          propertyType: updatedVisit.propertyType,
          createdThrough: "visit-form",
          stage: "revisit",
          cycle: {
            stage: "revisit",
            teamLeader: updatedVisit.closingManager,
            startDate: updatedVisit.date,
            validTill: moment(updatedVisit.date)
              .tz(zone)
              .add(30, "days")
              .toDate(),
            currentDays: 29,
            currentOrder: 1,
          },
        };

        foundLead = await leadModelV2.create(updates);
      }
    } catch (error) {
      //error upating/creating lead
      console.log(error);
    }
    // checking tagging
    const taggingOver = moment(foundLead.validTill)
      .tz(zone)
      .isBefore(moment.tz(zone));

    if (updatedVisit.visitType === "visit") {
      foundLead.visitStatus = "visited";
      foundLead.visitRef = updatedVisit._id;
      foundLead.stage = "revisit";
      foundLead.cycle.stage = "revisit";
      foundLead.cycle.currentDays = 29; // to cycle trigger properly
      foundLead.cycle.validTill = moment(updatedVisit.date)
        .tz(zone)
        .add(30, "days")
        .toDate(); // add +30 days to current cycle
      foundLead.visitDate = updatedVisit.date;
      if (!taggingOver) {
        // calculating remaining days
        const validTill = moment(foundLead.validTill).tz(zone).startOf("day");
        const totalRemainingDays = validTill.diff(today, "days");

        // adding extra days if condition satisfy
        if (totalRemainingDays <= 29) {
          const availableDays = 30 - totalRemainingDays;
          foundLead.validTill = validTill.add(availableDays, "days").toDate();
        }
      }
    } else if (updatedVisit.visitType === "virtual-meeting") {
      foundLead.visitStatus = "virtual-meeting";
      foundLead.visitRef = updatedVisit._id;
      foundLead.stage = "revisit";
      foundLead.cycle.stage = "revisit";
      foundLead.cycle.currentDays = 29; // to cycle trigger properly
      foundLead.cycle.validTill = moment(updatedVisit.date)
        .tz(zone)
        .add(30, "days")
        .toDate(); // add +30 days to current cycle

      if (!taggingOver) {
        // calculating remaining days
        const validTill = moment(foundLead.validTill).tz(zone).startOf("day");
        const totalRemainingDays = validTill.diff(today, "days");

        // adding extra days if condition satisfy
        if (totalRemainingDays <= 29) {
          const availableDays = 30 - totalRemainingDays;
          foundLead.validTill = validTill.add(availableDays, "days").toDate();
        }
      }
    } else if (updatedVisit.visitType === "revisit") {
      foundLead.revisitStatus = "revisited";
      foundLead.revisitRef = updatedVisit._id;
      foundLead.stage = "booking";
      foundLead.cycle.stage = "booking";
      foundLead.cycle.currentDays = 29; // to cycle trigger properly
      foundLead.cycle.validTill = moment(updatedVisit.date)
        .tz(zone)
        .add(30, "days")
        .toDate(); // add +30 days to current cycle
      foundLead.revisitDate = updatedVisit.date;
    }

    try {
      foundLead.firstName = updatedVisit?.firstName;
      foundLead.lastName = updatedVisit?.lastName;
      await foundLead.save();
    } catch (error) {
      //
      console.log(error);
    }

    // check if first visit & update score- ranking
    try {
      //
      const oldVisit = await siteVisitModel.findOne({
        phoneNumber: updatedVisit.phoneNumber,
      });
      if (!oldVisit) {
        //
        foundLead.isCountableVisit = true;
        await foundLead.save();
      }
    } catch (error) {
      //
      console.log(error);
    }
    //

    //notification
    try {
      const idsToFind = [
        { docId: "ev88-pavan-ale" },
        { docId: foundLead.teamLeader },
      ];

      if (!taggingOver) {
        idsToFind.push({ docId: foundLead?.channelPartner });
      }

      const dta = await oneSignalModel.find({
        $or: idsToFind,
      });

      let ids = dta.map((ele) => ele.playerId);

      await sendNotificationWithImage({
        playerIds: ids,
        title:
          updatedVisit.visitType === "virtual-meeting"
            ? "Virtual Meeting Done!"
            : `Site ${updatedVisit.visitType} Done!`,
        message: `Site visit is done for ${foundLead.firstName ?? ""} ${
          foundLead.lastName ?? ""
        }`,
        imageUrl: visitNotificationImage,
        data: {
          route: `/lead-details/${foundLead?._id}`,
          type: "lead",
          id: foundLead?._id,
          role: "channel-partner",
        },
      });

      // console.log("pass sent notification");
    } catch (error) {
      //
      console.log(error);
    }
    //email
    try {
      const attachment = [];
      if (updatedVisit.visitType === "virtual-meeting") {
        const imageUrl = updatedVisit?.virtualMeetingDoc ?? "";
        // 1. Get file extension from URL (ignoring query params)
        const cleanUrl = imageUrl.split("?")[0]; // remove query string
        const ext = path.extname(cleanUrl); // .jpg, .png, etc.

        const imageRes = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const base64Image = Buffer.from(imageRes.data).toString("base64");

        // 2. Create a dynamic filename
        const filename = `attachment-virtual-meeting${ext}`;

        attachment.push({
          name: filename,
          content: base64Image,
        });
      }
      var subject = "";
      if (updatedVisit.source?.toLowerCase() === "cp") {
        subject = `Client Just Visited the Sales Lounge through Channel Partner (${
          updatedVisit.channelPartner?.firmName ?? ""
        })`;
        if (updatedVisit?.visitType === "virtual-meeting") {
          subject = `Client Virtual Meeting is conducted through Channel Partner (${
            updatedVisit.channelPartner?.firmName ?? ""
          })`;
        }
      } else if (updatedVisit.source?.toLowerCase() === "walk-in") {
        subject = `A Walk-in Client Just Visited the Sales Lounge`;
      } else if (updatedVisit.source?.toLowerCase() === "virtual-meeting") {
        subject = `Client Virtual Meeting Completed for Channel Partner (${
          updatedVisit.channelPartner?.firmName ?? ""
        }) via ${updatedVisit.closingManager?.firstName} ${
          updatedVisit.closingManager?.lastName
        } Team`;
      }
      const visitDate = moment(updatedVisit.date)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY hh:mm A");

      await sendMultipleEmail(
        ["ricki@evgroup.co.in"],
        subject,
        visitTemplateV3({
          header: subject,
          clientName: `${updatedVisit?.firstName ?? " "} ${
            updatedVisit?.lastName ?? " "
          }`,
          phoneNumber: `${updatedVisit?.countryCode ?? " "} ${
            updatedVisit?.phoneNumber ?? " "
          }`,
          email: updatedVisit?.email ?? "NA",
          team: `${
            updatedVisit.closingTeam?.map((ele) => ele?.firstName).join(",") ??
            " "
          }`,
          closingManager: `${updatedVisit.closingManager?.firstName ?? " "} ${
            updatedVisit.closingManager?.lastName ?? " "
          }`,
          channelPartner: updatedVisit?.channelPartner?.firmName ?? "NA",
          projects: `${
            updatedVisit.projects?.map((ele) => ele.name).join(",") ?? " "
          }`,
          requirement: `${
            updatedVisit.choiceApt?.map((ele) => ele).join(",") ?? " "
          }`,
          date: visitDate,
          location: updatedVisit?.location?.address ?? "",
          visitType: updatedVisit?.visitType,
          imageUrl: updatedVisit.location?.showCaseImage,
        }),
        attachment,
        ["evhomes.operations@evgroup.co.in", "deepak@evgroup.co.in"],
      );

      try {
        //ninesq= 13/ 10mb = 5/
        if (
          updatedVisit.location?._id === "project-ev-9-square-vashi-sector-9" &&
          updatedVisit.email
        ) {
          // console.log("entered 9 square");
          await addContact({
            listIds: [13],
            email: updatedVisit.email,
            firstName: updatedVisit.firstName,
            lastName: updatedVisit.lastName,
            phoneNumber: `+91${updatedVisit.phoneNumber}`,
          });
        }
        if (
          updatedVisit.location?._id ===
            "project-ev-10-marina-bay-vashi-sector-10" &&
          updatedVisit.email
        ) {
          // console.log("entered 10 marina");

          await addContact({
            listIds: [5],
            email: updatedVisit.email,
            firstName: updatedVisit.firstName,
            lastName: updatedVisit.lastName,
            phoneNumber: `+91${updatedVisit.phoneNumber}`,
          });
        }
      } catch (error) {
        //
        console.log(error);
      }
    } catch (error) {
      console.log(error);
    }
    return successRes2(res, 200, "ok", { data: updatedVisit });
  } catch (error) {
    console.log(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
};

export const getCpFeedbackPendingVisits = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // console.log(oneHourAgo);
    const visits = await siteVisitModel
      .find({
        date: { $lte: oneHourAgo },
        cpfeedback: "",
        source: "cp",
        $or: [
          { cpfeedbackPendingEmailSent: { $exists: false } },
          { cpfeedbackPendingEmailSent: false },
        ],
        closingManager: { $ne: null },
      })
      .populate(siteVisitPopulateOptions);
    // .limit(1);

    // console.log(visits);
    const updateOps = [];

    for (const visit of visits) {
      try {
        const closingManager = await employeeModel.findById(
          visit.closingManager,
        );

        const channelPartnerFirm = await cpModel.findById(visit.channelPartner);
        // console.log(channelPartnerFirm?.firmName);

        let firmName = "";
        if (visit.channelPartner) {
          const channelPartnerFirm = await cpModel.findById(
            visit.channelPartner,
          );
          firmName = channelPartnerFirm?.firmName || "";
          // console.log("Firm Name:", firmName);
        }

        if (!closingManager) continue;
        const closingManagerEmail = closingManager.email;
        // console.log(closingManagerEmail);

        await sendMultipleEmail(
          [closingManagerEmail],
          `Pending CP Feedback for ${visit.firstName} ${visit.lastName}`,
          cpFeedbackPendingTemplate(
            `${visit.firstName} ${visit.lastName}`,
            visit.phoneNumber,
            visit.email,
            firmName,
            moment(visit.date).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm A"),
          ),
          [],
          ["evhomes.operations@evgroup.co.in"],
        );

        updateOps.push({
          updateOne: {
            filter: { _id: visit._id },
            update: { cpfeedbackPendingEmailSent: true },
          },
        });
      } catch (err) {
        console.error("Error sending email:", err);
      }
    }

    if (updateOps.length > 0) {
      await siteVisitModel.bulkWrite(updateOps);
    }

    // console.log(`CP Feedback emails sent for ${updateOps.length} visits.`);
    return visits;
  } catch (error) {
    console.error("Error in getCpFeedbackPendingVisits:", error);
    return null;
  }
};

// export const getSiteVisitSummaryByAttendee = async (req, res, next) => {
//   const { id } = req.params;

//   try {

//     const tasks = await taskModel.find({ assignTo: id });

//     const validSiteVisits = [];

//     for (const task of tasks) {
//       // Step 2: For each task, fetch the related lead
//       const lead = await leadModel.findById(task.lead); // Adjust based on your task schema

//       // console.log(lead);
//       // if (!lead || !Array.isArray(lead.callHistory) || lead.callHistory.length === 0)

//       const lastCall = lead.callHistory[lead.callHistory.length - 1];

// // console.log(lastCall?.caller === id);
//       // Step 3: Check if last call was done by the same ID
//       if (lead.callHistory && lead.callHistory.length > 0) {
//         const lastCall = lead.callHistory[lead.callHistory.length - 1];

//         if (lastCall.caller === id) {
//           const siteVisits = await siteVisitModel.find({
//             closingTeam: { $in: [id] }
//           });

//           validSiteVisits.push(...siteVisits);
//         }
//       } else {
//         console.log(`No call history for lead: ${lead._id}`);
//       }

//     }

//     // Remove duplicate site visits if needed
//     const uniqueSiteVisits = [...new Map(validSiteVisits.map(item => [item._id.toString(), item])).values()];

//     return res.send(
//       successRes(200, "Details fetched Successfully", {
//         totalItems: uniqueSiteVisits.length,
//         data: uniqueSiteVisits
//       })
//     );
//   } catch (e) {
//     return res.send(errorRes(500, `server error: ${e.message}`));
//   }
// };
