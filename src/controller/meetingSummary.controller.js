import clientModel from "../model/client.model.js";
import leadModel from "../model/lead/lead.model.js";
import leadModelV2 from "../model/lead/leadV2Model.js";
import meetingModel from "../model/meetingSummary.model.js";
import { errorRes, successRes } from "../model/response.js";
import { meetingPopulateOptions } from "../utils/constant.js";

//GET BY ALL
export const getMeetingSummary = async (req, res) => {
  try {
    const respMe = await meetingModel.find().populate(meetingPopulateOptions);

    return res.send(
      successRes(200, "Get Meeting Summary", {
        data: respMe,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getClientMeetingById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.send(errorRes(401, "ID is required"));
    let query = req.query.query || "";

    let searchFilter = {
      $or: [{ purpose: new RegExp(query, "i") }].filter(Boolean),
      customer: id,
    };

    const respMe = await meetingModel
      .find(searchFilter)
      .populate(meetingPopulateOptions);

    return res.send(
      successRes(200, "get meeting scheduled by client id", {
        data: respMe,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const scheduleMeetingByClient = async (req, res) => {
  const body = req.body;
  const { date, purpose } = body;
  const clientId = req.params.id;
  try {
    if (!date || !purpose) {
      return res.send(errorRes(403, "All fields are required"));
    }

    const customerResp = await clientModel.findById(clientId);

    if (!customerResp) {
      return res.send(errorRes("Customer not registered with us yet"));
    }

    const newMeeting = await meetingModel.create({
      ...body,
      customer: customerResp._id,
    });

    const respPayment = await meetingModel
      .findById(newMeeting._id)
      .populate(meetingPopulateOptions);

    return res.send(
      successRes(200, `Request sent!`, {
        data: respPayment,
      })
    );
  } catch (error) {
    // console.error(error);
    return res.send(
      errorRes(500, "An error occurred while adding the meeting summary")
    );
  }
};

export const addMeetingSummary = async (req, res) => {
  const body = req.body;
  const {
    date,
    place,
    purpose,
    customer,
    project,
    meetingWith,
    summary,
    meetingEnd,
    lead,
    postSaleBooking,
  } = body;

  try {
    // console.log("pass1");
    // Check for required fields
    if (!date || !project || !purpose) {
      return res.send(errorRes(403, "All fields are required"));
    }
    const leadResp = await leadModelV2.findById(lead);
    // console.log("passed note 1 ");

    if (!leadResp) {
      return res.send(errorRes("Meeting scheduled"));
    }
    // console.log("passed note 2 ");
    // console.log(leadResp);
    const customerResp = await clientModel.findOne({
      phoneNumber: leadResp.phoneNumber,
    });

    if (!customerResp) {
      return res.send(errorRes("Customer not registered with us yet"));
    }
    // console.log("passed note 3 ");

    const newMeeting = await meetingModel.create({
      ...body,
      customer: customerResp._id,
    });
    const respPayment = await meetingModel
      .findById(newMeeting._id)
      .populate(meetingPopulateOptions);

    return res.send(
      successRes(200, `Request sent!`, {
        data: respPayment,
      })
    );
  } catch (error) {
    console.error(error);
    return res.send(
      errorRes(500, "An error occurred while adding the meeting summary")
    );
  }
};
