import { Router } from "express";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import ExihibitionVideoModel from "../../model/exhibitionVideo/exhibitionVideo.model.js";
const exihibitionVideoRouter = Router();

exihibitionVideoRouter.get("/exhibition-video", async (req, res) => {
  //
  try {
    const oldDoc = await ExihibitionVideoModel.find().sort({ createdAt: -1 });

    //
    return successRes2(res, 200, "ok", { data: oldDoc });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

exihibitionVideoRouter.post("/add-exhibition-video", async (req, res) => {
  const body = req.body;
  const { name, phoneNumber } = body;

  try {
    if (!body) return res.send(errorRes(403, "data is required"));

    const newEOI = await ExihibitionVideoModel.create({
      ...body,
    });

    await newEOI.save();

    return successRes2(res, 200, "Entry added successfully", { data: newEOI });
  } catch (error) {
    console.error("EOI Error:", error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

export default exihibitionVideoRouter;
