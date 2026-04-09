import { errorRes2, successRes2 } from "../model/response.js";
import sessionModel from "../model/sessionSchema/session.model.js";
import logger from "../utils/logger.js";

export const getSessions = async (req, res) => {
  if (!req.user._id) return errorRes2(res, 401, `user id required`);

  try {
    const sessions = await sessionModel
      .find({
        userId: req.user._id,
        isRevoked: false,
      })
      .select("-refreshToken");

    return successRes2(res, 200, "Sessions", { data: sessions });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `error${error}`);
  }
};

// logout all
export const logoutAll = async (req, res) => {
  if (!req.user._id) return errorRes2(res, 401, `user id required`);

  try {
    await sessionModel.updateMany(
      { userId: req.user._id },
      { isRevoked: true },
    );
    return successRes2(res, 204, "Updated Successfully", true);
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `error${error}`);
  }
};
export const getAllSessions = async (req, res) => {
  const query = req.query.query || "";

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;

  try {
    const searchFilter = query
      ? {
          userId: { $regex: query, $options: "i" },
        }
      : {};

    console.log(searchFilter);

    const sessions = await sessionModel
      .find(searchFilter)
      .select("-refreshToken")
      .populate({
        path: "userId",
        select: "firstName lastName employeeId",
      })
      .skip(skip)
      .limit(limit);

    const totalItems = await sessionModel.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalItems / limit);

    return successRes2(res, 200, "Sessions", {
      page,
      limit,
      totalPages,
      totalItems,
      total: sessions.length,
      data: sessions,
    });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `error ${error}`);
  }
};
