import express from "express";
import appUpdateModel from "../../model/appUpdate.model.js";
import { errorRes, successRes } from "../../model/response.js";

const appUpdateRouter = express.Router();
appUpdateRouter.get("/app-update", async (req, res) => {
  try {
    const resp = await appUpdateModel.findOne();
    return res.send(
      successRes(200, "app update info", {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
});

export default appUpdateRouter;
