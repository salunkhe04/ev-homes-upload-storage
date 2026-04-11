import moment from "moment";
import config from "../config/config.js";
import { validateRegisterEmployeeFields } from "../middleware/employee.middleware.js";
import cpModel from "../model/channelPartner.model.js";
import clientModel from "../model/client.model.js";
import employeeModel from "../model/employee.model.js";
import shiftInfoModel from "../model/attendance/shift/employeeShiftInfo.js";
import oneSignalModel from "../model/oneSignal.model.js";
import otpModel from "../model/otp.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import shiftModel from "../model/attendance/shift/shift.model.js";
import { forgotPasswordTemplete } from "../templates/html_template.js";
import { sendEmail, sendMultipleEmail } from "../utils/brevo.js";
import { employeePopulateOptions, errorMessage } from "../utils/constant.js";
import {
  comparePassword,
  createJwtToken,
  encryptPassword,
  generateOTP,
  generateSessionAccessToken,
  generateSessionefreshToken,
  hashToken,
  verifyJwtToken,
} from "../utils/helper.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";
import logger from "../utils/logger.js";
import blockedTokenModel from "../model/token.model.js";
import sessionModel from "../model/sessionSchema/session.model.js";

export const updateDesgEmp = async (req, res, next) => {
  try {
    // Find employees with the specific designation ID
    const respCP = await employeeModel.find({
      designation: "670e5421de5adb5e87eb8d68",
    });

    if (respCP.length === 0) {
      return res.send(
        successRes(200, "No employees found with this designation", {
          data: [],
        }),
      );
    }

    // Update all matched documents by their designation
    const updateResponse = await employeeModel.updateMany(
      { _id: { $in: respCP.map((ele) => ele._id) } },
      { designation: "desg-pre-sales-head" },
    );

    // Send the updated data as response
    return res.send(
      successRes(200, "Updated Designation", {
        matchedCount: updateResponse.matchedCount,
        modifiedCount: updateResponse.modifiedCount,
      }),
    );
  } catch (error) {
    logger.info(error);

    logger.info(error);

    return next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const { status, desg } = req.query;

    let query = {
      ...(status ? { status: status } : { status: "active" }),
      ...(desg ? { designation: desg } : {}),
    };

    const respCP = await employeeModel
      .find(query)
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getEmployeesForAttendance = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        status: "active",
        permissions: "tab_checkin",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getVisitEntryAllowedStaff = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        $or: [
          { permissions: { $in: ["allowed_visit_entry"] } },
          {
            designation: "desg-pre-sales-head",
          },
          {
            designation: "desg-site-head",
          },
          // {
          //   designation: "desg-front-desk-executive",
          // },
          {
            designation: "desg-floor-manager",
          },
          {
            designation: "desg-post-sales-head",
          },
          {
            designation: "desg-senior-closing-manager",
          },
        ],
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};
export const getTeamLeaderCSM = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        $or: [
          { designation: "desg-senior-closing-manager" },
          { designation: "desg-site-head" },
          { designation: "desg-post-sales-head" },
        ],
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get TeamLeaders", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getSalesManagers = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        $or: [
          {
            designation: "desg-senior-sales-manager",
          },
          {
            designation: "desg-sales-executive",
          },
          {
            designation: "desg-sales-manager",
          },
          {
            designation: "desg-pre-sales-executive",
          },
        ],
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getSeniorClosingManagers = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        $or: [
          {
            designation: "desg-site-head",
          },
          {
            designation: "desg-senior-closing-manager",
          },
          //added as per request bcz of harshal desg changed
          {
            designation: "desg-post-sales-head",
          },
        ],
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getPostSaleExecutives = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        designation: "desg-post-sales-executive",
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getEmployeeByDesignation = async (req, res, next) => {
  try {
    const desgId = req.params.id;
    if (!desgId) return res.send(errorRes(200, "id is required"));
    let filter = { designation: desgId };
    if (desgId === "desg-senior-closing-manager") {
      filter = {
        designation: {
          $in: [
            "desg-senior-closing-manager",
            "desg-site-head",
            // "desg-post-sales-head",
          ],
        },
      };
    } else if (desgId === "desg-sales-manager") {
      filter = {
        designation: {
          $in: ["desg-sales-manager", "desg-senior-sales-manager"],
        },
      };
    }

    // logger.info(desgId);
    const respCP = await employeeModel
      .find({
        ...filter,
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getEmployeeByCustomRole = async (req, res, next) => {
  try {
    const desgId = req.query.role;
    if (!desgId) return res.send(errorRes(200, "id is required"));
    let filter = { permissions: desgId };

    // logger.info(desgId);
    const respCP = await employeeModel
      .find({
        ...filter,
        status: "active",
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getTeamLeaders = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find({
        $or: [
          {
            designation: "desg-pre-sales-team-leader",
            status: "active",
          },
        ],
      })
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getDataAnalyzers = async (req, res, next) => {
  try {
    const respCP = await employeeModel
      .find(
        {
          $or: [
            {
              designation: "desg-data-analyzer",
              status: "active",
            },
          ],
        },
        {
          firstName: 1,
          lastName: 1,
          designation: 1,
        },
      )
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Employees", {
        data: respCP,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};
export const getPreSalesExecutive = async (req, res, next) => {
  try {
    const reportingTo = req.query.id;

    let searchFilter = {
      designation: "desg-pre-sales-executive",
      status: "active",
      ...(reportingTo && { reportingTo: reportingTo }),
    };
    const respPreSaleEx = await employeeModel
      .find(searchFilter)
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    return res.send(
      successRes(200, "get Pre Sales Executive", {
        data: respPreSaleEx,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respEmployee = await employeeModel
      .findById(id)
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    //if not found
    if (!respEmployee) {
      return res.send(errorRes(404, errorMessage.EMP_NOT_FOUND));
    }
    //if found
    return res.send(
      successRes(200, `get Employee by id ${id}`, {
        data: respEmployee,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getEmployeeReAuth = async (req, res, next) => {
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
        user = await employeeModel
          .findById(decoded.data._id)
          .populate(employeePopulateOptions)
          .lean();

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
      const { password, ...userWithoutPassword } = user;

      req.user = user;
      return successRes2(res, 200, "Authenticated", {
        data: userWithoutPassword,
      });
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
            user = await employeeModel
              .findById(session.userId)
              .populate(employeePopulateOptions)
              .lean();

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
          return successRes2(res, 200, "Authenticated", {
            data: userWithoutPassword,
          });
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

  // try {
  //   const accessTokenCoockie = req.cookies.accessToken;
  //   const refreshTokenCoockie = req.cookies.refreshToken;
  //   const accessHeader = req.headers["authorization"]?.split(" ")[1];
  //   const refreshHeader = req.headers["x-refresh-token"]?.split(" ")[1];

  //   const accessToken = accessHeader ?? accessTokenCoockie;
  //   const refreshToken = refreshHeader ?? refreshTokenCoockie;
  //   const clientIsWeb = req.headers["x-platform"];

  //   // console.log(`acces web ${accessTokenCoockie}`);
  //   // console.log(`refresh web ${refreshTokenCoockie}`);

  //   // console.log(`acces ${accessHeader}`);
  //   // console.log(`refresh ${refreshHeader}`);

  //   if (!accessToken) {
  //     res.setHeader("x-force-logout", `force-logout`);

  //     return errorRes2(
  //       res,
  //       401,
  //       "Your session has expired. Please log in again to continue.",
  //     );
  //   }

  //   try {
  //     const blockedToken2 = await blockedTokenModel.findOne({
  //       token: accessToken,
  //     });
  //     if (blockedToken2) {
  //       res.setHeader("x-force-logout", `force-logout`);

  //       return errorRes2(res, 401, "Unauthorized Access.");
  //     }

  //     // Verify access token
  //     const decoded = verifyJwtToken(accessToken, config.SECRET_ACCESS_KEY);

  //     const user = await employeeModel
  //       .findOne({ _id: decoded.data._id, refreshToken: refreshToken })
  //       .select("-password -refreshToken")
  //       .populate(employeePopulateOptions)
  //       .lean();

  //     if (!user) {
  //       res.setHeader("x-force-logout", `force-logout`);
  //       return errorRes2(
  //         res,
  //         401,
  //         "Session Expired, Please log in again to continue.",
  //       );
  //     }

  //     if (user.status != "active") {
  //       res.setHeader("x-force-logout", `force-logout`);
  //       return errorRes2(res, 401, "Your account is no longer active.");
  //     }

  //     req.user = user;
  //     return successRes2(res, 200, "Authenticated", { data: user });
  //   } catch (error) {
  //     // logger.info(error);

  //     if (error.name === "TokenExpiredError") {
  //       // Access token expired, attempt to refresh
  //       if (!refreshToken) {
  //         res.setHeader("x-force-logout", `force-logout`);
  //         return errorRes2(
  //           res,
  //           401,
  //           "Session Expired, Please log in again to continue.",
  //         );
  //       }
  //       const blockedToken2 = await blockedTokenModel.findOne({
  //         token: refreshToken,
  //       });
  //       if (blockedToken2) {
  //         res.setHeader("x-force-logout", `force-logout`);

  //         return errorRes2(res, 401, "Unauthorized Access.");
  //       }

  //       try {
  //         const decoded = verifyJwtToken(
  //           refreshToken,
  //           config.SECRET_REFRESH_KEY,
  //         );
  //         const user = await employeeModel
  //           .findOne({ _id: decoded.data._id, refreshToken: refreshToken })
  //           .select("-password -refreshToken")
  //           .populate(employeePopulateOptions)
  //           .lean();

  //         if (!user) {
  //           res.setHeader("x-force-logout", `force-logout`);
  //           return errorRes2(
  //             res,
  //             401,
  //             "Session Expired, Please log in again to continue.",
  //           );
  //         }

  //         const dataToken = {
  //           _id: user._id,
  //           email: user.email,
  //           role: user.role,
  //         };

  //         // Generate a new access token
  //         const newAccessToken = createJwtToken(
  //           dataToken,
  //           config.SECRET_ACCESS_KEY,
  //           "15m",
  //         );

  //         // Check if refresh token is about to expire (e.g., less than 1 day)
  //         const refreshDecoded = verifyJwtToken(
  //           refreshToken,
  //           config.SECRET_REFRESH_KEY,
  //         );
  //         // logger.info(refreshDecoded);
  //         const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  //         const timeLeft = refreshDecoded.exp - currentTime;

  //         let newRefreshToken = refreshToken;
  //         if (timeLeft < 24 * 60 * 60) {
  //           // If less than 1 day left
  //           newRefreshToken = createJwtToken(
  //             dataToken,
  //             config.SECRET_REFRESH_KEY,
  //             "7d",
  //           ); // Generate a new refresh token
  //           res.setHeader("x-new-refresh-token", newRefreshToken); // Send new refresh token in response header
  //           if (clientIsWeb === "web") {
  //             res.cookie("refreshToken", newRefreshToken, {
  //               httpOnly: true,
  //               secure: process.env.NODE_ENV === "production",
  //               sameSite: "Strict",
  //               maxAge: 7 * 24 * 60 * 60 * 1000,
  //             });
  //           }
  //         }

  //         res.setHeader("Authorization", `Bearer ${newAccessToken}`);

  //         if (clientIsWeb === "web") {
  //           res.cookie("accessToken", accessToken, {
  //             httpOnly: true,
  //             secure: process.env.NODE_ENV === "production",
  //             sameSite: "Strict",
  //             maxAge: 15 * 60 * 1000,
  //           });
  //         }

  //         req.user = user;

  //         return successRes2(res, 200, "Token refreshed", {
  //           data: user,
  //           refreshToken: timeLeft < 24 * 60 * 60 ? newRefreshToken : undefined, // Include new token if generated
  //         });
  //       } catch (refreshError) {
  //         // logger.info(refreshError);
  //         res.setHeader("x-force-logout", `force-logout`);
  //         return errorRes2(
  //           res,
  //           401,
  //           "Session Expired, Please log in again to continue.",
  //         );
  //       }
  //     }
  //     res.setHeader("x-force-logout", `force-logout`);

  //     return errorRes2(
  //       res,
  //       401,
  //       "Session Expired, Please log in again to continue.",
  //     );
  //   }
  // } catch (error) {
  //   // res.setHeader("x-force-logout", `force-logout`);
  //   logger.info("Error during re-authentication:", error);
  //   return errorRes2(res, 500, "Internal server error");
  // }
};

export const editEmployeeById = async (req, res, next) => {
  const id = req.params.id;
  const body = req.filteredBody;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "valid data is required"));
    // logger.info(body);

    // return res.send(errorRes(404, `test success`));
    const respEmployee = await employeeModel
      .findById(id)
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    //if not found
    if (!respEmployee) {
      return res.send(errorRes(404, errorMessage.EMP_NOT_FOUND));
    }

    await respEmployee.updateOne({ ...body }, { new: true });

    //if all ok
    return res.send(
      successRes(200, errorMessage.EMP_INFO_UPDATED, {
        data: respEmployee,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const getReportingTo = async (req, res, next) => {
  try {
    const reportingToId = req.params.id;
    const { dept } = req.query;
    let filter = {
      reportingTo: reportingToId,
      status: "active",
    };
    if (dept === "sales") {
      filter = {
        reportingTo: reportingToId,
        status: "active",
        designation: {
          $in: [
            "desg-sales-executive",
            "desg-senior-sales-manager",
            "desg-sales-manager",
            "desg-sales-manager",
          ],
        },
      };
    } else if (dept === "post-sales") {
      filter = {
        reportingTo: reportingToId,
        status: "active",
        designation: {
          $in: ["desg-post-sales-executive", "desg-post-sales-head"],
        },
      };
    }

    const employees = await employeeModel
      .find(filter, {
        email: 1,
        profilePic: 1,
        employeeId: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        department: 1,
        designation: 1,
        division: 1,
        reportingTo: 1,
        incentive: 1,
      })
      // .select("firstName lastName profilePic employeeId phoneNumber email")
      .populate(employeePopulateOptions);
    // .populate({
    //   path: "reportingTo",
    //   select: "firstName lastName profilePic employeeId",
    //   populate: [{ path: "designation" }, { path: "department" },
    // { path: "division" },],
    // });

    // Return the list of employees
    return res.send(
      successRes(200, "Employees reporting to the specified ID", {
        data: employees,
      }),
    );
  } catch (error) {
    logger.info(error);

    next(error); // Pass the error to the global error handler
  }
};

export const deleteEmployeeById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respCP = await employeeModel.findById(id);

    //if not found
    if (!respCP) {
      return res.send(errorRes(404, errorMessage.EMP_NOT_FOUND));
    }
    const deletedResp = await respCP.deleteOne();
    //if found
    return res.send(
      successRes(200, errorMessage.EMP_DELETED, {
        data: deletedResp.acknowledged,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const registerMpin = async (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  const { mpin } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));

    const now = new Date();

    const hashMpin = await encryptPassword(mpin.toString());

    const updatedMpin = await employeeModel.findByIdAndUpdate(id, {
      ...body,
      mpChangeDate: now,
      mpin: hashMpin,
    });

    const {
      password: dbPassword,
      refreshToken: dbRefreshToken,
      ...userWithoutPassword
    } = updatedMpin._doc;

    return res.send(
      successRes(200, errorMessage.EMP_REGISTER_SUCCESS, {
        data: userWithoutPassword,
      }),
    );
  } catch (error) {
    logger.info(error);

    if (error.code === 11000) {
      return res.send(errorRes(400, `${error.keyValue._id} already exists.`));
    }

    return next(error);
  }
};

export const registerEmployee = async (req, res, next) => {
  const body = req.filteredBody;
  const { email, password, shift } = body;
  try {
    // logger.info(body);
    if (!body) return res.send(errorRes(403, "data is required"));
    const validateFields = validateRegisterEmployeeFields(body);

    if (!validateFields.isValid) {
      return res.send(errorRes(400, validateFields.message));
    }

    const oldUser = await employeeModel.findOne({
      email: email,
    });

    if (oldUser) {
      return res.send(errorRes(400, errorMessage.EMP_EMAIL_EXIST));
    }

    const hashPassword = await encryptPassword(password);
    const newId = `${body.employeeId}-${body.firstName
      ?.replace(/\s+/g, "-")
      .toLowerCase()}-${body.lastName?.replace(/\s+/g, "-").toLowerCase()}`;

    const newEmployee = new employeeModel({
      ...body,
      _id: newId,
      password: hashPassword,
    });
    const savedEmployee = await newEmployee.save();
    if (shift) {
      const shiftResp = await shiftModel.findById(shift);

      shiftResp.employees = [...new Set([...shiftResp.employees, newId])];
      await shiftResp.save();
      const oldShift = await shiftInfoModel.findOne({ userId: newId });
      if (!oldShift) {
        const newShiftInfoId =
          "shift-info-" + newId?.replace(/\s+/g, "-").toLowerCase();

        // Create a new shift with calculated shift hours
        await shiftInfoModel.create({
          _id: newShiftInfoId,
          userId: newId,
          shift: shift,
        });
      }
    }
    const updatedEmp = await employeeModel
      .findById(savedEmployee._id)
      .populate(employeePopulateOptions);

    const {
      password: dbPassword,
      refreshToken: dbRefreshToken,
      ...userWithoutPassword
    } = updatedEmp._doc;

    const dataToken = {
      _id: updatedEmp._id,
      email: updatedEmp.email,
      role: updatedEmp.role,
    };

    const accessToken = createJwtToken(
      dataToken,
      config.SECRET_ACCESS_KEY,
      "15m",
    );
    const refreshToken = createJwtToken(
      dataToken,
      config.SECRET_REFRESH_KEY,
      "7d",
    );
    updatedEmp.refreshToken = refreshToken;
    // logger.info(savedEmployee);
    await updatedEmp.save();

    return res.send(
      successRes(200, errorMessage.EMP_REGISTER_SUCCESS, {
        data: userWithoutPassword,
        accessToken,
        refreshToken,
      }),
    );
  } catch (error) {
    logger.info(error);

    if (error.code === 11000) {
      return res.send(errorRes(400, `${error.keyValue._id} already exists.`));
    }

    return next(error);
  }
};

export const validateMpin = async (req, res, next) => {
  const body = req.body;
  const id = req.params.id;
  const { mpin } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));

    const employeeDb = await employeeModel
      .findById(id)
      .populate(employeePopulateOptions);

    // .lean();

    if (!employeeDb) {
      return res.send(errorRes(400, errorMessage.EMP_EMAIL_NOT_EXIST));
    }

    if (employeeDb.status != "active") {
      return res.send(errorRes(401, "This account is no longer active."));
    }

    const hashPass = await comparePassword(mpin, employeeDb.mpin);

    if (!hashPass) {
      return res.json({ message: errorMessage.INVALID_PASS });
    }

    const {
      password: dbPassword,
      refreshToken: dbRefreshToken,
      ...userWithoutPassword
    } = employeeDb._doc;

    return res.send(
      successRes(200, errorMessage.EMP_LOGIN_SUCCESS, {
        data: userWithoutPassword,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const loginEmployee = async (req, res, next) => {
  const body = req.filteredBody;
  const { email, password } = body;
  try {
    if (!body) return errorRes2(res, 403, "data is required");
    if (!email) return errorRes2(res, 403, "email is required");
    if (!password) return errorRes2(res, 403, "password is required");

    const employeeDb = await employeeModel
      .findOne({
        email: email,
      })
      .populate(employeePopulateOptions);

    // .lean();

    if (!employeeDb) {
      return errorRes2(res, 400, errorMessage.EMP_EMAIL_NOT_EXIST);
    }

    if (employeeDb.status != "active") {
      return errorRes2(res, 401, "This account is no longer active.");
    }

    const hashPass = await comparePassword(password, employeeDb.password);

    if (!hashPass) {
      return errorRes2(res, 400, errorMessage.INVALID_PASS);
    }

    const { password: dbPassword, ...userWithoutPassword } = employeeDb._doc;
    const dataToken = {
      _id: employeeDb._id,
      // email: employeeDb.email,
      role: employeeDb.role,
    };

    const accessToken = createJwtToken(
      dataToken,
      config.SECRET_ACCESS_KEY,
      "15m",
    );
    const refreshToken = createJwtToken(
      dataToken,
      config.SECRET_REFRESH_KEY,
      "7d",
    );

    const sesssionRefresh = generateSessionefreshToken();

    const hashedRefresh = hashToken(sesssionRefresh);

    await sessionModel.create({
      userId: employeeDb._id,
      role: employeeDb.role,
      refreshToken: hashedRefresh,
      userAgent: req.headers["user-agent"],
      deviceName: req.headers["x-device-name"],
      deviceType: req.headers["x-device-type"],
      os: req.headers["x-device-os"],
      ipAddress: req.ip,

      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await employeeDb.updateOne(
      {
        refreshToken: refreshToken,
      },
      { new: true },
    );
    const clientIsWeb = req.headers["x-platform"];

    if (clientIsWeb === "web") {
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "Strict",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie("sessionRefreshToken", hashedRefresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.setHeader("Authorization", `Bearer ${accessToken}`);
      res.setHeader("x-refresh-token", `Bearer ${hashedRefresh}`);
    }

    return successRes2(res, 200, errorMessage.EMP_LOGIN_SUCCESS, {
      data: userWithoutPassword,
      accessToken,
      refreshToken: hashedRefresh,
    });
  } catch (error) {
    logger.info(error);

    return errorRes2(res, 500, `${error?.message ?? error} `);
  }
};

export const reAuthEmployee = async (req, res, next) => {
  const body = req.body;
  const { email, password } = body;
  try {
    if (!body) return errorRes2(res, 403, "data is required");
    if (!email) return errorRes2(res, 403, "email is required");
    if (!password) return errorRes2(res, 403, "password is required");

    const employeeDb = await employeeModel
      .findOne({
        email: email,
      })
      .lean();

    if (!employeeDb) {
      return errorRes2(res, 400, errorMessage.EMP_NOT_FOUND);
    }

    const hashPass = await comparePassword(password, employeeDb.password);

    if (!hashPass) {
      return errorRes2(res, 401, errorMessage.INVALID_PASS);
    }

    return successRes2(res, 200, "You have been successfully authenticated", {
      data: true,
    });
  } catch (error) {
    logger.info(error);

    return errorRes2(res, 500, `${error?.message ?? error}`);
  }
};

export const forgotPasswordEmployee = async (req, res, next) => {
  const body = req.body;
  const { email } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    const employeeDb = await employeeModel
      .findOne({
        email: email,
      })
      .lean();

    if (!employeeDb) {
      return res.send(
        errorRes(400, `No Employee found with given email: ${email}`),
      );
    }

    const oldOtp = await otpModel.findOne({ email: email }).lean();

    if (oldOtp) {
      await sendMultipleEmail(
        [email],
        "Reset Password",
        forgotPasswordTemplete(
          `${employeeDb.firstName} ${employeeDb.lastName}`,
          oldOtp.otp,
          "https://evhomes.tech/",
        ),
        [],
      );
      return res.send(
        successRes(200, `Your OTP has been re-sent to ${email}`, {
          data: oldOtp,
        }),
      );
    }

    const newOtp = generateOTP(4);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: employeeDb._id,
      email: email,
      type: "employees",
      message: "forgot passsword",
    });

    const savedOtp = await newOtpModel.save();

    await sendMultipleEmail(
      [email],
      "Reset Password",
      forgotPasswordTemplete(
        `${employeeDb.firstName} ${employeeDb.lastName}`,
        savedOtp.otp,
        "https://evhomes.tech/",
      ),
      [],
    );

    return res.send(
      successRes(200, `Your OTP has been sent to ${email}`, {
        data: savedOtp._doc,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const resetPasswordEmployee = async (req, res, next) => {
  const body = req.body;
  const { otp, email, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!otp) return res.send(errorRes(403, "otp is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    if (!password) return res.send(errorRes(403, "password is required"));

    const otpDbResp = await otpModel.findOne({
      email: email,
    });

    if (!otpDbResp) {
      return res.send(errorRes(404, "Invalid Otp"));
    }
    if (otpDbResp.otp != otp) {
      return res.send(errorRes(401, "Otp didn't matched"));
    }

    const employeeDb = await employeeModel
      .findById(otpDbResp.docId)
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    if (!employeeDb) {
      return res.send(errorRes(404, "No Employee found with given email"));
    }
    const hashPassword = await encryptPassword(password);
    await employeeDb.updateOne(
      {
        password: hashPassword,
      },
      { new: true },
    );
    // const updatedPassChannelPartner = await employeeModel.updateOne(
    //   {
    //     _id: employeeDb._id,
    //   },
    //   {
    //     password: hashPassword,
    //   }
    // );
    await otpDbResp.deleteOne();
    // await otpModel.deleteOne({ _id: otpDbResp._id });

    return res.send(
      successRes(200, `Reset password sucessfully for: ${otpDbResp.email}`, {
        data: employeeDb,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const searchEmployee = async (req, res, next) => {
  try {
    let query = req.query.query || "";
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    let skip = (page - 1) * limit;
    const isNumberQuery = !isNaN(query);

    let searchFilter = {
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        // { phoneNumber: { $regex: query, $options: "i" } },
        isNumberQuery ? { phoneNumber: Number(query) } : null,
        { email: { $regex: query, $options: "i" } },
        { firmName: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
        { reraNumber: { $regex: query, $options: "i" } },
      ].filter(Boolean),
    };

    const respEmp = await employeeModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .select("-password -refreshToken")
      .populate(employeePopulateOptions);

    // Count the total items matching the filter
    const totalItems = await employeeModel.countDocuments(searchFilter);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / limit);

    return res.send(
      successRes(200, "get Employee", {
        page,
        limit,
        totalPages,
        totalItems,
        items: respEmp,
      }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const newPassword = async (req, res, next) => {
  const { id } = req.params;
  const { password, newPassword } = req.body;

  try {
    if (!id) {
      return res.send(errorRes(403, "ID is required"));
    }
    // logger.info(id);
    // logger.info(password);
    // logger.info(newPassword);
    if (!password || !newPassword) {
      return res.send(errorRes(403, "Old and new passwords are required"));
    }

    const respAdmin = await employeeModel.findById(id);

    if (!respAdmin) {
      return res.send(errorRes(404, `Admin not found with id: ${id}`));
    }
    // logger.info("pass 1");
    // logger.info(respAdmin.password);

    const isMatch = await comparePassword(password, respAdmin.password);
    // logger.info("pass 2");

    if (!isMatch) {
      return res.send(errorRes(400, "Old password is incorrect"));
    }
    // logger.info("pass 3");

    const hashedNewPassword = await encryptPassword(newPassword);
    respAdmin.password = hashedNewPassword;
    await respAdmin.save();
    // logger.info("pass 4");

    return res.send(
      successRes(200, "Password updated successfully", { data: respAdmin }),
    );
  } catch (error) {
    logger.info(error);

    return next(error);
  }
};

export const sendAddLeaveNotification = async (req, res, next) => {
  try {
    const today = moment(); // current date
    const bufferDays = 4;

    // logger.info(today);

    // Employees with joiningDate
    const employees = await employeeModel.find({ joiningDate: { $ne: null } });

    // logger.info(employees);
    const upcomingLeaveEmployees = [];
    // logger.info(upcomingLeaveEmployees);

    for (const emp of employees) {
      const joiningDate = moment(emp.joiningDate);
      const leaveEligibilityDate = joiningDate.clone().add(3, "months");
      const notifyStartDate = leaveEligibilityDate
        .clone()
        .subtract(bufferDays, "days");

      // If within the 3-day window before 3-month completion
      if (
        today.isSameOrAfter(notifyStartDate) &&
        today.isSameOrBefore(leaveEligibilityDate)
      ) {
        const empName = `${emp.firstName} ${emp.lastName}`;
        const message = `Employee ${empName} is completing 3 months on ${leaveEligibilityDate.format(
          "DD-MM-YYYY",
        )}. Please add leave details.`;

        // Collect list for frontend
        upcomingLeaveEmployees.push({
          employeeId: emp.employeeId,
          name: empName,
          joiningDate: emp.joiningDate,
          leaveEligibilityDate: leaveEligibilityDate.format("YYYY-MM-DD"),
          message,
        });

        // List of fixed site heads or fallback to reporting manager
        const notifyIds = [
          "ev206-shreya-salunkhe",
          // "ev15-deepak-karki"
        ];

        const notifyPlayers = await oneSignalModel.find({
          docId: { $in: notifyIds },
        });

        const playerIds = notifyPlayers.map((p) => p.playerId).filter(Boolean);

        if (playerIds.length > 0) {
          await sendNotificationWithImage({
            playerIds,
            title: "Add Leave",
            imageUrl: "", // optional image
            message,
          });
        }
      }
    }

    return res.send(
      successRes(200, "Notifications sent", {
        count: upcomingLeaveEmployees.length,
        employees: upcomingLeaveEmployees,
      }),
    );
  } catch (e) {
    logger.info("Error in sendAddLeaveNoti:", e);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
};
