import { Router } from "express";
import { errorRes, successRes } from "../../model/response.js";
import slabModel from "../../model/slab.model.js";
import { slabPopulateOptions } from "../../utils/constant.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const slabRouter = Router();

slabRouter.post("/add-slab", authenticateToken, async (req, res) => {
  const { slabs, project, currentSlab } = req.body;
  try {
    if (!project) return res.send(errorRes(401, "project required"));

    if (!slabs || slabs?.length < 0)
      return res.send(errorRes(401, "slabs required required"));

    const newSlabs = slabs.map((slb) => {
      slb.id = `${project}-${slb.index}-${slb.name?.replace(
        /\s+/g,
        "-"
      )}`.toLowerCase();
      return slb;
    });
    const resp = await slabModel.create({
      _id: `slab-${project}`,
      ...req.body,
      slabs: newSlabs,
    });

    return res.send(successRes(200, "", { data: resp }));
  } catch (error) {
    return res.send(errorRes(500, error));
  }
});

slabRouter.get(
  "/get-slab-by-project/:project",
  authenticateToken,
  async (req, res) => {
    const project = req.params.project;

    try {
      if (!project) return res.send(errorRes(401, "project required"));

      const resp = await slabModel
        .findOne({ project: project })
        .populate(slabPopulateOptions);

      return res.send(successRes(200, "", { data: resp }));
    } catch (error) {
      return res.send(errorRes(500, error));
    }
  }
);

export async function updateSlab(req, res) {
  try {
    const { projectId, slabId } = req.body;
    const updatedSlab = await findOneAndUpdate(
      { project: projectId },
      { $set: { currentSlab: slabId } },
      { new: true }
    );
    if (!updatedSlab) {
      return res.status(404).json({ code: 404, message: "Slab not found" });
    }
    res.json({
      code: 200,
      message: "Slab updated successfully",
      data: updatedSlab,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, message: "Failed to update slab" });
  }
}

slabRouter.post("/update-slab/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  try {
    if (!id) return res.send(errorRes(200, "id required"));

    const resp = await slabModel
      .findByIdAndUpdate(id, { ...body }, { new: true })
      .populate(slabPopulateOptions);

    return res.send(
      successRes(200, `updated Succesffully`, {
        data: resp,
      })
    );
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
});

slabRouter.post(
  "/update-current-slab/:id",
  authenticateToken,
  async (req, res) => {
    const idResp = req.params.id;
    const { id, architectCertificate, completedOn, completed } = req.body;
    try {
      if (!idResp) return res.send(errorRes(400, "id required"));
      if (!id) return res.send(errorRes(400, "slabId required"));

      const resp = await slabModel
        .findByIdAndUpdate(idResp, { currentSlab: id }, { new: true })
        .populate(slabPopulateOptions);

      const updateFields = {};
      for (const key in req.body) {
        updateFields[`slabs.$.${key}`] = req.body[key];
      }

      // console.log(updateFields);

      const slabListResp = await slabModel.updateOne(
        { _id: idResp, "slabs.id": id },
        { $set: updateFields }
      );

      return res.send(
        successRes(200, `updated Succesffully`, {
          data: resp,
        })
      );
    } catch (error) {
      return res.send(errorRes(500, `${error}`));
    }
  }
);

export default slabRouter;
