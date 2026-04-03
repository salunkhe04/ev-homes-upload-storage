import { Router } from "express";
import { errorRes, successRes } from "../../model/response.js";
import slabModel from "../../model/slab.model.js";
import { slabPopulateOptions } from "../../utils/constant.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const slabRouter = Router();

const slabsData =[
  {
    "index": 1,
    "name": "On Booking",
    "percent": "10"
  },
  {
    "index": 2,
    "name": "On Execution of Agreement",
    "percent": "15"
  },
  {
    "index": 3,
    "name": "On Completion of Plinth level",
    "percent": "20"
  },
  {
    "index": 4,
    "name": "On completion of 1st slab",
    "percent": "3"
  },
  {
    "index": 5,
    "name": "On completion of 2nd slab",
    "percent": "3"
  },
  {
    "index": 6,
    "name": "On completion of 3rd slab",
    "percent": "3"
  },
  {
    "index": 7,
    "name": "On completion of 4th slab",
    "percent": "3"
  },
  {
    "index": 8,
    "name": "On completion of 5th slab",
    "percent": "3"
  },
  {
    "index": 9,
    "name": "On completion of 6th slab",
    "percent": "3"
  },
  {
    "index": 10,
    "name": "On completion of 7th slab",
    "percent": "3"
  },
  {
    "index": 11,
    "name": "On Completion of walls",
    "percent": "1.45"
  },
  {
    "index": 12,
    "name": "On Completion of internal plaster",
    "percent": "1.45"
  },
  {
    "index": 13,
    "name": "On Completion of Flooring",
    "percent": "1.45"
  },
  {
    "index": 14,
    "name": "On Completion of Doors",
    "percent": "1.45"
  },
  {
    "index": 15,
    "name": "On Completion of windows",
    "percent": "1.45"
  },
  {
    "index": 16,
    "name": "On Completion of Sanitary fittings",
    "percent": "1.45"
  },
  {
    "index": 17,
    "name": "On Completion of Staircase",
    "percent": "1.45"
  },
  {
    "index": 18,
    "name": "On Completion of Lift wall",
    "percent": "1.45"
  },
  {
    "index": 19,
    "name": "On Completion of Lobbies",
    "percent": "1.45"
  },
  {
    "index": 20,
    "name": "On Completion of external plumbing",
    "percent": "1.45"
  },
  {
    "index": 21,
    "name": "On Completion of External plaster",
    "percent": "1.45"
  },
  {
    "index": 22,
    "name": "On Completion of elevation",
    "percent": "1.45"
  },
  {
    "index": 23,
    "name": "On Completion of waterproofing",
    "percent": "1.45"
  },
  {
    "index": 24,
    "name": "On Completion of terrace",
    "percent": "1.45"
  },
  {
    "index": 25,
    "name": "On Completion of Lift",
    "percent": "1.45"
  },
  {
    "index": 26,
    "name": "On Completion of water pumps",
    "percent": "1.45"
  },
  {
    "index": 27,
    "name": "On Completion of electrical\nfittings",
    "percent": "1.45"
  },
  {
    "index": 28,
    "name": "On Completion of electro,\nmechanical and environmental requirements",
    "percent": "1.45"
  },
  {
    "index": 29,
    "name": "On completion of entrance lobby",
    "percent": "1.45"
  },
  {
    "index": 30,
    "name": "On completion of plinth\nprotection and paving",
    "percent": "1.45"
  },
  {
    "index": 31,
    "name": "On Possession",
    "percent": "5"
  }

];

slabRouter.post("/add-slab", async (req, res) => {
  const { slabs, project, currentSlab } = req.body;
  try {
    if (!project) return res.send(errorRes(401, "project required"));

    // if (!slabs || slabs?.length < 0)
    //   return res.send(errorRes(401, "slabs required require3d"));

    const newSlabs = slabsData.map((slb, i) => {
      slb.buildingNo = 3;
      slb.id = `${project}-3-${slb.index}-${slb.name?.replace(
        /\s+/g,
        "-",
      )}`.toLowerCase();

      return slb;
    });

    const proj = await slabModel.findByIdAndUpdate(
      "slab-project-solaris-rohinjan-2025",
      {
        $addToSet: {
          slabs: newSlabs,
        },
      },
    );

    // const proj = await slabModel.create({
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
