import { Router } from "express";
import { successRes, successRes2 } from "../../model/response.js";
import otpModel from "../../model/otp.model.js";

const otpRouter = Router();

otpRouter.get("/get-otp", async (req, res, next) => {

  try {
    const user = await otpModel.find({});

    return successRes2(res,200, "Get otp", {data:user});
  } catch (error) {
    return next(error);
  }
});

export default otpRouter;
