import postSaleLeadModel from "../model/postSaleLead.model.js";
import ourProjectModel from "../model/ourProjects.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import {
  startOfWeek,
  addDays,
  format,
  startOfYear,
  endOfYear,
  startOfDay,
} from "date-fns";
import {
  leadPopulateOptions,
  postSalePopulateOptions,
} from "../utils/constant.js";
import TargetModel from "../model/target.model.js";
import { updateFlatInfoByIdFlatNo } from "./ourProjects.controller.js";
// import ourProjectModel from "../model/ourProjects.model.js";
import { sendEmail, sendMultipleEmail } from "../utils/brevo.js";
import {
  bookingRecievedTemplate,
  paymentReminderTemplate,
} from "../templates/html_template.js";
import employeeModel from "../model/employee.model.js";
import leadModel from "../model/lead/lead.model.js";
import moment from "moment";
import leadModelV2 from "../model/lead/leadV2Model.js";
import revisedTargetModel from "../model/bookingTarget/bookingTarget.model.js";
import { defaultProjectTargets, getQuarterInfo } from "./quarterInforFun.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
import oneSignalModel from "../model/oneSignal.model.js";
import { FlatOccupancyChange } from "../routes/ourProject/flatRouter.js";
import { ParkingOccupancyChange } from "../routes/ourProject/parkingRouter.js";

export const getPostSaleLeads = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let project = req.query.project;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    let status = req.query.status;
    let closingManager = req.query.closingManager;
    let date = req.query.date;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;

    let dateFilter = {};
    let skip = (page - 1) * limit;
    const isNumberQuery = !isNaN(query);
    let statusToFind = null;
    let ids = [];
    // const moment = require("moment");

    if (project === "null") {
      project = null;
    }

    if (closingManager) {
      // console.log("entered member");
      const test = await postSaleLeadModel
        .find({ closingManager: closingManager })
        .select("_id");
      test.map((ele) => {
        ids.push(ele._id.toString());
      });

      // console.log(ids);
    }

    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
      } else if (date === "yesterday") {
        const startOfYesterday = moment()
          .subtract(1, "days")
          .startOf("day")
          .toISOString();
        const endOfYesterday = moment()
          .subtract(1, "days")
          .endOf("day")
          .toISOString();
        dateFilter = {
          date: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
          },
        };
      } else if (date === "last-7-days") {
        const starof7days = moment()
          .subtract(7, "days")
          .startOf("day")
          .toISOString();
        const endof7days = moment().endOf("day").toISOString();
        dateFilter = {
          date: {
            $gte: starof7days,
            $lte: endof7days,
          },
        };
        // console.log(starof7days);
        // console.log(endof7days);
      } else if (date === "last-30-days") {
        const startOfMonth = moment()
          .subtract(30, "days")
          .startOf("day")
          .toISOString();
        const endOfMonth = moment().endOf("day").toISOString();
        dateFilter = {
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        };
        // console.log(startOfMonth);
        // console.log(endOfMonth);
      }
    }

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: moment(startDate).startOf("day").toISOString(),
          $lte: moment(endDate).endOf("day").toISOString(),
        },
      };
      // console.log(startDate);
      // console.log(endDate);

      // console.log(dateFilter);
    }

    if (status === "registrationDone" || status === "registration-done") {
      statusToFind = {
        $and: [
          {
            registrationDone: { $ne: null },
          },
          {
            registrationDone: { $eq: true },
          },
        ],
      };
    } else if (
      status === "registrationPending" ||
      status === "registration-pending"
    ) {
      statusToFind = {
        $and: [
          {
            registrationDone: { $ne: null },
          },
          {
            registrationDone: { $eq: false },
          },
        ],
      };
    } else if (status?.toLowerCase()?.includes("eoi")) {
      statusToFind = {
        "bookingStatus.type": "EOI",
      };
    } else if (status?.toLowerCase()?.includes("cancel")) {
      statusToFind = {
        "bookingStatus.type": "Cancelled",
      };
    }

    // Build the search filter
    let searchFilter = {
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
        { address: new RegExp(query, "i") },
        { unitNo: new RegExp(query, "i") },
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
        {
          applicants: {
            $elemMatch: {
              $or: [
                { firstName: new RegExp(query, "i") },
                { lastName: new RegExp(query, "i") },
                { email: new RegExp(query, "i") },
                { address: new RegExp(query, "i") },
              ].filter(Boolean),
            },
          },
        },
      ].filter(Boolean),
      ...(project ? { project: project } : {}),
      ...(closingManager ? { closingManager: closingManager } : {}),
      ...dateFilter,
    };
    // console.log({
    //   ...searchFilter,
    //   ...(statusToFind != null ? statusToFind : null),
    //   ...dateFilter,
    // });

    const resp = await postSaleLeadModel
      .find({
        ...searchFilter,
        ...(statusToFind != null ? statusToFind : null),
      })
      .sort({ date: -1 })
      .populate(postSalePopulateOptions)
      .skip(skip)
      .limit(limit);

    // Count the total items matching the filter
    const totalItems = await postSaleLeadModel.countDocuments({
      ...(project ? { project: project } : {}),
    }); // Count with the same filter
    const registrationDone = await postSaleLeadModel.countDocuments({
      ...(project ? { project: project } : {}),
      $and: [
        {
          registrationDone: { $ne: null },
        },
        {
          registrationDone: { $eq: true },
        },
      ],
    });
    const eoiRecieved = await postSaleLeadModel.countDocuments({
      "bookingStatus.type": "EOI",
      ...(project ? { project: project } : {}),
    });

    const cancelled = await postSaleLeadModel.countDocuments({
      "bookingStatus.type": "Cancelled",
      ...(project ? { project: project } : {}),
    });
    // console.log(cancelled);
    const report = await postSaleLeadModel.countDocuments({});
    const totalPages = Math.ceil(totalItems / limit);

    const registrationPending = await postSaleLeadModel.countDocuments({
      ...(project ? { project: project } : {}),
      registrationDone: false,
      "bookingStatus.type": { $ne: "Cancelled" },
    });

    return res.send(
      successRes(200, "get post sale leads", {
        page,
        limit,
        totalItems,
        totalPages,
        registrationDone,
        registrationPending,
        eoiRecieved,
        cancelled,
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getPostSaleLeadByBookingId = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return errorRes2(res, 401, "id is required");

    const resp = await postSaleLeadModel
      .findById(id)
      .populate(postSalePopulateOptions);

    return res.send(
      successRes(200, "get booking by id", {
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getpostSaleCountsRegGraph = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let project = req.query.project;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    let status = req.query.status;
    let statusToFind = null;
    let skip = (page - 1) * limit;
    const filterDate = new Date("2024-12-10");
    const isNumberQuery = !isNaN(query);
    let interval = req.query.interval;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    let dateRange = {};
    const currentDate = new Date();
    // console.log(interval);
    // console.log(startDate);
    // console.log(endDate);

    if (interval === "weekly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
    } else if (interval === "monthly") {
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
    } else if (interval === "quarterly") {
      const quarter = Math.floor(currentDate.getMonth() / 3);
      startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
      endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
    } else if (interval === "semi-annually") {
      const half = Math.floor(currentDate.getMonth() / 6);
      startDate = new Date(currentDate.getFullYear(), half * 6, 1);
      endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
    } else if (interval === "yearly") {
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
    }

    let searchFilter = {
      $or: [
        { firstName: new RegExp(query, "i") },
        { lastName: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
        { address: new RegExp(query, "i") },
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
        {
          applicants: {
            $elemMatch: {
              $or: [
                { firstName: new RegExp(query, "i") },
                { lastName: new RegExp(query, "i") },
                { email: new RegExp(query, "i") },
                { address: new RegExp(query, "i") },
              ].filter(Boolean),
            },
          },
        },
      ].filter(Boolean),
      $and: [
        // { date: { $gte: filterDate } },
        interval && { date: { $gte: startDate, $lt: endDate } },
      ].filter(Boolean),
      ...(project ? { project: project } : {}),
    };
    // console.log(searchFilter);
    // console.log("Start Date:", startDate);
    // console.log("End Date:", endDate);

    // Count the total items matching the filter
    const totalItems = await postSaleLeadModel.countDocuments(searchFilter); // Count with the same filter
    const registrationDone = await postSaleLeadModel.countDocuments({
      ...(project ? { project: project } : {}),
      $and: [
        {
          registrationDone: { $ne: null },
        },
        {
          registrationDone: { $eq: true },
        },
      ],
      ...(interval && { date: { $gte: startDate, $lt: endDate } }),
    });
    const eoiRecieved = await postSaleLeadModel.countDocuments({
      bookingStatus: "EOI Recieved",
      ...(project ? { project: project } : {}),
    });
    const cancelled = await postSaleLeadModel.countDocuments({
      bookingStatus: "Cancelled",
      ...(project ? { project: project } : {}),
    });
    const report = await postSaleLeadModel.countDocuments({});
    const totalPages = Math.ceil(totalItems / limit);

    const registrationPending = await postSaleLeadModel.countDocuments({
      ...(project ? { project: project } : {}),
      $and: [
        {
          registrationDone: { $ne: null },
        },
        {
          registrationDone: { $eq: false },
        },
      ],
      ...(interval && { date: { $gte: startDate, $lt: endDate } }),
    });

    return res.send(
      successRes(200, "get monthly report", {
        page,
        limit,
        totalItems,
        totalPages,
        registrationDone,
        registrationPending,
        interval,
        eoiRecieved,
        cancelled,
      })
    );
  } catch (error) {
    return next(error);
  }
};

// export const getpostSaleCountsRegFunnel = async (req, res, next) => {
//   try {
//     let query = req.query.query || "";
//     let project = req.query.project;
//     let page = parseInt(req.query.page) || 1;
//     let limit = parseInt(req.query.limit) || 20;
//     let status = req.query.status;
//     let statusToFind = null;
//     let skip = (page - 1) * limit;
//     const filterDate = new Date("2024-12-10");
//     const isNumberQuery = !isNaN(query);
//     let interval = req.query.interval;
//     let startDate = req.query.startDate;
//     let endDate = req.query.endDate;
//     let dateRange = {};
//     const currentDate = new Date();
//     console.log(interval);
//     console.log(startDate);
//     console.log(endDate);

//     if (interval === "weekly") {
//       startDate = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       endDate = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//     } else if (interval === "monthly") {
//       startDate = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth(),
//         1
//       );
//       endDate = new Date(
//         currentDate.getFullYear(),
//         currentDate.getMonth() + 1,
//         0
//       );
//     } else if (interval === "quarterly") {
//       const quarter = Math.floor(currentDate.getMonth() / 3);
//       startDate = new Date(currentDate.getFullYear(), quarter * 3, 1);
//       endDate = new Date(currentDate.getFullYear(), (quarter + 1) * 3, 0);
//     } else if (interval === "semi-annually") {
//       const half = Math.floor(currentDate.getMonth() / 6);
//       startDate = new Date(currentDate.getFullYear(), half * 6, 1);
//       endDate = new Date(currentDate.getFullYear(), (half + 1) * 6, 0);
//     } else if (interval === "annually") {
//       startDate = new Date(currentDate.getFullYear(), 0, 1);
//       endDate = new Date(currentDate.getFullYear() + 1, 0, 0);
//     }

//     let searchFilter = {
//       $or: [
//         { firstName: new RegExp(query, "i") },
//         { lastName: new RegExp(query, "i") },
//         { email: new RegExp(query, "i") },
//         { address: new RegExp(query, "i") },
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
//         {
//           applicants: {
//             $elemMatch: {
//               $or: [
//                 { firstName: new RegExp(query, "i") },
//                 { lastName: new RegExp(query, "i") },
//                 { email: new RegExp(query, "i") },
//                 { address: new RegExp(query, "i") },
//               ].filter(Boolean),
//             },
//           },
//         },
//       ].filter(Boolean),
//       $and: [
//         { startDate: { $gte: filterDate } },
//         interval && { startDate: { $gte: startDate, $lt: endDate } },
//       ].filter(Boolean),
//       ...(project ? { project: project } : {}),

//     };
//     console.log("Start Date:", startDate);
//     console.log("End Date:", endDate);

//     const resp = await postSaleLeadModel
//       .find({
//         ...searchFilter,
//         ...(statusToFind != null ? statusToFind : null),
//       })
//       .sort({ date: -1 })
//       .populate(postSalePopulateOptions)
//       .skip(skip)
//       .limit(limit);

//     // Count the total items matching the filter
//     const totalItems = await postSaleLeadModel.countDocuments(searchFilter); // Count with the same filter
//     const registrationDone = await postSaleLeadModel.countDocuments({
//       ...(project ? { project: project } : {}),
//       $and: [
//         {
//           registrationDone: { $ne: null },
//         },
//         {
//           registrationDone: { $eq: true },
//         },
//       ],
//     });
//     const eoiRecieved = await postSaleLeadModel.countDocuments({
//       bookingStatus: "EOI Recieved",
//       ...(project ? { project: project } : {}),
//     });
//     const cancelled = await postSaleLeadModel.countDocuments({
//       bookingStatus: "Cancelled",
//       ...(project ? { project: project } : {}),
//     });
//     const report = await postSaleLeadModel.countDocuments({});
//     const totalPages = Math.ceil(totalItems / limit);

//     const registrationPending = await postSaleLeadModel.countDocuments({
//       ...(project ? { project: project } : {}),
//       $and: [
//         {
//           registrationDone: { $ne: null },
//         },
//         {
//           registrationDone: { $eq: false },
//         },
//       ],
//     });

//     return res.send(
//       successRes(200, "get monthly report", {
//         page,
//         limit,
//         totalItems,
//         totalPages,
//         registrationDone,
//         registrationPending,
//         interval,
//         eoiRecieved,
//         cancelled,
//         data: resp,
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// };

export const getPostSaleLeadById = async (req, res, next) => {
  try {
    const flatNo = req.params.flatNo;

    if (!flatNo) return res.send(errorRes(401, "Flat No Required"));

    const resp = await postSaleLeadModel
      .findOne({ unitNo: flatNo })
      .populate(postSalePopulateOptions);

    // Count the total items matching the filter
    // console.log("data Sent");
    return res.send(
      successRes(200, "get post sale lead by id", {
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getPostSaleLeadsForExecutive = async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) return res.send(errorRes(401, "Executive id required"));

    let query = req.query.query || "";
    let project = req.query.project;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let status = req.query.status;
    let closingManager = req.query.closingManager;
    let date = req.query.date;
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    let dateFilter = {};
    const isNumberQuery = !isNaN(query);
    let statusToFind = null;
    let ids = [];
    let skip = (page - 1) * limit;
    // console.log(project);
    // console.log(status);

    if (project === "null") {
      project = null;
    }

    if (closingManager) {
      // console.log("entered member");
      const test = await postSaleLeadModel
        .find({ closingManager: closingManager })
        .select("_id");
      test.map((ele) => {
        ids.push(ele._id.toString());
      });

      // console.log(ids);
    }

    if (date) {
      if (date === "today") {
        const startOfDay = moment().startOf("day").toISOString();
        const endOfDay = moment().endOf("day").toISOString();
        dateFilter = {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        };
        // console.log(startOfDay);
        // console.log(endOfDay);
      } else if (date === "yesterday") {
        const startOfYesterday = moment()
          .subtract(1, "days")
          .startOf("day")
          .toISOString();
        const endOfYesterday = moment()
          .subtract(1, "days")
          .endOf("day")
          .toISOString();
        dateFilter = {
          date: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
          },
        };
      } else if (date === "last-7-days") {
        const starof7days = moment()
          .subtract(7, "days")
          .startOf("day")
          .toISOString();
        const endof7days = moment().endOf("day").toISOString();
        dateFilter = {
          date: {
            $gte: starof7days,
            $lte: endof7days,
          },
        };
        // console.log(starof7days);
        // console.log(endof7days);
      } else if (date === "last-30-days") {
        const startOfMonth = moment()
          .subtract(30, "days")
          .startOf("day")
          .toISOString();
        const endOfMonth = moment().endOf("day").toISOString();
        dateFilter = {
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        };
        // console.log(startOfMonth);
        // console.log(endOfMonth);
      }
    }

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: moment(startDate).startOf("day").toISOString(),
          $lte: moment(endDate).endOf("day").toISOString(),
        },
      };
      // console.log(startDate);
      // console.log(endDate);

      // console.log(dateFilter);
    }

    if (status === "registrationDone" || status === "registration-done") {
      statusToFind = {
        $and: [
          {
            registrationDone: { $ne: null },
          },
          {
            registrationDone: { $eq: true },
          },
        ],
      };
    } else if (
      status === "registrationPending" ||
      status === "registration-pending"
    ) {
      statusToFind = {
        $and: [
          {
            registrationDone: { $ne: null },
          },
          {
            registrationDone: { $eq: false },
          },
        ],
      };
    } else if (status?.toLowerCase()?.includes("eoi")) {
      statusToFind = {
        "bookingStatus.type": "EOI",
      };
    } else if (status?.toLowerCase()?.includes("cancel")) {
      statusToFind = {
        "bookingStatus.type": "Cancelled",
      };
    }

    let searchFilter = {
      $and: [
        {
          $or: [
            { firstName: new RegExp(query, "i") },
            { lastName: new RegExp(query, "i") },
            { email: new RegExp(query, "i") },
            { address: new RegExp(query, "i") },
            { unitNo: new RegExp(query, "i") },
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
            {
              applicants: {
                $elemMatch: {
                  $or: [
                    { firstName: new RegExp(query, "i") },
                    { lastName: new RegExp(query, "i") },
                    { email: new RegExp(query, "i") },
                    { address: new RegExp(query, "i") },
                  ].filter(Boolean),
                },
              },
            },
          ].filter(Boolean),
        },
        {
          $or: [
            {
              postSaleExecutive: id,
            },
            {
              postSaleAssignTo: { $in: [id] },
            },
          ],
        },
      ],
      ...(project ? { project: project } : {}),
      ...(closingManager ? { closingManager: closingManager } : {}),
      ...dateFilter,
    };

    const resp = await postSaleLeadModel
      .find({ ...searchFilter, ...statusToFind })
      .sort({ date: -1 })
      .populate(postSalePopulateOptions)
      .skip(skip)
      .limit(limit);

    // Count the total items matching the filter
    const totalItems = await postSaleLeadModel.countDocuments({
      $or: [
        {
          postSaleExecutive: id,
        },
        {
          postSaleAssignTo: { $in: [id] },
        },
      ],
      ...(project ? { project: project } : {}),
    }); // Count with the same filter
    const registrationDone = await postSaleLeadModel.countDocuments({
      $or: [
        {
          postSaleExecutive: id,
        },
        {
          postSaleAssignTo: { $in: [id] },
        },
      ],

      ...(project ? { project: project } : {}),

      $and: [
        {
          registrationDone: { $ne: null },
        },
        {
          registrationDone: { $eq: true },
        },
      ],
    });
    const registrationPending = await postSaleLeadModel.countDocuments({
      $or: [
        {
          postSaleExecutive: id,
        },
        {
          postSaleAssignTo: { $in: [id] },
        },
      ],

      ...(project ? { project: project } : {}),
      registrationDone: false,
      "bookingStatus.type": { $ne: "Cancelled" },
    });

    const eoiRecieved = await postSaleLeadModel.countDocuments({
      $or: [
        {
          postSaleExecutive: id,
        },
        {
          postSaleAssignTo: { $in: [id] },
        },
      ],

      ...(project ? { project: project } : {}),

      "bookingStatus.type": "EOI",
    });
    const cancelled = await postSaleLeadModel.countDocuments({
      $or: [
        {
          postSaleExecutive: id,
        },
        {
          postSaleAssignTo: { $in: [id] },
        },
      ],

      ...(project ? { project: project } : {}),

      "bookingStatus.type": "Cancelled",
    });
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get post sale leads", {
        page,
        limit,
        totalItems,
        totalPages,
        registrationDone,
        registrationPending,
        eoiRecieved,
        cancelled,
        data: resp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export async function getLeadCounts(req, res, next) {
  try {
    let query = req.query.query || "";
    let project = req.query.project; // Project filter
    const { interval = "monthly", year } = req.query;
    const currentYear = new Date().getFullYear();

    // Validate and set the year
    let selectedYear = currentYear;
    if (year) {
      selectedYear = parseInt(year, 10);
      if (isNaN(selectedYear)) {
        return res.json({ message: "Invalid year parameter" });
      }
    }

    // Set match stage
    let matchStage = {};
    if (interval === "monthly") {
      matchStage.date = {
        $gte: new Date("2024-12-10T00:00:00Z"),
        $lt: new Date(`${selectedYear + 1}-01-01`),
      };
    } else {
      return res.json({ message: "Invalid interval parameter" });
    }

    // Add project filter if given
    if (project) {
      matchStage.project = project;
    }

    // Common group stage
    const groupStage = {
      _id: {
        month: { $month: "$date" },
        year: { $year: "$date" },
      },
      count: { $sum: 1 },
    };

    // First: booking count
    const leadCounts = await postSaleLeadModel.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { "_id.month": 1 } },
    ]);

    // Then: registration count
    const regMatchStage = { ...matchStage, registrationDone: true };
    const leadRegisCounts = await postSaleLeadModel.aggregate([
      { $match: regMatchStage },
      { $group: groupStage },
      { $sort: { "_id.month": 1 } },
    ]);

    // Month labels
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize month-wise data
    const monthlyData = monthNames.map((month, index) => ({
      month,
      year: selectedYear,
      bookingCount: 0,
      registrationCount: 0,
    }));

    // Clone safely
    const monthlyData1 = monthlyData.map((m) => ({ ...m }));
    const monthlyData2 = monthlyData.map((m) => ({ ...m }));

    // Fill booking counts
    leadCounts.forEach((item) => {
      const i = item._id.month - 1;
      if (monthlyData1[i]) {
        monthlyData1[i].bookingCount = item.count;
      }
    });

    // Fill registration counts
    leadRegisCounts.forEach((item) => {
      const i = item._id.month - 1;
      if (monthlyData2[i]) {
        monthlyData2[i].registrationCount = item.count;
      }
    });

    // Merge booking and registration
    const mergedMonthlyData = monthlyData1.map((item, index) => ({
      ...item,
      registrationCount: monthlyData2[index].registrationCount || 0,
    }));

    // Filter to remove empty months
    const filteredMonthlyData = mergedMonthlyData.filter(
      (item) => item.bookingCount > 0 || item.registrationCount > 0
    );

    return res.send(
      successRes(200, "ok", {
        data: filteredMonthlyData,
      })
    );
  } catch (error) {
    console.error("Error getting lead counts:", error);
    next(error);
  }
}

export const addPostSaleLead = async (req, res, next) => {
  const body = req.body;
  const {
    firstName,
    lastName,
    email,
    unitNo,
    project,
    address,
    carpetArea,
    flatCost,
    phoneNumber,
    buildingNo,
    floor,
    number,
    lead,
    date = new Date(),
  } = body;
  try {
    if (!body) {
      return res.send(errorRes(401, "No Data Provided"));
    }
    if (body.applicants == null || body.applicants?.length <= 0) {
      return res.send(errorRes(401, "Aplicant cant be empty"));
    }
    // console.log(body);
    const findProject = await ourProjectModel.findById(project);

    if (findProject) {
      const findExisintFlat = findProject.flatList.find(
        (ele) =>
          ele.floor === floor &&
          ele.number === number &&
          ele.buildingNo === buildingNo &&
          ele.occupied === true
      );
      if (findExisintFlat) {
        return res.send(
          errorRes(401, `Flat ${findExisintFlat.flatNo} is Already Booked`)
        );
      }
    }

    // const resp = await postSaleLeadModel.find();
    const resp = await postSaleLeadModel.create({
      ...body,
    });

    const newLead = await postSaleLeadModel
      .findById(resp._id)
      .populate(postSalePopulateOptions);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const findTarget = await TargetModel.findOne({
      staffId: resp?.closingManager,
      month: currentMonth,
      year: currentYear,
    });

    if (findTarget != null) {
      try {
        findTarget.achieved += 1;
        findTarget.extraAchieved = Math.max(
          0,
          findTarget.achieved - findTarget.target
        );
        findTarget.bookings.push(resp._id);

        await findTarget.save();
      } catch (error) {
        //
      }
    }

    const bookingDate = new Date(resp.date || Date.now());
    const { startDate, endDate, year, quarter } = getQuarterInfo(bookingDate);

    function calculateTotalTarget(projectList) {
      let total = 0;
      for (let i = 0; i < projectList.length; i++) {
        total += projectList[i].target || 0;
      }
      return total;
    }

    const isBooking = resp?.bookingStatus?.type === "confirm-booking";
    const isRegistration = resp?.registrationDone === true;

    const targetF = {
      staffId: resp?.closingManager,
      startDate,
      endDate,
      year,
    };

    let revisedTarget = await revisedTargetModel.findOne(targetF);

    if (!revisedTarget) {
      try {
        const projectWiseData = defaultProjectTargets.map((p) => ({
          projectId: p.projectId,
          target: p.target,
          booking: p.projectId === resp.project && isBooking ? 1 : 0,
          registration: p.projectId === resp.project && isRegistration ? 1 : 0,
        }));

        revisedTarget = new revisedTargetModel({
          ...targetF,
          quarter,
          booking: isBooking ? [resp._id] : [],
          registration: isRegistration ? [resp._id] : [],
          projectWise: projectWiseData,
          target: calculateTotalTarget(projectWiseData),
        });

        await revisedTarget.save();
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        const alreadyInBooking = revisedTarget.booking?.includes(resp._id);
        const alreadyInRegistration = revisedTarget.registration?.includes(
          resp._id
        );

        if (isBooking && !alreadyInBooking) {
          revisedTarget.booking.push(resp._id);
        }

        if (isRegistration && !alreadyInRegistration) {
          revisedTarget.registration.push(resp._id);
        }

        for (let i = 0; i < revisedTarget.projectWise.length; i++) {
          const project = revisedTarget.projectWise[i];
          if (project.projectId === resp.project) {
            if (isBooking) project.booking = (project.booking || 0) + 1;
            if (isRegistration)
              project.registration = (project.registration || 0) + 1;
          }
        }

        revisedTarget.target = calculateTotalTarget(revisedTarget.projectWise);

        await revisedTarget.save();
      } catch (e) {
        console.log(e);
      }
    }
    try {
      await updateFlatInfoByIdFlatNo({
        projectId: project,
        floor,
        buildingNo,
        number,
        updates: {
          occupied: true,
        },
      });
    } catch (error) {
      //
    }

    // new flat update
    try {
      //
      await FlatOccupancyChange({
        project: project,
        floor,
        buildingNo,
        number,
        occupied: true,
      });
    } catch (error) {
      //
    }

    try {
      //
      if (newLead.parking.length > 0) {
        await Promise.all(
          newLead.parking.map(async (ele) => {
            //
            try {
               if (ele?.number) {
              await ParkingOccupancyChange({
                project: project,
                floor: ele.floor,
                number: ele.number,
                occupied: true,
              });
              }
            } catch (error) {
              //
            }
          })
        );
      }
    } catch (error) {
      //
    }

    //uppdate at lead
    try {
      const foundLead = await leadModelV2
        .findOne({
          $or: [
            { _id: lead },
            {
              teamLeader: resp?.closingManager,
              phoneNumber: phoneNumber,
            },
          ],
        })
        .populate(leadPopulateOptions);
      try {
        await leadModelV2.findByIdAndUpdate(foundLead?._id, {
          $set: {
            stage: "booking",
            "cycle.stage": "booking",
            bookingStatus: "booked",
            bookingRef: newLead?._id,
            isCountableBooking: true,
          },
        });
      } catch (error) {
        //
      }
    } catch (error) {
      //
    }
    // TODO: email commented for testing
    try {
      const emailsRecp = [
        // "aktarul.evgroup@gmail.com",
        "ricki@evgroup.co.in",
        "evhomes.operations@evgroup.co.in",
      ];

      const emps = await employeeModel
        .findById(resp?.closingManager)
        .select("email firstName lastName");

      emailsRecp.push(emps.email);

      const superAdmins = await employeeModel.find({
        designation: {
          $in: [
            "desg-post-sales-head",
            // "desg-site-head",
            // "desg-post-sales-executive",
          ],
        },
        status: "active",
      });

      superAdmins?.map((ele) => {
        emailsRecp.push(ele?.email);
      });
      await sendMultipleEmail(
        //recpt
        [emps.email],
        // sub
        `Congratulations there has been a new booking in ${findProject?.name} by ${emps?.firstName} ${emps?.lastName} team`,
        // template
        bookingRecievedTemplate(
          findProject?.name,
          `${emps?.firstName} ${emps?.lastName}`,
          `${firstName} ${lastName}`,
          `+91 ${phoneNumber}`,
          foundLead?.channelPartner?.firmName ?? "NA",
          foundLead?.cycle?.startDate ?? "NA",
          foundLead?.visitRef?.date ?? "NA",
          foundLead?.revisitRef?.date ?? "NA",
          date ?? "NA",
          newLead?.preRegistrationCheckList?.kyc?.recieved ?? "NO"
        ),
        // attchment
        [],
        // cc
        emailsRecp
      );
      // await sendEmail("aktarul.evgroup@gmail.com","Congratulations there has been a new booking in Nine Square by Deepak Karki.","");
    } catch (error) {
      //
    }

    return res.send(
      successRes(200, "Booking Added Succesfully", {
        data: newLead,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const updatePostSaleLeadById = async (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  try {
    // console.log("entered");
    if (!body) return res.send(errorRes(401, "No Data Provided"));

    const foundLead = await postSaleLeadModel.findById(id);

    // console.log("entered 1");

    if (!foundLead) return res.send(errorRes(404, "No lead found"));

    if (body.paymentScheme === "regular") {
      body.paymentOneDueDate = null;
      body.paymentTwoDueDate = null;
      body.paymentThreeDueDate = null;
      body.paymentFourDueDate = null;

      body.paymentOneAmt = 0;
      body.paymentTwoAmt = 0;
      body.paymentThreeAmt = 0;
      body.paymentFourAmt = 0;
    } else if (body.paymentScheme === "25:25:25:25-ext") {
      body.paymentFourDueDate = null;

      body.paymentFourAmt = 0;
    }
    // console.log("entered 2");
    // console.log(body);
    await foundLead.updateOne({ $set: body }, { new: true });
    const updatedLead = await postSaleLeadModel
      .findById(id)
      .populate(postSalePopulateOptions);

    //
    try {
      //
      if (foundLead.parking.length > 0) {
        await Promise.all(
          foundLead.parking.map(async (ele) => {
            //
            try {
              if (ele?.number) {
                await ParkingOccupancyChange({
                  project: foundLead?.project,
                  floor: ele?.floor,
                  number: ele?.number,
                  occupied: true,
                });
              }
            } catch (error) {
              //
            }
          })
        );
      }
    } catch (error) {
      //
    }

    return res.send(
      successRes(200, "updated post sale lead", {
        data: updatedLead,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const deletePostSaleLeadBydId = async (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  try {
    if (!body) return res.send(errorRes(401, "No Data Provided"));

    const foundLead = await postSaleLeadModel.findByIdAndDelete(id);

    if (!foundLead) return res.send(errorRes(404, "No lead found"));

    return res.send(
      successRes(200, "deleted post sale lead", {
        data: foundLead,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getPostSaleLeadByFlat = async (req, res) => {
  try {
    const unitNo = req.query.unitNo;
    const project = req.query.project;
    // console.log(unitNo);
    // console.log(project);
    const filter = {
      unitNo: parseInt(unitNo),
      project,
    };
    // console.log(filter);

    const respPayment = await postSaleLeadModel
      .findOne(filter)
      .populate(postSalePopulateOptions);
    // console.log(respPayment);
    return res.send(
      successRes(200, "Get Post Lead payment", {
        data: respPayment,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export async function getPostSaleLeadCounts(req, res, next) {
  try {
    const { interval, year, startDate, endDate } = req.query;
    const currentYear = new Date().getFullYear();

    // Validate year parameter only if it's provided
    let selectedYear = currentYear;
    if (year) {
      selectedYear = parseInt(year, 10);
      if (isNaN(selectedYear)) {
        return res.json({ message: "Invalid year parameter" });
      }
    }

    // Calculate the start of the current week (Monday)
    const currentDate = new Date();
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 7); // Limit to current week (Mon-Sun)

    let matchStage = {};

    if (interval === "weekly") {
      matchStage = {
        startDate: {
          $gte: startOfCurrentWeek,
          $lt: endOfCurrentWeek,
        },
      };
    } else if (interval === "monthly") {
      if (startDate && endDate) {
        matchStage = {
          startDate: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        };
      } else {
        matchStage = {
          startDate: {
            $gte: new Date(`${selectedYear}-01-01`),
            $lt: new Date(`${selectedYear + 1}-01-01`),
          },
        };
      }
    } else {
      return res.json({ message: "Invalid interval parameter" });
    }

    let groupStage = {};
    if (interval === "weekly") {
      groupStage = {
        _id: {
          dayOfWeek: { $dayOfWeek: "$date" },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        count: { $sum: 1 },
      };
    } else if (interval === "monthly") {
      groupStage = {
        _id: {
          month: { $month: "$date" },
          year: { $year: "$date" },
        },
        count: { $sum: 1 },
      };
    }

    const leadCounts = await postSaleLeadModel.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { "_id.date": 1, "_id.month": 1, "_id.dayOfWeek": 1 } },
    ]);

    // Prepare a full weekly structure with zero counts for missing days
    const dayMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    let weekData = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date: format(date, "yyyy-MM-dd"),
        day: dayMap[(i + 1) % 7], // Adjust for MongoDB's $dayOfWeek (1 = Sunday)
        count: 0,
      };
    });

    // Populate `weekData` with actual counts where available
    leadCounts.forEach((item) => {
      const foundDay = weekData.find((day) => day.date === item._id.date);
      if (foundDay) foundDay.count = item.count;
    });

    if (interval === "weekly") {
      return res.json(weekData); // Only send weekly data with all days accounted for
    }

    // Monthly data output
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const formattedMonthlyData = leadCounts.map((item) => ({
      year: item._id.year,
      month: monthNames[item._id.month - 1], // Use month number to get month name
      count: item.count,
    }));

    return res.json(formattedMonthlyData);
  } catch (error) {
    console.error("Error getting lead counts:", error);
    next(error);
  }
}

export const cancelBooking = async (req, res, next) => {
  const { id, remark } = req.query;

  try {
    if (!id) return res.send(errorRes(400, "Lead ID is required"));

    // Find the lead to get the associated flat details
    const lead = await postSaleLeadModel
      .findById(id)
      .populate(postSalePopulateOptions);

    if (!lead) return res.send(errorRes(404, "Lead not found"));

    // console.log("Lead found:", lead);
    // console.log("Unit No to update:", lead.unitNo);

    const updatedLead = await postSaleLeadModel.findByIdAndUpdate(
      id,
      {
        $set: {
          bookingStatus: {
            type: "Cancelled",
          },
          bookingCancelRemark: remark || "Cancelled by user",
          bookingCancelDate: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedLead) {
      return res
        .status(500)
        .send(errorRes(500, "Failed to update lead status"));
    }

    // Update the flat status to "unoccupied"
    try {
      const flatUpdateSuccess = await updateFlatInfoByIdFlatNo({
        projectId: lead.project,
        floor: lead.floor,
        number: lead.number,
        buildingNo: lead.buildingNo,
        updates: {
          occupied: false,
        },
      });
    } catch (error) {
      // console.log(error);
    }

    // new flat update
    try {
      //
      await FlatOccupancyChange({
        project: project,
        floor,
        buildingNo,
        number,
        occupied: false,
      });
    } catch (error) {
      //
    }

    try {
      //
      if (lead.parking.length > 0) {
        await Promise.all(
          lead.parking.map(async (ele) => {
            //
            try {
              await ParkingOccupancyChange({
                project: project,
                floor: ele.floor,
                number: ele.number,
                occupied: false,
              });
            } catch (error) {
              //
            }
          })
        );
      }
    } catch (error) {
      //
    }

    try {
      await leadModelV2.findOneAndUpdate(
        { bookingRef: id },
        { bookingStatus: "cancelled", isCountableBooking: false }
      );
    } catch (error) {
      // console.log(error);
    }

    // if (!flatUpdateSuccess) {
    //   console.log("Failed to update flat status.");
    //   return res
    //     .status(500)
    //     .send(errorRes(500, "Failed to update flat status"));
    // }

    return res.send(
      successRes(200, "Booking cancelled successfully", {
        data: updatedLead,
      })
    );
  } catch (error) {
    console.error("Error cancelling booking:", error); // Log the error for debugging
    return res.status(500).send(errorRes(500, "An unexpected error occurred"));
  }
};

export const updateBookingFeedback = async (req, res, next) => {
  const id = req.params.id;
  const user = req.user;
  const { caller } = req.body;

  try {
    if (!id) {
      return res.send(errorRes(400, "Booking id is required"));
    }

    const now = new Date();
    const updatedLead = await postSaleLeadModel
      .findByIdAndUpdate(
        id,
        {
          $addToSet: {
            callHistory: {
              ...req.body,
              callDate: now,
              caller: caller ?? user?._id,
            },
          },
        },
        { new: true }
      )
      .populate(postSalePopulateOptions);

    return res.send(
      successRes(200, "Feedback Updated successfully", {
        data: updatedLead,
      })
    );
  } catch (error) {
    console.error("Error cancelling booking:", error); // Log the error for debugging
    return res.status(500).send(errorRes(500, "An unexpected error occurred"));
  }
};

export const notificationForPaymentDue = async (req, res, next) => {
  try {
    const today = moment().tz("Asia/Kolkata").startOf("day");
    const tomorrow = moment(today).add(1, "day");

    // leads any payment due today or tomorrow
    const leads = await postSaleLeadModel.find({
      $or: [
        {
          paymentOneDueDate: {
            $gte: today.toDate(),
            $lt: moment(tomorrow).endOf("day").toDate(),
          },
        },
        {
          paymentTwoDueDate: {
            $gte: today.toDate(),
            $lt: moment(tomorrow).endOf("day").toDate(),
          },
        },
        {
          paymentThreeDueDate: {
            $gte: today.toDate(),
            $lt: moment(tomorrow).endOf("day").toDate(),
          },
        },
        {
          paymentFourDueDate: {
            $gte: today.toDate(),
            $lt: moment(tomorrow).endOf("day").toDate(),
          },
        },
      ],
    });

    if (!leads.length) return;

    //  closing managers with permission
    const managers = await employeeModel.find({
      permissions: {
        $in: ["payment_notification", "all_access"],
      },
      status: "active",
    });

    // manager who gets all notifications
    const specialManagerId = "ev0001-ricki-thomas";

    // player IDs for all managers including special one
    const managerIds = [
      ...managers.map((m) => m._id.toString()),
      specialManagerId,
    ];
    const oneSignalRecords = await oneSignalModel.find({
      docId: { $in: managerIds },
    });

    // Map managerId to playerId
    const playerMap = {};
    oneSignalRecords.forEach((p) => {
      if (p.playerId && p.playerId.trim())
        playerMap[p.docId.toString()] = p.playerId;
    });

    // Send notifications per lead
    for (const lead of leads) {
      const payments = [
        { label: "Payment 1", date: lead.paymentOneDueDate },
        { label: "Payment 2", date: lead.paymentTwoDueDate },
        { label: "Payment 3", date: lead.paymentThreeDueDate },
        { label: "Payment 4", date: lead.paymentFourDueDate },
      ];

      const managerId = lead.closingManager?.toString();
      const managerPlayerId = playerMap[managerId];
      const specialPlayerId = playerMap[specialManagerId];

      if (!managerPlayerId && !specialPlayerId) continue;

      for (const p of payments) {
        if (!p.date) continue;

        const when = moment(p.date).isSame(today, "day")
          ? "today"
          : moment(p.date).isSame(tomorrow, "day")
          ? "tomorrow"
          : null;

        if (!when) continue;

        await sendNotificationWithImage({
          playerIds: [managerPlayerId, specialPlayerId].filter(Boolean),
          title: "Payment Due Reminder",
          imageUrl:
            "https://cdn.evhomes.tech/77450f74-dee8-4d7e-8c5d-130fcb975874-payment.png",
          message: `${p.label} is due ${when} for ${lead.firstName || ""} ${
            lead.lastName || ""
          } (Phone: ${lead.phoneNumber})`,
          android_channel_id: "payment_notification",
          data: {
            // leadId: lead._id,
            // dueFor: p.label,
            // dueDate: p.date,
          },
        });

        console.log(
          `Sent ${p.label} reminder (${when}) for ${lead.firstName} ${lead.lastName}`
        );
      }
    }

    return leads;
  } catch (error) {
    return error;
  }
};

export const sendPaymentDueEmail = async (req, res) => {
  try {
    const timeZone = "Asia/Kolkata";
    const today = moment().tz(timeZone).startOf("day");
    const tomorrow = moment(today).add(1, "day").endOf("day");

    const leads = await postSaleLeadModel
      .find({
        $or: [
          {
            paymentOneDueDate: {
              $gte: today.toDate(),
              $lte: tomorrow.toDate(),
            },
          },
          {
            paymentTwoDueDate: {
              $gte: today.toDate(),
              $lte: tomorrow.toDate(),
            },
          },
          {
            paymentThreeDueDate: {
              $gte: today.toDate(),
              $lte: tomorrow.toDate(),
            },
          },
          {
            paymentFourDueDate: {
              $gte: today.toDate(),
              $lt: moment(tomorrow).endOf("day").toDate(),
            },
          },
        ],
      })
      .populate(postSalePopulateOptions)
      .lean();

    if (!leads.length) return;

    const managers = await employeeModel
      .find({
        permissions: { $in: ["payment_notification", "all_access"] },
        status: "active",
      })
      .lean();

    const managerMap = {};
    leads.forEach((lead) => {
      const payments = [
        { label: "Payment 1", date: lead.paymentOneDueDate },
        { label: "Payment 2", date: lead.paymentTwoDueDate },
        { label: "Payment 3", date: lead.paymentThreeDueDate },
        { label: "Payment 4", date: lead.paymentFourDueDate },
      ];

      payments.forEach((p) => {
        if (!p.date) return;
        const isToday = moment(p.date).isSame(today, "day");
        const isTomorrow = moment(p.date).isSame(tomorrow, "day");
        if (!isToday && !isTomorrow) return;

        const managerId = lead?.closingManager?._id;
        if (!managerMap[managerId]) managerMap[managerId] = [];

        managerMap[managerId].push({
          ...lead,
          paymentLabel: p.label,
          dueDate: moment(p.date).format("DD-MM-YYYY"),
          when: isToday ? "today" : "tomorrow",
        });
      });
    });

    await Promise.all(
      Object.entries(managerMap).map(async ([managerId, leadsArr]) => {
        const manager = managers.find((m) => m._id.toString() === managerId);
        if (!manager) return;

        const html = paymentReminderTemplate({
          leads: leadsArr,
          manager: manager,
        });

        // console.log(manager.email);
        await sendMultipleEmail(
          [manager.email],
          `Payment Due Reminder`,
          html,
          []
        );
      })
    );

    const allLeadsByManager = Object.values(managerMap).flat();
    const htmlAll = paymentReminderTemplate({
      leads: allLeadsByManager,
    });

    await sendMultipleEmail(
      [
        "ricki@evgroup.co.in",
        "evhomes.operations@evgroup.co.in",
        "shreya@evgroup.co.in",
      ],
      `Payment Due Reminders`,
      htmlAll
    );

    return { data: allLeadsByManager };
  } catch (err) {
    console.error(" Error sending payment reminders:", err);
    return err;
  }
};

// export const updatePaymentAmtandStatus = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { paymentId, update } = req.body;

//     console.log("lead", id);
//     console.log("pay", paymentId);

// console.log("update",update);

//     console.log(req.body);

//     const updatedLead = await postSaleLeadModel.findOneAndUpdate(
//       { _id: id, "paymentDetailSchema._id": paymentId },
//       {
//         $set: {
//           "paymentDetailSchema.$.paymentAmount": update.paymentAmount,
//           "paymentDetailSchema.$.paymentDueDate": update.paymentDueDate,
//           "paymentDetailSchema.$.receivedStatus": update.receivedStatus,
//           "paymentDetailSchema.$.paymentReceivedDate":
//             update.paymentReceivedDate,
//           "paymentDetailSchema.$.remark": update.remark,
//           "paymentDetailSchema.$.attachments": update.attachments,
//         },
//       },
//       { new: true }
//     );
//     console.log(updatedLead);

//     if (!updatedLead) {
//       return errorRes2(res, 400, "Lead or payment detail not found");
//     }

//     return successRes2(res, 200, "Payment detail updated successfully", {
//       data: updatedLead,
//     });
//   } catch (error) {
//     console.error("Error updating payment detail:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

export const updatePaymentDetailsAmtStatus = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { paymentId, update } = req.body;

    console.log("Update body:", update);

    const lead = await leadModel.findOne({ bookingRef: leadId });

    if (!lead) {
      return errorRes2(res, 404, "Lead not found");
    }

    const postSaleLeadId = lead.bookingRef?._id;

    if (!postSaleLeadId) {
      return errorRes2(res, 400, "No bookingRef associated with this lead");
    }

    const updatedPostSaleLead = await postSaleLeadModel.findOneAndUpdate(
      { _id: postSaleLeadId, "paymentDetailSchema._id": paymentId },
      {
        $set: {
          "paymentDetailSchema.$.paymentAmount": update.paymentAmount,
          "paymentDetailSchema.$.paymentDueDate": update.paymentDueDate,
          "paymentDetailSchema.$.receivedStatus": update.receivedStatus,
          "paymentDetailSchema.$.paymentReceivedDate":
            update.paymentReceivedDate,
          "paymentDetailSchema.$.remark": update.remark,
          "paymentDetailSchema.$.attachment": update.attachment,
          "paymentDetailSchema.$.receivedAmount": update.receivedAmount,
        },
      },
      { new: true }
    );

    if (!updatedPostSaleLead) {
      return errorRes2(res, 400, "Payment detail not found in PostSaleLead");
    }

    const updatedLead = await leadModelV2
      .findOne({ bookingRef: postSaleLeadId })
      .populate(leadPopulateOptions);

    if (!updatedLead) {
      return errorRes2(res, 400, "Lead not found after update");
    }

    return successRes2(res, 200, "Payment detail updated successfully", {
      data: updatedLead,
    });
  } catch (error) {
    return errorRes2(res, 500, "Internal server error");
  }
};

export const getPaymentReport = async (req, res) => {
  try {
    const { project, slab } = req.query;

    const pipeline = [
      ...(project
        ? [{ $match: { project, "bookingStatus.type": { $ne: "Cancelled" } } }]
        : [{ $match: { "bookingStatus.type": { $ne: "Cancelled" } } }]),

      {
        $lookup: {
          from: "ourProjects",
          localField: "project",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $unwind: {
          path: "$project",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          selectedFlat: {
            $arrayElemAt: [
              {
                $filter: {
                  input: { $ifNull: ["$project.flatList", []] },
                  as: "flat",
                  cond: {
                    $and: [
                      { $eq: ["$$flat.flatNo", "$unitNo"] },
                      { $eq: ["$$flat.number", "$number"] },

                      {
                        $or: [
                          { $eq: ["$$flat.buildingNo", "$buildingNo"] },

                          { $eq: ["$$flat.buildingNo", null] },

                          { $eq: ["$buildingNo", null] },
                        ],
                      },
                    ],
                  },
                },
              },
              0,
            ],
          },
        },
      },

      {
        $addFields: {
          flatCarpetArea: {
            $ifNull: ["$selectedFlat.carpetArea", 0],
          },
          flatSellableCarpetArea: {
            $ifNull: ["$selectedFlat.sellableCarpetArea", 0],
          },
        },
      },

      {
        $lookup: {
          from: "employees",
          localField: "closingManager",
          foreignField: "_id",
          as: "closingManager",
        },
      },
      {
        $unwind: {
          path: "$closingManager",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "payments",
          let: {
            bookingId: "$_id",
            flatNo: "$unitNo",
            leadProject: "$project",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$booking", "$$bookingId"] },
                        {
                          $and: [
                            { $eq: ["$flatNo", "$$flatNo"] },
                            { $eq: ["$projects", "$$leadProject._id"] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,

                totalCgstPaid: { $sum: "$cgst" },
                totalTdsPaid: { $sum: "$tds" },
                totalStampDutyPaid: { $sum: "$stampDuty" },
                totalAgreementPaid: { $sum: "$bookingAmt" },
              },
            },
          ],
          as: "paymentSummary",
        },
      },
      {
        $lookup: {
          from: "leads",
          let: { phone: "$phoneNumber" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$phoneNumber", "$$phone"] },
              },
            },
            {
              $project: {
                _id: 0,
                channelPartner: 1,
              },
            },
          ],
          as: "leadInfo",
        },
      },
      {
        $addFields: {
          channelPartnerId: {
            $arrayElemAt: ["$leadInfo.channelPartner", 0],
          },
        },
      },
      {
        $lookup: {
          from: "channelPartners",
          localField: "channelPartnerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firmName: 1,
              },
            },
          ],
          as: "channelPartner",
        },
      },
      {
        $unwind: {
          path: "$channelPartner",
          preserveNullAndEmptyArrays: true,
        },
      },

      ...(slab
        ? [
            {
              $lookup: {
                from: "slabs",
                let: {
                  projectId: "$project._id",
                  selectedSlabId: slab,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$project", "$$projectId"] },
                    },
                  },

                  { $unwind: "$slabs" },

                  {
                    $addFields: {
                      isSelected: {
                        $eq: ["$slabs.id", "$$selectedSlabId"],
                      },
                    },
                  },

                  {
                    $group: {
                      _id: null,
                      selectedIndex: {
                        $max: {
                          $cond: ["$isSelected", "$slabs.index", null],
                        },
                      },
                      slabs: { $push: "$slabs" },
                    },
                  },

                  {
                    $project: {
                      totalSlabPercent: {
                        $sum: {
                          $map: {
                            input: "$slabs",
                            as: "s",
                            in: {
                              $cond: [
                                { $lte: ["$$s.index", "$selectedIndex"] },
                                "$$s.percent",
                                0,
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                ],
                as: "slabPercentInfo",
              },
            },
            {
              $addFields: {
                totalSlabPercent: {
                  $ifNull: [
                    { $arrayElemAt: ["$slabPercentInfo.totalSlabPercent", 0] },
                    0,
                  ],
                },
              },
            },
          ]
        : [
            {
              $addFields: { totalSlabPercent: 0 },
            },
          ]),

      {
        $addFields: {
          totalCgstPaid: {
            $ifNull: [
              { $arrayElemAt: ["$paymentSummary.totalCgstPaid", 0] },
              0,
            ],
          },
          totalTdsPaid: {
            $ifNull: [{ $arrayElemAt: ["$paymentSummary.totalTdsPaid", 0] }, 0],
          },
          totalStampDutyPaid: {
            $ifNull: [
              { $arrayElemAt: ["$paymentSummary.totalStampDutyPaid", 0] },
              0,
            ],
          },
          totalAgreementPaid: {
            $ifNull: [
              { $arrayElemAt: ["$paymentSummary.totalAgreementPaid", 0] },
              0,
            ],
          },

          totalAgreementPaid: {
            $ifNull: [
              { $arrayElemAt: ["$paymentSummary.totalAgreementPaid", 0] },
              0,
            ],
          },

          stampDutyPercent: {
            $ifNull: ["$preRegistrationCheckList.stampDuty.percent", 0],
          },
        },
      },

      {
        $project: {
          _id: 1,
          prepreRegistrationCheckList: 1,
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          project: {
            _id: "$project._id",
            name: "$project.name",
          },
          unitNo: 1,
          flatCost: 1,
          cgstAmount: 1,
          tdsAmount: 1,
          stampDutyAmount: 1,
          netAmount: 1,

          slab: 1,
          totalCgstPaid: 1,
          totalTdsPaid: 1,
          totalStampDutyPaid: 1,

          totalAgreementPaid: 1,
          stampDutyPercent: 1,
          totalSlabPercent: 1,

          flatCarpetArea: "$flatCarpetArea",
          flatSellableCarpetArea: "$flatSellableCarpetArea",
          channelPartner: {
            _id: "$channelPartner._id",
            firmName: "$channelPartner.firmName",
          },

          booking: {
            _id: "$_id",
            firstName: "$firstName",
            lastName: "$lastName",
            date: "$date",
            registrationDoneDate: "$registrationDoneDate",
            registrationDone: "$registrationDone",
            buildingNo: "$buildingNo",
            number: "$number",
            unitNo: "$unitNo",
            floor: "$floor",
            carpetArea: "$carpetArea",

            closingManager: {
              _id: "$closingManager._id",
              firstName: "$closingManager.firstName",
              lastName: "$closingManager.lastName",
            },
            project: {
              _id: "$project._id",
              name: "$project.name",
              // flatList: "$project.flatList.carpetArea",
            },
          },
        },
      },
    ];

    const resp = await postSaleLeadModel.aggregate(pipeline);

    return successRes2(res, 200, "Payment report fetched successfully", {
      data: resp,
    });
  } catch (error) {
    console.error(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
};

// backup -notification, triggers notification for all cm
// export const notificationForPaymentDue = async (req, res, next) => {
//   // console.log("Running payment reminder cron job...");

//   try {
//     const today = moment().tz("Asia/Kolkata").startOf("day");
//     const tomorrow = moment(today).add(1, "day");

//     // 1️⃣ Get leads whose payment due dates are today or tomorrow
//     const leads = await postSaleLeadModel.find({
//       $or: [
//         {
//           paymentOneDueDate: {
//             $gte: today.toDate(),
//             $lt: moment(today).endOf("day").toDate(),
//           },
//         },
//         {
//           paymentTwoDueDate: {
//             $gte: today.toDate(),
//             $lt: moment(today).endOf("day").toDate(),
//           },
//         },
//         {
//           paymentThreeDueDate: {
//             $gte: today.toDate(),
//             $lt: moment(today).endOf("day").toDate(),
//           },
//         },
//         {
//           paymentOneDueDate: {
//             $gte: tomorrow.toDate(),
//             $lt: moment(tomorrow).endOf("day").toDate(),
//           },
//         },
//         {
//           paymentTwoDueDate: {
//             $gte: tomorrow.toDate(),
//             $lt: moment(tomorrow).endOf("day").toDate(),
//           },
//         },
//         {
//           paymentThreeDueDate: {
//             $gte: tomorrow.toDate(),
//             $lt: moment(tomorrow).endOf("day").toDate(),
//           },
//         },
//       ],
//     });

//     // console.log(leads);

//     if (leads.length === 0) {
//       console.log("No leads with payment due today or tomorrow.");
//       return errorRes2(400, "No due payments today or tomorrow.");
//     }

//     const closingManagers = await employeeModel.find({
//       permissions: {
//         $in: [
//           "payment_notification",
//           // "all_access"
//         ],
//       },

//       // designation: "desg-senior-closing-manager",
//       status: "active",
//     });

//     // console.log(`closingManagers ${closingManagers}`);

//     const allIds = [...closingManagers.map((m) => m._id.toString())];

//     console.log(allIds);

//     const foundPlayers = await oneSignalModel.find({
//       docId: { $in: allIds },
//     });

//     const playerIds = foundPlayers
//       .map((p) => p.playerId)
//       .filter((id) => id && id.trim() !== "");

//     if (playerIds.length === 0) {
//       console.log("No OneSignal player IDs found for closing managers.");
//       return errorRes2(400, "No player IDs found.");
//     }

//     // 4️⃣ Loop through due payments and send notifications
//     for (const lead of leads) {
//       const dueDates = [
//         { name: "Payment 1", date: lead.paymentOneDueDate },
//         { name: "Payment 2", date: lead.paymentTwoDueDate },
//         { name: "Payment 3", date: lead.paymentThreeDueDate },
//       ];

//       for (const p of dueDates) {
//         if (!p.date) continue;

//         const isToday = moment(p.date).isSame(today, "day");
//         const isTomorrow = moment(p.date).isSame(tomorrow, "day");

//         if (isToday || isTomorrow) {
//           const when = isToday ? "today" : "tomorrow";
//           const message = `${p.name} is due ${when} for ${
//             lead.firstName || ""
//           } ${lead.lastName || ""} PhoneNumber: ${lead.phoneNumber}`;

//           await sendNotificationWithImage({
//             playerIds,
//             title: "Payment Due Reminder",
//             imageUrl:
//               "https://cdn.evhomes.tech/77450f74-dee8-4d7e-8c5d-130fcb975874-payment.png",
//             message,
//             android_channel_id: "payment_notification",
//             data: {
//               // type: "paymentReminder",
//               // leadId: lead._id,
//               // dueFor: p.name,
//             },
//           });

//           // console.log(
//           //   ` Sent ${p.name} reminder (${when}) for ${lead.firstName} ${lead.lastName}`
//           // );
//         }
//       }
//     }

//     // console.log("complete");

//     return res.send(
//       successRes(200, "Notification sent", {
//         data: leads.length,
//       })
//     );
//   } catch (e) {
//     console.log(e);
//     return errorRes2(500, `Internal Server error ${e}`);

//     // console.error("Payment reminder cron error:", err);
//     // next(err);
//   }
// };

//
