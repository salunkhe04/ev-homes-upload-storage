import ChatResponseModel from "../model/chatResponse.model.js";
import { errorRes, successRes } from "../model/response.js";
import ourProjectModel from "../model/ourProjects.model.js";
import leadModel from "../model/lead/lead.model.js";
import employeeModel from "../model/employee.model.js";
import { leadPopulateOptions } from "../utils/constant.js";
import leadModelV2 from "../model/lead/leadV2Model.js";

export const getDefaultOptionChatOptions = async (req, res) => {
  try {
    const resp = await ChatResponseModel.findOne({ id: "default" });

    return res.send(successRes(200, "chat option", { data: resp }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const addChatOptions = async (req, res) => {
  const { id, message, response, options, email, phoneNumber, type } = req.body;
  try {
    if (!id) return res.send(errorRes(401, "id is required"));
    if (!message) return res.send(errorRes(401, "message is required"));
    if (!type) return res.send(errorRes(401, "type is required"));

    const resp = await ChatResponseModel.create({
      ...req.body,
    });

    return res.send(successRes(200, "chat option", { data: resp }));
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};

export const getDetails = async (req, res) => {
  const { message } = req.body;
  const user = req.user;
  try {
    if (!message) {
      return res.send(errorRes(400, "Message is required"));
    }

    if (message.includes("Ask about projects")) {
      // Fetch projects from the database
      let opt = {};
      const projects = await ourProjectModel.find({}, { name: 1, _id: 1 }); // Include _id to get the project ID

      // Map the projects to include both name and id in the desired format
      const projectOptions = projects.map((project) => ({
        message: project.name,
        response: {
          id: project._id, // Use _id as the project ID and convert to string
          message: "Checkout", // Project name
          type: "project", // Set the type to "project"
        },
      }));
      opt.isBot = true;
      opt.message =
        "We have several exciting projects. Which one would you like to know more about?";
      opt.options = projectOptions;

      // Return the response with options inside data
      return res.send(successRes(200, "List of projects", { data: opt }));
    } else if (message.includes("Talk to a human")) {
      let humanResponse = {
        isBot: true,
        message: "Here is our Representative",
        options: [
          {
            type: "human-call",
            phoneNumber: "+91 8097192777", // Pawan
            message: "Call",
          },
          {
            type: "human-whatsapp",
            phoneNumber: "+91 9819066777", // Narayan
            message: "Whatsapp",
          },
        ],
      };

      const findLead = await leadModelV2
        .findOne({
          $or: [
            { phoneNumber: user.phoneNumber },
            { altPhoneNumber: user.phoneNumber },
          ],
        })
        .populate(leadPopulateOptions);
      //not found this number in lead
      if (!findLead) {
        const teamLeadersIds = [
          "ev15-deepak-karki",
          "ev69-vicky-mane",
          "ev70-jaspreet-arora",
          "ev54-ranjna-gupta",
        ];

        const teamLeadersResp = await employeeModel.find({
          _id: { $in: teamLeadersIds },
        });
        const randomNum = Math.floor(Math.random() * 4);
        const teamLeader = teamLeadersResp[randomNum];
        humanResponse = {
          isBot: true,
          message: `Here is our Representative ${teamLeader?.firstName} ${teamLeader?.lastName}`,
          options: [
            {
              type: "human-call",
              phoneNumber: `+91 ${teamLeader?.phoneNumber}`,
              message: "Call",
            },
            {
              type: "human-whatsapp",
              phoneNumber: `+91 ${teamLeader?.phoneNumber}`,
              message: "Whatsapp",
            },
          ],
        };
      } else {
        humanResponse = {
          isBot: true,
          message: `Here is our Representative ${findLead?.teamLeader?.firstName} ${findLead?.teamLeader?.lastName}`,
          options: [
            {
              type: "human-call",
              phoneNumber: `+91 ${findLead?.teamLeader?.phoneNumber}`,
              message: "Call",
            },
            {
              type: "human-whatsapp",
              phoneNumber: `+91 ${findLead?.teamLeader?.phoneNumber}`,
              message: "Whatsapp",
            },
          ],
        };
      }
      // Handle "Talk to a human" case

      return res.send(
        successRes(200, "Human representative options", { data: humanResponse })
      );
    } else {
      return res.send(
        successRes(200, "Default response", {
          data: "Your query did not match any specific action.",
        })
      );
    }
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
};
