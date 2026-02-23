import { Router } from "express";
import cpRouter from "./channelPartner/channelPartnerRouter.js";
import employeeRouter from "./employee/employeeRouter.js";
import divRouter from "./division/divisionRouter.js";
import desRouter from "./designation/designationRouter.js";
import deptRouter from "./department/departmentRouter.js";
import ourProjectRouter from "./ourProject/ourProjectRouter.js";
import leadRouter from "./lead/leadRouter.js";
import clientRouter from "./client/clientRouter.js";
import siteVisitRouter from "./siteVisit/sitevisitRouter.js";
import storageRouter from "./storage/storageRouter.js";
import { readFile } from "fs/promises";
import oneSignalRouter from "./oneSignal/oneSignalRouter.js";
import blockTokenRouter from "./bockedToken/blockTokenRouter.js";
import {
  addChannelPartnerList,
  addContact,
  addToCPListAutomated,
  addToList,
  sendEmail,
  sendMultipleEmail,
  updateListById,
} from "../utils/brevo.js";
import reqRouter from "./requirement/reqRouter.js";
import { encryptPassword } from "../utils/helper.js";
import postSaleRouter from "./postSaleLead/postSaleLeadRouter.js";
import contestRouter from "./contest/contestRouter.js";
import paymentRouter from "./payment/paymentRouter.js";
import demandRouter from "./demand/demandRouter.js";
import meetingRouter from "./meetingSummary/meetingSummaryRouter.js";
import targetRouter from "./target/targetRouter.js";
import teamSectionRouter from "./teamSection/teamSectionRouter.js";
import taskRouter from "./task/taskRouter.js";
import notifyRouter from "./notification/notificationRouter.js";
import attendanceRouter from "./attendance/attendanceRouter.js";
import chatRouter from "./chat/chatRouter.js";
import upcomingRouter from "./upcomingprojects/upcomingprojectsRouter.js";

import enquiryformRouter from "./enquiryform/enquiryformRouter.js";

import whatsnewrouterRouter from "./whatsnew/whatsnewRouter.js";
import appUpdateRouter from "./appUpdate/appUpdateRouter.js";
import auditSectionRouter from "./auditSection/auditSectionRouter.js";
import shiftRouter from "./shift/shiftRouter.js";
import weekoffRouter from "./weekoff/weekoffRouter.js";
import faceIdRouter from "./faceId/faceIdRouter.js";
import geoRouter from "./geofence/geofenceRouter.js";
import feedbackEnquiryRouter from "./feedbackEnquiry/feedbackEnquiryRouter.js";
import eventRouter from "./event/eventRouter.js";
import testimonialRouter from "./testimonial/testimonialRouter.js";
import vehicleRouter from "./vehicle/vehicleRouter.js";
import chatRespRouter from "./chatResponse/chatResponseRouter.js";
import transPortRouter from "./transport/transportRouter.js";
import leaveRequestRouter from "./leaveRequest/leaveRequestRouter.js";
import slabRouter from "./slabs/slabRouter.js";
import shiftInfoRouter from "./employeeShiftInfoRouter/employeeShiftInfoRouter.js";
import levRouter from "./leave/leaveRouter.js";
import holidayRouter from "./holidays/holidaysRouter.js";
import regularizationRouter from "./regularization/regularizationRouter.js";
import approvalStepRouter from "./approvalStep/approvalStepRouter.js";
import shiftInfoRequestRouter from "./employeeShiftInfoRequest/employeeShiftInfoRequestRouter.js";

import {
  bookingRecievedTemplate,
  feedbackPendingTemplate,
  leadAssignPendingTemplate,
  paymentConfirmationTemplate,
  siteVisitOtpTempleteV2,
  sitevisitTodayEmalTemplete,
  visitTemplateV2,
} from "../templates/html_template.js";
import reimbursementRouter from "./reimbursement/reimbursementRouter.js";
import meetingRequestRouter from "./meetingRequest/meeting_requestRouter.js";
import demandPaymentInfoRouter from "./demandPaymentInfoRouter/demandPaymentInfoRouter.js";
import couponRouter from "./coupon/couponRouter.js";

import accessoryRouter from "./accessory/accessoryRouter.js";

import estimateRouter from "./estimator/estimateRouter.js";
import assetlistRouter from "./assetlist/assetlistRouter.js";
import assetRequestRouter from "./assetRequest/assetRequestRouter.js";
import estimateGeneratedRouter from "./estimateGenerated/estimateGeneratedRouter.js";
import redisRouter from "./redis/redisRouter.js";
import attendanceStatusRouter from "./attendance/attendanceStatusRouter.js";
import flatRouter from "./ourProject/flatRouter.js";
import parkingRouter from "./ourProject/parkingRouter.js";
import appDevRouter from "./appDevTask/appDevTaskRouter.js";
import axios from "axios";
import path from "path";
import whatsAppTemplateRouter from "./whatsAppTemplate/whatsAppTemplateRouter.js";
import { connectedUsers, io } from "../socket/socket.js";

import leaveHistoryRouter from "./leaveHistory/leaveHistoryRouter.js";

import shiftPlannerRequest from "./shiftPlannerRequest/shiftPlannerRequestRouter.js";
import mentionMessageRouter from "./mentionMessage/mentionMessageRouter.js";
import warnLetterRouter from "./warningLetter/warningLetterRouter.js";
import scaleRouter from "./scale/scaleRouter.js";
import incentiveRouter from "./incentive/incentiveRouter.js";
import eligibilityRouter from "./eligibilityRequest/eligibilityRequestRouter.js";
import examRouter from "./exam/examRouter.js";
import examAnswerRouter from "./examAnswer/examAnswerRouter.js";
import estCompRouter from "./estimateCompany/estCompanyRouter.js";
import questionRouter from "./exam/questionRouter.js";
import appUpdateModel from "../model/appUpdate.js";
import { errorRes2, successRes, successRes2 } from "../model/response.js";
import passbackEstimateRouter from "./passbackEstimate/passbackEstimateRouter.js";
import CpOnBoardingRouter from "./cpOnBoarding/cpOnBoardingRouter.js";
import brokrageRouter from "./brokrage/brokrageRouter.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import { leadPopulateOptions } from "../utils/constant.js";
import { getTodayVisitLineUp } from "../controllerV2/leadsController.js";
import bookingTargetRouter from "./bookingTargetRouter/bookingTargetRouter.js";
import empDocReqRouter from "./employeeDocRequest/employeeDocRequestRouter.js";
import periodRouter from "./period/periodRouter.js";
import linkDintestModel from "../model/linkDinTest.model.js";
import rankingTurnRouter from "./period/rankingTurnRouter.js";
// import { GoogleGenAI } from "@google
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import geminiRouter from "./geminiAi/geminiRouter.js";
import teamInsightRouter from "./teamInsight/teamInsightRouter.js";
import moment from "moment-timezone";
import rankingTurnModel from "../model/period/ranking.model.js";
import siteVisitModel from "../model/siteVisit.model.js";
import { tryCatch } from "bullmq";
import extAttReqRouter from "./attendance/extAttReqRouter.js";
import zonesRouter from "./zones/zonesRouter.js";
import commercialProjectRouter from "./commercialProject/commercialProjectRouter.js";
import config from "../config/config.js";
import pLimit from "p-limit";
import cpModel from "../model/channelPartner.model.js";
import postSaleLeadModel from "../model/postSaleLead.model.js";
import shortsRouter from "./shorts/shortsRouter.js";
import instagram, { getCookie, igApi } from "insta-fetcher";
import eoiConfRouter from "./eoiConfirmationRouter/eoiConfirmationRouter.js";
import instaRouter from "./instaReels/instaReelRouter.js";
import eoiExhibitionRouter from "./eoiExhibition/eoiExhibitionRouter.js";
import exihibitionVideoRouter from "./exihibitionVideo/exhibitionVideoRouter.js";
import exhibitionVideoCountRouter from "./exhibitionVideoCount/exhibtionVideoCount.js";
import onbExhibRouter from "./onBoardingExhib/onboardingExhibRouter.js";
import designTaskRouter from "./task/designTaskRouter.js";
import trackerRouter from "./tracker/trackerRouter.js";
import logger from "../utils/logger.js";

const router = Router();

router.get("/ping", async (req, res) => {
  res.json({ code: 200, message: "ok" });
});

router.get("/status", async (req, res) => {
  logger.info(`${new Date().toString()}`);
  res.json({
    code: 200,
    message: "ok",
    date: new Date(),
    dateStr: new Date().toString(),
  });
});

router.get("/test-tesp", async (req, res) => {
  const resp = await getTodayVisitLineUp();

  res.json({ code: 200, message: "ok", data: resp });
});

router.get("/test-phone-num", async (req, res) => {
  const { phoneNumber } = req.query;
  try {
    const resp = await axios.get(
      `https://api.event.knocknok.co/api/exhibitor/visitors?eventId=3570b053-d910-4b5a-a963-2432288384eb&contactNumber=${phoneNumber}`,
    );

    res.json({ code: 200, message: "ok", data: resp?.data });
  } catch (error) {
    logger.error(error);
    res.json({ code: 200, message: `${error}` });
  }
});

router.post("/test-easylu-leads", async (req, res) => {
  // logger.info(req.body);
  // logger.info(req.query);
  let curDate = moment().tz("Asia/Kolkata");
  let endOfDay = moment().tz("Asia/Kolkata").endOf("day");
  let curAft = moment({ hour: 21, minute: 1 }).tz("Asia/Kolkata");
  let nextDay = moment({ hour: 11, minute: 59 })
    .add(1, "days")
    .tz("Asia/Kolkata");

  // logger.info(curDate);
  // logger.info(endOfDay);
  // logger.info(curAft);
  // logger.info(nextDay);

  if (
    curDate.isBefore(endOfDay) &&
    curDate.isAfter(moment({ hour: 21, minute: 10 }))
  ) {
  }
  res.json({
    code: 200,
    message: "ok",
    data: { body: req.body, query: req.query },
  });
});

router.post("/test-easylu-leads/:phoneNumber", async (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  // logger.info("Raw body:", req.body);

  let cleanedData = null;

  try {
    const keys = Object.keys(req.body);
    if (keys.length === 1) {
      const keyPart = keys[0]; // '{"data":{"phone1":" 9123712726","phone2":"","email":'
      const innerObj = req.body[keyPart];
      const emailKey = Object.keys(innerObj)[0].replace(/"/g, ""); // hamza.bandookwala@gmail.com
      const fixedJSONStr = `${keyPart}"${emailKey}"}}`; // Stitch into valid JSON
      cleanedData = JSON.parse(fixedJSONStr);
    } else {
      throw new Error("Unexpected body structure");
    }
  } catch (err) {
    console.error("Failed to parse data:", err);
  }

  // logger.info("Cleaned Data:", cleanedData);

  await linkDintestModel.create({
    phoneNumber,
    data: cleanedData?.data,
    raw: req?.body,
  });

  res.json({
    code: 200,
    message: "ok",
    data: { body: req.body, query: req.query, cleaned: cleanedData },
  });
});

router.post("/brevo-cp-test", addChannelPartnerList);

router.post("/update-cp-brevo-id/:id", updateListById);

router.post("/add-cp-list/:id", addToList);

router.post("/add-cp-list-automated", addToCPListAutomated);

router.post("/gemini-api-key", async (req, res) => {
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyCF4RBaoOghGK7YRXEPlcmxsgO2G-quq4I",
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      'Here is user data: {"name": "Nikhil Rupainwar", "phoneNumber": "+91-8657684467", "linkedIn":"https://www.linkedin.com/in/nikhil-rupainwar-702640136"} based on the linkedIn i provide,can you tell me what is the designation, a?',
  });

  // const ai = new GoogleGenAI({ apiKey: "AIzaSyCF4RBaoOghGK7YRXEPlcmxsgO2G-quq4I" });

  // const response = await ai.models.generateContent({
  //   model: "gemini-2.5-flash",
  //   contents:
  //     "List a few popular cookie recipes, and include the amounts of ingredients.",
  //   config: {
  //     responseMimeType: "application/json",
  //     responseSchema: {
  //       type: Type.ARRAY,
  //       items: {
  //         type: Type.OBJECT,
  //         properties: {
  //           recipe_name: { type: Type.STRING },
  //           ingredients: {
  //             type: Type.ARRAY,
  //             items: { type: Type.STRING },
  //           },
  //         },
  //         required: ["recipe_name", "ingredients"],
  //       },
  //     },
  //   },
  // });
  // logger.info(response.text);

  // logger.info(response.text);

  return res.send(successRes(200, "oka", { data: response }));
});

// router.get("/instagram-test", async (req, res) => {
//   // const userData = await instagram("https://www.instagram.com/evhomesofficial");

//   try {
//     let ig = new igApi("your cookie", false, {
//       proxy: {
//         host: 'proxy-url',
//         port: 80,
//         auth: {username: 'joker_1233009', password: 'Joker_1233'}
//     }
// });

// // Public post
// const igPost=await ig.fetchPost("https://www.instagram.com/reel/DLec2XfIzC6/?igsh=OTloejY2YWo5c3Bo");

//     // const userData = await getCookie("joker_1233009", "Joker_1233",true);
//     logger.info(igPost);
//     // res.json({
//     //   code: 200,
//     //   message: "ok",
//     //   data: { userData },
//     // });
//     //
//   } catch (error) {
// logger.error(error);
//     //
//     logger.info(error);
//   }
// });

router.post("/chatgpt-api-key", async (req, res) => {
  const openai = new OpenAI({
    apiKey: "sk-1234efghqrstuvwx1234efghqrstuvwx1234efgh",
  });

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input:
      'Here is user data: {"name": "Nikhil Rupainwar", "phoneNumber": "+91-8657684467", "linkedIn":"https://www.linkedin.com/in/nikhil-rupainwar-702640136"} based on the linkedIn i provide,can you tell me what is the designation, a?',

    store: true,
  });

  // response.then((result) => logger.info(result.output_text));
  return res.send(successRes(200, "oka", { data: response }));
});

router.get("/", async (req, res) => {
  const htmlContent = await readFile(
    "./src/templates/api_welcome_page.html",
    "utf8",
  );
  return res.type("html").send(htmlContent);
});

router.get("/email", async (req, res, next) => {
  try {
    // const imageUrl =
    //   "https://cdn.evhomes.tech/5fbd766b-59e0-41a5-8c0a-2cfdf2f7e19a-1000127604.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaWxlbmFtZSI6IjVmYmQ3NjZiLTU5ZTAtNDFhNS04YzBhLTJjZmRmMmY3ZTE5YS0xMDAwMTI3NjA0LmpwZyIsImlhdCI6MTc0NTEzMzQ2M30.Z9f4Tqs6p3oCPXiQsu4A707g0V-jF-pgdCFPrAJm0Ao";

    // // 1. Get file extension from URL (ignoring query params)
    // const cleanUrl = imageUrl.split("?")[0]; // remove query string
    // const ext = path.extname(cleanUrl); // .jpg, .png, etc.

    // const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    // const base64Image = Buffer.from(imageRes.data).toString("base64");

    // // 2. Create a dynamic filename
    // const filename = `attachment-virtual-meeting${ext}`;

    const attachment = [
      // {
      //   name: filename,
      //   content: base64Image,
      // },
    ];
    // const resp = await sendMultipleEmail(
    //   ["aktarul.evgroup@gmail.com"],
    //   `visit attachment test 2`,
    //   leadAssignPendingTemplate(
    //     `visit attachment test `,
    //     `+91 9988775566`,
    //     "virtual meeting",
    //     `Pavan Ale`,
    //     `21-02-2025 11:45Deepak Karki`
    //   ),
    //   attachment
    // );

    // const resp = await sendMultipleEmail(
    //   ["aktarul.evgroup@gmail.com"],
    //   `Client Just Visited the Sales Lounge through Channel Partner (test cp1)`,
    //   visitTemplateV2({
    //     header:
    //       "Client Just Visited the Sales Lounge through Channel Partner (test cp1)",
    //     clientName: "test user 2",
    //     phoneNumber: "+91 1234567890",
    //     email: "test@gmail.com",
    //     team: "mayur,shreya,anurag",
    //     closingManager: "test cm",
    //     channelPartner: "none",
    //     projects: "marina",
    //     requirement: "2bhk",
    //     date: "03-05-2025",
    //     location: "sector 9 vashi",
    //     visitType: "visit",
    //   }),
    //   attachment
    // );
    const leads = await leadModelV2
      .find({
        siteVisitInterested: true,
        siteVisitInterestedDate: {
          $gte: new Date("2025-08-28T18:30:00.000Z"),
          $lte: new Date("2025-08-29T18:29:00.000Z"),
        },
      })
      .populate(leadPopulateOptions);

    const resp = await sendMultipleEmail(
      ["aktarul.evgroup@gmail.com"],
      `Important: Client Site Visit Scheduled for Today (${moment()
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY")}), Please Ensure Visit Happens`,
      sitevisitTodayEmalTemplete({
        leads,
        teamLeader: { firstName: "test", lastName: "test" },
      }),
      attachment,
      ["aktarul@evgroup.co.in", "deepak@evgroup.co.in"],
    );

    // const resp = await sendMultipleEmail(
    //   ["aktarul.evgroup@gmail.com"],
    //   `Feedback is pending for lead which was assigned to you at 21-02-2025 11:45`,
    //   feedbackPendingTemplate(
    //     `test client 2 `,
    //     `+91 9988775566`,
    //     `Deepak Karki`,
    //     "21-02-2025 11:45",
    //     "Visit Pending"
    //   )
    // );

    // const resp = await sendMultipleEmail(
    //   ["aktarul.evgroup@gmail.com"],
    //   "Congratulations there has been a new booking in Nine Square by Jaspreet team",
    //   bookingRecievedTemplate(
    //     "EV 10 Marina Bay",
    //     "Jarpreet Arora",
    //     "test Client",
    //     "+91 1122334455",
    //     null,
    //     "10-02-2025",
    //     "12-02-2025",
    //     "16-02-2025",
    //     "22-02-2025",
    //     "NO"
    //   )
    // );
    res.send(resp);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post("/add-contact-brevo", async (req, res, next) => {
  const resp = await addContact({
    listIds: [13],
    email: "aktarul.evgroup@gmail.com",
    firstName: "aktarul",
    lastName: "test",
    phoneNumber: "919876543210",
  });
  res.send(resp);
});

router.post("/hashPassword", async (req, res, next) => {
  const { password } = req.body;
  try {
    const resp = await encryptPassword(password);
    res.send(resp);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.post("/test-call", async (req, res, next) => {
  const { phoneNumber, type, message, userId } = req.query;
  try {
    const user = connectedUsers.find((ele) => ele.userId === userId);
    io.to(user?.phoneSocketId).emit("callCustomer", {
      lead: "id",
      phoneNumber: phoneNumber,
      type: type,
      message: message,
    });
    res.send("ok");
  } catch (error) {
    logger.error(error);
    res.send(error);
  }
});

router.get("/app-update", async (req, res, next) => {
  const { appName } = req.query;
  try {
    //
    const resp = await appUpdateModel.findOne({ appName: appName });
    if (!resp) return errorRes2(res, 404, "No App found");
    return successRes2(res, 200, "app found", { data: resp });
  } catch (error) {
    logger.error(error);
    //
    return errorRes2(res, 500, `${error}`);
  }
});

router.post("/app-update", async (req, res, next) => {
  const { appName } = req.body;
  try {
    //
    const resp = await appUpdateModel.create({ ...req.body });
    if (!resp) return errorRes2(res, 404, "No App found");
    return successRes2(res, 200, "app found", { data: resp });
  } catch (error) {
    logger.error(error);
    //
    return errorRes2(res, 500, `${error}`);
  }
});

router.post("/add-visit-count-ranking", async (req, res, next) => {
  const { visitId, teamLeader } = req.body;
  try {
    //
    const targetDate = new Date();
    let filter = {
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    };

    const resp = await rankingTurnModel.findOne(filter);

    if (!resp) return errorRes2(res, 404, "No App found");
    return successRes2(res, 200, "app found", { data: resp });
  } catch (error) {
    logger.error(error);
    //
    return errorRes2(res, 500, `${error}`);
  }
});

router.post("/sync-test-easy-leadz", async (req, res, next) => {
  const { appName } = req.body;
  try {
    const resp = await leadModelV2
      .find({
        $and: [{ linkedIn: { $ne: null } }, { linkedIn: { $ne: "" } }],
      })
      .sort({ createdAt: -1 });
    // .limit(10);

    if (!resp || resp.length === 0) return errorRes2(res, 404, "No App found");

    for (const ele of resp) {
      const datat2 = {
        data: {
          url: ele.linkedIn,
          callbackUrl: `https://api.evhomes.tech/test-easylu-leads/${ele.phoneNumber}`,
        },
      };

      try {
        await axios.get("https://app.easyleadz.com/api/prod/", {
          headers: {
            "Enapi-Key":
              "e41f1895a0d5b4e6a58b7344f78c786429a8876803c998edc9ca05d945bd2c01",
          },
          data: datat2, // use params for GET
        });
        // logger.info(`✅ Called API for ${ele.phoneNumber}`);
      } catch (error) {
        logger.error(`❌ Error for ${ele.phoneNumber}:`, error.message);
      }
      // to check
      // wait for 5 seconds before the next call
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return successRes2(res, 200, "Completed EasyLeadz sync test", {
      count: resp.length,
    });
  } catch (error) {
    logger.error(error);
    return errorRes2(res, 500, `${error}`);
  }
});

router.get("/sync-visit-rank", async (req, res, next) => {
  //
  try {
    //
    const date = moment().tz("Asia/Kolkata").subtract(1, "day").startOf("day");
    // logger.info(date.toDate().toISOString());
    const visits = await siteVisitModel.find({
      date: { $gte: date.toDate() },
      visitType: "visit",
    });
    const avlsVist = [];
    const availabe = await Promise.all(
      visits.map(async (ele) => {
        // check if its first visit
        const oldVisit = await siteVisitModel.findOne({
          $and: [
            {
              _id: { $ne: ele._id },
            },
            {
              phoneNumber: ele.phoneNumber,
            },
          ],
        });
        // if old visit
        if (oldVisit) {
          //
          return;
        }
        // if new then
        await leadModelV2.findOneAndUpdate(
          {
            phoneNumber: ele.phoneNumber,
          },
          {
            //
            isCountableVisit: true,
          },
        );
        // logger.info(`visit countable for ${ele.phoneNumber}`);
        avlsVist.push(ele);
      }),
    );

    return successRes2(res, 200, "sync visit", {
      total: avlsVist.length,
      data: avlsVist,
    });
  } catch (error) {
    logger.error(error);
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});

router.get("/find-no-lead-visits", async (req, res, next) => {
  try {
    //
    const leadsNotFound = [];

    const allVisits = await siteVisitModel.find(
      {},
      { phoneNumber: 1, closingManager: 1, date: 1, source: 1 },
    );
    //
    for (let i = 0; i < allVisits.length; i++) {
      //

      let visit = allVisits[i];
      const foundLead = await leadModelV2.findOne(
        { phoneNumber: visit.phoneNumber },
        {
          phoneNumber: 1,
          "cycle.teamLeader": 1,
          createdAt: 1,
          approvalDate: 1,
          dataAnalyzer: 1,
        },
      );
      if (!foundLead) {
        //
        leadsNotFound.push(visit);
      }
      // logger.info(`${i}/${allVisits.length} done`);
    }
    return successRes2(res, 200, "oka", {
      total: leadsNotFound.length,
      data: leadsNotFound,
    });
  } catch (error) {
    logger.error(error);
    //
    return errorRes2(res, 200, `${error?.message || error}`);
  }
});

router.get("/brevo-contact-get-bylist", async (req, res, next) => {
  const { listId } = req.query;
  const scucess = [];

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    const now = moment().subtract(1, "day").endOf("day");
    const tOverLeads = await leadModelV2
      .find(
        {
          validTill: { $lt: now },
          leadType: "cp",
          channelPartner: { $ne: null },
          brevoCpTaggingRemovedFromList: { $ne: true },
        },
        { phoneNumber: 1, channelPartner: 1, validTill: 1, startDate: 1 },
      )
      .sort({ validTill: -1 })
      .limit(10);
    const cps = await cpModel.find({ brevoId: { $ne: null } }, { brevoId: 1 });
    const availabeIds = cps.map((ele) => ele.brevoId);
    //
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.BREVO_API_KEY,
    };

    // 1️⃣ Throttled GET calls
    const groupedByList = {};

    for (const ele of tOverLeads) {
      try {
        const brevoResponse = await axios.get(
          `https://api.brevo.com/v3/contacts/91${ele.phoneNumber}?identifierType=phone_id`,
          { headers },
        );

        const data = brevoResponse?.data;
        if (!data?.id) {
          await sleep(150); // still pause between requests
          continue;
        }

        const contactId = data.id;
        let listIds = (data.listIds || [])
          .filter((lid) => lid !== null && lid !== undefined)
          .filter((lid) => availabeIds.includes(lid));

        listIds.forEach((lid) => {
          if (!groupedByList[lid]) {
            groupedByList[lid] = {
              listId: lid,
              ids: [],
              phone: [],
            };
          }
          groupedByList[lid].ids.push(contactId);
          groupedByList[lid].phone.push(ele.phoneNumber);
        });

        // throttle GET
        await sleep(150); // ~6-7 req/sec, under Brevo 10 RPS
      } catch (err) {
        console.error(`GET error for phone ${ele.phoneNumber}`, err.message);
        await sleep(150); // still pause on errors
      }
    }

    // Convert grouped object to array and remove null groups
    const needToRemove = Object.values(groupedByList).filter(
      (g) => g.listId !== null && g.listId !== undefined,
    );

    // 2️⃣ Throttled POST calls
    // for (const ele of needToRemove) {
    //   try {
    //     logger.info(
    //       `Removing from listId ${ele.listId} (contacts: ${ele.ids.length})`
    //     );

    //     const brevoResponse = await axios.post(
    //       `https://api.brevo.com/v3/contacts/lists/${ele.listId}/contacts/remove`,
    //       { ids: ele.ids },
    //       { headers }
    //     );

    //     if (brevoResponse?.data) {
    //       scucess.push(brevoResponse.data);

    //       // update your leads
    //       for (const phone of ele.phone) {
    //         await leadModelV2.findOneAndUpdate(
    //           { phoneNumber: phone },
    //           { brevoCpTaggingRemovedFromList: true }
    //         );
    //       }
    //     }

    //     logger.info(`Removed from listId ${ele.listId} - done`);
    //     // throttle POST
    //     await sleep(200); // ~5 req/sec
    //   } catch (err) {
    //     console.error(`POST error for listId ${ele.listId}`, err.message);
    //     await sleep(200);
    //   }
    // }

    return successRes2(res, 200, "sf", {
      total: needToRemove.length,
      scucess,
      availabeIds,
      data: needToRemove,
    });
  } catch (error) {
    logger.error(error);
    return errorRes2(res, 500, `${error}`);
  }
});

// router.get("/brevo-contact-get-bylist", async (req, res, next) => {
//   //
//   const { listId } = req.query;
//   const scucess = [];
//   try {
//     //
//     const now = moment().subtract(1, "day").endOf("day");
//     const tOverLeads = await leadModelV2
//       .find(
//         {
//           validTill: { $lt: now },
//           leadType: "cp",
//           channelPartner: { $ne: null },
//           brevoCpTaggingRemovedFromList: { $ne: true },
//         },
//         { phoneNumber: 1, channelPartner: 1, validTill: 1, startDate: 1 }
//       )
//       .sort({ validTill: -1 })
//       .limit(50);
//     //
//     const headers = {
//       accept: "application/json",
//       "content-type": "application/json",
//       "api-key": config.BREVO_API_KEY,
//     };
//     // Build the grouped object
//     const groupedByList = {};

//     const brevoFolderId = 21;
//     const limit = pLimit(10); // max 10 concurrent lookups
//     logger.info("pass 1");
//     await Promise.all(
//       tOverLeads.map((ele) =>
//         limit(async () => {
//           const brevoResponse = await axios.get(
//             `https://api.brevo.com/v3/contacts/91${ele.phoneNumber}?identifierType=phone_id`,
//             { headers }
//           );
//           const data = brevoResponse?.data;
//           if (!data?.id) return;

//           // 4. The contact’s Brevo ID
//           const contactId = data.id;

//           // 5. The contact’s listIds (array)
//           let listIds = data.listIds || []; // e.g. [21, 42]
//           // 6. Filter out null/undefined/0 listIds
//           listIds = listIds.filter((lid) => lid !== null && lid !== undefined);

//           // 6. Group by each listId
//           listIds.forEach((lid) => {
//             if (!groupedByList[lid]) {
//               groupedByList[lid] = {
//                 listId: lid,
//                 ids: [],
//                 phone: [],
//               };
//             }
//             groupedByList[lid].ids.push(contactId);
//             groupedByList[lid].phone.push(ele.phoneNumber);
//           });
//         })
//       )
//     );
//     logger.info("pass 2");

//     // Convert grouped object to array
//     const needToRemove = Object.values(groupedByList);

//     await Promise.all(
//       needToRemove.map((ele, index) => {
//         limit(async () => {
//           //
//           logger.info(`${index} / ${needToRemove.length} - ${ele?.listId}`);
//           const brevoResponse = await axios.post(
//             `https://api.brevo.com/v3/contacts/lists/${ele.listId}/contacts/remove`,
//             { ids: ele.ids },
//             { headers }
//           );
//           if (!brevoResponse.data) return;
//           //
//           scucess.push(brevoResponse.data);
//           await Promise.all(
//             ele.phone.map(async (el2) => {
//               //
//               await leadModelV2.findOneAndUpdate(
//                 { phoneNumber: el2 },
//                 {
//                   brevoCpTaggingRemovedFromList: true,
//                 }
//               );
//             })
//           );
//           logger.info(`${index} / ${needToRemove.length} - done`);
//         });
//       })
//     );

//     // logger.info("bre list created:", brevoResponse.data);

//     return successRes2(res, 200, "sf", {
//       // data: brevoResponse.data,
//       total: needToRemove.length,
//       scucess,
//       data: needToRemove,
//     });
//   } catch (error) {
// logger.error(error);
//     //

//     return errorRes2(res, 500, `${error}`);
//   }
// });

// router.get("/leads-booking-ref-postsale-test", async (req, res, next) => {
//   try {

//     const leads = await leadModelV2.find({ bookingRef: { $ne: null } });

//     const bookingIds = leads.map((lead) => lead.bookingRef);

//     const matchedBookings = await postSaleLeadModel.find({
//       _id: { $in: bookingIds },
//     });

//     const matchedBookingIds = matchedBookings.map((b) => b._id.toString());
//     const unmatchedLeads = leads.filter(
//       (lead) => !matchedBookingIds.includes(lead.bookingRef.toString())
//     );

//     return successRes2(res, 200, "Leads BookingRef Validation", {
//       totalLeadsWithRef: leads.length,
//       matchedCount: matchedBookings.length,
//       unmatchedCount: unmatchedLeads.length,
//       matchedBookings,
//       unmatchedLeads,
//     });
//   } catch (e) {
//     return errorRes2(res, 400, `server error ${e}`);
//   }
// });

router.use(cpRouter);
router.use(employeeRouter);
router.use(divRouter);
router.use(desRouter);
router.use(deptRouter);
router.use(ourProjectRouter);
router.use(leadRouter);
router.use(clientRouter);
router.use(storageRouter);
router.use(siteVisitRouter);
router.use(oneSignalRouter);
router.use(blockTokenRouter);
router.use(reqRouter);
router.use(postSaleRouter);
router.use(contestRouter);
router.use(paymentRouter);
router.use(demandRouter);
router.use(meetingRouter);
router.use(targetRouter);
router.use(teamSectionRouter);
router.use(taskRouter);
router.use(notifyRouter);
router.use(attendanceRouter);
router.use(chatRouter);
router.use(upcomingRouter);
router.use(enquiryformRouter);
router.use(whatsnewrouterRouter);
router.use(appUpdateRouter);
router.use(auditSectionRouter);
router.use(shiftRouter);
router.use(weekoffRouter);
router.use(faceIdRouter);
router.use(geoRouter);
router.use(feedbackEnquiryRouter);
router.use(eventRouter);
router.use(testimonialRouter);
router.use(vehicleRouter);
router.use(chatRespRouter);
router.use(transPortRouter);
router.use(leaveRequestRouter);
router.use(slabRouter);
router.use(shiftInfoRouter);
router.use(levRouter);
router.use(holidayRouter);
router.use(regularizationRouter);
router.use(reimbursementRouter);
router.use(approvalStepRouter);
router.use(meetingRequestRouter);
router.use(demandPaymentInfoRouter);
router.use(couponRouter);
router.use(assetlistRouter);
router.use(accessoryRouter);
router.use(estimateRouter);
router.use(assetRequestRouter);
router.use(shiftInfoRequestRouter);
router.use(estimateGeneratedRouter);
router.use(redisRouter);
router.use(attendanceStatusRouter);
router.use(flatRouter);
router.use(parkingRouter);
router.use(appDevRouter);
router.use(whatsAppTemplateRouter);
router.use(leaveHistoryRouter);
router.use(shiftPlannerRequest);
router.use(mentionMessageRouter);
router.use(warnLetterRouter);
router.use(scaleRouter);
router.use(incentiveRouter);
router.use(eligibilityRouter);
router.use(examRouter);
router.use(examAnswerRouter);
router.use(estCompRouter);
router.use(questionRouter);
router.use(passbackEstimateRouter);
router.use(CpOnBoardingRouter);
router.use(brokrageRouter);
router.use(bookingTargetRouter);
router.use(empDocReqRouter);
router.use(periodRouter);
router.use(rankingTurnRouter);
router.use(geminiRouter);
router.use(teamInsightRouter);
router.use(extAttReqRouter);
router.use(zonesRouter);
router.use(commercialProjectRouter);
router.use(shortsRouter);
router.use(eoiConfRouter);

router.use(instaRouter);
router.use(eoiExhibitionRouter);
router.use(exihibitionVideoRouter);
router.use(exhibitionVideoCountRouter);
router.use(onbExhibRouter);
router.use(designTaskRouter);
router.use(trackerRouter);

export default router;
