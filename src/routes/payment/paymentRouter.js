import { Router } from "express";
import {
  addPayment,
  addPaymentAtDemand,
  deletePaymentAtDemand,
  deletePaymentById,
  getPayment,
  getPaymentbyFlat,
  getPaymentList,
  getPaymentsbyFlatBuildingNoAndProject,
  getPaymentsbyFlatNoAndProject,
  getPaymentsByProj,
  updateCheckDates,
  updatePayment,
  updatePaymentAtDemand,
  updatePaymentTypesForSorting,
} from "../../controller/payment.controller.js";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import postSaleLeadModel from "../../model/postSaleLead.model.js";
import { successRes2 } from "../../model/response.js";
import paymentModel from "../../model/payment.model.js";
import moment from "moment";
import flatModel from "../../model/flat.model.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paymentRouter = Router();
paymentRouter.get("/payment", authenticateToken, getPayment);
paymentRouter.get("/payment-list", authenticateToken, getPaymentList);
paymentRouter.post("/payment-add", authenticateToken, addPayment);
paymentRouter.post(
  "/payment-add-at-demand",
  authenticateToken,
  addPaymentAtDemand,
);
paymentRouter.post(
  "/update-payment-add-at-demand/:id",
  authenticateToken,
  updatePaymentAtDemand,
);
paymentRouter.post(
  "/delete-payment-at-demand/:id",
  authenticateToken,
  deletePaymentAtDemand,
);
paymentRouter.post(
  "/update-cheque-date/:id",
  authenticateToken,
  updateCheckDates,
);
paymentRouter.get("/get-payment-by-flat", authenticateToken, getPaymentbyFlat);
paymentRouter.get(
  "/get-payment-by-flat-project",
  authenticateToken,
  getPaymentsbyFlatNoAndProject,
);

paymentRouter.get(
  "/get-payment-by-flat-building-project",
  authenticateToken,
  getPaymentsbyFlatBuildingNoAndProject,
);

paymentRouter.delete(
  "/delete-payment/:id",
  // authenticateToken,
  deletePaymentById,
);

paymentRouter.get(
  "/payment-by-project",
  // authenticateToken,
  getPaymentsByProj,
);

paymentRouter.post(
  "/update-payment/:id",
  // authenticateToken,
  updatePayment,
);

const monthMap = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

paymentRouter.get(
  "/sales-report",
  // authenticateToken,
  async (req, res) => {
    try {
      /* -----------------------------
         1️⃣ BOOKINGS / SALES COUNTS
      ------------------------------ */
      const salesAggr = await postSaleLeadModel.aggregate([
        {
          $match: {
            "bookingStatus.type": { $ne: "Cancelled" },
          },
        },
        {
          $group: {
            _id: null,

            totalBookings: { $sum: 1 },

            totalUnits: {
              $sum: { $ifNull: ["$units", 1] },
            },

            totalCarpetArea: {
              $sum: { $ifNull: ["$carpetArea", 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalBookings: 1,
            totalUnits: 1,
            totalCarpetArea: {
              $round: [{ $toDouble: "$totalCarpetArea" }, 2],
            },
          },
        },
      ]);

      const salesCounts = salesAggr[0] || {
        totalBookings: 0,
        totalUnits: 0,
        totalCarpetArea: 0,
      };

      /* -----------------------------
        PROJECT-WISE BOOKINGS GRAPH
      ------------------------------ */
      const projectGraphAggr = await postSaleLeadModel.aggregate([
        {
          $match: {
            "bookingStatus.type": { $ne: "Cancelled" },
          },
        },

        // join projects collection
        {
          $lookup: {
            from: "ourProjects", // collection name
            localField: "project",
            foreignField: "_id",
            as: "projectData",
          },
        },

        // flatten project array
        {
          $unwind: {
            path: "$projectData",
            preserveNullAndEmptyArrays: true,
          },
        },

        // group by project name
        {
          $group: {
            _id: "$projectData.name",
            total: { $sum: 1 },
          },
        },

        // shape response
        {
          $project: {
            _id: 0,
            project: { $ifNull: ["$_id", "Unknown"] },
            total: 1,
          },
        },

        // highest bookings first
        {
          $sort: { total: -1 },
        },
      ]);

      /* -----------------------------
        CLOSINGMANAGER-WISE BOOKINGS GRAPH
      ------------------------------ */
      const closingManagerGraphAggr = await postSaleLeadModel.aggregate([
        {
          $match: {
            "bookingStatus.type": { $ne: "Cancelled" },
          },
        },

        // join users (closing managers)
        {
          $lookup: {
            from: "employees", // collection name
            localField: "closingManager",
            foreignField: "_id",
            as: "managerData",
          },
        },

        // flatten manager array
        {
          $unwind: {
            path: "$managerData",
            preserveNullAndEmptyArrays: true,
          },
        },

        // group by manager name
        {
          $group: {
            _id: "$managerData.firstName",
            total: { $sum: 1 },
          },
        },

        // shape response
        {
          $project: {
            _id: 0,
            closingManager: {
              $ifNull: ["$_id", "Unknown"],
            },
            total: 1,
          },
        },

        // highest bookings first
        {
          $sort: { total: -1 },
        },
      ]);

      /* -----------------------------
         2️⃣ TOTAL PAYMENT (bookingAmt)
      ------------------------------ */
      const paymentTotalAggr = await paymentModel.aggregate([
        {
          $group: {
            _id: null,
            totalPayment: {
              $sum: { $ifNull: ["$bookingAmt", 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalPayment: {
              $round: [{ $toDouble: "$totalPayment" }, 2],
            },
          },
        },
      ]);

      const totalPayment = paymentTotalAggr[0]?.totalPayment || 0;

      /* -----------------------------
         3️⃣ MONTHLY GRAPH (JAN–DEC)
      ------------------------------ */
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear + 1, 0, 1);

      const paymentMonthlyAggr = await paymentModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfYear,
              $lt: endOfYear,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" }, // 1–12
            total: {
              $sum: { $ifNull: ["$bookingAmt", 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            total: {
              $round: [{ $toDouble: "$total" }, 2],
            },
          },
        },
        {
          $sort: { month: 1 },
        },
      ]);

      const monthMap = {
        1: "Jan",
        2: "Feb",
        3: "Mar",
        4: "Apr",
        5: "May",
        6: "Jun",
        7: "Jul",
        8: "Aug",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Dec",
      };

      const monthlyGraph = Array.from({ length: 12 }, (_, i) => {
        const found = paymentMonthlyAggr.find((p) => p.month === i + 1);

        return {
          month: monthMap[i + 1],
          total: found ? found.total : 0,
        };
      });

      /* -----------------------------
         4️⃣ FINAL RESPONSE
      ------------------------------ */
      return successRes2(res, 200, "ok", {
        counts: salesCounts,
        totalPayment,
        monthlyGraph,
        projectGraph: projectGraphAggr,
        closingManagerGraph: closingManagerGraphAggr,
      });
    } catch (error) {
      console.error("Sales report error:", error);
      return res.status(500).json({
        message: "Failed to generate sales report",
      });
    }
  },
);

function extractNumber(str) {
  // Match the first sequence of digits in the string
  const match = str.match(/\d+/);
  // If a match is found, return it as a number; otherwise, return 0
  return match ? parseInt(match[0], 10) : 0;
}

paymentRouter.post("/payment-update", async (req, res) => {
  const results = [];
  const dataTuPush = [];
  const csvFilePath = path.join(__dirname, "payments_nine_square.csv");

  if (!fs.existsSync(csvFilePath)) {
    return res.status(400).send("CSV file not found");
  }
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", async () => {
      for (const row of results) {
        const {
          recordDate,
          recieptNo,
          account,
          paymentMode,
          flatNo,
          name,
          totalRecieved,
          stampDutyReg,
          bookingAmount,
          gst,
          tds,
        } = row;

        dataTuPush.push({
          projects: "project-ev-9-square-vashi-sector-9",
          recordDate,
          recieptNo,
          account,
          paymentMode: paymentMode?.trim(),
          flatNo,
          customerName: name?.split("/")[0]?.trim(),
          amtReceived: extractNumber(totalRecieved),
          stampDutyReg: extractNumber(stampDutyReg),
          bookingAmount: extractNumber(bookingAmount),
          gst: extractNumber(gst),
          tds: extractNumber(tds),
        });
      }
      // await leadModel.insertMany(dataTuPush);
      // Send the results only after processing is done
      return res.send(dataTuPush);
    })
    .on("error", (err) => {
      return res.status(500).send({ error: err.message });
    });
});

paymentRouter.get("/payment-mode-updates", updatePaymentTypesForSorting);

paymentRouter.get(
  "/payment-export-com",
  authenticateToken,
  async (req, res) => {
    //

    try {
      const payments = await paymentModel.find({
        $or: [
          { project: "project-9-vtc-vashi-2025" },
          { project: "project-ev-capitol-9-vashi-2025" },

          { project: "project-ev-9hq-vashi-2026" },

          { projects: "project-9-vtc-vashi-2025" },
          { projects: "project-ev-capitol-9-vashi-2025" },

          { projects: "project-ev-9hq-vashi-2026" },
        ],
      });
      const flats = await flatModel.find({
        $or: [
          { project: "project-9-vtc-vashi-2025" },
          { project: "project-ev-capitol-9-vashi-2025" },

          { project: "project-ev-9hq-vashi-2026" },

          { projects: "project-9-vtc-vashi-2025" },
          { projects: "project-ev-capitol-9-vashi-2025" },

          { projects: "project-ev-9hq-vashi-2026" },
        ],
      });

      const bookings = await postSaleLeadModel.find({
        $or: [
          { project: "project-9-vtc-vashi-2025" },
          { project: "project-ev-capitol-9-vashi-2025" },
          { project: "project-ev-9hq-vashi-2026" },
        ],
        $and: [
          { "bookingStatus.type": { $ne: "cancelled" } },
          { "bookingStatus.type": { $ne: "Cancelled" } },
        ],
      });

      const map = payments.map((ele, ind) => {
        const paymentDate = moment(ele.date)
          .tz("Asia/Kolkata")
          .format("DD-MM-YYYY");
        const proj = ele?.project ?? ele?.projects;

        const flat = flats.find(
          (e) =>
            e?.flatNo === ele?.flatNo &&
            e?.buildingNo === ele?.buildingNo &&
            e?.project == proj,
        );

        const booking = bookings.find(
          (e) =>
            e?.unitNo === ele?.flatNo &&
            e?.buildingNo === ele?.buildingNo &&
            e?.project == proj,
        );
        const bookingDate = moment(booking?.date).isValid()
          ? moment(booking?.date)?.tz("Asia/Kolkata")?.format("DD-MM-YYYY")
          : "--";
        return {
          sr: ind + 1,
          project: proj,
          floor: flat?.floor,
          buildingNo: ele?.buildingNo,
          officeNo: ele?.flatNo,
          name: `${booking?.firstName} ${booking?.lastName}`,
          carpet: flat?.carpetArea,
          reraArea: flat?.reraArea,
          rateSqft: "",
          parking: "",
          netAmount: booking?.flatCost,
          gst: "",
          stampDuty: "",
          amountRecieved: ele?.bookingAmt ?? 0,
          recievedDate: paymentDate,
          bookingDate: bookingDate,
          bookingStatus: booking?.bookingStatus?.type ?? "--",
        };
      });

      //
      res.json({
        data: map,
      });
    } catch (error) {
      //
      console.log(error);
      res.json({
        data: [],
      });
    }
  },
);
export default paymentRouter;
