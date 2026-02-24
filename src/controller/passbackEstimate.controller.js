import employeeModel from "../model/employee.model.js";
import estimateGeneratedModel from "../model/estimateGenerate.model.js";
import passbackEstimateModel from "../model/passback.model.js";
import { errorRes, successRes } from "../model/response.js";
import {
  estimateGeneratedPopulateOptions,
  passbackEstimatePopulateOptions,
} from "../utils/constant.js";
import logger from "../utils/logger.js";

export const getPassbackEstimate = async (req, res) => {
  try {
    const respP = await passbackEstimateModel
      .find()
      .populate(passbackEstimatePopulateOptions);
    return res.send(
      successRes(200, "Get passback", {
        data: respP,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const getPassbackEstimateById = async (req, res) => {
  const id = req.params.id;
  try {
    const respP = await passbackEstimateModel
      .findById(id)
      .populate(passbackEstimatePopulateOptions);

    if (!id) return res.send(errorRes(400, "id is required"));
    return res.send(
      successRes(200, "Get passback by id", {
        data: respP,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const getPassEstimateByLead = async (req, res) => {
  const id = req.params.id;

  try {
    const respP = await passbackEstimateModel
      .find({ lead: id })
      .populate(passbackEstimatePopulateOptions);

    if (!id) return res.send(errorRes(400, "id is required"));
    return res.send(
      successRes(200, "Get passback by Lead", {
        data: respP,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, error));
  }
};

export const addPassbackEstimate = async (req, res) => {
  const body = req.body;

  try {
    if (!body) return res.send(errorRes(403, "Estimate ID is required"));

    // logger.info(body.estimate);
    // logger.info(body);

    const estimate = await estimateGeneratedModel
      .findById(body.estimate)
      .populate(estimateGeneratedPopulateOptions);
    if (!estimate)
      return res.send(errorRes(404, "Estimate not found with provided ID"));

    const requestedByEmp = await employeeModel.findById(body.requestedBy);

    const newPassback = await passbackEstimateModel.create({
      ...body,
      estimate: body.estimate,
      lead: estimate.lead._id,
      channelPartner: estimate.lead.channelPartner._id,
      requestedBy: requestedByEmp._id,
      requestDate: new Date(),
    });

    // logger.info(newPassback);

    const newResp = await passbackEstimateModel
      .findById(newPassback._id)
      .populate(passbackEstimatePopulateOptions);

    // logger.info(newPassback);

    return res.send(
      successRes(200, "Passback request added successfully", {
        data: newResp,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, error.message || error));
  }
};

export const updatePassbackStatus = async (req, res) => {
  const { id, requestStatus } = req.params;
  const body = req.body;

  try {
    if (!id) return res.send(errorRes(400, "Passback ID is required"));
    if (!requestStatus) return res.send(errorRes(400, "statusis required"));

    body.requestStatus = requestStatus.toLowerCase();
    body.cpApprovedDate = new Date();

    const updatedPassback = await passbackEstimateModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true },
    );

    const resp = await passbackEstimateModel
      .findById(updatedPassback._id)
      .populate(passbackEstimatePopulateOptions);
    if (!resp) return res.send(errorRes(404, "Passback estimate not found"));

    return res.send(
      successRes(200, "Passback status updated successfully", {
        data: resp,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const getByChannelPartner = async (req, res) => {
  const id = req.params.id;

  try {
    const respP = await passbackEstimateModel
      .find({ channelPartner: id })
      .populate(passbackEstimatePopulateOptions);

    if (!id) return res.send(errorRes(400, "id is required"));
    return res.send(
      successRes(200, "Get passback by id", {
        data: respP,
      }),
    );
  } catch (e) {
    return res.send(errorRes(500, error));
  }
};
