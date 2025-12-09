import axios from "axios";
import config from "../config/config.js";
import { validateRegisterCPFields } from "../middleware/channelPartner.middleware.js";
import cpModel, {
  channelPartnerSchema,
} from "../model/channelPartner.model.js";
import oneSignalModel from "../model/oneSignal.model.js";
import otpModel from "../model/otp.model.js";
import { errorRes, successRes } from "../model/response.js";
import {
  cpAccountOTPTemplate,
  forgotPasswordTemplete,
} from "../templates/html_template.js";
import { sendEmail, sendMultipleEmail } from "../utils/brevo.js";
import {
  comparePassword,
  createJwtToken,
  encryptPassword,
  generateOTP,
  verifyJwtToken,
} from "../utils/helper.js";
import { sendNotificationWithImage } from "./oneSignal.controller.js";

export const getChannelPartners = async (req, res, next) => {
  try {
    const respCP = await cpModel.find({
        status: "active",
      }).select("-password -refreshToken");
    return res.send(
      successRes(200, "Get Channel Partners ", {
        data: respCP,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const getChannelPartnerReviewList = async (req, res, next) => {
  try {
    const respCP = await cpModel
      .find({
        $or: [
          {
            onBoarding: "approved",
          },
          {
            onBoarding: "under-review",
          },
          {
            onBoarding: "rejected",
          },
        ],
        // onBoarding: "under-review",
      })
      .select("-password -refreshToken");

    return res.send(
      successRes(200, "Get Channel Partners for review ", {
        data: respCP,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const searchChannelPartners = async (req, res, next) => {
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

    const respCP = await cpModel
      .find(searchFilter)
      .skip(skip)
      .limit(limit)
      .select("-password -refreshToken");

    // Count the total items matching the filter
    const totalItems = await cpModel.countDocuments(searchFilter);

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

export const getChannelPartnerById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respCP = await cpModel.findById(id).select("-password -refreshToken");

    //if not found
    if (!respCP) {
      return res.send(
        errorRes(404, `Channel Partner not found with id: ${id}`)
      );
    }
    //if found
    return res.send(
      successRes(200, `get Channel Partner by id ${id}`, {
        data: respCP,
      })
    );
  } catch (error) {
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const editChannelPartnerById = async (req, res, next) => {
  const id = req.params.id;
  const body = req.filteredBody;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "valid data is required"));

    const respCP = await cpModel.findById(id);

    //if not found
    if (!respCP) {
      return res.send(
        errorRes(404, `Channel Partner not found with id: ${id}`)
      );
    }
    if (body.password) {
      const saltRounds = 10; // You can adjust the number of salt rounds based on your security requirements
      body.password = await encryptPassword(body.password, saltRounds);
    }

    await respCP.updateOne(
      {
        ...body,
      },
      { new: true }
    );

    // const updateResp = await cpModel.updateOne(
    //   { _id: id },
    //   {
    //     ...body,
    //   }
    // );

    //if all ok
    return res.send(
      successRes(200, `updated Channel Partner by id ${id}`, {
        data: respCP,
      })
    );
  } catch (error) {
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const deleteChannelPartnerById = async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    const respCP = await cpModel.findById(id);

    //if not found
    if (!respCP) {
      return res.send(
        errorRes(404, `Channel Partner not found with id: ${id}`)
      );
    }
    const deletedResp = await respCP.deleteOne();
    //if found
    return res.send(
      successRes(200, `deleted Channel Partner by id ${id}`, {
        data: deletedResp,
      })
    );
  } catch (error) {
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const registerChannelPartner = async (req, res, next) => {
  const body = req.filteredBody;
  const { firmName, firstName, lastName, email, phoneNumber, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (password.length < 6) {
      return res.send(
        errorRes(400, "Password should be at least 6 character long.")
      );
    }
    const validateFields = validateRegisterCPFields(body);
    if (!validateFields.isValid) {
      return res.send(errorRes(400, validateFields.message));
    }

    const oldUser = await cpModel
      .findOne({
        $or: [
          {
            email: email,
          },
          { phoneNumber: phoneNumber },
        ],
      })
      .lean();

    if (oldUser) {
      return res.send(
        errorRes(400, "Account already exist with this email or phone number")
      );
    }

    const hashPassword = await encryptPassword(password);

    const newCpId =
      firmName?.replace(/\s+/g, "-").toLowerCase() +
      "-" +
      firstName?.replace(/\s+/g, "").toLowerCase() +
      "-" +
      lastName.replace(/\s+/g, "").toLowerCase();

    const newChannelPartner = new cpModel({
      ...body,
      _id: newCpId,
      password: hashPassword,
    });
    const savedCp = await newChannelPartner.save();

    const { password: dbPassword, ...userWithoutPassword } = savedCp._doc;

    const dataToken = {
      _id: savedCp._id,
      email: savedCp.email,
      role: savedCp.role,
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
    savedCp.refreshToken = refreshToken;
    await savedCp.save();

    return res.send(
      successRes(200, "channel partner is registered", {
        data: userWithoutPassword,
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const loginChannelPartner = async (req, res, next) => {
  const body = req.filteredBody;
  const { email, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    if (!password) return res.send(errorRes(403, "password is required"));

    const channelPartnerDb = await cpModel.findOne({
      email: email,
    });

    if (!channelPartnerDb) {
      return res.send(errorRes(404, "No Channel Partner found"));
    }

    // const hashPassword = await encryptPassword(password);

    const hashPass = await comparePassword(password, channelPartnerDb.password);

    if (!hashPass) {
      return res.send(errorRes(401, "Password didn't Matched"));
    }

    const {
      password: dbPassword,
      refreshToken: dbRefreshToken,
      ...userWithoutPassword
    } = channelPartnerDb._doc;

    const dataToken = {
      _id: channelPartnerDb._id,
      email: channelPartnerDb.email,
      role: channelPartnerDb.role,
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
    await channelPartnerDb.updateOne({
      refreshToken: refreshToken,
    });

    // await cpModel.updateOne(
    //   { _id: channelPartnerDb._id },
    //   {
    //     refreshToken: refreshToken,
    //   }
    // );
    // savedCp.refreshToken = refreshToken;
    // await savedCp.save();

    return res.send(
      successRes(200, "Login Successful", {
        data: userWithoutPassword,
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const loginChannelPartnerV2 = async (req, res, next) => {
  const body = req.filteredBody;
  const { email, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    if (!password) return res.send(errorRes(403, "password is required"));

    const channelPartnerDb = await cpModel.findOne({
      email: email,
    });

    if (!channelPartnerDb) {
      return res.send(errorRes(404, "No Channel Partner found"));
    }

    // const hashPassword = await encryptPassword(password);

    const hashPass = await comparePassword(password, channelPartnerDb.password);

    if (!hashPass) {
      return res.send(errorRes(401, "Password didn't Matched"));
    }

    const {
      password: dbPassword,
      refreshToken: dbRefreshToken,
      ...userWithoutPassword
    } = channelPartnerDb._doc;

    const dataToken = {
      _id: channelPartnerDb._id,
      email: channelPartnerDb.email,
      role: channelPartnerDb.role,
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
    await channelPartnerDb.updateOne({
      refreshToken: refreshToken,
    });

    // await cpModel.updateOne(
    //   { _id: channelPartnerDb._id },
    //   {
    //     refreshToken: refreshToken,
    //   }
    // );
    // savedCp.refreshToken = refreshToken;
    // await savedCp.save();

    return res.send(
      successRes(200, "Login Successful", {
        data: userWithoutPassword,
        accessToken,
        refreshToken,
      })
    );
  } catch (error) {
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
    // console.log(id);
    // console.log(password);
    // console.log(newPassword);
    if (!password || !newPassword) {
      return res.send(errorRes(403, "Old and new passwords are required"));
    }

    const respCP = await cpModel.findById(id);

    if (!respCP) {
      return res.send(
        errorRes(404, `Channel Partner not found with id: ${id}`)
      );
    }
    // console.log("pass 1");
    // console.log(respCP.password);

    const isMatch = await comparePassword(password, respCP.password);
    // console.log("pass 2");

    if (!isMatch) {
      return res.send(errorRes(400, "Old password is incorrect"));
    }
    // console.log("pass 3");

    const hashedNewPassword = await encryptPassword(newPassword);
    respCP.password = hashedNewPassword;
    await respCP.save();
    // console.log("pass 4");

    return res.send(
      successRes(200, "Password updated successfully", { data: respCP })
    );
  } catch (error) {
    return next(error);
  }
};

export const reAuthChannelPartner = async (req, res, next) => {
  const body = req.body;
  const { email, password } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    if (!password) return res.send(errorRes(403, "password is required"));

    const channelPartnerDb = await cpModel
      .findOne({
        email: email,
      })
      .lean();

    if (!channelPartnerDb) {
      return res.send(errorRes(400, "No Channel Partner found"));
    }

    const hashPass = await comparePassword(password, channelPartnerDb.password);

    if (!hashPass) {
      return res.send(errorRes(401, "Password didn't Matched"));
    }

    return res.send(
      successRes(200, "channel partner is verified", {
        status: true,
      })
    );
  } catch (error) {
    return next(error);
  }
};

// export const forgotPasswordChannelPartner = async (req, res, next) => {
//   const body = req.body;
//   const { email } = body;
//   try {
//     if (!body) return res.send(errorRes(403, "data is required"));
//     if (!email) return res.send(errorRes(403, "email is required"));

//     const oldOtp = await otpModel.findOne({ email: email }).lean();

//     if (oldOtp) {
//       return res.send(successRes(200, `otp re-sent to ${email}`, oldOtp));
//     }

//     const channelPartnerDb = await cpModel
//       .findOne({
//         email: email,
//       })
//       .lean();

//     if (!channelPartnerDb) {
//       return res.send(errorRes(404, `Account not with ${email}`));
//     }

//     const newOtp = generateOTP(4);
//     const newOtpModel = new otpModel({
//       otp: newOtp,
//       docId: channelPartnerDb._id,
//       email: email,
//       type: "channel-partner",
//       message: "forgot passsword",
//     });

//     const savedOtp = await newOtpModel.save();

//     return res.send(successRes(200, `otp sent to ${email}`, savedOtp._doc));
//   } catch (error) {
//     return next(error);
//   }
// };

export const forgotPasswordChannelPartner = async (req, res, next) => {
  const body = req.body;
  const { email } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    const channelPartnerDb = await cpModel
      .findOne({
        email: email,
      })
      .lean();

    if (!channelPartnerDb) {
      return res.send(
        errorRes(400, `No channel partner found with given email: ${email}`)
      );
    }

    const oldOtp = await otpModel.findOne({ email: email }).lean();

    if (oldOtp) {
      await sendMultipleEmail(
        [email],
        "Reset Password",
        forgotPasswordTemplete(
          `${channelPartnerDb.firstName} ${channelPartnerDb.lastName}`,
          oldOtp.otp,
          "https://evhomes.tech/"
        ),
        []
      );
      return res.send(
        successRes(200, `Your OTP has been re-sent to ${email}`, {
          data: oldOtp,
        })
      );
    }

    const newOtp = generateOTP(4);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: channelPartnerDb._id,
      email: email,
      type: "channel partner",
      message: "forgot passsword",
    });

    const savedOtp = await newOtpModel.save();

    await sendMultipleEmail(
      [email],
      "Reset Password",
      forgotPasswordTemplete(
        `${channelPartnerDb.firstName} ${channelPartnerDb.lastName}`,
        savedOtp.otp,
        "https://evhomes.tech/"
      ),
      []
    );

    return res.send(
      successRes(200, `Your OTP has been sent to ${email}`, {
        data: savedOtp._doc,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const sendEmailVerificationOtp = async (req, res, next) => {
  const body = req.body;
  const { email } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));
    const channelPartnerDb = await cpModel
      .findOne({
        email: email,
      })
      .lean();

    if (!channelPartnerDb) {
      return res.send(
        errorRes(400, `No channel partner found with given email: ${email}`)
      );
    }

    const oldOtp = await otpModel.findOne({ email: email }).lean();

    if (oldOtp) {
      await sendMultipleEmail(
        [email],
        `OTP for ${channelPartnerDb.firmName}`,
        cpAccountOTPTemplate(
          `${channelPartnerDb.firstName} ${channelPartnerDb.lastName}`,
          "email",
          oldOtp.otp,
          "https://evhomes.tech/"
        ),
        []
      );
      return res.send(
        successRes(200, `Your OTP has been re-sent to ${email}`, {
          data: oldOtp,
        })
      );
    }

    const newOtp = generateOTP(6);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: channelPartnerDb._id,
      email: email,
      type: "channel partner",
      message: "forgot passsword",
    });

    const savedOtp = await newOtpModel.save();

    await sendMultipleEmail(
      [email],
      `OTP for ${channelPartnerDb.firmName}`,
      cpAccountOTPTemplate(
        `${channelPartnerDb.firstName} ${channelPartnerDb.lastName}`,
        "email",
        savedOtp.otp,
        "https://evhomes.tech/"
      ),
      []
    );

    return res.send(
      successRes(200, `Your OTP has been sent to ${email}`, {
        data: savedOtp._doc,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const sendRegisterEmailVerificationOtp = async (req, res, next) => {
  const body = req.body;
  const { email, firmName } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!email) return res.send(errorRes(403, "email is required"));

    const oldOtp = await otpModel.findOne({ email: email }).lean();

    if (oldOtp) {
      await sendMultipleEmail(
        [email],
        `OTP for ${firmName}`,
        cpAccountOTPTemplate(
          `${firmName}`,
          "email",
          oldOtp.otp,
          "https://evhomes.tech/"
        ),
        []
      );
      return res.send(
        successRes(200, `Your OTP has been re-sent to ${email}`, {
          data: oldOtp,
        })
      );
    }

    const newOtp = generateOTP(6);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: email,
      email: email,
      type: "channel partner",
      message: "forgot passsword",
    });

    const savedOtp = await newOtpModel.save();

    await sendMultipleEmail(
      [email],
      `OTP for ${email}`,
      cpAccountOTPTemplate(
        `${email}`,
        "email",
        savedOtp.otp,
        "https://evhomes.tech/"
      ),
      []
    );

    return res.send(
      successRes(200, `Your OTP has been sent to ${email}`, {
        data: savedOtp._doc,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const verifyEmailOTP = async (req, res, next) => {
  const body = req.body;
  const { otp, email } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!otp) return res.send(errorRes(403, "otp is required"));
    if (!email) return res.send(errorRes(403, "email is required"));

    const otpDbResp = await otpModel.findOne({
      email: email,
    });

    if (!otpDbResp) {
      return res.send(errorRes(404, "Invalid Otp"));
    }
    if (otpDbResp.otp != otp) {
      return res.send(errorRes(401, "Otp didn't matched"));
    }

    const channelPartnerDb = await cpModel
      .findById(otpDbResp.docId)
      .select("-password -refreshToken");

    if (!channelPartnerDb) {
      return res.send(errorRes(404, "No Employee found with given email"));
    }

    await channelPartnerDb.updateOne(
      {
        isVerifiedEmail: true,
      },
      { new: true }
    );
    const updatedCP = await cpModel
      .findById(channelPartnerDb._id)
      .select("-password -refreshToken");

    try {
      await otpDbResp.deleteOne();
    } catch (error) {
      //
      console.log(error);
    }

    return res.send(
      successRes(200, `Email Verified Successfully`, {
        data: updatedCP,
      })
    );
  } catch (error) {
    console.log(error);

    return next(error);
  }
};

export const verifyRegisterEmailOTP = async (req, res, next) => {
  const body = req.body;
  const { otp, email } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!otp) return res.send(errorRes(403, "otp is required"));
    if (!email) return res.send(errorRes(403, "email is required"));

    const otpDbResp = await otpModel.findOne({
      email: email,
    });

    if (!otpDbResp) {
      return res.send(errorRes(404, "Invalid Otp"));
    }
    if (otpDbResp.otp != otp) {
      return res.send(errorRes(401, "Otp didn't matched"));
    }

    try {
      await otpDbResp.deleteOne();
    } catch (error) {
      //
      console.log(error);
    }

    return res.send(
      successRes(200, `Email Verified Successfully`, {
        data: true,
      })
    );
  } catch (error) {
    console.log(error);

    return next(error);
  }
};

export const sendPhoneVerificationOtp = async (req, res, next) => {
  const body = req.body;
  const { phoneNumber } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!phoneNumber) return res.send(errorRes(403, "email is required"));
    const channelPartnerDb = await cpModel
      .findOne({
        phoneNumber: phoneNumber,
      })
      .lean();

    if (!channelPartnerDb) {
      return res.send(
        errorRes(
          400,
          `No channel partner found with given email: ${phoneNumber}`
        )
      );
    }

    const oldOtp = await otpModel.findOne({ phoneNumber: phoneNumber }).lean();

    if (oldOtp) {
      // await sendMultipleEmail(
      //   [email],
      //   `OTP for ${channelPartnerDb.firmName}`,
      //   cpAccountOTPTemplate(
      //     `${channelPartnerDb.firstName} ${channelPartnerDb.lastName}`,
      //     "email",
      //     oldOtp.otp,
      //     "https://evhomes.tech/"
      //   ),
      //   []
      // );
      return res.send(
        successRes(200, `Your OTP has been re-sent to ${phoneNumber}`, {
          data: oldOtp,
        })
      );
    }

    const newOtp = generateOTP(6);
    const newOtpModel = new otpModel({
      otp: newOtp,
      docId: channelPartnerDb._id,
      email: email,
      type: "channel partner",
      message: "forgot passsword",
    });

    const savedOtp = await newOtpModel.save();

    // await sendMultipleEmail(
    //   [email],
    //   `OTP for ${channelPartnerDb.firmName}`,
    //   cpAccountOTPTemplate(
    //     `${channelPartnerDb.firstName} ${channelPartnerDb.lastName}`,
    //     "email",
    //     savedOtp.otp,
    //     "https://evhomes.tech/"
    //   ),
    //   []
    // );

    return res.send(
      successRes(200, `Your OTP has been sent to ${email}`, {
        data: savedOtp._doc,
      })
    );
  } catch (error) {
    return next(error);
  }
};

export const verifyPhoneOTP = async (req, res, next) => {
  const body = req.body;
  const { otp, phoneNumber } = body;
  try {
    if (!body) return res.send(errorRes(403, "data is required"));
    if (!otp) return res.send(errorRes(403, "otp is required"));
    if (!phoneNumber) return res.send(errorRes(403, "phoneNumber is required"));

    const otpDbResp = await otpModel.findOne({
      phoneNumber: phoneNumber,
    });

    if (!otpDbResp) {
      return res.send(errorRes(404, "Invalid Otp"));
    }
    if (otpDbResp.otp != otp) {
      return res.send(errorRes(401, "Otp didn't matched"));
    }

    const channelPartnerDb = await cpModel
      .findById(otpDbResp.docId)
      .select("-password -refreshToken");

    if (!channelPartnerDb) {
      return res.send(
        errorRes(404, "No Employee found with given phoneNumber")
      );
    }

    await channelPartnerDb.updateOne(
      {
        isVerifiedPhone: true,
      },
      { new: true }
    );
    const updatedCP = await cpModel
      .findById(channelPartnerDb._id)
      .select("-password -refreshToken");

    try {
      await otpDbResp.deleteOne();
    } catch (error) {
      //
      console.log(error);
    }

    return res.send(
      successRes(200, `Phone Number Verified Successfully`, {
        data: updatedCP,
      })
    );
  } catch (error) {
    console.log(error);

    return next(error);
  }
};

// export const resetPasswordChannelPartner = async (req, res, next) => {
//   const body = req.filteredBody;
//   const { otp, email, password } = body;
//   try {
//     if (!body) return res.send(errorRes(403, "data is required"));
//     if (!otp) return res.send(errorRes(403, "otp is required"));
//     if (!email) return res.send(errorRes(403, "email is required"));
//     if (!password) return res.send(errorRes(403, "password is required"));

//     const otpDbResp = await otpModel.findOne({
//       email: email,
//     });

//     if (!otpDbResp) {
//       return res.send(errorRes(404, "Invalid Otp"));
//     }
//     if (otpDbResp.otp != otp) {
//       return res.send(errorRes(401, "Otp didn't matched"));
//     }
//     const channelPartnerDb = await cpModel.findById(otpDbResp.docId);
//     if (!channelPartnerDb) {
//       return res.send(
//         errorRes(404, "No Channel Partner found with given email")
//       );
//     }
//     const hashPassword = await encryptPassword(password);

//     await channelPartnerDb.updateOne(
//       {
//         password: hashPassword,
//       },
//       { new: true }
//     );

//     // const updatedPassChannelPartner = await cpModel.updateOne(
//     //   {
//     //     _id: channelPartnerDb._id,
//     //   },
//     //   {
//     //     password: hashPassword,
//     //   }
//     // );
//     await otpDbResp.deleteOne();
//     // await otpModel.deleteOne({ _id: otpDbResp._id });

//     return res.send(
//       successRes(200, `Reset password sucessfully for: ${otpDbResp.email}`, {
//         status: channelPartnerDb.acknowledged,
//       })
//     );
//   } catch (error) {
//     return next(error);
//   }
// };

export const resetPasswordChannelPartner = async (req, res, next) => {
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

    const channelPartnerDb = await cpModel
      .findById(otpDbResp.docId)
      .select("-password -refreshToken");

    if (!channelPartnerDb) {
      return res.send(errorRes(404, "No Employee found with given email"));
    }
    const hashPassword = await encryptPassword(password);
    await channelPartnerDb.updateOne(
      {
        password: hashPassword,
      },
      { new: true }
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
        data: channelPartnerDb,
      })
    );
  } catch (error) {
    return next(error);
  }
};

// export  const generateOtpChannelPartner = async (req, res, next) => {
//   const{email,password}=req.body;
//   try {
//     const user = await channelPartnerSchema.findById(_id);

// const newOtp = generateOTP(4);
// const newOtpModel = new otpModel({
//   otp: newOtp,
//   docId: user?._id,
//   email: email ?? "noemailprovided2026625@gmail.com",
//   phoneNumber: phoneNumber,
//   type: "channel-partner-otp",
//   message: "Channel Partner OTP verifification code.",
// });

// const savedOtp = await newOtpModel.save();
// return res.send(
//   successRes(200, "otp Sent to Client", {
//     data: savedOtp,
//   })
// );
//   }
//   catch (error) {
//     return next(error);
//   }
// };

export const getCPReAuth = async (req, res, next) => {
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

      const user = await cpModel
        .findById(decoded.data._id)
        .select("-password -refreshToken")
        // .populate(employeePopulateOptions)
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
          const user = await cpModel
            .findById(decoded.data._id)
            .select("-password -refreshToken")
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

export const cpOnboardingRegister = async (req, res, next) => {
  const body = req.body;
  const { firmName, firstName, lastName, email, phoneNumber, password } =
    req.body;
  try {
    if (!body) return res.send(errorRes(403, "valid data is required"));
    // console.log(body);
    const oldCp = await cpModel.findOne({
      $or: [{ email: email }, { phoneNumber: phoneNumber }],
    });

    if (oldCp)
      return res.send(
        errorRes(401, "account already exist with email or phone Number")
      );

    const hashPassword = await encryptPassword(password?.toString());

    const newCpId =
      firmName?.replace(/\s+/g, "-").toLowerCase() +
      "-" +
      firstName?.replace(/\s+/g, "").toLowerCase() +
      "-" +
      lastName.replace(/\s+/g, "").toLowerCase();

    const newResp = await cpModel.create({
      ...body,
      _id: newCpId,
      password: hashPassword,
      onBoarding: "under-review",
      onBoardingDate: new Date(),
    });
    const updatedResp = await cpModel.findById(newResp?._id);

    try {
      const foundTLPlayerId = await oneSignalModel.find({
        docId: {
          $in: [
            "ev15-deepak-karki",
            //  "ev201-aktarul-biswas"
          ],
        },
      });
      // console.log("passed note 5 ");

      if (foundTLPlayerId.length > 0) {
        // console.log(foundTLPlayerId);
        const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

        await sendNotificationWithImage({
          playerIds: getPlayerIds,
          title: `${updatedResp?.firmName} Requested for onboarding`,
          imageUrl:
            "https://cdn.evhomes.tech/279d986d-d71d-4317-84f2-ce1d3fb8205a-11630063.jpg",
          message: `Hey, ${updatedResp?.firmName} is requesting onboarding please check the details`,
          data: {},
        });
      }
    } catch (error) {
      //
      console.log(error);
    }

    //if all ok
    return res.send(
      successRes(200, `Your request is sent for review`, {
        data: updatedResp,
      })
    );
  } catch (error) {
    console.log(error);

    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const cpOnboardingUpdate = async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "valid data is required"));
    console.log(body);
    const respCP = await cpModel.findById(id);

    //if not found
    if (!respCP) {
      return res.send(
        errorRes(404, `Channel Partner not found with id: ${id}`)
      );
    }

    await cpModel.findByIdAndUpdate(
      id,
      {
        ...body,
        onBoarding: "under-review",
        onBoardingDate: new Date(),
      },
      { new: true }
    );
    const updatedResp = await cpModel.findById(id);

    try {
      const foundTLPlayerId = await oneSignalModel.find({
        docId: {
          $in: [
            "ev15-deepak-karki",
            //  "ev201-aktarul-biswas"
          ],
        },
      });
      // console.log("passed note 5 ");

      if (foundTLPlayerId.length > 0) {
        // console.log(foundTLPlayerId);
        const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

        await sendNotificationWithImage({
          playerIds: getPlayerIds,
          title: `${updatedResp?.firmName} Requested for onboarding`,
          imageUrl:
            "https://cdn.evhomes.tech/279d986d-d71d-4317-84f2-ce1d3fb8205a-11630063.jpg",
          message: `Hey, ${updatedResp?.firmName} is requesting onboarding please check the details`,
          data: {},
        });
      }
    } catch (error) {
      //
    }

    //if all ok
    return res.send(
      successRes(200, `Your request is sent for review`, {
        data: updatedResp,
      })
    );
  } catch (error) {
    console.log(error);
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const cpOnboardingApproval = async (req, res, next) => {
  const id = req.params.id;
  const body = req.body;
  const user = req.user;
  const { status, remark } = req.body;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));
    if (!body) return res.send(errorRes(403, "valid data is required"));

    // console.log(body);
    const respCP = await cpModel.findById(id);
    let updatedResp = await cpModel.findById(id);

    //if not found
    if (!respCP) {
      return res.send(
        errorRes(404, `Channel Partner not found with id: ${id}`)
      );
    }
    let updates = {
      onBoarding: "approved",
      onBoardingApproval: user?._id,
      onBoardingApprovalDate: new Date(),
      isVerified: true,
      status: "active",
      onBoardingApprovalRemark: remark,
    };
    if (status === "rejected") {
      updates = {
        onBoarding: "rejected",
        onBoardingApproval: user?._id,
        onBoardingApprovalDate: new Date(),
        onBoardingApprovalRemark: remark,
      };
    }
    await cpModel.findByIdAndUpdate(
      id,
      {
        onBoarding: status,
        onBoardingApproval: user?._id,
        onBoardingApprovalDate: new Date(),
        isVerified: true,
        status: "active",
        onBoardingApprovalRemark: remark,
      },
      { new: true }
    );

    if (status === "approved") {
      const headers = {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.BREVO_API_KEY,
      };

      const brevoFolderId = 21;

      const brevoResponse = await axios.post(
        "https://api.brevo.com/v3/contacts/lists",
        {
          name: updatedResp?.firmName,
          folderId: brevoFolderId,
        },
        { headers }
      );

      console.log("bre list created:", brevoResponse.data);

      const brevoListId = brevoResponse?.data?.id;

      if (brevoListId) {
        await cpModel.findByIdAndUpdate(
          id,
          { brevoId: brevoListId },
          { new: true }
        );
        updatedResp = await cpModel.findById(id);
      }
    }

    console.log("pass till here");

    try {
      const foundTLPlayerId = await oneSignalModel.find({
        docId: { $in: [updatedResp?._id] },
      });
      // console.log("passed note 5 ");

      if (foundTLPlayerId.length > 0) {
        // console.log(foundTLPlayerId);
        const getPlayerIds = foundTLPlayerId.map((dt) => dt.playerId);

        await sendNotificationWithImage({
          playerIds: getPlayerIds,
          title: `Your Request is ${status}`,
          imageUrl:
            "https://cdn.evhomes.tech/5d6c80bb-7232-43cd-9594-856587f0697b-10306566.jpg",
          message: `Hey, ${updatedResp?.firmName} your request for onboarding is ${status}`,
          data: {},
        });
      }
    } catch (error) {
      //
    }

    //if all ok
    return res.send(
      successRes(200, `Your request is sent for review`, {
        data: updatedResp,
      })
    );
  } catch (error) {
    return next(error);
    // return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
};

export const syncCp = async (req, res, next) => {
  try {
    // 1. Find all already approved & active CPs that do NOT have brevoId
    const cps = await cpModel.find({
      onBoarding: "approved",
      status: "active",
      brevoId: { $exists: false },
    });

    const headers = {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.BREVO_API_KEY,
    };

    const brevoFolderId = 21; // <-- Replace with your actual folder ID in Brevo

    let synced = [];
    for (const cp of cps) {
      try {
        const brevoResponse = await axios.post(
          "https://api.brevo.com/v3/contacts/lists",
          {
            name: cp.firmName,
            folderId: brevoFolderId,
          },
          { headers }
        );

        const brevoListId = brevoResponse?.data?.id;

        console.log(brevoListId);

        if (brevoListId) {
          await cpModel.findByIdAndUpdate(cp._id, { brevoId: brevoListId });
          synced.push({ cp: cp.firmName, brevoId: brevoListId });
        }
      } catch (err) {
        console.log(
          "Brevo sync error for CP:",
          cp.firmName,
          err?.response?.data || err.message
        );
      }
    }

    return res.send(
      successRes(200, "Auto Sync Completed", {
        syncedCount: synced.length,
        synced,
      })
    );
  } catch (error) {
    return next(error);
  }
};
