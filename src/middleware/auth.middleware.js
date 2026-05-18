import config from "../config/config.js";

import { errorRes, errorRes2 } from "../model/response.js";
import {
  createJwtToken,
  generateSessionefreshToken,
  hashToken,
  verifyJwtToken,
} from "../utils/helper.js";
import os from "os";
import semver from "semver";
import logger from "../utils/logger.js";
import blockedTokenModel from "../model/token.model.js";
import sessionModel from "../model/sessionSchema/session.model.js";
import moment from "moment";
import requestLogModel from "../model/reqeustLog.model.js";

const MIN_VERSION = "1.1.105";

export const authenticateToken = async (req, res, next) => {
  try {
    const accessTokenCoockie = req.cookies.accessToken;
    const refreshTokenCoockie = req.cookies.refreshToken;
    const accessHeader = req.headers["authorization"]?.split(" ")[1];
    const refreshHeader = req.headers["x-refresh-token"]?.split(" ")[1];

    const accessToken = accessHeader ?? accessTokenCoockie;
    const refreshToken = refreshHeader ?? refreshTokenCoockie;
    const clientIsWeb = req.headers["x-platform"];

    if (!accessToken) {
      if (!refreshToken) {
        res.setHeader("x-force-logout", `force-logout`);
        return res.status(401).json({
          message: "Your account is no longer active.",
        });
      }

      res.setHeader("x-force-logout", `force-logout`);

      return errorRes2(res, 401, "Employee not found");
    }
    const blockedToken2 = await blockedTokenModel.findOne({
      token: accessToken,
    });
    if (blockedToken2) {
      res.setHeader("x-force-logout", `force-logout`);

      return errorRes2(res, 401, "Unauthorized Access.");
    }

    try {
      const decoded = verifyJwtToken(accessToken, config.SECRET_ACCESS_KEY);
      let user = null;
      if (decoded.data.role === "channel-partner") {
        user = await cpModel.findById(decoded.data._id).lean();

        if (!user) {
          return errorRes2(res, 401, "Channel Partner not found");
        }
        if (user.status != "active") {
          res.setHeader("x-force-logout", `force-logout`);

          return errorRes2(res, 401, "Unauthorized Access.");
        }
      } else if (decoded.data.role === "employee") {
        user = await employeeModel.findById(decoded.data._id).lean();

        if (!user) {
          return errorRes2(res, 401, "employee not found");
        }
        if (user.status != "active") {
          res.setHeader("x-force-logout", `force-logout`);

          return errorRes2(res, 401, "Unauthorized Access.");
        }
      } else if (decoded.data.role === "customer") {
        user = await clientModel.findById(decoded.data._id).lean();

        if (!user) {
          res.setHeader("x-force-logout", `force-logout`);

          return errorRes2(res, 401, "client not found");
        }
      }

      if (!user) {
        res.setHeader("x-force-logout", `force-logout`);

        return errorRes2(
          res,
          401,
          "Your session has expired. Please log in again to continue.",
        );
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Token has expired, attempt to refresh
        if (!refreshToken) {
          res.setHeader("x-force-logout", `force-logout`);

          return errorRes2(
            res,
            401,
            "Your session has expired. Please log in again to continue.",
          );
        }
        const blockedToken2 = await blockedTokenModel.findOne({
          token: refreshToken,
        });
        if (blockedToken2) {
          res.setHeader("x-force-logout", `force-logout`);

          return errorRes2(res, 401, "Unauthorized Access.");
        }

        try {
          const session = await sessionModel.findOne({
            refreshToken: refreshToken,
            isRevoked: false,
          });

          if (!session) {
            res.setHeader("x-force-logout", `force-logout`);

            return errorRes2(res, 401, "Employee not found");
          }

          let user = null;
          if (session.role === "channel-partner") {
            user = await cpModel.findById(session.userId).lean();

            if (!user) {
              res.setHeader("x-force-logout", `force-logout`);

              return errorRes2(res, 401, "Channel Partner not found");
            }
          } else if (session.role === "employee") {
            user = await employeeModel.findById(session.userId).lean();

            if (!user) {
              res.setHeader("x-force-logout", `force-logout`);

              return errorRes2(res, 401, "Employee not found");
            }

            if (user.status != "active") {
              res.setHeader("x-force-logout", `force-logout`);

              return errorRes2(res, 401, "Unauthorized Access");
            }
          } else if (session.role === "customer") {
            user = await clientModel.findById(session.userId).lean();

            if (!user) {
              res.setHeader("x-force-logout", `force-logout`);

              return errorRes2(res, 401, "client not found");
            }
          }

          if (!user) {
            res.setHeader("x-force-logout", `force-logout`);

            return errorRes2(
              res,
              401,
              "Your session has expired. Please log in again to continue.",
            );
          }

          const date = moment().tz("Asia/Kolkata");
          const { password, ...userWithoutPassword } = user;
          const dataToken = {
            _id: user._id,
            // email: user.email,
            role: user.role,
          };
          const expiredDate = moment(session.expiresAt).tz("Asia/Kolkata");
          if (expiredDate.isBefore(date)) {
            // 4. Revoke old session
            session.isRevoked = true;
            session.lastUsedAt = new Date();

            await session.save();

            const sesssionRefresh = generateSessionefreshToken();

            const hashedRefresh = hashToken(sesssionRefresh);

            await sessionModel.create({
              userId: user._id,
              role: user.role,
              refreshToken: hashedRefresh,
              userAgent: req.headers["user-agent"],
              deviceName: req.headers["x-device-name"],
              deviceType: req.headers["x-device-type"],
              os: req.headers["x-device-os"],
              ipAddress: req.ip,

              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });
            res.setHeader("x-refresh-token", `Bearer ${hashedRefresh}`);
            if (clientIsWeb === "web") {
              res.cookie("refreshToken", hashedRefresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
              });
            }
          } else {
            session.lastUsedAt = new Date();
            await session.save();
          }

          const newAccessToken = createJwtToken(
            dataToken,
            config.SECRET_ACCESS_KEY,
            "15m",
          );

          res.setHeader("Authorization", `Bearer ${newAccessToken}`);
          if (clientIsWeb === "web") {
            res.cookie("accessToken", newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "Strict",
              maxAge: 15 * 60 * 1000,
            });
          }
          // res.setHeader("NewAccessToken", `Bearer ${newAccessToken}`);
          req.user = {
            ...userWithoutPassword,
          };
          return next();
        } catch (refreshError) {
          res.setHeader("x-force-logout", `force-logout`);

          return errorRes2(
            res,
            401,
            "Your session has expired. Please log in again to continue.",
          );
        }
      }
      res.setHeader("x-force-logout", `force-logout`);

      return errorRes2(res, 401, "Invalid credentials");
    }
  } catch (error) {
    res.setHeader("x-force-logout", `force-logout`);
    // logger.info(error);
    return errorRes2(res, 401, "Internal server error");
  }
};

export function versionCheckMiddleware(req, res, next) {
  const clientVersion = req.headers["x-app-version"];
  const clientIsWeb = req.headers["x-platform"];
  const { force } = req.query;
  if (clientIsWeb === "web" || force == 1) {
    return next();
  }
  if (!clientVersion || !semver.gte(clientVersion, MIN_VERSION)) {
    res.setHeader("x-force-logout", `force-logout`);

    return res
      .status(426)
      .json({ code: 426, message: "Please update your app to continue." });
  }

  next();
}

export const logRequest = async (req, res, next) => {
  const accessToken = req.headers["authorization"]?.split(" ")[1];
  // logger.info(req.originalUrl);

  let decoded;
  try {
    decoded = verifyJwtToken(accessToken, config.SECRET_ACCESS_KEY);
  } catch (error) {
    //
  }

  let clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  // Convert IPv6 loopback (::1) to IPv4 (127.0.0.1)
  if (clientIp === "::1") {
    clientIp = "127.0.0.1";
  }

  // If IP is 127.0.0.1 or localhost, get actual network IPv4
  if (clientIp === "127.0.0.1" || req.hostname === "localhost") {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      for (const net of networkInterfaces[interfaceName]) {
        if (net.family === "IPv4" && !net.internal) {
          clientIp = net.address; // Get the first non-internal IPv4 address
          break;
        }
      }
    }
  }

  try {
    await requestLogModel.create({
      userId: decoded?.data?._id,
      role: decoded?.data?.role,
      ip: clientIp,
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      body: req.body,
      hostname: req.hostname,
      host: req.get("host"),
    });
  } catch (err) {
    console.error("Error saving log:", err);
  }

  next();
};
