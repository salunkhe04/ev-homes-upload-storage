import holidayModel from "../model/attendance/holiday/holidays.model.js";
import { errorRes, successRes } from "../model/response.js";

//GET BY ALL
export const getHoliday = async (req, res) => {
  try {
    const respDes = await holidayModel.find();

    return res.send(
      successRes(200, "Get Holiday", {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//ADD DESIGNATION
export const addHoliday = async (req, res) => {
  const body = req.body;

  const { holiday, status, startdate, enddate, days } = body;

  try {
    if (!body) return res.send(errorRes(403, "holiday is required"));

    // console.log(body);
    const newHoliday = await holidayModel.create({
      ...body,
    });
    await newHoliday.save();

    return res.send(
      successRes(200, `holiday added successfully: ${body}`, {
        data: newHoliday,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//update designation
export const updateHoliday = async (req, res) => {
  const body = req.body;
  const id = req.params.id;

  const { holiday, status, startDate, endDate, days } = body; // Destructuring the body fields

  try {
    // Validate the necessary fields
    if (!id) return res.send(errorRes(403, "ID is required"));
    if (!body) return res.send(errorRes(403, "Data is required"));

    const updatedholiday = await holidayModel.findByIdAndUpdate(
      id, // Find by project ID
      { ...body },
      { new: true } // Return the updated document
    );

    if (!updatedholiday)
      return res.send(errorRes(404, `Holiday not found with ID: ${id}`));

    // Send a success response
    return res.send(
      successRes(200, `Holiday updated successfully: ${holiday}`, {
        data: updatedholiday,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

//delete designation
export const deleteHoliday = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Holiday ID is required"));
    const deleteHoliday = await holidayModel.findByIdAndDelete(id);
    if (!deleteHoliday)
      return res.send(errorRes(404, `Holiday not found with ID: ${id}`));
    return res.send(
      successRes(
        200,
        `Holiday deleted successfully: ${deleteHoliday.holiday}`,
        {
          deleteHoliday,
        }
      )
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
