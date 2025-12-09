import { Router } from "express";
import ourProjectModel from "../../model/ourProjects.model.js";
import flatModel from "../../model/flat.model.js";
import parkingModel from "../../model/parking.model.js";
const flatRouter = Router();
flatRouter.get("/flat", async (req, res) => {
  const projs = await ourProjectModel.find().lean();
  const flats = [];

  projs.forEach((proj) => {
    proj.flatList.map((flt) => {
      let id = `${proj?._id}-b${flt.buildingNo ?? "0"}-f${flt.floor}-n${
        flt.number
      }`;
      flt._id = id;
      flats.push({
        project: proj?._id,
        ...flt,
      });
    });
  });

  // await flatModel.insertMany(flats);

  res.send(flats);
});


flatRouter.get("/project-occupied-count/:id", async (req, res) => {
  try {
    const  id = req.params.id;

    // Find project by name
    const project = await ourProjectModel.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Count occupied flats
    const notOccupiedCount = project.flatList.filter((flat)=>flat.occupied == false).length;  
    const occupiedCount = project.flatList.filter((flat)=>flat.occupied == true).length;

   const occupiedUnits = project.flatList
  .filter(flat => flat.occupied === true)
  .map(flat => flat.flatNo);

    const diff= notOccupiedCount+occupiedCount;



    res.json({
      success: true,
      notOccupiedCount: notOccupiedCount,
      occupiedFlats: occupiedCount,
     diff,

     occupiedUnits,

      totalFlats: project.flatList.length
    });
  } catch (error) {
    console.error("Error fetching occupied flats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



export default flatRouter;
