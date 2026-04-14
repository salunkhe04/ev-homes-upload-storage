import axios from "axios";
import config from "../config/config.js"; // Adjust the path to your config file
import { GeoReplyWith } from "redis";
import leadModelV2 from "../model/lead/leadV2Model.js";
import cpModel from "../model/channelPartner.model.js";
import { errorRes, successRes } from "../model/response.js";
import moment from "moment-timezone";
import logger from "./logger.js";

// Function to send an email via Brevo API
const senderName = "EV Homes";
const senderEmail = "evhomes.operations@evgroup.co.in";
export const sendEmail = async (
  recipientEmail,
  subject,
  htmlContent,
  attachment = [],
) => {
  const url = "https://api.brevo.com/v3/smtp/email";

  // Prepare the email data
  const emailData = {
    sender: { name: senderName, email: senderEmail }, // Replace with a valid sender email
    to: [{ email: recipientEmail }],
    subject: subject,
    htmlContent: htmlContent,
    attachment: attachment,
  };

  // Set up headers including your API key
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": config.BREVO_API_KEY, // Ensure your API key is set in your config
  };

  try {
    // Make the POST request to send the email
    const response = await axios.post(url, emailData, { headers });
    // logger.info("Email sent successfully:", response.data);
  } catch (error) {
    logger.info(
      "Error sending email:",
      error.response ? error.response.data : error.message,
    );
  }
};

export const sendMultipleEmail = async (
  recipientEmails,
  subject,
  htmlContent,
  attachment = [],
  ccEmails = [], // ✅ Add optional CC parameter
) => {
  const url = "https://api.brevo.com/v3/smtp/email";
  let recipients = recipientEmails.map((ele) => {
    return {
      email: ele,
    };
  });
  // logger.info(recipients);

  // Build "attachment" recipients if provided
  let attachmentList = attachment?.length > 0 ? attachment : [];

  let ccList =
    ccEmails?.length > 0 ? ccEmails?.map((email) => ({ email })) : [];

  // Prepare the email data
  const emailData = {
    sender: { name: senderName, email: senderEmail },
    to: recipients,
    ...(ccList.length > 0 && { cc: ccList }),

    subject: subject,
    htmlContent: htmlContent,
    ...(attachmentList.length > 0 && { attachment: attachmentList }),
  };

  // Set up headers including your API key
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "api-key": config.BREVO_API_KEY,
  };

  try {
    // Make the POST request to send the email
    const response = await axios.post(url, emailData, { headers });
    // logger.info("Email sent successfully:", response.data);
  } catch (error) {
    logger.info(
      "Error sending email:",
      error.response ? error.response.data : error.message,
    );
  }
};

export const getContactList = async () => {};

export const addContact = async ({
  listIds = [],
  email,
  firstName,
  lastName,
  phoneNumber,
  apiKey,
  type
}) => {
  try {
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey ?? config.BREVO_API_KEY, // Ensure your API key is set in your config
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/contacts",
      {
        email: email,
        attributes: {
          ...(firstName ? { FIRSTNAME: firstName } : {}),
          ...(lastName ? { LASTNAME: lastName } : {}),
          ...(phoneNumber ? { WHATSAPP: phoneNumber } : {}),
          ...(phoneNumber ? { SMS: phoneNumber } : {}),
          ...(type ? { REQUIREMENT: type } : {}),
        },
        listIds: listIds,
        updateEnabled: true,
      },
      {
        headers: headers,
      },
    );
    // logger.info("Contact added:", response.data);
    return response.data;
  } catch (error) {
    logger.info("Error adding contact:", error.response?.data || error.message);
    return error;
  }
};

export const addChannelPartnerList = async (req, res) => {
  const { name, folderId } = req.body;

  try {
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.BREVO_API_KEY, // Ensure your API key is set in your config
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/contacts/lists",
      {
        name, // String (required)
        folderId, // Number (required)
      },
      {
        headers: headers,
      },
    );

    // logger.info("List created:", response.data);
    return res.status(201).json(response.data);
  } catch (error) {
    logger.info("Error creating list:", error.response?.data || error.message);
    return res
      .status(500)
      .json({ error: error.response?.data || error.message });
  }
};

export const updateListById = async (req, res) => {
  const listId = req.params.id;

  try {
    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.BREVO_API_KEY,
    };
    const todayDate = moment().startOf("day").toDate();

    // const cpList = await cpModel.findOne({
    //   brevoId: listId,
    // });

    const leads = await leadModelV2.findOne({
      channelPartner: "my-firm-name-last",
      validTill: { $gt: todayDate },
    });

    // if (!cpList.length) {
    //   return res.send(successRes(200, "No contacts to sync", []));
    // }

    const response = await axios.post(
      `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/add`,
      {
        ids: [3408],
      },

      {
        headers: headers,
      },
    );

    return res.send(
      successRes(
        200,
        "Contacts synced to Brevo List successfully",
        response.data,
      ),
    );
  } catch (e) {
    logger.info(e);
    return res.send(errorRes(500, `Something went wrong ${e}`));
  }
};

export const addToList = async (req, res) => {
  const id = req.params.id;

  try {
    const resp = await cpModel.findById(id);
    const todayDate = moment().toDate();
    const updates = [];

    if (resp.brevoId == null) {
      return res.send(errorRes(500, `Something went wrong `));
    }

    const leads = await leadModelV2
      .find({
        channelPartner: id,
        validTill: { $gt: todayDate },
      })
      .limit(10);

    await Promise.all(
      leads.map(async (ele) => {
        const con = await addContact({
          listIds: [resp.brevoId],
          ...(ele.email != null && ele.email != "" ? { email: ele.email } : {}),
          firstName: ele.firstName ?? "",
          lastName: ele.lastName ?? "",
          phoneNumber: `91 ${ele.phoneNumber}`,
        });
      }),
    );

    return res.send(successRes(200, `data added`, { data: updates }));
  } catch (e) {
    return res.send(errorRes(500, `Something went wrong ${e}`));
  }
};

// helper sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const addToCPListAutomated = async (req, res) => {
  try {
    const resp = await cpModel.find({
      onBoarding: "approved",
      status: "active",
    });
    const todayDate = moment().toDate();

    for (const ele of resp) {
      // skip if no brevo ID
      if (ele.brevoId == null) continue;

      const leads = await leadModelV2.find({
        channelPartner: ele._id,
        validTill: { $gt: todayDate },
      });

      for (const ele2 of leads) {
        await addContact({
          listIds: [ele.brevoId],
          ...(ele2.email != null && ele2.email != ""
            ? { email: ele2.email }
            : {}),
          firstName: ele2.firstName ?? "",
          lastName: ele2.lastName ?? "",
          phoneNumber: `91 ${ele2.phoneNumber}`,
        });

        // delay 2–3 seconds between each
        await sleep(2000 + Math.random() * 1000);
      }
    }

    return res.send(successRes(200, `data added`, {}));
  } catch (e) {
    return res.send(errorRes(500, `Something went wrong ${e}`));
  }
};
