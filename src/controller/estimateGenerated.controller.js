import { nextDay } from "date-fns";
import estimateGeneratedModel from "../model/estimateGenerate.model.js";
import { errorRes, successRes } from "../model/response.js";
import {
  estimateGeneratedPopulateOptions,
  leadPopulateOptions,
} from "../utils/constant.js";
import estModel from "../model/estimator.model.js";
import logger from "../utils/logger.js";

export const getEstimateGenerated = async (req, res, next) => {
  try {
    let query = req.params.query || "";
    let teamLeader = req.query.teamLeader;

    // logger.info(teamLeader);

    const estimateGenerated = await estimateGeneratedModel
      .find()
      .populate(estimateGeneratedPopulateOptions)
      .sort({ createdAt: -1 });

    // logger.info(estimateGenerated);

    const filteredEstimates = teamLeader
      ? estimateGenerated.filter(
          (estimate) =>
            estimate.lead?.teamLeader?._id?.toString() === teamLeader,
        )
      : estimateGenerated;
    // logger.info(filteredEstimates.length);
    return res.send(
      successRes(200, "Get Estimate Details", {
        data: filteredEstimates,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

export const addGeneratedEstimate = async (req, res, next) => {
  const body = req.body;
  try {
    if (!body) {
      return res.send(errorRes(403, "body is required"));
    }
    // logger.info(body);

    const newEstimate = new estimateGeneratedModel(body);

    const savedEstimate = await newEstimate.save();
    const newSaved = await estimateGeneratedModel
      .findById(savedEstimate._id)
      .populate(estimateGeneratedPopulateOptions);

    const estId = await estModel.findOne({
      teamLeader: newSaved?.lead?.teamLeader?._id,
    });

    // logger.info(body);
    // logger.info(estId);

    const newResp = await estModel.findByIdAndUpdate(estId._id, {
      count: estId.count + 1,
    });

    return res.send(
      successRes(200, "Estimate Details Added Successfully!!", {
        data: newSaved,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error.message || "Server error"));
  }
};

export const getEstimateGeneratedById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const estimateGenerated = await estimateGeneratedModel
      .find({ lead: id })
      .populate(estimateGeneratedPopulateOptions)
      .sort({ date: 1 });

    if (!estimateGenerated || estimateGenerated.length === 0) {
      return res.send(errorRes(404, "No data available!"));
    }

    return res.send(
      successRes(200, "Get Estimate Details By Lead", {
        data: estimateGenerated,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

export const getEstimatedById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const estimateGenerated = await estimateGeneratedModel
      .findById(id)
      .populate(estimateGeneratedPopulateOptions)
      .sort({ date: 1 });

    if (!estimateGenerated || estimateGenerated.length === 0) {
      return res.send(errorRes(404, "No data available!"));
    }

    return res.send(
      successRes(200, "Get Estimate Details By Lead", {
        data: estimateGenerated,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

export const getEstimateGeneratedByEstId = async (req, res, next) => {
  const id = req.params.id;
  try {
    const estimateGenerated = await estimateGeneratedModel
      .findOne({ estID: id })
      .populate(estimateGeneratedPopulateOptions)
      .sort({ date: 1 });

    if (!estimateGenerated) {
      return res.send(errorRes(404, "No data available!"));
    }

    return res.send(
      successRes(200, "Get Estimate Details By Est ID", {
        data: estimateGenerated,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

export const updateEstimateGeneratedById = async (req, res, next) => {
  const id = req.params.id;
  try {
    // logger.info(req.body);

    const estimateGenerated = await estimateGeneratedModel
      .findByIdAndUpdate(id, { ...req.body }, { new: true })
      .populate(estimateGeneratedPopulateOptions);

    return res.send(
      successRes(200, "updated Estimate Details By Lead", {
        data: estimateGenerated,
      }),
    );
  } catch (error) {
    logger.error(error);
    // logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const updateEstimateGeneratedByIdArray = async (req, res, next) => {
  const id = req.params.id;
  try {
    // logger.info(req.body);

    const existingDoc = await estimateGeneratedModel
      .findById(id)
      .select("finalDocumentCreated");
    if (!existingDoc) {
      return res.send(errorRes(404, "Estimate not found"));
    }

    const index = (existingDoc.finalDocumentCreated?.length || 0) + 1;

    // logger.info(index);
    const estimateGenerated = await estimateGeneratedModel
      .findByIdAndUpdate(
        id,
        {
          $push: {
            finalDocumentCreated: {
              ...req.body,
              index,
            },
          },
        },
        { new: true },
      )
      .populate(estimateGeneratedPopulateOptions);

    return res.send(
      successRes(200, "updated Estimate Details By Lead", {
        data: estimateGenerated,
      }),
    );
  } catch (error) {
    logger.error(error);
    logger.info(error);
    return res.send(errorRes(500, error));
  }
};

export const getEstimateGeneratedMultiple = async (req, res) => {
  const id = req.params.lead;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respSite = await estimateGeneratedModel
      .find({ lead: id })
      .populate(estimateGeneratedPopulateOptions)
      .sort({ date: 1 });

    if (!respSite) {
      return res.send(errorRes(404, "No data available!"));
    }

    return res.send(
      successRes(200, "Estimate details", {
        data: respSite,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, `server error:${error?.message}`));
  }
};

export const updateHandoverRevoke = async (req, res) => {
  const id = req.params.id;
  const { index, reason, status } = req.body;
  try {
    const now = new Date();
    // logger.info(req.body);
    // if (!index) return res.send(errorRes(500, "index not found"));
    let resp;
    if (index != null) {
      const updateFields = {};
      for (const key in req.body) {
        updateFields[`finalDocumentCreated.$.${key}`] = req.body[key];
      }
      // logger.info(updateFields);
      // Perform the update
      resp = await estimateGeneratedModel.updateOne(
        { _id: id, "finalDocumentCreated.index": index }, // Match project and specific flat
        { $set: updateFields }, // Dynamically update fields
      );
      // logger.info(req.body);
    } else {
      const updateFields = {
        status,
        reason,
        statusChangedDate: now,
      };

      resp = await estimateGeneratedModel.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true },
      );
    }
    // logger.info(id);
    // logger.info(resp._id);
    const doc = await estimateGeneratedModel
      .findById(id)
      .populate(estimateGeneratedPopulateOptions);
    return res.send(
      successRes(200, "Document updated", {
        data: doc,
      }),
    );
  } catch (error) {
    logger.error(error);
    logger.error(error);
    return res.send(errorRes(500, error.message));
  }
};
