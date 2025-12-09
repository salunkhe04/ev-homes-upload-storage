import { Router } from "express";
import {
  addRequirement,
  getRequirements,
} from "../../controller/requirement.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import scaleModel from "../../model/incentive/scale.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
const scaleRouter = Router();

scaleRouter.get("/scales", authenticateToken, async (req, res) => {
  const { status } = req.query;

  try {
    const resp = await scaleModel.find({ ...(status ? { status } : {}) });
    return successRes2(res, 200, "scales", { data: resp });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});
scaleRouter.post("/scale-add", authenticateToken, async (req, res) => {
  const { name, amountCp, amountNonCp, type = "scales" } = req.body;
  try {
    //
    let id = `${name}-scale`.toLowerCase();

    const resp = await scaleModel.create({ ...req.body, _id: id });

    return successRes2(res, 200, "scales", { data: resp });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

export default scaleRouter;
