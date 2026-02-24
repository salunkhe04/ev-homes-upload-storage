import { Router } from "express";
import {
  addSiteVisits,
  deleteSiteVisits,
  generateSiteVisitOtp,
  getSiteVisits,
  getSiteVisitsById,
  searchSiteVisits,
  updateSiteVisits,
  verifySiteVisitOtp,
  getClosingManagerSiteVisitById,
  getSiteVisitByPhoneNumber,
  getTeamMemberSiteVisitById,
  getSiteVisitHistoryByPhone,
  addLeadFromSiteVisit,
  getTodayVisitSummary,
  addSiteVisitV2,
  searchSiteVisitDTA,
  siteVisitApproval,
  getCpFeedbackPendingVisits,
  getSiteVisitByPermission,
  geSiteVisitStartEndDate,
  // getCompleteMerged,
  // getSiteVisitSummaryByAttendee,
} from "../../controller/siteVisit.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import employeeModel from "../../model/employee.model.js";
import siteVisitModel from "../../model/siteVisit.model.js";
import mongoose from "mongoose";
import { sendMultipleEmail } from "../../utils/brevo.js";
import { visitSummaryTemplate } from "../../templates/html_template.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import { successRes2 } from "../../model/response.js";
import logger from "../../utils/logger.js";
// import jsonVisits from "./siteVisits_list.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteVisitRouter = Router();
siteVisitRouter.get("/siteVisit", authenticateToken, getSiteVisits);
siteVisitRouter.get("/siteVisit/:id", getSiteVisitsById);
siteVisitRouter.get(
  "/siteVisit-phoneNumber/:phoneNumber",
  authenticateToken,
  getSiteVisitByPhoneNumber,
);
siteVisitRouter.post(
  "/site-visits-by-phone",
  authenticateToken,
  getSiteVisitHistoryByPhone,
);

siteVisitRouter.post("/siteVisits-add", authenticateToken, addSiteVisits);
siteVisitRouter.post("/site-visit-add-v2", authenticateToken, addSiteVisitV2);
//ok
siteVisitRouter.post(
  "/site-visit-add-int/:id",
  authenticateToken,
  addLeadFromSiteVisit,
);

//visible to closing managers
siteVisitRouter.get(
  "/site-visit-closing-manager/:id",
  authenticateToken,
  getClosingManagerSiteVisitById,
);

//visibile to team members only
siteVisitRouter.get(
  "/site-visit-team-member/:id",
  authenticateToken,
  getTeamMemberSiteVisitById,
);

siteVisitRouter.post(
  "/site-visit-generate-otp",
  // authenticateToken,
  generateSiteVisitOtp,
);
siteVisitRouter.post(
  "/site-visit-otp-verify",
  authenticateToken,
  verifySiteVisitOtp,
);

siteVisitRouter.post(
  "/siteVisit-update/:id",
  authenticateToken,
  updateSiteVisits,
);
siteVisitRouter.delete("/siteVisit/:id", authenticateToken, deleteSiteVisits);
siteVisitRouter.get("/siteVisits-search", authenticateToken, searchSiteVisits);
siteVisitRouter.get(
  "/site-visit-search-dta",
  authenticateToken,
  searchSiteVisitDTA,
);
siteVisitRouter.post(
  "/site-visit-approval/:id",
  // authenticateToken,
  siteVisitApproval,
);

siteVisitRouter.get("/site-visit-permission/:id", getSiteVisitByPermission);
// siteVisitRouter.get("/site-visit-permission-complete",getCompleteMerged);

siteVisitRouter.get("/cp-feedback", async (req, res) => {
  const resp = await getCpFeedbackPendingVisits();
  return res.send({
    total: resp.length,
    data: resp,
  });
});

siteVisitRouter.get("/siteVisits-summary", async (req, res) => {
  const resp = await getTodayVisitSummary();

  return res.send(resp);
});

siteVisitRouter.get("/site-visit-past-15day", async (req, res) => {
  const resp = await siteVisitModel.find({
    date: {
      $gt: new Date("2025-05-31T18:30:00.000Z"),
    },
    visitType: { $ne: "virtual-meeting" },
  });

  await Promise.all(
    resp.map(async (ele) => {
      try {
        //
        let update = {};
        if (ele.visitType === "visit") {
          update = {
            visitDate: ele.date,
          };
        }
        if (ele.visitType === "revisit") {
          update = {
            revisitDate: ele.date,
          };
        }
        await leadModelV2.findOneAndUpdate(
          {
            $or: [
              {
                _id: ele.lead,
              },
              {
                phoneNumber: ele.phoneNumber,
              },
            ],
          },
          update,
        );
      } catch (error) {
        //
        logger.info(error);
      }
    }),
  );

  return res.send(resp);
});

siteVisitRouter.post(
  "/site-visit-by-start-end-date",
  // authenticateToken,
  geSiteVisitStartEndDate,
);

// siteVisitRouter.get("/site-visit-date-update-lead", async (req, res) => {
//   try {
//     const leads = await leadModelV2.find({
//       disabled: false,
//       $or: [{ visitRef: { $ne: null } }, { revisitRef: { $ne: null } }],
//     });

//     await Promise.all(
//       leads.map(async (ele) => {
//         try {
//           const findRecentVisit = await siteVisitModel
//             .findOne({ phoneNumber: ele.phoneNumber })
//             .sort({ date: -1 });
//           //
//           if (findRecentVisit != null) {
//             if (findRecentVisit.visitType == "visit") {
//               await leadModelV2.findByIdAndUpdate(ele._id, {
//                 $set: {
//                   visitDate: findRecentVisit.date,
//                 },
//               });
//             } else if (findRecentVisit.visitType == "revisit") {
//               await leadModelV2.findByIdAndUpdate(ele._id, {
//                 $set: {
//                   revisitDate: findRecentVisit.date,
//                 },
//               });
//             }
//           }
//           //
//         } catch (error) {
//           //
//         }
//       })
//     );
//     res.send("ok");
//   } catch (error) {
//     logger.info(error);
//     res.send(error);
//   }
// });
// siteVisitRouter.get(
//   "/site-visit-summary-attendee/:id",
//   // authenticateToken,
//   getSiteVisitSummaryByAttendee
// );

export default siteVisitRouter;

function getGender(prefix) {
  if (prefix.toLowerCase() === "mrs" || prefix.toLowerCase() === "ms") {
    return "female";
  } else if (prefix.toLowerCase() === "mr") {
    return "male";
  }
  return "other";
}

function convertStringToDate(dateString) {
  // Split the date string into day, month, and year
  const [day, month, year] = dateString.split("-");

  // Create a new Date object
  // Note: month is 0-indexed in JavaScript Date, so we subtract 1
  return new Date(year, month - 1, day);
}

async function insertDataInBatches(data, batchSize = 1000) {
  const totalRecords = data.length;
  let insertedCount = 0;

  for (let i = 0; i < totalRecords; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await siteVisitModel.insertMany(batch, { ordered: false });
    insertedCount += batch.length;
    // logger.info(`Inserted ${insertedCount} out of ${totalRecords} records`);
  }
}
