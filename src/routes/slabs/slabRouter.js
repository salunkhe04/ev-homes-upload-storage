import { Router } from "express";
import { errorRes, successRes } from "../../model/response.js";
import slabModel from "../../model/slab.model.js";
import { slabPopulateOptions } from "../../utils/constant.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const slabRouter = Router();

const slabsData = [
  { index: 0, name: "On Booking", percent: 10 },
  { index: 1, name: "On Execution of Agreement", percent: 10 },
  { index: 2, name: "On Completion of Basement 1", percent: 5 },
  { index: 3, name: "On Completion of Basement 2", percent: 5 },
  { index: 4, name: "On Completion of Basement 3", percent: 5 },
  { index: 5, name: "On Completion of Plinth Level", percent: 10 },
  { index: 6, name: "On Completion of 1st Slab (Ground)", percent: 3 },
  { index: 7, name: "On Completion of 2nd Slab", percent: 3 },
  { index: 8, name: "On Completion of 3rd Slab", percent: 3 },
  { index: 9, name: "On Completion of 4th Slab", percent: 3 },
  { index: 10, name: "On Completion of 5th Slab", percent: 1 },
  { index: 11, name: "On Completion of 6th Slab", percent: 1 },
  { index: 12, name: "On Completion of 7th Slab", percent: 1 },
  { index: 13, name: "On Completion of 8th Slab", percent: 1 },
  { index: 14, name: "On Completion of 9th Slab", percent: 1 },
  { index: 15, name: "On Completion of 10th Slab", percent: 1 },
  { index: 16, name: "On Completion of 11th Slab", percent: 1 },
  { index: 17, name: "On Completion of 12th Slab", percent: 1 },
  { index: 18, name: "On Completion of 13th Slab", percent: 1 },
  { index: 19, name: "On Completion of 14th Slab", percent: 1 },
  { index: 20, name: "On Completion of 15th Slab", percent: 0.5 },
  { index: 21, name: "On Completion of 16th Slab", percent: 0.5 },
  { index: 22, name: "On Completion of 17th Slab", percent: 0.5 },
  { index: 23, name: "On Completion of walls", percent: 0.5 },
  { index: 23, name: "On Completion of internal plaster", percent: 1 },

  { index: 24, name: "On Completion of Flooring", percent: 1 },
  { index: 25, name: "On Completion of Doors", percent: 1 },
  { index: 26, name: "On Completion of Windows", percent: 1 },
  { index: 27, name: "On Completion of Sanitary fittings", percent: 1.25 },
  { index: 28, name: "On Completion of Staircase", percent: 1.25 },
  { index: 29, name: "On Completion of Lift well", percent: 1.25 },
  { index: 30, name: "On Completion of Lobbies", percent: 1.25 },
  { index: 31, name: "On Completion of external plumbing", percent: 1 },
  { index: 32, name: "On Completion of External plaster", percent: 1 },
  { index: 33, name: "On Completion of elevation", percent: 1 },
  { index: 34, name: "On Completion of terrace", percent: 1 },
  { index: 35, name: "On Completion of Waterproofing", percent: 1 },
  { index: 36, name: "On Completion of Lift", percent: 4 },
  { index: 37, name: "On Completion of water pumps", percent: 1 },
  { index: 38, name: "On Completion of electrical fittings", percent: 1 },
  {
    index: 39,
    name: "On Completion of electrical, mechanical and environmental requirements",
    percent: 1,
  },
  { index: 40, name: "On Completion of entrance lobby", percent: 2 },
  {
    index: 41,
    name: "On completion of plinth protection and paving",
    percent: 1,
  },
  { index: 42, name: "On Possession", percent: 5 },
];
slabRouter.post("/add-slab", async (req, res) => {
  const { slabs, project, currentSlab } = req.body;
  try {
    if (!project) return res.send(errorRes(401, "project required"));

    // if (!slabs || slabs?.length < 0)
    //   return res.send(errorRes(401, "slabs required require3d"));

    const newSlabs = slabsData.map((slb, i) => {
      slb.buildingNo = 2;
      slb.id = `${project}-2-${i}-${slb.name?.replace(
        /\s+/g,
        "-",
      )}`.toLowerCase();

      return slb;
    });

    const proj = await slabModel.findByIdAndUpdate(
      "slab-project-ev23-malibu-west-koparkhairne-2024",
      {
        $addToSet: {
          slabs: newSlabs,
        },
      },
    );

    // const resp = await slabModel.create({
    //   _id: `slab-${project}`,
    //   ...req.body,
    //   slabs: newSlabs,
    // });

    return res.send(successRes(200, "", { data: proj }));
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
  },
);

export async function updateSlab(req, res) {
  try {
    const { projectId, slabId } = req.body;
    const updatedSlab = await findOneAndUpdate(
      { project: projectId },
      { $set: { currentSlab: slabId } },
      { new: true },
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
      }),
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

      const slabListResp = await slabModel.updateOne(
        { _id: idResp, "slabs.id": id },
        { $set: updateFields },
      );

      return res.send(
        successRes(200, `updated Succesffully`, {
          data: resp,
        }),
      );
    } catch (error) {
      return res.send(errorRes(500, `${error}`));
    }
  },
);

slabRouter.post("/update-building-number/:id", async (req, res) => {
  const idResp = req.params.id;
  try {
    if (!idResp) return res.send(errorRes(400, "id required"));

    const resp = await slabModel.findById(idResp);
    const slabsData = resp.slabs.map((e) => {
      e.buildingNo = 3;
      e.id = `${resp.project}-3-${e.index}-${e.name?.replace(
        /\s+/g,
        "-",
      )}`.toLowerCase();
      return e;
    });
    await slabModel.findByIdAndUpdate(idResp, {
      $addToSet: {
        slabs: slabsData,
      },
    });
    // resp.slabs.forEach((row) => {
    //   row.buildingNo = 1;
    //   // if (row.buildingNo) {
    //   //   row.index +=1;
    //   //   // row.buildingNo = null;
    //   // }
    // });
    // resp.markModified("slabs"); // ✅ important

    // await resp.save();

    return res.send(
      successRes(200, `updated Succesffully`, {
        data: slabsData,
      }),
    );
  } catch (error) {
    return res.send(errorRes(500, `${error}`));
  }
});
export default slabRouter;
