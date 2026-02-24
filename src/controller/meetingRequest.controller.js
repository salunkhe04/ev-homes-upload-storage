import clientModel from "../model/client.model.js";
import employeeModel from "../model/employee.model.js";
import leadModel from "../model/lead/lead.model.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import meetingRequestModel from "../model/meeting_request.model.js";
import { errorRes, successRes } from "../model/response.js";
import { meetingRequestTemplate } from "../templates/html_template.js";
import { sendEmail, sendMultipleEmail } from "../utils/brevo.js";
import {
  leadPopulateOptions,
  meetingPopulateOptions,
  meetingRequestPopulateOptions,
} from "../utils/constant.js";
import { encryptPassword } from "../utils/helper.js";
import logger from "../utils/logger.js";

export const getMeetingRequest = async (req, res) => {
  try {
    const respMe = await meetingRequestModel
      .find()
      .populate(meetingRequestPopulateOptions);
    // .populate(leadPopulateOptions);

    return res.send(
      successRes(200, "Get Meeting Summary", {
        data: respMe,
      }),
    );
  } catch (error) {
    logger.info(error);

    return res.send(errorRes(500, error));
  }
};

export const getMeetinRequestById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.send(errorRes(401, "Team Leader ID is required"));
    const respMe = await meetingRequestModel
      .find({ teamLeader: id })
      .populate(meetingRequestPopulateOptions)
      .sort({ date: 1 });

    // logger.info(respMe);
    return res.send(
      successRes(200, "Get meeting requests by team leader ID", {
        data: respMe,
      }),
    );
  } catch (error) {
    logger.info(error);

    return res.send(errorRes(500, error));
  }
};

export const addMeetingRequest = async (req, res) => {
  const body = req.body;
  const { teamLeader, lead, date, upload, bookingStatus, feedback } = body;

  try {
    const leadResp = await leadModelV2.findById(lead).lean();

    if (!leadResp) {
      return res.send(errorRes("Lead not found"));
    }

    if (!date) return res.send(errorRes(401, "Date is required"));
    // logger.info(phoneNumber);
    const checkId = await clientModel.findOne({
      phoneNumber: leadResp.phoneNumber,
    });
    // .populate(meetingRequestPopulateOptions);

    if (!checkId) {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        location,
        residence,
        closingManager,
        choiceApt,
      } = leadResp;

      try {
        const hashPassword = await encryptPassword(phoneNumber.toString());

        const newClient = await clientModel.create({
          firstName,
          lastName,
          email,
          phoneNumber,
          // projects: location,
          // address: residence,
          closingManager: teamLeader,
          // choiceApt,
          password: hashPassword,
        });
      } catch (error) {
        logger.info(error);
      }
    } else {
      // logger.info("else part");
    }
    // logger.info("pass 4");

    // Create the meeting request
    const newMeeting = await meetingRequestModel.create({
      ...body,
    });
    const employee = await employeeModel.findById(teamLeader).lean();

    const leadData = await leadModelV2.findById(lead);

    await sendMultipleEmail(
      ["ricki@evgroup.co.in"],
      "New Appointment Request Received!!!",
      meetingRequestTemplate(
        `${employee.firstName} ${employee.lastName}`,
        leadData.firstName,
        leadData.lastName,
      ),
      [],
      ["evhomes.operations@evgroup.co.in", "shreya.evgroup@gmail.com"],
    );

    const resultMeeting = await meetingRequestModel
      .findById(newMeeting._id)
      .populate(meetingRequestPopulateOptions);

    // logger.info("last");
    // logger.info(resultMeeting);

    // Return the created meeting request
    return res.send(
      successRes(200, `Meeting request added successfully!`, {
        data: resultMeeting,
      }),
    );
  } catch (error) {
    logger.info(error);

    return res.send(
      errorRes(500, "An error occurred while adding the meeting request"),
    );
  }
};
