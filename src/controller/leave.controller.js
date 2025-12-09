import leaveTypeModel from "../model/attendance/leave/leave.model.js";
import { errorRes, successRes } from "../model/response.js";

//GET BY ALL
export const getLeave = async (req, res) => {
  try {
    const respDes = await leaveTypeModel.find();

    return res.send(
      successRes(200, "Get leave", {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//GET BY ID
export const getLeaveById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respDes = await leaveTypeModel.findById(id);

    if (!respDes)
      return res.send(
        successRes(404, `leave not found`, {
          data: respDes,
        })
      );

    return res.send(
      successRes(200, `Get leave`, {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//ADD DESIGNATION
export const addLeave = async (req, res) => {
  const body = req.body;
  const { leave } = body;
  try {
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!leave) return res.send(errorRes(403, "leave is required"));
    const newLevId = "lev-" + leave?.replace(/\s+/g, "-").toLowerCase();
    const newLeave = await leaveTypeModel.create({
      _id: newLevId,
      leave: leave,
    });

    await newLeave.save();
    return res.send(
      successRes(200, `leave added successfully: ${leave}`, {
        data: newLeave,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//update designation
export const updateLeave = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const { leave } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!leave) return res.send(errorRes(403, "leave is required"));

    const updatedLeave = await leaveTypeModel.findByIdAndUpdate(
      id,
      { leave },
      { new: true }
    );
    if (!updateLeave)
      return res.send(errorRes(402, `leave cannot be updated: ${leave}`));

    return res.send(
      successRes(200, `leave updated successfully: ${leave}`, {
        data: updatedLeave,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//delete designation
export const deleteLeave = async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  const { leave } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));
    const deletedLeave = await leaveTypeModel.findByIdAndDelete(id);

    if (!deleteLeave)
      return res.send(errorRes(402, `leave cannot be deleted: ${leave}`));

    return res.send(
      successRes(200, `leave deleted successfully`, {
        data: deletedLeave,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
