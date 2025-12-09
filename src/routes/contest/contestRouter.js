import { Router } from "express";
import {
  addContest,
  getContest,
  getContestById,
  updateContestById,
} from "../../controller/contest.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const contestRouter = Router();
contestRouter.get("/contest", authenticateToken, getContest);

contestRouter.post("/contest-update/:id", authenticateToken, updateContestById);

contestRouter.post("/add-contest", authenticateToken, addContest);
contestRouter.post("/contest-byPhone", getContestById);

contestRouter.get("/contest-id/:id", authenticateToken, getContestById);
// contest.post(
//   "/contest-otp",
//   // authenticateToken,
//   generateContestOtp
// );
export default contestRouter;
