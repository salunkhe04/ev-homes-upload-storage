import { Router } from "express";
import { addTarget, getQuarterWiseTarget } from "../../controller/bookingTarget.controller.js";

const bookingTargetRouter = Router();
bookingTargetRouter.get("/revised-my-target/:id",getQuarterWiseTarget);
bookingTargetRouter.post("/revised-add-target",addTarget);

export default bookingTargetRouter;
