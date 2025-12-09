import assetlistModel from "../model/assetlist.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getAssetlist = async (req, res) => {
  try {
    let accessoryfilter = req.query.accessory?.toLowerCase();
    const respDes = await assetlistModel
      .find({
        ...(accessoryfilter ? { accessory: accessoryfilter } : {}),
      })
      .populate("accessory");

    return res.send(
      successRes(200, "Get Asset", {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const addAssetlist = async (req, res) => {
  const body = req.body;

  const {
    accessory,
    code,
    brand,
    status,
    condition,
    specification,
    description,
  } = body;

  try {
    if (!body) return res.send(errorRes(403, "asset is required"));

    // console.log(body);
    const newAsset = await assetlistModel.create({
      ...body,
    });
    await newAsset.save();

    return res.send(
      successRes(200, `asset added successfully: ${body}`, {
        data: newAsset,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const updateAssetlist = async (req, res) => {
  const body = req.body;
  const id = req.params.id;
  const {
    accessory,
    code,
    brand,
    status,
    condition,
    specification,
    description,
  } = body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!code) return res.send(errorRes(403, "accessory is required"));

    const updatedAssetlist = await assetlistModel.findByIdAndUpdate(
      id,
      { accessory, code, brand, status, condition, specification, description },
      { new: true }
    );
    if (!updateAssetlist)
      return res.send(
        errorRes(402, `assetlist cannot be updated: ${accessory}`)
      );

    return res.send(
      successRes(200, `assetlist updated successfully: ${accessory}`, {
        data: updatedAssetlist,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

export const deleteAssetlist = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "Asset ID is required"));
    const deleteAssetlist = await assetlistModel.findByIdAndDelete(id);
    if (!deleteAssetlist)
      return res.send(errorRes(404, `Asset not found with ID: ${id}`));
    return res.send(
      successRes(200, `Asset record deleted successfully`, {
        deleteAssetlist,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};
