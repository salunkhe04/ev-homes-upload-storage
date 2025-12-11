import { Router } from "express";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import ExihibitionVideoCountModel from "../../model/exhibitionVideoCount/exhibitionVideoCount.js";

const exhibitionVideoCountRouter = Router();

exhibitionVideoCountRouter.get("/exhibition-video-count", async (req, res) => {
  //
  try {
    const oldDoc = await ExihibitionVideoCountModel.find().sort({
      createdAt: -1,
    });

    //
    return successRes2(res, 200, "ok", { data: oldDoc });
  } catch (error) {
    //
    return errorRes2(res, 500, "Internal Server Error");
  }
});

exhibitionVideoCountRouter.post(
  "/update-exhibition-count",
  async (req, res) => {
    try {
      const { count } = req.body;

      let doc = await ExihibitionVideoCountModel.findOne();

      if (!doc) {
        doc = await ExihibitionVideoCountModel.create({
          count,
          previousCount: 0,
        });
      } else {
        const lastCount = doc.count;

        doc.previousCount = lastCount;
        doc.count = count;

        await doc.save();
      }

      return successRes2(res, 200, "ok", {
        data: {
          previousCount: doc.previousCount,
          currentCount: doc.count,
        },
      });
    } catch (error) {
      console.error("Update count error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default exhibitionVideoCountRouter;
