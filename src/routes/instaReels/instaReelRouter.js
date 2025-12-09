import { Router } from "express";
import instaReelModel from "../../model/instaReel/instaReel.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";

const instaRouter = Router();
// get list
instaRouter.get("/insta-reels", async (req, res) => {
  //
  try {
    //
    const resp = await instaReelModel.find().sort({ createdAt: -1 });

    return successRes2(res, 200, "ok", { data: resp });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});

// add
instaRouter.put("/insta-reel", async (req, res) => {
  //
  const { url, thumbnail, like, description } = req.body;
  try {
    //
    const resp = await instaReelModel.create({
      url,
      thumbnail,
      like,
      description,
    });

    return successRes2(res, 200, "ok", { data: resp });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});

// update
instaRouter.post("/insta-reel/:id", async (req, res) => {
  //
  const id = req.params.id;
  const body = req.body;

  if (!id) return errorRes2(res, 200, "id Required");
  //
  try {
    //
    const resp = await instaReelModel.findById(id);
    if (!resp) return errorRes2(res, 200, "Reel Not Found");
    const resp2 = await instaReelModel.findByIdAndUpdate(
      id,
      { ...body },
      { new: true }
    );

    return successRes2(res, 200, "deleted", { data: resp2 });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});

// delete
instaRouter.delete("/insta-reel/:id", async (req, res) => {
  //
  const id = req.params.id;
  if (!id) return errorRes2(res, 200, "id Required");
  //
  try {
    //
    const resp = await instaReelModel.findById(id);
    if (!resp) return errorRes2(res, 200, "Reel Not Found");
    const resp2 = await instaReelModel.deleteOne({ _id: id });

    return successRes2(res, 200, "deleted", { data: resp2.acknowledged });
    //
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});

export default instaRouter;
