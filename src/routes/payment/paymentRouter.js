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
  updateCheckDates,
  updatePaymentAtDemand,
  updatePaymentTypesForSorting,
} from "../../controller/payment.controller.js";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paymentRouter = Router();
paymentRouter.get("/payment", authenticateToken, getPayment);
paymentRouter.get("/payment-list", authenticateToken, getPaymentList);
paymentRouter.post("/payment-add", authenticateToken, addPayment);
paymentRouter.post(
  "/payment-add-at-demand",
  authenticateToken,
  addPaymentAtDemand
);
paymentRouter.post(
  "/update-payment-add-at-demand/:id",
  authenticateToken,
  updatePaymentAtDemand
);
paymentRouter.post(
  "/delete-payment-at-demand/:id",
  authenticateToken,
  deletePaymentAtDemand
);
paymentRouter.post(
  "/update-cheque-date/:id",
  authenticateToken,
  updateCheckDates
);
paymentRouter.get("/get-payment-by-flat", authenticateToken, getPaymentbyFlat);
paymentRouter.get(
  "/get-payment-by-flat-project",
  authenticateToken,
  getPaymentsbyFlatNoAndProject
);

paymentRouter.get(
  "/get-payment-by-flat-building-project",
  authenticateToken,
  getPaymentsbyFlatBuildingNoAndProject
);

paymentRouter.delete(
  "/delete-payment/:id",
  // authenticateToken,
  deletePaymentById
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

export default paymentRouter;
