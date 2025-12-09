import designationModel from "../model/designation.model.js";
import { errorRes, successRes } from "../model/response.js";

//GET BY ALL
export const getDesignation = async (req, res) => {
  try {
    const respDes = await designationModel.find();

    return res.send(
      successRes(200, "Get designation", {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//GET BY ID
export const getDesignationById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respDes = await designationModel.findById(id);

    if (!respDes)
      return res.send(
        successRes(404, `Designation not found`, {
          data: respDes,
        })
      );

    return res.send(
      successRes(200, `get designation`, {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//ADD DESIGNATION
export const addDesignation = async (req, res) => {
  const body = req.body;
  const { designation } = body;
  try {
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!designation) return res.send(errorRes(403, "designation is required"));
    const newDesgId = "desg-" + designation?.replace(/\s+/g, "-").toLowerCase();
    const newDesignation = await designationModel.create({
      _id: newDesgId,
      designation: designation,
    });

    await newDesignation.save();
    return res.send(
      successRes(200, `designation added successfully: ${designation}`, {
        data: newDesignation,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//update designation
export const updateDesignation = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const { designation } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!designation) return res.send(errorRes(403, "designation is required"));

    const updatedDesignation = await designationModel.findByIdAndUpdate(
      id,
      { designation },
      { new: true }
    );
    if (!updateDesignation)
      return res.send(errorRes(402, `designation cannot be updated: ${designation}`));

    return res.send(
      successRes(200, `designation upodated successfully: ${designation}`, {
        data: updatedDesignation,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//delete designation
export const deleteDesignation = async (req, res) => {
  const body = req.body;
  const { id } = req.params;
  const { designation } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));
    const deletedDesignation = await designationModel.findByIdAndDelete(id);

    if (!deleteDesignation)
      return res.send(errorRes(402, `designation cannot be deleted: ${designation}`));

    return res.send(
      successRes(200, `designation deleted successfully`, {
        data: deletedDesignation,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
