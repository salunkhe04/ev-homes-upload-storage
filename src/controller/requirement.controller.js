import reqModel from "../model/requirement.model.js";
import { errorRes, successRes } from "../model/response.js";

export const getRequirements = async (req, res, next) => {
  try {
    const resp = await reqModel.find();

    return res.send(
      successRes(200, "requirment list", {
        data: resp,
      })
    );
  } catch (error) {
    next(error);
  }
};

//ADD Requirement
export const addRequirement = async (req, res) => {
  const body = req.body;
  const { requirement } = body;
  try {
    // if (!body) return res.send(errorRes(403, "data is required"));
    if (!requirement) return res.send(errorRes(403, "requirement is required"));

    const newRequirement = await reqModel.create({
      requirement: requirement,
    });

    await newRequirement.save();
    return res.send(
      successRes(200, `Requirement added successfully: ${requirement}`, {
        data: newRequirement,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};
