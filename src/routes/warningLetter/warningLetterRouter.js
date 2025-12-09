import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { errorRes2, successRes, successRes2 } from "../../model/response.js";
import warningLetterModel from "../../model/warningLetter.model.js";
import { warnLetterPopulations } from "../../utils/constant.js";

const warnLetterRouter = Router();

warnLetterRouter.get("/warning-letter/:id", async (req, res) => {
  const id = req.params.id;
  try {
    //
    const resp = await warningLetterModel
      .find({
        givenTo: id,
      })
      .populate(warnLetterPopulations);

    return successRes2(res, 200, "ok", { data: resp });
  } catch (error) {
    //
    return errorRes2(res, 200, "Internal Server Error");
  }
});

warnLetterRouter.get("/warning-letter", async (req, res) => {
  try {
    //
    const resp = await warningLetterModel
      .find()
      .populate(warnLetterPopulations);

    return successRes2(res, 200, "ok", { data: resp });
  } catch (error) {
    //
    return errorRes2(res, 200, "Internal Server Error");
  }
});

warnLetterRouter.post("/warning-letter-add", async (req, res) => {
  const { givenTo, givenBy, document, validTill } = req.body;
  try {
    //
    const resp = await warningLetterModel.create({
      ...req.body,
    });

    const created = await warningLetterModel
      .findById(resp._id)
      .populate(warnLetterPopulations);

    return successRes2(res, 200, "ok", { data: resp });
  } catch (error) {
    //
    return errorRes2(res, 200, "Internal Server Error");
  }
});

export default warnLetterRouter;
