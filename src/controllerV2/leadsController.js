import employeeModel from "../model/employee.model.js";
import leadAssignmentModel from "../model/lead/leadAssignment.model.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import { errorRes2, successRes, successRes2 } from "../model/response.js";
import { sitevisitTodayEmalTemplete } from "../templates/html_template.js";
import { sendMultipleEmail } from "../utils/brevo.js";
import { leadPopulateOptions } from "../utils/constant.js";
import moment from "moment-timezone";
import logger from "../utils/logger.js";

export const getLeadsTeamLeaderV2 = async (req, res, next) => {
  const id = req.params.id;
  const { status, sort } = req.query;
  if (!id) return errorRes2(res, 401, "id Required");
  try {
    //
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let sortDirection = -1;
    let skip = (page - 1) * limit;

    if (sort == "Ascending" || sort == "ascending") {
      sortDirection = 1;
      // logger.info("ascending");
    } else if (sort == "Descending" || sort == "descending") {
      sortDirection = -1;
    }

    const resp = await leadModelV2
      .find({
        "cycle.teamLeader": id,
      })
      .sort({ "cycle.startDate": sortDirection, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate(leadPopulateOptions);

    return successRes2(res, 200, "leads for tl", {
      totalItems: resp.length,
      data: resp,
    });
  } catch (error) {
    //
    logger.error(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
};

export const getTodayVisitLineUp = async () => {
  const startOfDay = moment().tz("Asia/Kolkata").startOf("day").toDate();
  const endOfDay = moment().tz("Asia/Kolkata").endOf("day").toDate();

  const leads = await leadModelV2
    .find({
      siteVisitInterested: true,
      siteVisitInterestedDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
    .populate(leadPopulateOptions);

  const tls = ["ev15-deepak-karki", "ev54-ranjna-gupta", "ev70-jaspreet-arora"];

  if (leads.length > 0) {
    await Promise.all(
      tls.map(async (tl) => {
        //
        const filtedLeads = leads.filter(
          (lead) => lead?.cycle?.teamLeader?._id == tl,
        );

        if (filtedLeads.length <= 0) {
          return;
        }

        const teamLeader = filtedLeads[0]?.cycle?.teamLeader;
        const tlEmail = teamLeader?.email;
        const resp = await sendMultipleEmail(
          [tlEmail],
          // ["shreya.evgroup@gmail.com","shreya@evgroup.co.in"],
          `Important: Client Site Visit Scheduled for Today (${moment()
            .tz("Asia/Kolkata")
            .format("DD-MM-YYYY")}), Please Ensure Visit Happens`,
          sitevisitTodayEmalTemplete({ leads: filtedLeads, teamLeader }),
          [],
          [
            // "shreya.evgroup@gmail.com",
            // "shreya@evgroup.co.in", // need to remove after - checking done - 4-5days
            "deepak@evgroup.co.in",
            "ricki@evgroup.co.in",
            "evhomes.operations@evgroup.co.in",
            // "aktarul.evgroup@gmail.com", // need to remove after - checking done - 4-5days
            // "aktarul@evgroup.co.in",
            // need to remove after - checking done - 4-5days
          ],
        );
      }),
    );
  }
};

// export async function automatedLeadAssignment(leadId) {
//   const tls = ["ev000-test-dum", "ev0019-dummy-cm"];

//   try {
//     let tracker = await leadAssignmentModel.findOne();
//     if (!tracker) {
//       tracker = await leadAssignmentModel.create({
//         firstTeamLeader: tls[0], // Start with Deepak
//         assignedLeads: [],
//         index: 0,
//       });
//     }

//     logger.info(tracker);
//     const currentIndex = tracker.index;
//     const currentTL = tls[currentIndex];

//     const teamLeaderDoc = await employeeModel.findOne({ _id: currentTL });

//     if (!teamLeaderDoc) {
//       throw new Error(`No team leader found for ${currentTL}`);
//     }

// logger.info(teamLeaderDoc);
//     tracker.firstTeamLeader = teamLeaderDoc._id;
//     tracker.assignedLeads.push(leadId);

//     tracker.index = (currentIndex + 1) % tls.length;

//     await tracker.save();

//     return { assignedTo: currentTL };
//   } catch (err) {
//     console.error("Error assigning lead:", err);
//     throw err;
//   }
// }
