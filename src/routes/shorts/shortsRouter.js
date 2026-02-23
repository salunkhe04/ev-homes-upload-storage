import { Router } from "express";
import shortsModel from "../../model/shorts_model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import logger from "../../utils/logger.js";

const shortsRouter = Router();

shortsRouter.get("/fetch-ev-homes-shorts", async (req, res) => {
  try {
    const shorts = await shortsModel
      .find()
      .populate({ path: "project", select: "name" });

    return successRes2(res, 200, "Fetched ev homes shorts", { data: shorts });
  } catch (error) {
    logger.error(error);
    return errorRes2(res, 500, "Internal server error");
  }
});

shortsRouter.post("/add-ev-homes-shorts", async (req, res) => {
  const body = req.body;

  const { project, shorts } = body;
  try {
    if (!body) {
      return errorRes2(res, 403, "data is required");
    }

    const newShorts = await shortsModel.create({
      ...body,
    });
    await newShorts.save();
    const respP = await shortsModel
      .findById(newShorts._id)
      .populate({ path: "project", select: "name" });

    return successRes2(res, 200, "shorts added successfully", {
      data: respP,
    });
  } catch (error) {
    logger.error(error);
    return errorRes2(res, 500, "Error adding shorts");
  }
});

shortsRouter.get("/fetch-ev-homes-shorts-project-id/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const proj = await shortsModel.findById(id);
    if (!proj) return errorRes2(res, 400, "Project is required");

    const shorts = await shortsModel
      .findOne({ project: proj._id })
      .populate({ path: "project", select: "name" });

    return successRes2(res, 200, "Fetched ev homes shorts", { data: shorts });
  } catch (error) {
    logger.error(error);
    return errorRes2(res, 500, "Internal server error");
  }
});

shortsRouter.post("/edit-ev-homes-shorts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { shorts } = req.body;

    if (!shorts || !Array.isArray(shorts)) {
      return errorRes2(res, 400, "Shorts array is required");
    }

    const updatedShorts = await shortsModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { shorts: { $each: shorts } } },
        { new: true },
      )
      .populate({ path: "project", select: "name" });

    if (!updatedShorts) {
      return errorRes2(res, 404, "Shorts document not found");
    }

    return successRes2(res, 200, "Shorts updated successfully", {
      data: updatedShorts,
    });
  } catch (error) {
    logger.error(error);
    return errorRes2(res, 500, "Internal server error");
  }
});

shortsRouter.delete("/delete-shorts-shorts-id/:id", async (req, res) => {
  const { id } = req.params;
  const { id: shortId } = req.body;

  try {
    // Perform the update
    let resp = await shortsModel.findById(id);

    if (!resp) return errorRes2(res, 404, "no short found");

    const foundShort = resp.shorts.find(
      (ele) => ele._id?.toString() === shortId,
    );

    // logger.info(foundShort);

    if (!foundShort) {
      return errorRes2(res, 404, "no short 1 found");
    }
    const updateFields = {};
    for (const key in req.body) {
      updateFields[`shorts.$.${key}`] = req.body[key];
    }

    // Perform the update
    resp = await shortsModel.findByIdAndUpdate(
      id,
      {
        $pull: {
          shorts: {
            _id: shortId,
          },
        },
      },
      { new: true },
    );

    const updateProj = await shortsModel.findById(id);

    return successRes2(res, 200, "Shorts updated successfully", {
      data: updateProj,
    });
  } catch (err) {
    // logger.info(err);
    return errorRes2(res, 500, "Server error");
  }
});

export default shortsRouter;
