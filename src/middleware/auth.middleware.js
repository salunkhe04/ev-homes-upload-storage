import config from "../config/config.js";
import cpModel from "../model/channelPartner.model.js";
import clientModel from "../model/client.model.js";
import employeeModel from "../model/employee.model.js";
import requestLogModel from "../model/reqeustLog.model.js";
import { errorRes } from "../model/response.js";
import { createJwtToken, verifyJwtToken } from "../utils/helper.js";
import os from "os";
import semver from "semver";
const MIN_VERSION = "1.1.105";

export const authenticateToken = async (req, res, next) => {
  try {
    const accessTokenCoockie = req.cookies.accessToken;
    const refreshTokenCoockie = req.cookies.refreshToken;

    const accessToken =
      req.headers["authorization"]?.split(" ")[1] ?? accessTokenCoockie;
    // const refreshToken = req.headers.refreshtoken?.split(" ")[1];
    const refreshToken =
      req.headers["x-refresh-token"]?.split(" ")[1] ?? refreshTokenCoockie;
    const clientVersion = req.headers["x-app-version"];
    const clientIsWeb = req.headers["x-platform"];

    // console.log(`app version: ${clientVersion} `);
    // console.log(`acces: ${accessToken} `);
    // console.log(`refresh: ${refreshToken} `);
    if (!accessToken) {
      if (!refreshToken) {
        res.setHeader("x-force-logout", `force-logout`);
        return res.status(401).json({
          message: "Your account is no longer active.",
        });
      }
      try {
        const decoded = verifyJwtToken(refreshToken, config.SECRET_REFRESH_KEY);
        let user = null;
        if (decoded.data.role === "channel-partner") {
          user = await cpModel.findById(decoded.data._id).lean();

          if (!user) {
            res.setHeader("x-force-logout", `force-logout`);

            return res.send(errorRes(401, "Channel Partner not found"));
          }
          if (user.status != "active") {
            res.setHeader("x-force-logout", `force-logout`);

            return res.send(errorRes(401, "Unauthorized Access."));
          }
        } else if (decoded.data.role === "employee") {
          user = await employeeModel.findById(decoded.data._id).lean();

          if (!user) {
            res.setHeader("x-force-logout", `force-logout`);

            return res.send(errorRes(401, "Channel Partner not found"));
          }

          if (user.status != "active") {
            res.setHeader("x-force-logout", `force-logout`);

            return res.send(errorRes(401, "Unauthorized Access"));
          }
        } else if (decoded.data.role === "customer") {
          user = await clientModel.findById(decoded.data._id).lean();

          if (!user) {
            res.setHeader("x-force-logout", `force-logout`);

            return res.send(errorRes(401, "Channel Partner not found"));
          }
        }

        if (!user) {
          res.setHeader("x-force-logout", `force-logout`);

          return res.send(
            errorRes(
              401,
              "Your session has expired. Please log in again to continue."
            )
          );
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

        return res.send(
          errorRes(
            401,
            "Your session has expired. Please log in again to continue."
          )
        );
      }
    }

    try {
      const decoded = verifyJwtToken(accessToken, config.SECRET_ACCESS_KEY);
      let user = null;
      if (decoded.data.role === "channel-partner") {
        user = await cpModel.findById(decoded.data._id).lean();

        if (!user) {
          return res.send(errorRes(401, "Channel Partner not found"));
        }
        if (user.status != "active") {
          res.setHeader("x-force-logout", `force-logout`);

          return res.send(errorRes(401, "Unauthorized Access."));
        }
      } else if (decoded.data.role === "employee") {
        user = await employeeModel.findById(decoded.data._id).lean();

        if (!user) {
          return res.send(errorRes(401, "Channel Partner not found"));
        }
        if (user.status != "active") {
          res.setHeader("x-force-logout", `force-logout`);

          return res.send(errorRes(401, "Unauthorized Access."));
        }
      } else if (decoded.data.role === "customer") {
        user = await clientModel.findById(decoded.data._id).lean();

        if (!user) {
          res.setHeader("x-force-logout", `force-logout`);

          return res.send(errorRes(401, "Channel Partner not found"));
        }
      }

      if (!user) {
        res.setHeader("x-force-logout", `force-logout`);

        return res.send(
          errorRes(
            401,
            "Your session has expired. Please log in again to continue."
          )
        );
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Token has expired, attempt to refresh
        if (!refreshToken) {
          res.setHeader("x-force-logout", `force-logout`);

          return res.send(
            errorRes(
              401,
              "Your session has expired. Please log in again to continue."
            )
          );
        }

        try {
          const decoded = verifyJwtToken(
            refreshToken,
            config.SECRET_REFRESH_KEY
          );
          let user = null;
          if (decoded.data.role === "channel-partner") {
            user = await cpModel.findById(decoded.data._id).lean();

            if (!user) {
              res.setHeader("x-force-logout", `force-logout`);

              return res.send(errorRes(401, "Channel Partner not found"));
            }
          } else if (decoded.data.role === "employee") {
            user = await employeeModel.findById(decoded.data._id).lean();

            if (!user) {
              res.setHeader("x-force-logout", `force-logout`);

              return res.send(errorRes(401, "Channel Partner not found"));
            }

            if (user.status != "active") {
              res.setHeader("x-force-logout", `force-logout`);

              return res.send(errorRes(401, "Unauthorized Access"));
            }
          } else if (decoded.data.role === "customer") {
            user = await clientModel.findById(decoded.data._id).lean();

            if (!user) {
              res.setHeader("x-force-logout", `force-logout`);

              return res.send(errorRes(401, "Channel Partner not found"));
            }
          }

          if (!user) {
            res.setHeader("x-force-logout", `force-logout`);

            return res.send(
              errorRes(
                401,
                "Your session has expired. Please log in again to continue."
              )
            );
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

          return res.send(
            errorRes(
              401,
              "Your session has expired. Please log in again to continue."
            )
          );
        }
      }
      res.setHeader("x-force-logout", `force-logout`);

      return res.send(errorRes(401, "Invalid credentials"));
    }
  } catch (error) {
    res.setHeader("x-force-logout", `force-logout`);
    // console.log(error);
    return res.send(errorRes(401, "Internal server error"));
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
  // console.log(req.originalUrl);

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
