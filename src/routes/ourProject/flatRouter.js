import { Router } from "express";
import ourProjectModel from "../../model/ourProjects.model.js";
import flatModel from "../../model/flat.model.js";
import parkingModel from "../../model/parking.model.js";
import { errorRes2, successRes, successRes2 } from "../../model/response.js";
import { RedisService } from "../../app/redis.js";
const flatRouter = Router();

flatRouter.get("/flat", async (req, res) => {
  const projs = await ourProjectModel.find().lean();
  const flats = [];

  projs.forEach((proj) => {
    proj.flatList.map((flt) => {
      let id = `${proj?._id}-b${flt.buildingNo ?? "0"}-f${flt.floor}-n${
        flt.number
      }-w${flt.wing ?? "-"}`;
      flt._id = id;
      flats.push({
        project: proj?._id,
        ...flt,
      });
    });
  });

  // await flatModel.insertMany(flats);

  res.send({
    message: "Flats inserted successfully",
    count: flats.length,
    data: flats,
  });
});


//get all flats
flatRouter.get("/get-flats", async (req, res) => {
  try {
    const { project } = req.query;

    const cacheData = project ? `flats_${project}` : "flats";

    const cached = await RedisService.get(cacheData, true);
    if (cached) {
      return successRes2(res, 200, "Get Flats-cached", { data: cached });
    }

    let query = { ...(project ? { project: project } : {}) };
    const flats = await flatModel
      .find(query)
      .populate({ path: "project", select: "name" });

    await RedisService.set(cacheData, flats, 86400); // 24 hours

    return successRes2(res, 200, `Flat fetched`, { data: flats });
  } catch (error) {
    console.error(error);
    return errorRes2(res, 500, " server error ");
  }
});

//update flat by project id
flatRouter.post("/flat-update/:id", async (req, res) => {
  const id = req.params.id;
  try {
    // console.log(req.body);

    const flat = await flatModel
      .findByIdAndUpdate(id, { ...req.body }, { new: true })
      .populate({ path: "project", select: "name" });

    const uflat = await flatModel
      .findById(id)
      .populate({ path: "project", select: "name" });

    await RedisService.del("flats");
    await RedisService.del(`flats_${id}`);

    return res.send(
      successRes(200, "flat update", {
        data: uflat,
      })
    );
  } catch (error) {
    // console.log(error);
    return errorRes2(res, 500, " server error ");
  }
});

//add flat by project id
flatRouter.post("/add-new-flat/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  try {
    let { buildingNo, floor, number, wing } = req.body;
    const newFLatId = `${id}-b${buildingNo ?? "0"}-f${floor}-n${number}-w${
      wing ?? "-"
    }"`;
    const existingFlat = await flatModel.findOne({ project: id });

    if (!existingFlat) {
      return errorRes2(res, 404, "Ppoject not found in flats");
    }

    const newFlat = await flatModel.create({
      ...body,
      _id: newFLatId,
    });

    await newFlat.save();

    // console.log(req.body);

    const uflat = await flatModel
      .findById(newFlat._id)
      .populate({ path: "project", select: "name" });

    await RedisService.del("flats");
    await RedisService.del(`flats_${id}`);

    return res.send(
      successRes(200, "flat update", {
        data: uflat,
      })
    );
  } catch (error) {
    // console.log(error);
    return errorRes2(res, 500, " server error ");
  }
});



flatRouter.get("/project-occupied-count/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Find project by name
    const project = await ourProjectModel.findById(id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Count occupied flats
    const notOccupiedCount = project.flatList.filter(
      (flat) => flat.occupied == false
    ).length;
    const occupiedCount = project.flatList.filter(
      (flat) => flat.occupied == true
    ).length;

    const occupiedUnits = project.flatList
      .filter((flat) => flat.occupied === true)
      .map((flat) => flat.flatNo);

    const diff = notOccupiedCount + occupiedCount;

    res.json({
      success: true,
      notOccupiedCount: notOccupiedCount,
      occupiedFlats: occupiedCount,
      diff,

      occupiedUnits,

      totalFlats: project.flatList.length,
    });
  } catch (error) {
    console.error("Error fetching occupied flats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default flatRouter;
