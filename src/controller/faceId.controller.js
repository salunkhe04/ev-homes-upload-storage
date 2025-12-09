import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import faceIdModel from "../model/faceId.model.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import { faceIdPopulations } from "../utils/constant.js";

export const getFaceIds = async (req, res, next) => {
  const status = req.query.status;
  try {
    const resp = await faceIdModel
      .find({
        ...(status === "active" ? { status: "active" } : {}),
      })
      .populate(faceIdPopulations);
    return res.send(
      successRes(200, "get FaceIds", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addFaceId = async (req, res, next) => {
  const { shift, userId, geofence, faceId, status, panalty } = req.body;

  try {
    if (!userId) return res.send(errorRes(401, "userId is required"));

    // Check if shift already exists
    const oldShift = await faceIdModel.findOne({ userId });

    if (oldShift) return res.send(errorRes(401, "FaceId Already Exist"));

    const newFaceIdId = "faceid-" + userId?.replace(/\s+/g, "-").toLowerCase();

    // Create a new shift with calculated shift hours
    const newFaceId = await faceIdModel.create({
      ...req.body,
      _id: newFaceIdId,
    });

    return res.send(
      successRes(200, "faceId added", {
        data: newFaceId,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getFaceIdById = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const resp = await faceIdModel.findById(id);

    return res.send(
      successRes(200, "get faceid", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getFaceIdByUserId = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const resp = await faceIdModel
      .findOne({ userId: id })
      .populate(faceIdPopulations);

    return res.send(
      successRes(200, "get faceid", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const getFaceIdByFaceId = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const resp = await faceIdModel
      .findOne({ faceId: id })
      .populate(faceIdPopulations);

    return res.send(
      successRes(200, "get face by face id", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};

export const addNewFaceId = async (req, res, next) => {
  const { userId, faceId, preLoadedFace } = req.body;

  try {
    if (!userId) return errorRes2(res, 401, "user id required");
    if (!faceId) return errorRes2(res, 401, "face id required");

    const findShift = await shiftInfoModel.findOne({ userId });
    if (!findShift) return errorRes2(res, 404, "Dont have shift assigned");

    let id = `face-id-${userId}`;
    const newFace = await faceIdModel.create({
      userId,
      faceId,
      preLoadedFace,
      _id: id,
    });
    try {
      //
      findShift.faceId = newFace?._id;
      await findShift.save();
    } catch (error) {
      //
    }
    const updatedResp = await faceIdModel
      .findById(newFace?._id)
      .populate(faceIdPopulations);
    //
    return successRes2(res, 200, "face registration successful", {
      data: updatedResp,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
};

export const updateFaceIdById = async (req, res, next) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(401, "id required"));

    const resp = await faceIdModel.findByIdAndUpdate(id, {
      $set: {
        ...req.body,
      },
    });

    return res.send(
      successRes(200, "face updated", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, "Internal Server Error"));
  }
};
