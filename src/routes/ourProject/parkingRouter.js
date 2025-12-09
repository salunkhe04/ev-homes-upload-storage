import { Router } from "express";
import ourProjectModel from "../../model/ourProjects.model.js";
import parkingModel from "../../model/parking.model.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import csvParser from "csv-parser";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";
import { successRes } from "../../model/response.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parkingRouter = Router();

parkingRouter.get("/parkings", authenticateToken, async (req, res) => {
  const projs = await ourProjectModel.find().lean();
  const flats = [];

  projs.forEach((proj) => {
    proj?.parkingList.map((flt) => {
      let pNum = flt.parkingNo?.replace("S-", "");
      let id = `${proj?._id}-f${flt.floor}-n${pNum}`;
      flt._id = id;
      flt.number = parseInt(pNum);
      flats.push({
        project: proj?._id,
        ...flt,
      });
    });
  });

  // await parkingModel.insertMany(flats);

  res.send(flats);
});

parkingRouter.post("/parkings-ev9-update/:id", async (req, res) => {
  const projectId = req.params.id;

  const projs = await ourProjectModel.findById(projectId);
  const flats = [];

  projs?.parkingList.map((flt) => {
    let pNum = flt.parkingNo?.replace("S-", "");
    flt.number = parseInt(pNum);
  });
  await projs.save();

  res.send(projs);
});

parkingRouter.post("/parking-floor/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const filePath = path.join(__dirname, "Parking_details_marina.csv");

    if (!fs.existsSync(filePath)) {
      return res.status(400).send("CSV file not found");
    }

    const project = await ourProjectModel.findById(projectId);
    if (!project) return res.status(404).send("Project not found");

    const parkingList = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => {
          parkingList.push({
            floor: row.floor != "" ? parseInt(row.floor) : null,

            parkingNo: row.parkingNo,
            occupied: false,
            floorName: row.floorName,
            number: row.number != "" ? parseInt(row.number) : null,
            occupiedBy: null,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    project.parkingList = parkingList;
    await project.save();

    res.send(successRes(200, "inserted", { data: parkingList }));
  } catch (err) {
    console.error("Error importing parking list from CSV:", err);
    res.status(500).json({ message: "Failed to import parking list." });
  }
});

export default parkingRouter;
