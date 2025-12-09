import incentiveModel from "../model/incentive/incentive.model.js";
import { errorRes2, successRes2 } from "../model/response.js";
import { incentivePopulations } from "../utils/constant.js";

export const getIncetiveByUserId = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return errorRes2(res, 401, "user id requried");

  try {
    //
    const foundIncentives = await incentiveModel
      .findOne({ userId: id })
      .populate(incentivePopulations);

    if (!foundIncentives) return errorRes2(res, 404, "No incentive found");


    return successRes2(res, 200, "found incentive", {
      data: foundIncentives,

    });
  } catch (error) {
    //
    return errorRes2(res, 500, `Internal Server error ${error}`,);
  }
};
