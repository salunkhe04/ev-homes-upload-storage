// import bcrypt from 'bcrypt';
import config from "../config/config.js";
import { validateRegisterClientFields } from "../middleware/client.middleware.js";
import clientModel from "../model/client.model.js";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../model/response.js";
import otpModel from "../model/otp.model.js";
import {
  comparePassword,
  createJwtToken,
  encryptPassword,
  generateOTP,
  verifyJwtToken,
} from "../utils/helper.js";
import {
  clientPopulateOptions,
  demandPopulationOptions,
  demandPopulationOptionsv2,
  postSalePopulateOptions,
  postSalePopulateOptionsv2,
} from "../utils/constant.js";
import axios from "axios";
import postSaleLeadModel from "../model/postSaleLead.model.js";
import Demand from "../model/demand.model.js";
import { sendMultipleEmail } from "../utils/brevo.js";
import { forgotPasswordTemplete } from "../templates/html_template.js";

//GET BY ALL
export const getClients = async (req, res) => {
  try {
    const respClient = await clientModel.find().populate(clientPopulateOptions);

    return res.send(
      successRes(200, "Get Clients", {
        data: respClient,
      })
    );
  } catch (error) {
    return res.json({
      message: `error: ${error}`,
    });
  }
};

export const searchClients = async (req, res, next) => {
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
        isNumberQuery ? { phoneNumber: Number(query) } : null,
        isNumberQuery ? { altPhoneNumber: Number(query) } : null,
        { email: { $regex: query, $options: "i" } },
      ].filter(Boolean),
    };

    const respCP = await clientModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .select("-password -refreshToken")
      .populate(clientPopulateOptions);

    // Count the total items matching the filter
    const totalItems = await clientModel.countDocuments(searchFilter);

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

export const getClientById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respDes = await clientModel
      .findById(id)
      .populate(clientPopulateOptions);

    if (!respDes)
      return res.send(
        successRes(404, `Client not found`, {
          data: respDes,
        })
      );

    return res.send(
      successRes(200, `Client Details found`, {
        data: respDes,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, error));
  }
};

//REGISTER
export const registerClient = async (req, res, next) => {
  const body = req.body;
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    altPhoneNumber,
    address,
    password,
    role,
  } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!firstName) return res.send(errorRes(403, "First name is required"));
    if (!lastName) return res.send(errorRes(403, "Last name is required"));
    if (!password) return res.send(errorRes(403, "Password is required"));
    if (!email) return res.send(errorRes(403, "Email is required"));
    if (!phoneNumber)
      return res.send(errorRes(403, "Phone number is required"));
    if (!address) return res.send(errorRes(403, "Address is required"));

    if (password.length < 6) {
      return res.send(
        errorRes(400, "Password should be at least 6 character long.")
      );
    }
    const validateFields = validateRegisterClientFields(body, res);

    if (!validateFields)
      return res.send(errorRes(400, "All field is required."));

    const oldUser = await clientModel
      .findOne({
        $or: [{ email: email }, { phoneNumber: phoneNumber }],
      })
      .lean();

    if (oldUser) {
      return res.send(
        errorRes(400, "Client already exist with this credential")
      );
    }

    const hashPassword = await encryptPassword(password);

    const newClient = new clientModel({
      ...body,
      password: hashPassword,
    });
    const savedClient = await newClient.save();

    const { password: dbPassword, ...userWithoutPassword } = savedClient._doc;
    const accessToken = createJwtToken(
      userWithoutPassword,
      config.SECRET_ACCESS_KEY,
      "15m"
    );
    const refreshToken = createJwtToken(
      userWithoutPassword,
      config.SECRET_REFRESH_KEY,
      "7d"
    );
    savedClient.refreshToken = refreshToken;
    await savedClient.save();

    return res.send(
      successRes(200, "Client is registered successfully", {
        ...userWithoutPassword,
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
    if (error.code === 11000) {
      const test = error;
      return res.send(errorRes(400, `${test} already exists.`));
    }

    return next(error);
  }
};

//LOGIN
export const loginClient = async (req, res, next) => {
  const body = req.body;
  const { email, phoneNumber, altPhoneNumber, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!password) return res.send(errorRes(403, "Password is required"));
    if (!email) return res.send(errorRes(403, "Email is required"));
    // if (!phoneNumber)
    //   return res.send(errorRes(403, "Phone number is required"));

    const clientDb = await clientModel
      .findOne({
        email: email,
      })
      .populate(clientPopulateOptions);

    if (!clientDb) {
      return res.send(errorRes(400, "Client not found with given email"));
    }

    const hashPass = await comparePassword(password, clientDb.password);

    if (!hashPass) {
      return res.json({ message: "Password do not match" });
    }

    const { password: dbPassword, ...userWithoutPassword } = clientDb._doc;
    const dataToken = {
      _id: clientDb._id,
      email: clientDb.email,
      role: clientDb.role,
    };

    const accessToken = createJwtToken(
      dataToken,
      config.SECRET_ACCESS_KEY,
      "15m"
    );
    const refreshToken = createJwtToken(
      dataToken,
      config.SECRET_REFRESH_KEY,
      "7d"
    );
    await clientDb.updateOne({ refreshToken: refreshToken }, { new: true });
    // await clientModel.updateOne(
    //   { _id: clientDb._id },
    //   {
    //     refreshToken: refreshToken,
    //   }
    // );

    return res.send(
      successRes(200, "Client Login successfully", {
        data: userWithoutPassword,
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const generateClientOtp = async (req, res, next) => {
  const { phoneNumber } = req.body;
  let url;
  try {
    const clientResp = await clientModel.findOne({ phoneNumber: phoneNumber });

    if (!clientResp) return res.send(errorRes(401, "no account found"));

    const findOldOtp = await otpModel.findOne({
      phoneNumber: phoneNumber,
      docId: clientResp?._id,
      type: "client_login",
      message: "client Verification Code",
    });
    // https://hooks.zapier.com/hooks/catch/9993809/25xnarr

    if (findOldOtp) {
      // if (
      //   project?.toLowerCase() === "project-ev-10-marina-bay-vashi-sector-10"
      // ) {
      url = `https://hooks.zapier.com/hooks/catch/9993809/25xnarr?phoneNumber=${encodeURIComponent(
        `+91${phoneNumber}`
      )}&name=${clientResp?.firstName} ${
        clientResp?.lastName
      }&project=EV&closingManager=EV&otp=${findOldOtp.otp}`;
      // } else {
      //   url = `https://hooks.zapier.com/hooks/catch/9993809/25xnarr?phoneNumber=${encodeURIComponent(
      //     `+91${phoneNumber}`
      //   )}&name=${clientResp?.firstName} ${
      //     clientResp?.lastName
      //   }&project=${project}&closingManager= &otp=${findOldOtp.otp}`;
      // }
      const resp = await axios.post(url);
      // console.log(resp);
      return res.send(
        successRes(200, "otp Sent to Client", {
          data: findOldOtp,
        })
      );
    }

    const newOtp = generateOTP(4);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: clientResp?._id,
      phoneNumber: phoneNumber,
      type: "client_login",
      message: "client Verification Code",
    });

    const savedOtp = await newOtpModel.save();
    url = `https://hooks.zapier.com/hooks/catch/9993809/25xnarr?phoneNumber=${encodeURIComponent(
      `+91${phoneNumber}`
    )}&name=${clientResp?.firstName} ${
      clientResp?.lastName
    }&project=EV&closingManager=EV&otp=${newOtp}`;

    // if (project?.toLowerCase() === "project-ev-10-marina-bay-vashi-sector-10") {
    //   url = `https://hooks.zapier.com/hooks/catch/9993809/2r64nmh?phoneNumber=${encodeURIComponent(
    //     `+91${phoneNumber}`
    //   )}&name=${clientResp?.firstName} ${clientResp?.lastName}&project= &closingManager= &otp=${newOtp}`;
    // } else {
    //   url = `https://hooks.zapier.com/hooks/catch/9993809/25xnarr?phoneNumber=${encodeURIComponent(
    //     `+91${phoneNumber}`
    //   )}&name=${clientResp?.firstName} ${clientResp?.lastName}&project=${project}&closingManager=&otp=${newOtp}`;
    // }

    const resp = await axios.post(url);
    // console.log(resp);

    return res.send(
      successRes(200, "otp Sent to Client", {
        data: savedOtp,
      })
    );
  } catch (error) {
    return next(error);
  }
};

//client login using phone
export const loginPhone = async (req, res, next) => {
  const { phoneNumber, otp } = req.body;

  try {
    if (!otp) {
      return res.send(errorRes(403, "Invalid Otp"));
    }

    if (!phoneNumber) {
      return res.send(errorRes(403, "Phone number is required"));
    }
    const otpExist = await otpModel.findOne({
      phoneNumber: phoneNumber,
    });

    if (!otpExist) return res.send(errorRes(404, "Otp is Expired"));

    if (otp != otpExist.otp)
      return res.send(errorRes(401, "Otp Didn't matched"));

    await otpExist.deleteOne();

    const clientDb = await clientModel
      .findOne({ phoneNumber: phoneNumber })
      .populate(clientPopulateOptions);

    if (!clientDb) {
      return res.send(
        errorRes(400, "Client not found with given phone Number")
      );
    }

    const { password: dbPassword, ...userWithoutPhone } = clientDb._doc;
    const dataToken = {
      _id: clientDb._id,
      phoneNumber: clientDb.phoneNumber,
      role: clientDb.role,
    };

    const accessToken = createJwtToken(
      dataToken,
      config.SECRET_ACCESS_KEY,
      "15m"
    );
    const refreshToken = createJwtToken(
      dataToken,
      config.SECRET_REFRESH_KEY,
      "7d"
    );

    await clientDb.updateOne({ refreshToken: refreshToken }, { new: true });

    await clientDb.save();

    return res.send(
      successRes(200, "Login Successful", {
        data: userWithoutPhone,
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const newPasswordClient = async (req, res, next) => {
  const { id } = req.params;
  const { password, newPassword } = req.body;

  try {
    if (!id) {
      return res.send(errorRes(403, "ID is required"));
    }
    // console.log(id);
    // console.log(password);
    // console.log(newPassword);
    if (!password || !newPassword) {
      return res.send(errorRes(403, "Old and new passwords are required"));
    }

    const respClient = await clientModel
      .findById(id)
      .populate(clientPopulateOptions);

    if (!respClient) {
      return res.send(errorRes(404, `Client not found with id: ${id}`));
    }
    // console.log(respClient.password);

    const isMatch = await comparePassword(password, respClient.password);

    if (!isMatch) {
      return res.send(errorRes(400, "Old password is incorrect"));
    }

    const hashedNewPassword = await encryptPassword(newPassword);
    respClient.password = hashedNewPassword;
    await respClient.save();

    return res.send(
      successRes(200, "Password updated successfully", { data: respClient })
    );
  } catch (error) {
    return next(error);
  }
};

//AUTHENTICATION
export const reAuthClient = async (req, res, next) => {
  const body = req.body;
  const { email, phoneNumber, altPhoneNumber, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!password) return res.send(errorRes(403, "Password is required"));
    if (!email) return res.send(errorRes(403, "Email is required"));
    if (!phoneNumber)
      return res.send(errorRes(403, "Phone number is required"));

    const clientDb = await clientModel
      .findOne({
        email: email,
      })
      .lean();

    if (!clientDb) {
      return res.send(errorRes(400, "No client found with given email"));
    }

    const hashPass = await comparePassword(password, clientDb.password);

    if (!hashPass) {
      return res.send(errorRes(401, "Password didn't matched"));
    }

    return res.send(
      successRes(200, "Client is registered", {
        data: true,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const forgotPasswordClient = async (req, res, next) => {
  const body = req.body;
  const { email } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    const clientDb = await clientModel
      .findOne({
        email: email,
      })
      .lean();

    const oldOtp = await otpModel.findOne({ email: email }).lean();

    if (oldOtp) {
      await sendMultipleEmail(
        [email],
        "Reset Password",
        forgotPasswordTemplete(
          `${clientDb?.firstName ?? ""} ${clientDb?.lastName ?? ""}`,
          oldOtp.otp,
          "https://evhomes.tech/"
        ),
        []
      );

      return res.send(successRes(200, `otp re-sent to ${email}`, oldOtp));
    }

    if (!clientDb) {
      return res.send(errorRes(400, `No Client found with ${email}`));
    }

    const newOtp = generateOTP(4);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: clientDb._id,
      email: email,
      type: "clients",
      message: "forgot passsword",
    });

    const savedOtp = await newOtpModel.save();

    await sendMultipleEmail(
      [email],
      "Reset Password",
      forgotPasswordTemplete(
        `${clientDb?.firstName ?? ""} ${clientDb?.lastName ?? ""}`,
        savedOtp.otp,
        "https://evhomes.tech/"
      ),
      []
    );

    return res.send(successRes(200, `otp sent to ${email}`, savedOtp._doc));
  } catch (error) {
    return next(error);
  }
};

export const resetPasswordClient = async (req, res, next) => {
  const body = req.body;
  const { otp, email, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!otp) return res.send(errorRes(403, "otp is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    if (!password) return res.send(errorRes(403, "password is required"));

    const otpDbResp = await otpModel
      .findOne({
        email: email,
      })
      .lean();

    if (!otpDbResp) {
      return res.send(errorRes(404, "Invalid Otp"));
    }
    if (otpDbResp.otp != otp) {
      return res.send(errorRes(401, "Otp didn't matched"));
    }
    const clientDb = await clientModel.findById(otpDbResp.docId).lean();
    if (!clientDb) {
      return res.send(errorRes(404, "No client found with given email"));
    }
    const hashPassword = await encryptPassword(password);
    const updatedClient = await clientModel.updateOne(
      {
        _id: clientDb._id,
      },
      {
        password: hashPassword,
      }
    );
    await otpModel.deleteOne({ _id: otpDbResp._id });

    return res.send(
      successRes(200, `Reset password sucessfully for: ${otpDbResp.email}`, {
        data: updatedClient.acknowledged,
      })
    );
  } catch (error) {
    return next(error);
  }
};

//UPDATE
export const updateClient = async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  try {
    if (!body) return res.send(errorRes(403, "Data is required"));

    // Find the client by ID
    const updatedClient = await clientModel
      .findByIdAndUpdate(
        id,
        {
          ...body,
        },
        { new: true }
      )
      .populate(clientPopulateOptions);

    if (!updatedClient) return res.senderrorRes(402, `Client not updated`);

    return res.send(
      successRes(200, `Client updated successfully`, {
        data: updatedClient,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const deleteClient = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id) return res.send(errorRes(403, "ID is required"));
    const deletedClient = await clientModel.findByIdAndDelete(id);
    if (!deletedClient)
      return res.send(errorRes(404, `Client not found with ID: ${id}`));

    return res.send(
      successRes(200, `Client deleted successfully with ID: ${id}`, {
        deletedClient,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const duplicateClients = async (req, res) => {
  try {
    const duplicates = await clientModel.aggregate([
      {
        $group: {
          _id: "$phoneNumber",
          latestId: { $last: "$_id" }, // Keep the last added document
          duplicates: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 }, // Only consider duplicates
        },
      },
    ]);

    // for (let doc of duplicates) {
    //   await clientModel.deleteMany({
    //     _id: {
    //       $in: doc.duplicates.filter(
    //         (id) => id.toString() !== doc.latestId.toString()
    //       ),
    //     },
    //   });
    // }

    // console.log("Duplicates removed successfully!");

    return res.send(
      successRes(200, `Client duplicates`, {
        duplicates,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const getClientReAuth = async (req, res, next) => {
  try {
    const accessToken = req.headers["authorization"]?.split(" ")[1];
    const refreshToken = req.headers["x-refresh-token"]?.split(" ")[1];
    // console.log(accessToken);
    // console.log(refreshToken);
    if (!accessToken) {
      res.setHeader("x-force-logout", `force-logout`);

      return res.send(
        errorRes(
          401,
          "Your session has expired. Please log in again to continue."
        )
      );
    }

    try {
      // Verify access token
      const decoded = verifyJwtToken(accessToken, config.SECRET_ACCESS_KEY);

      const user = await clientModel
        .findById(decoded.data._id)
        .select("-password -refreshToken")
        .populate(clientPopulateOptions)
        .lean();

      if (!user) {
        res.setHeader("x-force-logout", `force-logout`);
        return res.send(
          errorRes(401, "Session Expired, Please log in again to continue.")
        );
      }

      // if (user.status != "active") {
      //   res.setHeader("x-force-logout", `force-logout`);
      //   return res.send(errorRes(401, "Your account is no longer active."));
      // }

      req.user = user;
      return res.send(successRes(200, "Authenticated", { data: user }));
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Access token expired, attempt to refresh
        if (!refreshToken) {
          res.setHeader("x-force-logout", `force-logout`);
          return res.send(
            errorRes(401, "Session Expired, Please log in again to continue.")
          );
        }

        try {
          const decoded = verifyJwtToken(
            refreshToken,
            config.SECRET_REFRESH_KEY
          );
          const user = await clientModel
            .findById(decoded.data._id)

            .select("-password -refreshToken")
            .populate(clientPopulateOptions)
            .lean();

          if (!user) {
            res.setHeader("x-force-logout", `force-logout`);
            return res.send(
              errorRes(401, "Session Expired, Please log in again to continue.")
            );
          }

          const dataToken = {
            _id: user._id,
            email: user.email,
            role: user.role,
          };

          // Generate a new access token
          const newAccessToken = createJwtToken(
            dataToken,
            config.SECRET_ACCESS_KEY,
            "15m"
          );

          // Check if refresh token is about to expire (e.g., less than 1 day)
          const refreshDecoded = verifyJwtToken(
            refreshToken,
            config.SECRET_REFRESH_KEY
          );
          // console.log(refreshDecoded);
          const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
          const timeLeft = refreshDecoded.exp - currentTime;

          let newRefreshToken = refreshToken;
          if (timeLeft < 24 * 60 * 60) {
            // If less than 1 day left
            newRefreshToken = createJwtToken(
              dataToken,
              config.SECRET_REFRESH_KEY,
              "7d"
            ); // Generate a new refresh token
            res.setHeader("x-new-refresh-token", newRefreshToken); // Send new refresh token in response header
          }

          res.setHeader("Authorization", `Bearer ${newAccessToken}`);
          req.user = user;

          return res.json(
            successRes(200, "Token refreshed", {
              data: user,
              newRefreshToken:
                timeLeft < 24 * 60 * 60 ? newRefreshToken : undefined, // Include new token if generated
            })
          );
        } catch (refreshError) {
          // console.log(refreshError);
          res.setHeader("x-force-logout", `force-logout`);
          return res.send(
            errorRes(401, "Session Expired, Please log in again to continue.")
          );
        }
      }
      res.setHeader("x-force-logout", `force-logout`);

      return res.send(
        errorRes(401, "Session Expired, Please log in again to continue.")
      );
    }
  } catch (error) {
    res.setHeader("x-force-logout", `force-logout`);
    console.error("Error during re-authentication:", error);
    return res.send(errorRes(500, "Internal server error"));
  }
};

export const getBookingForClient = async (req, res, next) => {
  const id = req.params.id;
  try {
    const resp = await postSaleLeadModel
      .findOne({ phoneNumber: id })
      .populate(postSalePopulateOptionsv2);
    if (!resp) errorRes2(res, 400, "Booking not found");

    // console.log(resp);
    return successRes2(res, 200, "Booking details for client", {
      data: resp,
    });
    //
  } catch (error) {
    //
    return res.send(errorRes(500, "Internal server error"));
  }
};

export const getClientDemand = async (req, res, next) => {
  const id = req.params.id;
  try {
    const resp = await postSaleLeadModel
      .findOne({ phoneNumber: id })
      .populate(postSalePopulateOptions);

    if (!resp) {
      return errorRes2(res, 400, "Booking not found");
    }

    const demand = await Demand.find({
      booking: resp._id,
    })
      .populate(demandPopulationOptions)
      .sort({ createdAt: -1 });

    return successRes2(res, 200, "Booking details for client", {
      data: demand,
    });
  } catch (error) {
    console.error("Error in getClientDemand:", error);
    return res.status(500).json(errorRes(500, "Internal server error"));
  }
};
