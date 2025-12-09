import config from "../config/config.js";
import cpModel from "../model/channelPartner.model.js";
import clientModel from "../model/client.model.js";
import employeeModel from "../model/employee.model.js";
import { errorRes, successRes } from "../model/response.js";
import blockedTokenModel from "../model/token.model.js";
import { validateToken, verifyJwtToken } from "../utils/helper.js";

export const getBlockedTokens = async (req, res, next) => {
  try {
    const tokens = await blockedTokenModel.find();

    res.send(
      successRes(200, "get all blocked Tokens", {
        data: tokens,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const searchBlockedTokens = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let skip = (page - 1) * limit;

    let searchFilter = {
      $or: [{ token: { $regex: query, $options: "i" } }].filter(Boolean),
    };

    const respCP = await blockedTokenModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .select("-password -refreshToken");

    // Count the total items matching the filter
    const totalItems = await blockedTokenModel.countDocuments(searchFilter);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get Channel Partners", {
        page,
        limit,
        totalPages,
        totalItems,
        items: respCP,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const addBlockToken = async (req, res, next) => {
  const { type, token } = req.body;

  try {
    if (!type) return res.send(errorRes(404, "Type required"));

    if (!token) return res.send(errorRes(404, "Token required"));

    const oldToken = await blockedTokenModel.findOne({ token: token });

    if (oldToken) {
      return res.send(
        successRes(200, "Token already in blocklist", {
          data: oldToken,
        })
      );
    }

    const newToken = new blockedTokenModel({ token, type });

    await newToken.save();

    return res.send(
      successRes(200, "added New Token", {
        data: newToken,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const deleteBLockedToken = async (req, res, next) => {
  const { token } = req.params;

  try {
    if (!token) return res.send(errorRes(404, "Token Param required"));

    const oldToken = await blockedTokenModel.find({ token });

    if (!oldToken)
      return res.send(errorRes(404, "Token didn't exist in our record"));

    const deleteResp = await blockedTokenModel.findOneAndDelete({
      token: token,
    });

    return res.send(
      successRes(200, "Deleted Token successfully", {
        data: deleteResp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

// export async function validateTokens(req, res) {
//   const accessToken = req.headers.authorization?.split(" ")[1];
//   const refreshToken = req.headers["x-refresh-token"];

//   if (!accessToken || !refreshToken) {
//     return res.status(401).json({ valid: false, message: "No token provided" });
//   }

//   const accessResult = validateToken(accessToken, config.SECRET_ACCESS_KEY);

//   if (accessResult.valid) {
//     return res.json({ valid: true });
//   }

//   if (accessResult.expired) {
//     const refreshResult = validateToken(refreshToken, REFRESH_TOKEN_SECRET);

//     if (refreshResult.valid) {
//       // Refresh token is valid, issue a new access token

//       const user = await User.findById(refreshResult.decoded.userId);
//       if (!user) {
//         return res
//           .status(401)
//           .json({ valid: false, message: "User not found" });
//       }

//       const newAccessToken = generateAccessToken(user._id);
//       res.setHeader("Authorization", `Bearer ${newAccessToken}`);
//       return res.json({ valid: true, message: "New access token issued" });
//     } else if (refreshResult.expired) {
//       // Both access and refresh tokens are expired
//       return res.json({ valid: false, message: "Refresh token expired" });
//     }
//   }

//   // If we reach here, tokens are invalid
//   return res.status(401).json({ valid: false, message: "Invalid tokens" });
// }

export const validateTokens = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    const refreshToken = req.headers["x-refresh-token"];

    if (!accessToken) {
      return res
        .status(401)
        .json({ valid: false, message: "No access token provided" });
    }

    try {
      const decoded = verifyJwtToken(accessToken, config.SECRET_ACCESS_KEY);
      req.user = decoded.data;
      return res.json({ valid: true });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Access token has expired, attempt to refresh
        if (!refreshToken) {
          return res
            .status(401)
            .json({ valid: false, message: "Refresh token not found" });
        }

        try {
          const decoded = verifyJwtToken(
            refreshToken,
            config.SECRET_REFRESH_KEY
          );
          let user;

          switch (decoded.data.role) {
            case "channel-partner":
              user = await cpModel.findById(decoded.data._id);
              break;
            case "employee":
              user = await employeeModel.findById(decoded.data._id);
              break;
            case "customer":
              user = await clientModel.findById(decoded.data._id);
              break;
            default:
              return res
                .status(401)
                .json({ valid: false, message: "Invalid user role" });
          }

          if (!user) {
            return res
              .status(401)
              .json({ valid: false, message: "User not found" });
          }

          const { password, ...userWithoutPassword } = user;
          const dataToken = {
            _id: user._id,
            email: user.email,
            role: user.role,
          };

          const newAccessToken = createJwtToken(
            dataToken,
            config.SECRET_ACCESS_KEY,
            "15m"
          );

          res.setHeader("Authorization", `Bearer ${newAccessToken}`);
          return res.json({
            valid: true,
            message: "New access token issued",
            user: userWithoutPassword,
          });
        } catch (refreshError) {
          return res
            .status(401)
            .json({ valid: false, message: "Invalid refresh token" });
        }
      }
      return res
        .status(401)
        .json({ valid: false, message: "Invalid access token" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ valid: false, message: "Internal server error" });
  }
};
