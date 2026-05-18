import { Router } from "express";
import {
  addPostSaleLead,
  getPostSaleLeadById,
  getPostSaleLeads,
  getPostSaleLeadsForExecutive,
  updatePostSaleLeadById,
  getPostSaleLeadByFlat,
  getLeadCounts,
  getpostSaleCountsRegGraph,
  cancelBooking,
  updateBookingFeedback,
  getPostSaleLeadByBookingId,
  notificationForPaymentDue,
  sendPaymentDueEmail,
  updatePaymentDetailsAmtStatus,
  getPaymentReport,
  getPostSaleLeadForParking,
  addParkingInBooking,
  removeParkingFromBooking,
  // flatUpdateResult
  // cancelBooking

  // getpostSaleCountsRegFunnel,
} from "../../controller/postSaleLead.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import postSaleLeadModel from "../../model/postSaleLead.model.js";
import { errorRes2, successRes, successRes2 } from "../../model/response.js";
import employeeModel from "../../model/employee.model.js";
import ourProjectModel from "../../model/ourProjects.model.js";
import { postSalePopulateOptionsv2 } from "../../utils/constant.js";
import logger from "../../utils/logger.js";
import flatModel from "../../model/flat.model.js";
import moment from "moment-timezone";

const postSaleRouter = Router();
postSaleRouter.get(
  "/post-sale-leads",

  // authenticateToken,

  getPostSaleLeads,
);
postSaleRouter.get(
  "/post-sale-lead/:id",
  authenticateToken,
  getPostSaleLeadByBookingId,
);

postSaleRouter.get(
  "/post-sale-lead-parking/:id",
  // authenticateToken,
  getPostSaleLeadForParking,
);

postSaleRouter.post("/post-sale-lead-add", authenticateToken, addPostSaleLead);
postSaleRouter.post(
  "/post-sale-lead-update/:id",
  authenticateToken,
  updatePostSaleLeadById,
);

postSaleRouter.post(
  "/post-sale-lead-add-parking/:id",
  authenticateToken,
  addParkingInBooking,
);

postSaleRouter.delete(
  "/post-sale-lead-remove-parking/:id",
  authenticateToken,
  removeParkingFromBooking,
);

postSaleRouter.post("/cancel-booking", cancelBooking);
postSaleRouter.get(
  "/post-sale-leads-for-pse/:id",
  authenticateToken,
  getPostSaleLeadsForExecutive,
);
postSaleRouter.get(
  "/post-sale-lead-by-id/:flatNo",
  authenticateToken,
  getPostSaleLeadById,
);

postSaleRouter.get(
  "/post-sale-leadCount",
  // authenticateToken,
  getLeadCounts,
);

postSaleRouter.get(
  "/post-sale-leads-regraph",
  authenticateToken,
  getpostSaleCountsRegGraph,
);
// postSaleRouter.get(
//   "/post-sale-leads-refunnel",authenticateToken,
//   getpostSaleCountsRegFunnel
// );

postSaleRouter.get(
  "/post-sale-lead-by-flat",
  authenticateToken,
  getPostSaleLeadByFlat,
);
postSaleRouter.post(
  "/update-booking-feedback/:id",
  authenticateToken,
  updateBookingFeedback,
);

postSaleRouter.post(
  "/notification-payment-due",
  // authenticateToken,
  notificationForPaymentDue,
);
postSaleRouter.post(
  "/payment-due-email",
  // authenticateToken,
  sendPaymentDueEmail,
);
// one time used
postSaleRouter.get("/post-sale-list/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const update = [];
    const project = await ourProjectModel.findById(id);
    await Promise.all(
      project.flatList?.map(async (element) => {
        const flat = await postSaleLeadModel.findOne({
          // buildingNo: element?.buildingNo,
          unitNo: element.flatNo,
          // number: element?.number,
          // floor: element?.floor,
          "bookingStatus.type": { $ne: "Cancelled" },
        });
        if (!flat && element.occupied == true) {
          update.push(element);
        }
      }),
    );

    res.send({ total: update.length, data: update });
  } catch (e) {
    logger.info(e);
    res.send(e);
  }
});
// one time used

postSaleRouter.get("/post-sale-list-marina-fix-bldg", async (req, res) => {
  try {
    const leads = await postSaleLeadModel.find({
      project: "project-ev-10-marina-bay-vashi-sector-10",
      parking: { $ne: [] },
    });

    if (!leads.length) {
      return errorRes2(res, 404, "No lead found");
    }

    for (const el of leads) {
      el.parking.forEach((p) => {
        p.buildingNo = 1;
      });

      // ensure mongoose detects change
      el.markModified("parking");

      await el.save();
    }

    res.send({ total: leads.length, data: "ok" });
  } catch (e) {
    logger.info(e);
    res.send(e);
  }
});
postSaleRouter.get(
  "/post-sale-dashboard-count/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const { project, interval } = req.query;

    try {
      const empResp = await employeeModel
        .findById(id)
        .select("firstName lastName designation")
        .populate("designation");

      //
      const totalPipeline = [];

      if (project) {
        totalPipeline.push({ $match: { project } });
      }

      totalPipeline.push({ $count: "count" });

      const [basicCounts, projectCounts, teamCounts] = await Promise.all([
        postSaleLeadModel.aggregate([
          {
            $facet: {
              total: [...totalPipeline],
              registrationDone: [
                {
                  $match: {
                    registrationDone: true,
                    "bookingStatus.type": { $ne: "Cancelled" },
                  },
                },
                ...totalPipeline,
              ],
              registrationPending: [
                {
                  $match: {
                    registrationDone: false,
                    "bookingStatus.type": { $ne: "Cancelled" },
                  },
                },
                ...totalPipeline,
              ],
              cancelled: [
                { $match: { "bookingStatus.type": "Cancelled" } },
                ...totalPipeline,
              ],
              eoiRecieved: [
                { $match: { "bookingStatus.type": "EOI" } },
                ...totalPipeline,
              ],
            },
          },
          {
            $addFields: {
              total: { $arrayElemAt: ["$total.count", 0] },
              registrationDone: {
                $arrayElemAt: ["$registrationDone.count", 0],
              },
              registrationPending: {
                $arrayElemAt: ["$registrationPending.count", 0],
              },
              cancelled: { $arrayElemAt: ["$cancelled.count", 0] },
              eoiRecieved: {
                $arrayElemAt: ["$eoiRecieved.count", 0],
              },
            },
          },
          { $project: { _id: 0 } },
        ]),
        postSaleLeadModel.aggregate([
          {
            $match: { "bookingStatus.type": { $ne: "Cancelled" } },
          },

          {
            $group: { _id: "$project", count: { $sum: 1 } },
          },
          {
            $lookup: {
              from: "ourProjects",
              localField: "_id",
              foreignField: "_id",
              as: "projectDetails",
            },
          },
          { $unwind: "$projectDetails" },

          {
            $lookup: {
              from: "flats",
              let: { project: "$projectDetails._id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$project", "$$project"],
                    },
                  },
                },
              ],
              as: "flatData",
            },
          },
          {
            $project: {
              count: 1,

              // total flats
              total: { $size: "$flatData" },

              project: {
                _id: "$projectDetails._id",
                name: "$projectDetails.name",
              },
            },
          },
        ]),
        postSaleLeadModel.aggregate([
          {
            $match: { "bookingStatus.type": { $ne: "Cancelled" } },
          },
          {
            $group: { _id: "$closingManager", count: { $sum: 1 } },
          },
          {
            $lookup: {
              from: "employees",
              localField: "_id",
              foreignField: "_id",
              as: "emp",
            },
          },
          { $unwind: "$emp" },
          {
            $project: {
              count: 1,
              employee: {
                _id: "$emp._id",
                firstName: "$emp.firstName",
                lastName: "$emp.lastName",
              },
            },
          },
        ]),
      ]);

      const counts = basicCounts[0] || {};
      return successRes2(res, 200, "", {
        data: {
          id: id,
          name: `${empResp.firstName} ${empResp.lastName}`,
          designation: empResp.designation?.designation,
          ...counts,
          projects: projectCounts,
          teams: teamCounts.sort((a, b) => b.count - a.count),
        },
      });
    } catch (error) {
      logger.info(error);
      //
      return errorRes2(res, 500, `${error}`);
    }
  },
);
postSaleRouter.get(
  "/post-sale-ex-dashboard-count/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const { project, interval } = req.query;

    try {
      const empResp = await employeeModel
        .findById(id)
        .select("firstName lastName designation")
        .populate("designation");

      //
      const totalPipeline = [];

      if (project) {
        totalPipeline.push({ $match: { project } });
      }

      totalPipeline.push({ $count: "count" });

      const [basicCounts, projectCounts, teamCounts] = await Promise.all([
        postSaleLeadModel.aggregate([
          {
            $match: {
              $or: [
                {
                  postSaleAssignTo: { $in: [id] },
                },
                {
                  postSaleExecutive: id,
                },
              ],
            },
          },
          {
            $facet: {
              total: [...totalPipeline],
              registrationDone: [
                {
                  $match: {
                    registrationDone: true,
                    "bookingStatus.type": { $ne: "Cancelled" },
                  },
                },
                ...totalPipeline,
              ],
              registrationPending: [
                {
                  $match: {
                    registrationDone: false,
                    "bookingStatus.type": { $ne: "Cancelled" },
                  },
                },
                ...totalPipeline,
              ],
              cancelled: [
                { $match: { "bookingStatus.type": "Cancelled" } },
                ...totalPipeline,
              ],
              eoiRecieved: [
                { $match: { "bookingStatus.type": "EOI" } },
                ...totalPipeline,
              ],
            },
          },
          {
            $addFields: {
              total: { $arrayElemAt: ["$total.count", 0] },
              registrationDone: {
                $arrayElemAt: ["$registrationDone.count", 0],
              },
              registrationPending: {
                $arrayElemAt: ["$registrationPending.count", 0],
              },
              cancelled: { $arrayElemAt: ["$cancelled.count", 0] },
              eoiRecieved: {
                $arrayElemAt: ["$eoiRecieved.count", 0],
              },
            },
          },
          { $project: { _id: 0 } },
        ]),
        postSaleLeadModel.aggregate([
          {
            $match: { "bookingStatus.type": { $ne: "Cancelled" } },
          },

          {
            $group: { _id: "$project", count: { $sum: 1 } },
          },
          {
            $lookup: {
              from: "ourProjects",
              localField: "_id",
              foreignField: "_id",
              as: "projectDetails",
            },
          },
          { $unwind: "$projectDetails" },
          {
            $lookup: {
              from: "flats",
              let: { project: "$projectDetails._id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$project", "$$project"],
                    },
                  },
                },
              ],
              as: "flatData",
            },
          },

          {
            $project: {
              count: 1,

              // total flats
              total: { $size: "$flatData" },

              project: {
                _id: "$projectDetails._id",
                name: "$projectDetails.name",
              },
            },
          },
        ]),
        postSaleLeadModel.aggregate([
          {
            $match: { "bookingStatus.type": { $ne: "Cancelled" } },
          },

          {
            $group: { _id: "$closingManager", count: { $sum: 1 } },
          },
          {
            $lookup: {
              from: "employees",
              localField: "_id",
              foreignField: "_id",
              as: "emp",
            },
          },
          { $unwind: "$emp" },
          {
            $project: {
              count: 1,
              employee: {
                _id: "$emp._id",
                firstName: "$emp.firstName",
                lastName: "$emp.lastName",
              },
            },
          },
        ]),
      ]);

      const counts = basicCounts[0] || {};
      return successRes2(res, 200, "", {
        data: {
          id: id,
          name: `${empResp.firstName} ${empResp.lastName}`,
          designation: empResp.designation?.designation,
          ...counts,
          projects: projectCounts,
          teams: teamCounts.sort((a, b) => b.count - a.count),
        },
      });
    } catch (error) {
      logger.info(error);
      //
      return errorRes2(res, 500, `${error}`);
    }
  },
);

postSaleRouter.post(
  "/update-payment-status/:id",
  updatePaymentDetailsAmtStatus,
);

postSaleRouter.get("/postsale-booking-payment-report", getPaymentReport);

postSaleRouter.get("/postsale-lead-by-unit", async (req, res) => {
  try {
    const { project, unitNo, buildingNo } = req.query;
    // logger.info(req.query);

    if (!project) {
      return errorRes2(res, 400, `Project is required`);
    }

    const client = await postSaleLeadModel
      .findOne({
        project: project,
        buildingNo: buildingNo,
        unitNo: unitNo,
      })
      .sort({ createdAt: -1 })
      .populate(postSalePopulateOptionsv2);

    if (!client) {
      return errorRes2(res, 401, `No booking found`);
    }

    // logger.info(client);
    return successRes2(res, 200, "Booking details for client", {
      data: client,
    });
  } catch (error) {
    logger.info("Error fetching client by unit:", error);
    return errorRes2(res, 500, `${error}`);
  }
});

postSaleRouter.get("/postsale-fix-docs", async (req, res) => {
  try {
    const clients = await postSaleLeadModel.find({});
    await Promise.all(
      clients.map(async (ele) => {
        //
        try {
          //
          const foundflat = await flatModel.findOne({
            project: ele.project,
            flatNo: ele.unitNo,
            buildingNo: ele.buildingNo,
            floor: ele.floor,
          });
          if (foundflat?.configuration) {
            //
            ele.configuration = foundflat.configuration;
            await ele.save();
          }
          // ele?.applicants?.forEach((apl) => {
          //   const emptyAdhar = apl?.kyc?.addhar.document === "";
          //   const emptyPan = apl?.kyc?.pan.document === "";
          //   const emptyOther = apl?.kyc?.other.document === "";
          //   if (emptyAdhar) {
          //     apl.kyc.addhar.document = null;
          //   }
          //   if (emptyPan) {
          //     apl.kyc.pan.document = null;
          //   }
          //   if (emptyOther) {
          //     apl.kyc.other.document = null;
          //   }
          // });
          // await ele.save();
        } catch (error) {
          logger.info(error);
          //
        }
      }),
    );
    // logger.info(client);
    return successRes2(res, 200, "Booking details for client", {
      data: clients,
    });
  } catch (error) {
    logger.info("Error fetching client by unit:", error);
    return errorRes2(res, 500, `${error}`);
  }
});

postSaleRouter.get("/postsale-fixed-area", async (req, res) => {
  try {
    const client = await postSaleLeadModel.find({
      project: "project-ev23-malibu-west-koparkhairne-202f4",
      "bookingStatus.type": { $ne: "Cancelled" },
    });

    const proj = await ourProjectModel.findById(
      "project-ev23-malibu-west-koparkhairne-2024",
    );
    const area = await Promise.all(
      client.map(async (e) => {
        //
        const flat = proj.flatList.find(
          (ele) =>
            ele.buildingNo === e.buildingNo &&
            ele.floor === e.floor &&
            ele.number === e.number &&
            ele.wing === e.wing,
        );
        const resp = await postSaleLeadModel.findByIdAndUpdate(e._id, {
          $set: {
            carpetArea: flat?.carpetArea,
            sellableCarpetArea: flat?.sellableCarpetArea,
            configuration: flat?.configuration,
          },
        });
      }),
    );

    // logger.info(client);
    return successRes2(res, 200, "Booking details for client", {
      data: client,
    });
  } catch (error) {
    logger.info("Error fetching client by unit:", error);
    return errorRes2(res, 500, `${error}`);
  }
});

postSaleRouter.get("/post-sale-booked-marina", async (req, res) => {
  try {
    const data = await postSaleLeadModel
      .find(
        {
          project: "project-ev-10-marina-bay-vashi-sector-10",
          "bookingStatus.type": "confirm-booking",
        },
        {
          unitNo: 1,
          closingManager: 1,
          email: 1,
          phoneNumber: 1,
          firstName: 1,
          lastName: 1,
          applicants: 1,
          date: 1,
        },
      )
      .populate(postSalePopulateOptionsv2)
      .lean();

    const formattedData = data.map((item) => {
      const applicants = item.applicants || [];

      return {
        unitNo: item.unitNo || "",
        email: item.email || "",
        phoneNumber: item.phoneNumber || "",
        firstName: item.firstName || "",
        lastName: item.lastName || "",
        applicantCount: applicants.length,

        applicant1: applicants[0]
          ? `${applicants[0].firstName || ""} ${
              applicants[0].lastName || ""
            }`.trim()
          : "",

        applicant2: applicants[1]
          ? `${applicants[1].firstName || ""} ${
              applicants[1].lastName || ""
            }`.trim()
          : "",

        applicant3: applicants[2]
          ? `${applicants[2].firstName || ""} ${
              applicants[2].lastName || ""
            }`.trim()
          : "",

        applicant4: applicants[3]
          ? `${applicants[3].firstName || ""} ${
              applicants[3].lastName || ""
            }`.trim()
          : "",
        closingManager: item.closingManager
          ? `${item.closingManager.firstName || ""} ${item.closingManager.lastName || ""}`.trim()
          : "",
        bookingDate:
          moment(item?.date).tz("Asia/Kolkata").format("DD-MM-YYYY") ?? "",
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

// postSaleRouter.post('/cancel-booking', cancelBooking);
// postSaleRouter.post('/update-flat-status', flatUpdateResult);

export default postSaleRouter;
