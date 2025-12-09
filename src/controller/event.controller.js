import eventModel from "../model/event.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getEvent = async (req, res) => {
  try {
    const currentDate = new Date(); // Get the current date

    const respDept = await eventModel.find({
      validTill: { $gt: currentDate },
    });

    return res.send(
      successRes(200, "Get Event", {
        data: respDept,
      })
    );
  } catch (error) {
    console.error("Error fetching events:", error); // Log the error for debugging
    return res
      .status(500)
      .send(errorRes(500, "Internal Server Error", error.message));
  }
};

export const addEvent = async (req, res) => {
  const body = req.body;
  const { startDate, validTill, event, remark } = body;

  try {
    if (!startDate) return res.send(errorRes(403, "Start Date is required"));
    if (!event) return res.send(errorRes(403, "Event is required"));
    const currentYear = new Date().getFullYear();
    // console.log(currentYear);
    const newEventId =
      "event-" + event?.replace(/\s+/g, "-").toLowerCase() + "-" + currentYear;
    // console.log(newEventId);

    const newEvent = await eventModel.create({
      _id: newEventId,
      startDate: startDate,
      validTill: validTill,
      event: event,
      remark: remark,
    });
    await newEvent.save();

    return res.send(
      successRes(200, `Event added successfully: ${event}`, {
        data: newEvent,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const getEventById = async (req, res) => {
  const event = req.params.id;
  try {
    if (!event) return res.send(errorRes(403, "id is required"));

    const respDiv = await eventModel.findOne({ event: event });

    if (!respDiv) return res.send(errorRes(404, `Event not found`));

    return res.send(
      successRes(200, `Event Found`, {
        data: respDiv,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const updateEvent = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const { startDate, validTill, event } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const updatedEvent = await eventModel.findByIdAndUpdate(id, ...body, {
      new: true,
    });
    if (!updatedEvent)
      return res.send(errorRes(402, `event not updated: ${event}`));
    return res.send(
      successRes(200, `event updated successfully: ${event}`, {
        data: updatedEvent,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const deleteEvent = async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));

    const deleteEvent = await eventModel.findByIdAndDelete(id);

    if (!deleteEvent) return res.send(errorRes(402, `event not deleted: `));

    return res.send(
      successRes(200, `event deleted successfully`, {
        deleteEvent,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
