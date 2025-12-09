import accessoryModel from "../model/accessory.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getAccessory = async (req, res) => {
    try {
      const respDes = await accessoryModel.find();
  
      return res.send(
        successRes(200, "Get Accessory", {
          data: respDes,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, error));
    }
  };

export const getAccessoryById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respDes = await accessoryModel.findById(id);

    if (!respDes)
      return res.send(
        successRes(404, `accessory not found`, {
          data: respDes,
        })
      );

    return res.send(
      successRes(200, `Get accessory`, {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addAccessory = async (req, res) => {
    const body = req.body;
    const { accessory } = body;

    try {

      if (!accessory) return res.send(errorRes(403, "accessory is required"));
      const newAccessoryId = "accessory-" + accessory?.replace(/\s+/g, "-").toLowerCase();
      const newAccessory = await accessoryModel.create({
        _id: newAccessoryId,
        accessory: accessory,
        
      });
  
      await newAccessory.save();
      return res.send(
        successRes(200, `accessory added successfully: ${accessory}`, {
          data: newAccessory,
        })
      );
    } catch (error) {
      console.log(error);
      return res.send(errorRes(500, error));
    }
  };

  export const updateAccessory = async (req, res) => {
    const body = req.body;
    const id = req.params.id;
    const { accessory } = body;
    try {
      if (!id) return res.send(errorRes(403, "id is required"));
      // if (!body) return res.send(errorRes(403, "data is required"));
      if (!accessory) return res.send(errorRes(403, "accessory is required"));
  
      const updatedAccessory = await accessoryModel.findByIdAndUpdate(
        id,
        { accessory },
        { new: true }
      );
      if (!updateAccessory)
        return res.send(errorRes(402, `accessory cannot be updated: ${accessory}`));
  
      return res.send(
        successRes(200, `accessory updated successfully: ${accessory}`, {
          data: updatedAccessory,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, error));
    }
  };

  export const deleteAccessory = async (req, res) => {
    const body = req.body;
    const { id } = req.params;
    const { accessory } = body;
    try {
      if (!id) return res.send(errorRes(403, "id is required"));
      // if (!body) return res.send(errorRes(403, "data is required"));
      const deletedAccessory = await accessoryModel.findByIdAndDelete(id);
  
      if (!deleteAccessory)
        return res.send(errorRes(402, `accessory cannot be deleted: ${accessory}`));
  
      return res.send(
        successRes(200, `accessory deleted successfully`, {
          data: deletedAccessory,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, error));
    }
  };