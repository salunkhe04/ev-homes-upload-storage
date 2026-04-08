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
