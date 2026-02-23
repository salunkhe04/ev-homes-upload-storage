import { Router } from "express";
import { errorRes2, successRes2 } from "../model/response.js";
import siteVisitModel from "../model/siteVisit.model.js";
import {
  siteVisitPopulateOptions,
  visitNotificationImage,
} from "../utils/constant.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import moment from "moment-timezone";
import axios from "axios";
import { addContact, sendMultipleEmail } from "../utils/brevo.js";
import { visitTemplateV3 } from "../templates/html_template.js";
import oneSignalModel from "../model/oneSignal.model.js";
import { sendNotificationWithImage } from "../controller/oneSignal.controller.js";
import deletedVisitModel from "../model/deletedVisit.model.js";
import logger from "../utils/logger.js";
const timeZone = "Asia/Kolkata";
const zone = "Asia/Kolkata";

const visitRouterV2 = Router();

visitRouterV2.post("/site-visit-approval/:id", async (req, res) => {
  const id = req.params.id;
  const { remark, status, userId } = req.body;
  const user = req.user;

  try {
    if (!id) return errorRes2(res, 401, `id required`);
    if (!status) return errorRes2(res, 401, `status required`);

    //
    const existVisit = await siteVisitModel.findById(id);
    if (!existVisit) return errorRes2(res, 401, `visit not found`);

    const today = new Date();

    const updatedVisit = await siteVisitModel
      .findByIdAndUpdate(id, {
        approvalStatus: status,
        approvalRemark: remark,
        approvalDate: today,
        approveBy: user?._id ?? userId,
      })
      .populate(siteVisitPopulateOptions);

    if (status?.toLowerCase() === "rejected") {
      try {
        //
        await deletedVisitModel.create({
          data: updatedVisit,
          userId: user?._id ?? userId,
        });
        await siteVisitModel.findByIdAndDelete(id);
      } catch (error) {
        //
      }
      return successRes2(res, 200, "Visit Rejected", { data: updatedVisit });
    }

    // get lead by id if exist
    let foundLead = await leadModelV2.findOne({
      $or: [
        // { _id: updatedVisit.lead },
        { phoneNumber: updatedVisit.phoneNumber },
      ],
    });
    if (!foundLead) {
      //
      if (updatedVisit.source?.toLowerCase() != "cp") {
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
      } else {
        return errorRes2(res, 401, `lead not found for the visit`);
      }
    }
    const taggingOver = moment(foundLead.validTill)
      .tz(timeZone)
      .isBefore(moment.tz(timeZone));

    if (updatedVisit.visitType === "visit") {
      //
      foundLead.visitStatus = "visited";
      foundLead.visitDate = today;
      foundLead.visitRef = updatedVisit._id;
      foundLead.stage = "revisit";
      foundLead.cycle.stage = "revisit";
      if (!foundLead.firstVisit) {
        // to cycle trigger properly
        foundLead.cycle.currentDays = 119;
        // add 120days from cycle start date
        foundLead.cycle.validTill = moment(foundLead.cycle.startDate)
          .tz(timeZone)
          .add(119, "days")
          .toDate();
        foundLead.firstVisit = true;
      }
      if (!taggingOver) {
        // calculating remaining days
        const validTill = moment(foundLead.validTill)
          .tz(timeZone)
          .startOf("day");
        const totalRemainingDays = validTill.diff(today, "days");

        // adding extra days if condition satisfy
        if (totalRemainingDays <= 29) {
          const availableDays = 30 - totalRemainingDays;
          foundLead.validTill = validTill.add(availableDays, "days").toDate();
        }
      }
      if (updatedVisit.source != "walk-in") {
        //
        try {
          //
          const oldVisit = await siteVisitModel.findOne({
            phoneNumber: updatedVisit.phoneNumber,
            _id: { $ne: updatedVisit._id },
          });
          if (!oldVisit) {
            //
            foundLead.isCountableVisit = true;
            await foundLead.save();
          }
        } catch (error) {
          //
          logger.error(error);
        }
      }
    } else if (updatedVisit.visitType === "virtual-meeting") {
      //
      foundLead.visitStatus = "virtual-meeting";
      foundLead.visitRef = updatedVisit._id;
      foundLead.stage = "revisit";
      foundLead.cycle.stage = "revisit";
      if (!foundLead.firstVisit) {
        // to cycle trigger properly
        foundLead.cycle.currentDays = 119;
        // add 120days from cycle start date
        foundLead.cycle.validTill = moment(foundLead.cycle.startDate)
          .tz(timeZone)
          .add(119, "days")
          .toDate();
        foundLead.firstVisit = true;
      }
      if (!taggingOver) {
        // calculating remaining days
        const validTill = moment(foundLead.validTill)
          .tz(timeZone)
          .startOf("day");
        const totalRemainingDays = validTill.diff(today, "days");

        // adding extra days if condition satisfy
        if (totalRemainingDays <= 29) {
          const availableDays = 30 - totalRemainingDays;
          foundLead.validTill = validTill.add(availableDays, "days").toDate();
        }
      }
    } else if (updatedVisit.visitType === "revisit") {
      //
      foundLead.revisitStatus = "revisited";
      foundLead.revisitRef = updatedVisit._id;
      foundLead.stage = "booking";
      foundLead.cycle.stage = "booking";
      foundLead.revisitDate = today;

      if (!foundLead.firstVisit) {
        // to cycle trigger properly
        foundLead.cycle.currentDays = 119;
        // add 120days from cycle start date
        foundLead.cycle.validTill = moment(foundLead.cycle.startDate)
          .tz(timeZone)
          .add(119, "days")
          .toDate();
        foundLead.firstVisit = true;
      }
    }

    try {
      foundLead.firstName = updatedVisit?.firstName;
      foundLead.lastName = updatedVisit?.lastName;
      foundLead.email = updatedVisit?.email;
      foundLead.address = updatedVisit?.address;
      foundLead.project = updatedVisit?.projects;
      foundLead.requirement = updatedVisit?.choiceApt;

      await foundLead.save();
    } catch (error) {
      //
      logger.info(error);
    }
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
      try {
        //
        let tlId = dta.find((ele) => ele.docId == foundLead.teamLeader);
        if (tlId) {
          //
          await sendNotificationWithImage({
            playerIds: [tlId.playerId],
            title:
              updatedVisit.visitType === "virtual-meeting"
                ? "Virtual Meeting Done!"
                : `Site ${updatedVisit.visitType} Done!`,
            message: `Site visit is done for ${updatedVisit.firstName ?? ""} ${
              updatedVisit.lastName ?? ""
            }`,
            imageUrl: visitNotificationImage,
            data: {
              route: `/visit-details/${updatedVisit?._id}`,
              type: "lead",
              id: updatedVisit?._id,
            },
            android_channel_id: "visit_notification",
          });
        }
      } catch (error) {
        //
      }

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
        },
      });

      // logger.info("pass sent notification");
    } catch (error) {
      //
      logger.info(error);
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
        ["evhomes.operations@evgroup.co.in", "deepak@evgroup.co.in"]
      );

      try {
        //ninesq= 13/ 10mb = 5/
        if (
          updatedVisit.location?._id === "project-ev-9-square-vashi-sector-9" &&
          updatedVisit.email
        ) {
          // logger.info("entered 9 square");
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
          // logger.info("entered 10 marina");

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
        // logger.info(error);
      }
    } catch (error) {
      logger.info(error);
    }

    return successRes2(res, 200, "", { data: "ok" });
  } catch (error) {
    //
    logger.info(error);

    return errorRes2(res, 500, `${error}`);
  }
});
visitRouterV2.post("/site-visit-cycle-fix", async (req, res) => {
  try {
    //
    const existVisit = await siteVisitModel.find({
      date: {
        $gte: new Date("2025-06-15T18:30:00.000Z"),
      },
    });
    await Promise.all(
      existVisit.map(async (eoe) => {
        try {
          // const fixReq = await axios.post(
          //   `http://localhost:8082/v2/site-visit-approval/${eoe._id}?force=1`,
          //   {
          //     remark: "re-approved due to cycle issue",
          //     status: "approved",
          //     userId: "ev88-pavan-ale",
          //   }
          // );
        } catch (error) {
          //
          print(error);
        }
      })
    );
    res.send({ total: existVisit.length, data: existVisit });
  } catch (error) {
    //
    res.send({ data: error });
  }
});

export default visitRouterV2;
