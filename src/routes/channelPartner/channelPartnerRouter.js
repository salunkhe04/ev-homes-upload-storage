import { Router } from "express";
import {
  cpOnboardingApproval,
  cpOnboardingRegister,
  cpOnboardingUpdate,
  deleteChannelPartnerById,
  editChannelPartnerById,
  forgotPasswordChannelPartner,
  // generateOtpChannelPartner,
  getChannelPartnerById,
  getChannelPartnerReviewList,
  getChannelPartners,
  getCPReAuth,
  loginChannelPartner,
  loginChannelPartnerV2,
  newPassword,
  registerChannelPartner,
  resetPasswordChannelPartner,
  searchChannelPartners,
  sendEmailVerificationOtp,
  sendPhoneVerificationOtp,
  sendRegisterEmailVerificationOtp,
  syncCp,
  verifyEmailOTP,
  verifyPhoneOTP,
  verifyRegisterEmailOTP,
} from "../../controller/channelPartner.controller.js";
import { validateChannelPartnerFields } from "../../middleware/channelPartner.middleware.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import cpModel from "../../model/channelPartner.model.js";
import { encryptPassword } from "../../utils/helper.js";
import { errorRes, successRes } from "../../model/response.js";

const cpRouter = Router();

cpRouter.get("/channel-partner", authenticateToken, getChannelPartners);
cpRouter.get(
  "/channel-partner-review-list",
  authenticateToken,
  getChannelPartnerReviewList
);

cpRouter.get(
  "/search-channel-partner",
  authenticateToken,
  searchChannelPartners
);

cpRouter.get("/channel-partner/:id", authenticateToken, getChannelPartnerById);

cpRouter.post(
  "/channel-partner-register",
  validateChannelPartnerFields,
  registerChannelPartner
);

cpRouter.post(
  "/channel-partner-login",
  validateChannelPartnerFields,
  loginChannelPartner
);

cpRouter.post(
  "/channel-partner-login-v2",
  validateChannelPartnerFields,
  loginChannelPartnerV2
);

cpRouter.post(
  "/channel-partner-edit/:id",
  authenticateToken,
  validateChannelPartnerFields,
  editChannelPartnerById
);

cpRouter.post(
  "/channel-partner-onboarding-update/:id",
  // authenticateToken,
  cpOnboardingUpdate
);

cpRouter.post("/channel-partner-onboarding-register", cpOnboardingRegister);

cpRouter.post("/channel-partner-forgot-password", forgotPasswordChannelPartner);

//otp for email verification
cpRouter.post("/channel-partner-email-otp", sendEmailVerificationOtp);
cpRouter.post(
  "/channel-partner-register-email-otp",
  sendRegisterEmailVerificationOtp
);
cpRouter.post("/channel-partner-verify-email-otp", verifyEmailOTP);
cpRouter.post(
  "/channel-partner-verify-register-email-otp",
  verifyRegisterEmailOTP
);

//otp for phone verification
cpRouter.post("/channel-partner-phone-otp", sendPhoneVerificationOtp);
cpRouter.post("/channel-partner-verify-phone-otp", verifyPhoneOTP);
//
cpRouter.post(
  "/channel-partner-review-request/:id",
  // authenticateToken,
  cpOnboardingApproval
);

cpRouter.post(
  "/sync-cp",
  // authenticateToken,
  syncCp
);

cpRouter.post("/channel-partner-reset-password", resetPasswordChannelPartner);

cpRouter.post("/channel-partner-pw/:id", newPassword);

cpRouter.delete(
  "/channel-partner/:id",
  authenticateToken,
  deleteChannelPartnerById
);

cpRouter.post("/validate-channel-partner-session", getCPReAuth);
cpRouter.get("/check-cp-email-exist/:email", async (req, res) => {
  const email = req.params.email;
  try {
    if (!email) res.send(errorRes(500, "no email provided"));
    //
    const resp = await cpModel.findOne({ email: email }).select("email");

    if (resp) return res.send(successRes(200, "exist", { data: true }));

    return res.send(successRes(200, "exist", { data: false }));
  } catch (error) {
    //
    return res.send(errorRes(500, "Internal Server Error"));
  }
});

cpRouter.get("/check-cp-exist", async (req, res) => {
  const { email, phoneNumber, reraNumber } = req.query;
  try {
    console.log(req.query);
    if (!email && !phoneNumber && !reraNumber) {
      return res.send(errorRes(400, "No query provided"));
    }
    let query = {
      $or: [],
    };
    if (email) {
      //
      query.$or.push({
        email: email,
      });
    }

    if (phoneNumber) {
      //
      query.$or.push({
        phoneNumber: phoneNumber,
      });
    }

    if (reraNumber) {
      //
      query.$or.push({
        reraNumber: reraNumber,
      });
    }

    console.log(query);
    //
    const resp = await cpModel
      .findOne(query)
      .select("email phoneNumber reraNumber");

    if (resp) return res.send(successRes(200, "exist", { data: true }));

    return res.send(successRes(200, "exist", { data: false }));
  } catch (error) {
    //
    return res.send(errorRes(500, "Internal Server Error"));
  }
});

// cpRouter.post("/channel-set-name-empty", async (req, res) => {
//   try {
//     // Update all documents where firstName or lastName is null
//     const result = await cpModel.updateMany(
//       {
//         $or: [{ firstName: null }, { lastName: null }],
//       },
//       {
//         $set: { firstName: "", lastName: "" },
//       }
//     );

//     res.json({
//       message: "Updated firstName and lastName to empty string where null",
//       matchedCount: result.matchedCount,
//       modifiedCount: result.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Error updating channel partner names:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// });

export default cpRouter;
