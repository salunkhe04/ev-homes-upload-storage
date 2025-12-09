import { Router } from "express";
import oneSignalModel from "../../model/oneSignal.model.js";
import {
  sendNotificationWithImage,
  sendNotificationWithInfo,
  sendSilentNotification,
} from "../../controller/oneSignal.controller.js";
import leadModel from "../../model/lead/lead.model.js";
import { errorRes, successRes } from "../../model/response.js";
import clientModel from "../../model/client.model.js";
import employeeModel from "../../model/employee.model.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import cpModel from "../../model/channelPartner.model.js";

const notifyRouter = Router();

notifyRouter.post("/send-notification", async (req, res, next) => {
  const { title, message, image, templateName, leadRef } = req.body;
  try {
    // console.log(req.body);
    // console.log("passed note 1 ");
    const leadResp = await leadModelV2.findById(leadRef);
    // console.log("passed note 2 ");

    if (!leadResp) {
      return res.send(errorRes("Customer info not found for notification"));
    }
    // console.log("passed note 3 ");

    const customerResp = await clientModel.findOne({
      phoneNumber: leadResp.phoneNumber,
    });

    if (!customerResp) {
      return res.send(errorRes("Customer not registered with us yet"));
    }
    // console.log("passed note 4 ");

    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [customerResp._id] },
    });
    // console.log("passed note 5 ");

    if (foundTLPlayerId.length > 0) {
      // console.log(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      await sendNotificationWithImage({
        playerIds: getPlayerIds,
        title: title,
        imageUrl: image,
        message: message,
      });
    }
    return res.send(successRes(200, "Notification sent"));
  } catch (error) {
    return next(error);
  }
});

notifyRouter.post("/send-notification-to-cp", async (req, res, next) => {
  const { title, message, image, templateName, leadRef } = req.body;
  try {
    // console.log(req.body);
    // console.log("passed note 1 ");
    const leadResp = await leadModelV2.findById(leadRef);
    // console.log("passed note 2 ");

    if (!leadResp) {
      return res.send(errorRes("info not found for notification"));
    }
    // console.log("passed note 3 ");

    // console.log("passed note 4 ");

    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [leadResp.channelPartner] },
    });
    // console.log("passed note 5 ");

    if (foundTLPlayerId.length > 0) {
      // console.log(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      await sendNotificationWithImage({
        playerIds: getPlayerIds,
        title: title,
        imageUrl: image,
        message: message,
      });
    }
    return res.send(successRes(200, "Notification sent"));
  } catch (error) {
    return next(error);
  }
});

notifyRouter.post("/send-notication-from-cp/:id", async (req, res, next) => {
  const id = req.params.id;
  const { message } = req.body;

  // const respTeamLeader = await employeeModel.findById(id);
  // const teamLeaderId = respTeamLeader.reportingTo;
  //  // Use 'message' instead of 'description'

  try {
    // console.log(req.body);

    // console.log("passed note 1 ");

    const leadResp = await leadModelV2.findById(id);

    const teams = await employeeModel.find({ reportingTo: id }).select("_id");
    const ids = teams.map((ele) => ele._id);

    // console.log("passed note 2 ");

    if (!leadResp) {
      return res.send(errorRes("info not found for notification"));
    }
    // console.log("passed note 3 ");

    // console.log(ids);
    const foundPlayerIds = await oneSignalModel.find({
      docId: { $in: [leadResp.dataAnalyzer, leadResp.teamLeader, ids] },
    });

    // console.log("passed note 5 ");

    if (foundPlayerIds.length > 0) {
      // console.log(foundPlayerIds);
      const getPlayerIds = foundPlayerIds.map((dt) => dt.playerId);

      await sendNotificationWithImage({
        playerIds: getPlayerIds,
        title: "Notification from Channel Partner",
        imageUrl: "kmjmk6",
        message: "mssa", // Use 'message' here
        // data: {
        //   type: "notify-cp",
        //   route: "/cp-tagging/683ab276811fb1969755a72a",
        //   id: "",
        // },
      });
    }
    return res.send(successRes(200, "Notification sent"));
  } catch (error) {
    return next(error);
  }
});

notifyRouter.post("/send-notification-doc-id/:id", async (req, res, next) => {
  const {
    title,
    message = "afsifi",
    image,
    templateName,
    leadRef,
    data: bData,
  } = req.body;
  const id = req.params.id;

  try {
    // console.log(id);
    // console.log(req.body);
    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [id] },
    });
    // console.log("passed note 5 ");

    if (foundTLPlayerId.length > 0) {
      // console.log(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      // await sendSilentNotification({
      //   playerIds: getPlayerIds,
      //   data: {
      //     type: "silent",
      //     foo: "bar",
      //   },
      // });

      await sendNotificationWithImage({
        playerIds: getPlayerIds,
        title: title,
        imageUrl:
          image ?? "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",
        message: message,
        android_channel_id: "leads_assign",
        data: {
          type: "idk",
        },
      });
    }
    return res.send(successRes(200, "Notification sent"));
  } catch (error) {
    return next(error);
  }
});

notifyRouter.post(
  "/send-notification-doc-id-test/:id",
  async (req, res, next) => {
    const {
      title,
      message,
      image,
      templateName,
      leadRef,
      data: bData,
    } = req.body;
    const id = req.params.id;

    try {
      // console.log(id);
      // console.log(req.body);
      const foundTLPlayerId = await oneSignalModel.find({
        docId: { $in: [id] },
      });
      // console.log("passed note 5 ");

      if (foundTLPlayerId.length > 0) {
        // console.log(foundTLPlayerId);
        const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

        await sendNotificationWithImage({
          playerIds: getPlayerIds,
          title: title,
          imageUrl:
            image ??
            "https://cdn.evhomes.tech/279d986d-d71d-4317-84f2-ce1d3fb8205a-11630063.jpg",
          message: message,
          data: {},
        });
      }
      return res.send(successRes(200, "Notification sent"));
    } catch (error) {
      return next(error);
    }
  }
);




notifyRouter.post("/send-payment-notification-doc-id/:id", async (req, res, next) => {
  const {
    title,
    message = "payment",
    image,
    templateName,
    leadRef,
    data: bData,
  } = req.body;
  const id = req.params.id;

  try {
    // console.log(id);
    // console.log(req.body);
    const foundTLPlayerId = await oneSignalModel.find({
      docId: { $in: [id] },
    });
    // console.log("passed note 5 ");

    if (foundTLPlayerId.length > 0) {
      // console.log(foundTLPlayerId);
      const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

      // await sendSilentNotification({
      //   playerIds: getPlayerIds,
      //   data: {
      //     type: "silent",
      //     foo: "bar",
      //   },
      // });

      await sendNotificationWithImage({
        playerIds: getPlayerIds,
        title: title,
        imageUrl:
          image ?? "https://cdn-icons-png.flaticon.com/512/12210/12210154.png",
        message: message,
        android_channel_id: "payment_notification",
        data: {
          type: "idk",
        },
      });
    }
    return res.send(successRes(200, "Notification sent"));
  } catch (error) {
    return next(error);
  }
});




export default notifyRouter;
