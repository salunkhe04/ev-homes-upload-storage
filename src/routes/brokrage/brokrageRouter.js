import { Router } from "express";
import { brokerageModel } from "../../model/brokerageCalculationData.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import ourProjectModel from "../../model/ourProjects.model.js";
import { brokeragePopulate } from "../../utils/constant.js";
const brokrageRouter = Router();

brokrageRouter.get(
  "/search-brokerage",
  //   authenticateToken,
  async (req, res) => {
    //
    try {
      //
      const resp = await brokerageModel.find().populate(brokeragePopulate);

      return successRes2(res, 200, "added", { data: resp });
    } catch (error) {
      //
      console.log(error);
      return errorRes2(res, 500, "Server Error");
    }
  }
);

brokrageRouter.post(
  "/add-brokerage",
  //   authenticateToken,
  async (req, res) => {
    const body = req.body;
    //
    // console.log(body);
    try {
      //
      const count = await brokerageModel.countDocuments({
        project: body.project,
      });
      const proj = await ourProjectModel.findById(body.project, {
        shortCode: 1,
      });

      let brokeId = `BRK/${proj.shortCode ?? "DIRECT"}/${count + 1}`;
      const resp = await brokerageModel.create({
        ...body,
        phone: body?.phone ?? 0,
        brokerageId: brokeId,
      });
      const updatedResp = await brokerageModel
        .findById(resp._id)
        .populate(brokeragePopulate);

      return successRes2(res, 200, "added", { data: updatedResp });
    } catch (error) {
      //
      console.log(error);
      return errorRes2(res, 500, "Server Error");
    }
  }
);
// TODO:fix

export default brokrageRouter;
