import employeeModel from "../model/employee.model.js";
import messageModel from "../model/mentionMessage.model.js";
import oneSignalModel from "../model/oneSignal.model.js";
import { errorRes2, successRes, successRes2 } from "../model/response.js";
import { messagePopulationOptions } from "../utils/constant.js";
import logger from "../utils/logger.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
//func
export const createMessage = async (leadId, message, taggedEmployees) => {
  try {
    const newMessage = new messageModel({
      leadId,
      message,
      taggedEmployees,
    });

    await newMessage.save();

    return { success: true, message: "Message created." };
  } catch (error) {
    console.error("Error creating message:", error);
    throw new Error("Failed to create message.");
  }
};

//func
export const getMessagesForLead = async (leadId) => {
  try {
    const messages = await messageModel
      .find({ leadId })
      .populate(messagePopulationOptions)
      .sort({ timestamp: 1 });

    return messages;
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw new Error("Failed to retrieve messages.");
  }
};

export const markMessageAsSeenFunc = async (messageId, employeeId) => {
  try {
    const foundMessage = await messageModel.findById(messageId);

    if (!foundMessage) throw new Error("Message not found");

    foundMessage.seenBy.push({
      employee: employeeId,
      timestamp: new Date(),
    });

    await foundMessage.save();
    return { success: true, message: "Message marked as seen." };
  } catch (error) {
    console.error("Error marking message as seen:", error);
    throw new Error("Failed to mark message as seen.");
  }
};

//route
export const getMentionedMessages = async (req, res) => {
  const { leadId } = req.query;
  try {
    //
    const filter = {
      ...(leadId ? { leadId: leadId } : {}),
    };
    const resp = await messageModel
      .find(filter)
      .populate(messagePopulationOptions)
      .sort({ timestamp: 1 });

    return successRes2(res, 200, "get mentioned messages", {
      data: resp,
    });
  } catch (error) {
    //
    return errorRes2(500, "server error");
  }
};

//route
export const createNewMessage = async (req, res) => {
  const { leadId, message, sentBy } = req.body;
  try {
    // Step 1: Extract @mentions using regex
    const tags = message.match(/@[\w-]+/g);
    // Step 2: Remove @ and lowercase to match usernames (if you're tagging by username)
    const usernames = tags ? tags.map((t) => t.slice(1)) : [];
    // logger.info(usernames);

    // Step 3: Fetch employees by username
    const employees = await employeeModel.find({
      _id: { $in: usernames },
    });

    // Step 4: Prepare mentioned array
    const mentioned = employees.map((emp) => ({
      employee: emp._id,
      taggedBy: sentBy,
      timestamp: new Date(),
      read: false,
    }));

    // create new message
    const newMessage = new messageModel({
      leadId,
      message,
      mentioned,
      sentBy: sentBy,
    });

    await newMessage.save();

    //get populated -updated document
    const updatedMessage = await messageModel
      .findById(newMessage._id)
      .populate(messagePopulationOptions);

    try {
      const dta = await oneSignalModel.find({
        docId: { $in: usernames },
      });

      let ids = dta.map((ele) => ele.playerId);

      await sendNotificationWithImage({
        playerIds: ids,
        title: "You've been mentioned in this lead",
        message: `Please check it out`,
        imageUrl:
          "https://cdn.evhomes.tech/087e405a-c913-4a97-ba12-d10f4bb677cf-notify.png",
        data: {
          route: `/lead-details/${leadId}`,
          type: "mentioned",
          id: "",
          role: "employee",
        },
      });

      //
    } catch (error) {
      //
    }

    return successRes2(res, 200, "new message added", { data: updatedMessage });
  } catch (error) {
    // logger.info(error);
    //
    return errorRes2(res, 500, "server error");
  }
};

// route - mark as seen perticular message for that leadId
export const markMessageAsSeen = async (req, res) => {
  const { messageId } = req.query;
  const { employee } = req.body;

  try {
    const foundMessage = await messageModel.findById(messageId);

    if (!foundMessage) throw new Error("Message not found");

    // Prevent duplicate seenBy entry
    const alreadySeen = foundMessage.seenBy.some((seen) =>
      seen.employee.equals(employee)
    );

    if (!alreadySeen) {
      foundMessage.seenBy.push({
        employee,
        timestamp: new Date(),
      });
    }

    // Mark read if tagged
    foundMessage.mentioned.forEach((ele) => {
      if (ele.employee.equals(employee)) {
        ele.read = true;
      }
    });

    await foundMessage.save();
    const updatedDoc = await messageModel
      .findById(messageId)
      .populate(messagePopulationOptions);

    return res.send(successRes(200, "ok", { data: updatedDoc }));
  } catch (error) {
    return errorRes2(res, 500, "server error");
  }
};

//route - mark as seen all message for that leadId
export const markAllMessagesAsSeen = async (req, res) => {
  const { leadId } = req.query;
  const { employee } = req.body;

  try {
    // Update all messages where:
    // - leadId matches
    // - employee is tagged
    // - hasn't marked as read yet

    const messages = await messageModel.find({
      leadId,
    });

    const bulkOps = [];

    messages.forEach((msg) => {
      let updated = false;

      // Add to seenBy if not already seen
      const alreadySeen = msg.seenBy.some((seen) => seen.employee === employee);

      if (!alreadySeen) {
        msg.seenBy.push({ employee, timestamp: new Date() });
        updated = true;
      }

      // Mark mentioned.read = true
      msg.mentioned.forEach((tagged) => {
        if (tagged.employee === employee && !tagged.read) {
          tagged.read = true;
          updated = true;
        }
      });

      // logger.info(msg.mentioned);
      if (updated) {
        bulkOps.push({
          updateOne: {
            filter: { _id: msg._id },
            update: {
              seenBy: msg.seenBy,
              mentioned: msg.mentioned,
            },
          },
        });
      }
    });

    if (bulkOps.length > 0) {
      await messageModel.bulkWrite(bulkOps);
    }

    const updatedList = await messageModel
      .findOne({ leadId: leadId })
      .populate(messagePopulationOptions);

    return successRes2(res, 200, "Messages marked as seen", {
      data: updatedList,
    });
  } catch (error) {
    console.error(error);
    return errorRes2(res, 500, "Server error");
  }
};
