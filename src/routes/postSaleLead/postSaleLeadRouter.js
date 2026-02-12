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
postSaleRouter.post("/post-sale-lead-add", authenticateToken, addPostSaleLead);
postSaleRouter.post(
  "/post-sale-lead-update/:id",
  authenticateToken,
  updatePostSaleLeadById,
);

postSaleRouter.post("/cancel-booking", authenticateToken, cancelBooking);
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
    console.log(e);
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
            $project: {
              count: 1,
              total: { $size: { $ifNull: ["$projectDetails.flatList", []] } },

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
            $project: {
              count: 1,
              total: { $size: { $ifNull: ["$projectDetails.flatList", []] } },

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
    // console.log(req.query);

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

    // console.log(client);
    return successRes2(res, 200, "Booking details for client", {
      data: client,
    });
  } catch (error) {
    console.error("Error fetching client by unit:", error);
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
          ele?.applicants?.forEach((apl) => {
            const emptyAdhar = apl?.kyc?.addhar.document === "";
            const emptyPan = apl?.kyc?.pan.document === "";
            const emptyOther = apl?.kyc?.other.document === "";
            if (emptyAdhar) {
              apl.kyc.addhar.document = null;
            }
            if (emptyPan) {
              apl.kyc.pan.document = null;
            }
            if (emptyOther) {
              apl.kyc.other.document = null;
            }
          });
          await ele.save();
        } catch (error) {
          //
        }
      }),
    );
    // console.log(client);
    return successRes2(res, 200, "Booking details for client", {
      data: clients,
    });
  } catch (error) {
    console.error("Error fetching client by unit:", error);
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

    // console.log(client);
    return successRes2(res, 200, "Booking details for client", {
      data: client,
    });
  } catch (error) {
    console.error("Error fetching client by unit:", error);
    return errorRes2(res, 500, `${error}`);
  }
});

// postSaleRouter.post('/cancel-booking', cancelBooking);
// postSaleRouter.post('/update-flat-status', flatUpdateResult);

export default postSaleRouter;
