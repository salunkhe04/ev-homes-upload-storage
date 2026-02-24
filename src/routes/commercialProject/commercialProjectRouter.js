import { Router } from "express";
import commercialProjModel from "../../model/commercialProject.model.js";
import { errorRes, errorRes2, successRes } from "../../model/response.js";
import logger from "../../utils/logger.js";

const commercialProjectRouter = Router();

commercialProjectRouter.get("/commercial-project", async (req, res) => {
  try {
    const respPro = await commercialProjModel.findOne().populate({
      path: "list.teamLeader",
      select: "firstName lastName",
      populate: [{ path: "designation" }],
    });

    return res.send(
      successRes(200, "Get commercial project", {
        data: respPro,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.json({
      message: `error:${error}`,
    });
  }
});

commercialProjectRouter.get("/commercial-projects", async (req, res) => {
  try {
    const respPro = await commercialProjModel.find().populate({
      path: "list.teamLeader",
      select: "firstName lastName",
      populate: [{ path: "designation" }],
    });

    return res.send(
      successRes(200, "Get commercial project", {
        data: respPro,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.json({
      message: `error:${error}`,
    });
  }
});

commercialProjectRouter.post("/add-commerical-project", async (req, res) => {
  const body = req.body;

  const { name } = body;

  try {
    if (!body) return res.send(errorRes(403, "Data is required"));
    if (!name) return res.send(errorRes(403, "Project name is required"));
    // if (!showCaseImage)
    //   return res.send(errorRes(403, "Showcase image is required"));

    const newProject = await commercialProjModel.create({ ...body });

    await newProject.save();

    return res.send(
      successRes(200, `Project added successfully: ${name}`, {
        data: newProject,
      }),
    );
  } catch (error) {
    logger.info(error);
    return res.send(errorRes(500, `Server error: ${error?.message}`));
  }
});

commercialProjectRouter.post(
  "/update-commerical-project-list/:id",
  async (req, res) => {
    const { id } = req.params;
    const { id: flatId, floor, number, buildingNo } = req.body;

    // logger.info(req.body);

    try {
      let resp = await commercialProjModel.findById(id);
      if (!resp) return errorRes2(res, 404, "no project found");

      // check if flat exists by floor+number OR flatId
      const foundFlat = resp.list.find(
        (ele) =>
          (ele.number === number &&
            ele.floor === floor &&
            ele.buildingNo == buildingNo) ||
          ele._id === flatId,
      );
      // logger.info(foundFlat);

      if (!foundFlat) {
        // add new flat
        resp = await commercialProjModel.findByIdAndUpdate(
          id,
          {
            $addToSet: {
              list: {
                ...req.body,
              },
            },
          },
          { new: true },
        );
        const updateProj = await commercialProjModel.findById(id);

        return res.send(
          successRes(200, "Flat Added successfully", {
            data: updateProj,
          }),
        );
      }

      const updateFields = {};
      for (const key in req.body) {
        updateFields[`list.$.${key}`] = req.body[key];
      }

      await commercialProjModel.updateOne(
        {
          _id: id,
          "list._id": foundFlat._id,
        },
        { $set: updateFields },
      );

      const updateProj = await commercialProjModel.findById(id).populate({
        path: "list.teamLeader",
        select: "firstName lastName",
        populate: [{ path: "designation" }],
      });

      return res.send(
        successRes(200, "Flat updated successfully", {
          data: updateProj,
        }),
      );
    } catch (err) {
      logger.info(err);
      return res.send(errorRes(500, "Server error"));
    }
  },
);

commercialProjectRouter.post("/bulk-add-flats/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await commercialProjModel.findById(id);
    if (!project) return errorRes2(res, 404, "No project found");

    const flatsToAdd = [];

    for (let floor = 8; floor <= 42; floor++) {
      const flatCount = [8, 13, 17].includes(floor) ? 37 : 39;

      for (let number = 1; number <= flatCount; number++) {
        flatsToAdd.push({
          floor,
          number,
          occupied: false,
        });
      }
    }

    await commercialProjModel.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          list: { $each: flatsToAdd },
        },
      },
      { new: true },
    );

    const updatedProject = await commercialProjModel.findById(id);

    return res.send(
      successRes(200, "Flats bulk added successfully", {
        data: updatedProject,
      }),
    );
  } catch (err) {
    console.error(err);
    return res.send(errorRes(500, "Server error"));
  }
});

export default commercialProjectRouter;
