import { Router } from "express";

import zonesModel from "../../model/zones.model.js";
import { errorRes, errorRes2, successRes } from "../../model/response.js";

const zonesRouter = Router();
zonesRouter.get("/zones", async (req, res) => {
  try {
    const resp = await zonesModel.find();

    return res.send(
      successRes(200, "zones list", {
        data: resp,
      })
    );
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});
zonesRouter.post("/zones-add", async (req, res) => {
  const body = req.body;
  const { zoneName } = body;
  try {
    if (!zoneName) return res.send(errorRes(403, "requirement is required"));

    const newCompany = await zonesModel.create({
      zoneName: zoneName,
    });

    return res.send(
      successRes(200, `zone added successfully: ${zoneName}`, {
        data: newCompany.zoneName,
      })
    );
  } catch (error) {
    //
    return errorRes2(res, 500, `${error?.message || error}`);
  }
});
export default zonesRouter;
