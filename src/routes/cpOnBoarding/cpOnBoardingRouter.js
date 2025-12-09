import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  getMonthlyTarget,
  getOnBoardedCp,
  getOnBoardedCpById,
  onboardCp,
} from "../../controller/cpOnBoarding.controller.js";

const CpOnBoardingRouter = Router();

// Onboarding list
CpOnBoardingRouter.get("/channel-partner-onboards", getOnBoardedCp);
// onboard by id
CpOnBoardingRouter.get("/channel-partner-onboard/:id", getOnBoardedCpById);

// ONBOARD new channel Partner
CpOnBoardingRouter.post("/onboard-channel-partner", onboardCp);

// onboard by month
CpOnBoardingRouter.get("/onboard-target", getMonthlyTarget);

export default CpOnBoardingRouter;
