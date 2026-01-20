import { Router } from "express";
import {
  addProjects,
  getOurProjects,
  getProjectsById,
  updateProjects,
  deleteProject,
  searchProjects,
  updateFlatDetails,
  getFlatListByProject,
  updateFlatInProject,
  deleteFlatInProject,
  updatCarpetArea,
} from "../../controller/ourProjects.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import ourProjectModel from "../../model/ourProjects.model.js";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import multer from "multer";
import csvParser from "csv-parser";
import {
  errorRes,
  errorRes2,
  successRes,
  successRes2,
} from "../../model/response.js";
import { RedisService } from "../../app/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ourProjectRouter = Router();
ourProjectRouter.get(
  "/ourProjects",
  // authenticateToken,

  getOurProjects,
);

ourProjectRouter.get(
  "/ourProjects/:id",
  //  authenticateToken,
  getProjectsById,
);
ourProjectRouter.get("/ourProjects-flat/:id", getFlatListByProject);

ourProjectRouter.post(
  "/ourProjects-add",

  authenticateToken,

  addProjects,
);
ourProjectRouter.post(
  "/ourProjects-update/:id",
  authenticateToken,
  updateProjects,
);
// NEW:
ourProjectRouter.post(
  "/our-project-flat-update/:id",
  authenticateToken,
  updateFlatInProject,
);
ourProjectRouter.delete(
  "/our-project-flat-delete/:id",
  authenticateToken,
  deleteFlatInProject,
);

ourProjectRouter.post(
  "/our-project-flat-update",
  authenticateToken,
  updateFlatDetails,
);

ourProjectRouter.delete("/ourProjects/:id", authenticateToken, deleteProject);

ourProjectRouter.get("/ourProjects-search", authenticateToken, searchProjects);

ourProjectRouter.get(
  "/ourProjects-flatList-csv",
  // authenticateToken,
  async (req, res) => {
    try {
      // Fetch the project and get flatList
      const resp = await ourProjectModel.findById(
        "project-ev-10-marina-bay-vashi-sector-10",
      );
      const flats = resp.flatList;

      // Define headers for the CSV
      const headers = [
        "type",
        "floor",
        "number",
        "flatNo",
        "configuration",
        "carpetArea",
        "sellableCarpetArea",
        "allInclusiveValue",
      ];

      // Create a write stream to a CSV file
      const filePath = "./flatList.csv";
      const writeStream = fs.createWriteStream(filePath);

      // Write the headers
      writeStream.write(headers.join(",") + "\n");

      // Write each row of data
      flats.forEach((flat) => {
        const row = headers.map((header) => flat[header] || "").join(",");
        writeStream.write(row + "\n");
      });

      // Close the stream
      writeStream.end();

      // Send the file as a response
      writeStream.on("finish", () => {
        res.download(filePath, "flatList.csv", (err) => {
          if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Failed to download file.");
          } else {
            // console.log("File sent successfully.");
          }

          // Cleanup: Remove the file after sending
          fs.unlinkSync(filePath);
        });
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).send("Error exporting data.");
    }
  },
);
ourProjectRouter.get(
  "/ourProjects-parking-csv",
  // authenticateToken,
  async (req, res) => {
    try {
      // Fetch the project and get flatList
      const resp = await ourProjectModel.findById(
        "project-ev-9-square-vashi-sector-9",
      );
      const flats = resp.parkingList;

      // Define headers for the CSV
      const headers = ["floor", "floorName", "number", "parkingNo", "occupied"];

      // Create a write stream to a CSV file
      const filePath = "./parkings.csv";
      const writeStream = fs.createWriteStream(filePath);

      // Write the headers
      writeStream.write(headers.join(",") + "\n");

      // Write each row of data
      flats.forEach((flat) => {
        const row = headers.map((header) => flat[header] || "").join(",");
        // console.log(row);
        writeStream.write(row + "\n");
      });

      // Close the stream
      writeStream.end();

      // Send the file as a response
      writeStream.on("finish", () => {
        res.download(filePath, "parkings.csv", (err) => {
          if (err) {
            console.error("Error sending file:", err);
            res.status(500).send("Failed to download file.");
          } else {
            // console.log("File sent successfully.");
          }

          // Cleanup: Remove the file after sending
          fs.unlinkSync(filePath);
        });
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).send("Error exporting data.");
    }
  },
);

ourProjectRouter.post(
  "/ourProjects-flatList-updatedfd",
  // authenticateToken,
  async (req, res) => {
    try {
      const csvText = req.body.csv; // Assume CSV is sent as raw text in `csv` field
      if (!csvText) {
        return res.status(400).send("CSV data not provided");
      }

      const projectId = "project-ev-9-square-vashi-sector-9";
      const project = await ourProjectModel.findById(projectId);
      if (!project) return res.status(404).send("Project not found");

      const flats = project.flatList || [];

      // Convert CSV text to readable stream for parsing
      const stream = Readable.from([csvText]);
      const updatedFlatsMap = new Map();

      const headers = [
        "flatNo",
        "floor",
        "number",
        "type",
        "configuration",
        "carpetArea",
        "sellableCarpetArea",
        "allInclusiveValue",
      ];

      // Parse CSV and store updated values in a Map by flatNo
      await new Promise((resolve, reject) => {
        stream
          .pipe(csvParser({ headers }))
          .on("data", (row) => {
            if (row.flatNo) {
              updatedFlatsMap.set(row.flatNo.trim(), row);
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });

      // Update matching flats in the array
      const updatedFlatList = flats.map((flat) => {
        const update = updatedFlatsMap.get(flat.flatNo?.toString()?.trim());
        if (update) {
          return {
            ...flat,
            floor: update.floor || flat.floor,
            number: update.number || flat.number,
            type: update.type || flat.type,
            configuration: update.configuration || flat.configuration,
            carpetArea: update.carpetArea || flat.carpetArea,
            sellableCarpetArea:
              update.sellableCarpetArea || flat.sellableCarpetArea,
            allInclusiveValue:
              update.allInclusiveValue || flat.allInclusiveValue,
          };
        }
        return flat;
      });

      // Save the updated flatList
      project.flatList = updatedFlatList;
      await project.save();

      res.send({
        message: "Flat list updated successfully",
        total: updatedFlatsMap.size,
      });
    } catch (error) {
      console.error("Error updating flat list:", error);
      res.status(500).send("Internal server error");
    }
  },
);

ourProjectRouter.post(
  "/ourProjects-flatList-update",
  // authenticateToken,
  async (req, res) => {
    try {
      const filePath = path.join(
        __dirname,
        "marina_bay_flatlist_latest_changed.csv",
      );
      // console.log("Looking for CSV at:", filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(400).send("CSV file not found");
      }

      const projectId = "project-ev-10-marina-bay-vashi-sector-10";
      const project = await ourProjectModel.findById(projectId);
      if (!project) return res.status(404).send("Project not found");

      const flats = project.flatList || [];
      const updatedFlatsMap = new Map();

      const headers = [
        "floor",
        "flatNo",
        "occupied",
        "configuration",
        "carpetArea",
        "sellableCarpetArea",
        "allInclusiveValue",
        "buildingNo",
      ];

      // Parse CSV and store rows by unique key: flatNo + buildingNo
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser({ headers }))
          .on("data", (row) => {
            if (row.flatNo && row.buildingNo) {
              const key = `${row.buildingNo.trim()}-${row.flatNo.trim()}`;
              updatedFlatsMap.set(key, row);
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });

      // Update flatList with matched entries
      let updatedCount = 0;
      const updatedFlatList = flats.map((flat) => {
        const key = `${flat.buildingNo?.toString()?.trim()}-${flat.flatNo
          ?.toString()
          ?.trim()}`;
        const update = updatedFlatsMap.get(key);
        if (update) {
          updatedCount++;
          return {
            ...flat,
            floor: update.floor || flat.floor,
            // occupied: update.occupied?.toLowerCase() === "true",
            // configuration: update.configuration || flat.configuration,
            // carpetArea: parseFloat(update.carpetArea) || flat.carpetArea,
            // sellableCarpetArea:
            //   parseFloat(update.sellableCarpetArea) || flat.sellableCarpetArea,
            allInclusiveValue:
              parseFloat(update.allInclusiveValue) ||
              flat.allInclusiveValue ||
              flat.AlInclusive,
            // buildingNo: parseInt(update.buildingNo) || flat.buildingNo,
          };
        }
        return flat;
      });

      project.flatList = updatedFlatList;
      await project.save();

      res.send({
        message: "Flat list updated from CSV successfully",
        totalUpdated: updatedCount,
      });
    } catch (error) {
      console.error("Error updating flat list from CSV:", error);
      res.status(500).send("Internal server error");
    }
  },
);

ourProjectRouter.post(
  "/project-updates-flat-fix-bldg",
  authenticateToken,
  async (req, res) => {
    try {
      const resp2 = await ourProjectModel.findOne({
        _id: "project-ev-9-square-vashi-sector-9",
      });

      if (!resp2) {
        return res.json({ message: "Project not found" });
      }

      // ✅ Correctly update each flat's `buildingNo`
      resp2.flatList.forEach((flat) => {
        flat.buildingNo = null; // Ensure buildingNo is updated in each object
      });

      // ✅ Save the updated document
      await resp2.save();

      res.json({ message: "Building numbers updated", data: resp2 });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
);
ourProjectRouter.post("/project-heart-fix-bldg", async (req, res) => {
  try {
    //
    const projectResp = await ourProjectModel.findOne({
      _id: "project-ev-heart-city-mosare-2025",
    });

    if (!projectResp) {
      return res.send("Project not found");
    }
    projectResp.flatList.forEach((flt) => {
      if (flt.buildingNo === 2) {
        flt.buildingNo = 3;
      }
    });
    await projectResp.save();
    res.send("ok");
  } catch (error) {
    //
    res.send(error);
  }
});
ourProjectRouter.post("/project-updates-flat-list-sort", async (req, res) => {
  try {
    //
    const projectResp = await ourProjectModel.findOne({
      _id: "project-ev23-malibu-west-koparkhairne-2024",
    });
    projectResp.flatList.sort(
      (a, b) => parseInt(a.flatNo) - parseInt(b.flatNo),
    );
    await projectResp.save();
    res.send("ok");
  } catch (error) {
    res.send(error);
    //
  }
});
// actuallly working flat list updates
ourProjectRouter.post(
  "/project-updates-flat-list",
  // authenticateToken,
  async (req, res) => {
    const results = [];
    const dataToPush = [];

    const csvFilePath = path.join(__dirname, "captol9-flatlist-15-01-2026.csv");

    try {
      const projectResp = await ourProjectModel.findOne({
        _id: "project-ev-capitol-9-vashi-2025",
      });

      if (!projectResp) {
        return res.status(404).send("Project not found");
      }
      const flatList = projectResp.flatList;
      if (!fs.existsSync(csvFilePath)) {
        return res.status(400).send("CSV file not found");
      }

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          // Collect only the required fields from CSV
          for (const row of results) {
            const {
              buildingNo,
              floor,
              OfficeNo,
              salebleArea,
              usableArea,
              Basic,
              //
              flatNo,
              occupied,
              configuration,
              carpetArea,
              sellableCarpetArea,
              allInclusiveValue,
              AlInclusive,
              allInclusive,
              ReraArea,
              BalconyArea,
              SSArea,
              FlatName,
              // number,
              config,
              flatName,
              reraArea,
              balconyArea,
              usableCarpetArea,
              totalSaleArea,

              //
            } = row;

            // let allInc =
            //   allInclusiveValue != "" ? parseFloat(allInclusiveValue) : 0;
            // let number = parseInt(flatNo) % 100;
            dataToPush.push({
              buildingNo: 1,
              flatNo: OfficeNo,
              floor: floor,
              carpetArea: usableArea,
              sellableCarpetArea: salebleArea,
              allInclusiveValue: Basic,
              // ...row,
              // reraArea,
              // balconyArea,
              // // usableCarpetArea:,
              // ssArea: SSArea,
              // buildingNo: 3, //buildingNo,
              // floor,
              // flatNo,
              // number,
              // occupied:
              //   occupied?.toString().toLowerCase() === "true" ? true : false,
              // configuration: config,
              // carpetArea: usableCarpetArea,
              // sellableCarpetArea: totalSaleArea,
              // allInclusiveValue: allInc,
              // type: flatName,
            });
          }

          // Update matching flats
          projectResp.flatList.forEach((flt) => {
            const match = dataToPush.find(
              (item) =>
                item.flatNo?.toString() === flt.flatNo?.toString() &&
                flt.buildingNo == 1,
            );

            if (match) {
              // Object.keys(match).forEach((key) => {
              //   if (match[key] !== undefined && match[key] !== null) {
              //     flt[key] = match[key]; // will create field if not exist
              //   }
              // });

              // flt.floor = match.floor;
              // flt.occupied = match.occupied;
              // flt.reraArea = match.carpetArea;
              // flt.balconyArea = match.balconyArea;
              // flt.ssArea = match.ssArea;
              // flt.configuration = match.configuration;
              flt.carpetArea = match.carpetArea;
              flt.sellableCarpetArea = match.sellableCarpetArea;
              flt.allInclusiveValue = match.allInclusiveValue;
              // flt.type = match.type;
            }
          });

          // projectResp.markModified("flatList");
          // await projectResp.save();
          // await RedisService.delMultipleKeys(["projects"]);
          //
          return res.send({
            message: "Flat list updated successfully",
            updatedCount: dataToPush,
          });
        })
        .on("error", (err) => {
          return res.status(500).send({ error: err.message });
        });
    } catch (err) {
      return res
        .status(500)
        .send({ error: "Something went wrong", details: err.message });
    }
  },
);

// actuallly working flat list updates
ourProjectRouter.post(
  "/project-updates-parking",
  // authenticateToken,
  async (req, res) => {
    const results = [];
    const dataToPush = [];

    const csvFilePath = path.join(__dirname, "Parking_details_marina.csv");

    try {
      const projectResp = await ourProjectModel.findOne({
        _id: "project-ev-10-marina-bay-vashi-sector-10",
      });

      if (!projectResp) {
        return res.status(404).send("Project not found");
      }
      const flatList = projectResp.flatList;
      if (!fs.existsSync(csvFilePath)) {
        return res.status(400).send("CSV file not found");
      }

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          // Collect only the required fields from CSV
          for (const row of results) {
            dataToPush.push({
              ...row,
            });
          }

          // Update matching flats
          projectResp.parkingList.forEach((flt) => {
            // const match = dataToPush.find(
            //   (item) =>
            //     item.number?.toString() === flt.number?.toString() &&
            //     item.floor?.toString() === flt.floor?.toString()
            // );

            // if (!match) {
            flt.floor = parseInt(match.floor);
            flt.floorName = match.floorName?.toString();
            flt.occupied = false;
            flt.number = parseInt(match.number);
            flt.parkingNo = match.parkingNo?.toString();
            // }
          });

          // projectResp.markModified("flatList");
          await projectResp.save();
          return res.send({
            message: "Flat list updated successfully",
            updatedCount: dataToPush,
          });
        })
        .on("error", (err) => {
          return res.status(500).send({ error: err.message });
        });
    } catch (err) {
      return res
        .status(500)
        .send({ error: "Something went wrong", details: err.message });
    }
  },
);

ourProjectRouter.post("/project-floor-plan/:id", async (req, res) => {
  const { id } = req.params;
  const { carpetArea, floorPlan, buildingNo } = req.body;

  if (!carpetArea || !floorPlan) {
    return res
      .status(400)
      .json({ message: "number and floorPlan are required" });
  }

  try {
    const project = await ourProjectModel.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let modifiedCount = 0;

    project.flatList = project.flatList.map((flat) => {
      const isSameFloor = flat.carpetArea === carpetArea;
      const isSameBuilding = buildingNo ? flat.buildingNo === buildingNo : true;

      if (isSameFloor && isSameBuilding) {
        flat.floorPlan = floorPlan;
        modifiedCount++;
      }

      return flat;
    });

    await project.save();

    const updatedFlats = project.flatList.filter(
      (flat) =>
        flat.carpetArea === carpetArea &&
        (buildingNo ? flat.buildingNo === buildingNo : true),
    );

    return res.send(
      successRes(200, "Floor plans updated successfully", {
        modifiedCount,
        updatedFlats,
      }),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

ourProjectRouter.post("/bulk-add-flats-p2/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await ourProjectModel.findById(id);
    if (!project) return errorRes2(res, 404, "No project found");

    const flatsToAdd = [];

    project.flatList.forEach((e) => {
      //
      const paddedNumber = String(e.number).padStart(2, "0");
      const flatNo =
        e.floor === 0 ? `0${paddedNumber}` : `${e.floor}${paddedNumber}`;

      e.type = e.floor > 0 ? "office" : "shop";
      e.flatNo = flatNo;
    });

    //  await project.save();

    // for (let floor = 8; floor <= 42; floor++) {
    //   // const flatCount = 23;
    //   const flatCount = [8, 13, 17].includes(floor) ? 37 : 39;

    //   for (let number = 1; number <= flatCount; number++) {
    //     flatsToAdd.push({
    //       floor,
    //       // number,
    //       // occupied: false,

    //       //
    //       type: "shop",
    //       // floor: 0,
    //       buildingNo: 1,
    //       number: number,
    //       flatNo: `${number}`,
    //       occupied: false,
    //       //
    //     });
    //   }
    // }

    // for (let floor = 8; floor <= 42; floor++) {
    //   const flatCount = [8, 13, 17].includes(floor) ? 37 : 39;

    //   for (let number = 1; number <= flatCount; number++) {
    //     const paddedNumber = String(number).padStart(2, "0");

    //     const flatNo =
    //       floor === 0 ? `0${paddedNumber}` : `${floor}${paddedNumber}`;

    //     flatsToAdd.push({
    //       floor,
    //       buildingNo: 1,
    //       number,
    //       flatNo,
    //       type: floor > 0 ? "office" : "shop",
    //       occupied: false,
    //     });
    //   }
    // }

    // console.log(flatsToAdd);
    // await ourProjectModel.findByIdAndUpdate(
    //   id,
    //   {
    //     $addToSet: {
    //       flatList: { $each: flatsToAdd },
    //     },
    //   },
    //   { new: true }
    // );

    // const updatedProject = await ourProjectModel.findById(id);

    return res.send(
      successRes(200, "Flats bulk added successfully", {
        data: project.flatList,
      }),
    );
  } catch (err) {
    console.error(err);
    return res.send(errorRes(500, "Server error"));
  }
});

// ourProjectRouter.post("/bulk-add-flats-9vtc/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const project = await ourProjectModel.findById(id);
//     if (!project) return errorRes2(res, 404, "No project found");

//     const flatsToAdd = [];

//     // for (let floor = 8; floor <= 42; floor++) {
//     //   const flatCount = [8, 13, 17].includes(floor) ? 37 : 39;

//     //   for (let number = 1; number <= flatCount; number++) {
//     //     const paddedNumber = String(number).padStart(2, "0");

//     //     const flatNo =
//     //       floor === 0 ? `0${paddedNumber}` : `${floor}${paddedNumber}`;

//     //     flatsToAdd.push({
//     //       floor,
//     //       buildingNo: 1,
//     //       number,
//     //       flatNo,
//     //       type: floor > 0 ? "office" : "shop",
//     //       occupied: false,
//     //     });
//     //   }
//     // }

//     console.log(flatsToAdd);
//     // await ourProjectModel.findByIdAndUpdate(
//     //   id,
//     //   {
//     //     $addToSet: {
//     //       flatList: { $each: flatsToAdd },
//     //     },
//     //   },
//     //   { new: true }
//     // );

//     // const updatedProject = await ourProjectModel.findById(id);

//     return res.send(
//       successRes(200, "Flats bulk added successfully", {
//         data: project.flatList,
//       })
//     );
//   } catch (err) {
//     console.error(err);
//     return res.send(errorRes(500, "Server error"));
//   }
// });

// ourProjectRouter.post("/bulk-add-offices/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Find project
//     const project = await ourProjectModel.findById(id);
//     if (!project) return errorRes2(res, 404, "No project found");

//     const flatsToAdd = [];
//     const specialFloors = [9,10,11,12,14,15,16,17,19,20,21,22,24,25,26,27,29,30,31,32,34,35,36,37,39,40,41,42];

//     // Generate flats only for the special floors
//     for (let floor of specialFloors) {
//       // From 2 → 9
//       for (let number = 1; number <= 29; number++) {
//         const flatNo = `${floor}${String(number).padStart(2, "0")}`;
//         flatsToAdd.push({
//           floor,
//           buildingNo: 2,
//           number,
//           flatNo,
//           type: "office",
//           occupied: false,
//         });
//       }

//       // // From 11 → 29 (skip 10)
//       // for (let number = 11; number <= 29; number++) {
//       //   const flatNo = `${floor}${String(number).padStart(2, "0")}`;
//       //   flatsToAdd.push({
//       //     floor,
//       //     buildingNo: 2,
//       //     number,
//       //     flatNo,
//       //     type: "office",
//       //     occupied: false,
//       //   });
//       // }
//     }

//     // ✅ Log flats for verification
//     // console.log("Flats to insert:", flatsToAdd);

//     // 🟡 Once verified, you can uncomment this to save
//     // await ourProjectModel.findByIdAndUpdate(
//     //   id,
//     //   {
//     //     $addToSet: {
//     //       flatList: { $each: flatsToAdd },
//     //     },
//     //   },
//     //   { new: true }
//     // );

//     return res.send(
//       successRes(200, "Special floor offices generated successfully", {
//         total: flatsToAdd.length,
//         preview: flatsToAdd, // send first few for preview
//       })
//     );
//   } catch (err) {
//     console.error(err);
//     return res.send(errorRes(500, "Server error"));
//   }
// });

ourProjectRouter.get("/flats-3rd-series-c", async (req, res) => {
  const project = await ourProjectModel.findById(
    "project-ev-capitol-9-vashi-2025",
  );

  project.flatList.forEach((ele) => {
    //
    if (ele.number === 1 || ele.number === 2) {
      //
      ele.reraArea = 330;
      ele.sellableCarpetArea = 660;
    } else if (ele.number === 3) {
      //
      ele.reraArea = 343;
      ele.sellableCarpetArea = 686;
    } else if (ele.number === 4) {
      //
      ele.reraArea = 375;
      ele.sellableCarpetArea = 751;
    } else if (ele.number === 5) {
      //
      ele.reraArea = 855;
      ele.sellableCarpetArea = 1711;
    } else if (ele.number === 6) {
      //
      ele.reraArea = 1917;
      ele.sellableCarpetArea = 3834;
    } else if (ele.number === 7) {
      //
      ele.reraArea = 1950;
      ele.sellableCarpetArea = 3900;
    } else if (ele.number === 8) {
      //
      ele.reraArea = 2097;
      ele.sellableCarpetArea = 4195;
    } else if (ele.number === 9) {
      //
      ele.reraArea = 2818;
      ele.sellableCarpetArea = 5637;
    } else if (ele.number >= 10 && ele.number <= 23) {
      //
      ele.reraArea = 562;
      ele.sellableCarpetArea = 1125;
    } else if (ele.number === 24) {
      //
      ele.reraArea = 2508;
      ele.sellableCarpetArea = 5017;
    } else if (ele.number >= 25 && ele.number <= 30) {
      //
      ele.reraArea = 562;
      ele.sellableCarpetArea = 1125;
    } else if (ele.number >= 25 && ele.number <= 30) {
      //
      ele.reraArea = 562;
      ele.sellableCarpetArea = 1125;
    } else if (ele.number >= 31 && ele.number <= 34) {
      //
      ele.reraArea = 387;
      ele.sellableCarpetArea = 774;
    } else if (ele.number >= 35 && ele.number <= 36) {
      //
      ele.reraArea = 523;
      ele.sellableCarpetArea = 1046;
    } else if (ele.number >= 37) {
      //
      ele.reraArea = 1055;
      ele.sellableCarpetArea = 2110;
    } else if (ele.number >= 38) {
      //
      ele.reraArea = 3166;
      ele.sellableCarpetArea = 6332;
    } else if (ele.number >= 39) {
      //
      ele.reraArea = 1992;
      ele.sellableCarpetArea = 3985;
    }
  });

  await project.save();

  return successRes2(res, 200, "sok", {
    data: project,
  });
});

ourProjectRouter.get("/update-carpet-area/:id", updatCarpetArea);

// TODO: not used
// ourProjectRouter.post("/project-updates-list-details", async (req, res) => {
//   const results = [];
//   const csvFilePath = path.join(__dirname, "malibuPrice.csv");

//   // Check if the CSV file exists
//   if (!fs.existsSync(csvFilePath)) {
//     return res.status(400).send("CSV file not found");
//   }

//   // Read the CSV file
//   fs.createReadStream(csvFilePath)
//     .pipe(csv())
//     .on("data", (data) => {
//       results.push(data);
//     })
//     .on("end", async () => {
//       // Process each row in the CSV
//       await Promise.all(
//         results.map(async (row) => {
//           const {ssArea, balconyArea, reraArea,flatNo2,allInclusiveValue } = row;

//           // Update the project with the matching flatNo
//           const updateResponse = await ourProjectModel.findOneAndUpdate(
//             {
//               _id: "project-ev23-malibu-west-koparkhairne-2024",
//               "flatList.flatNo": flatNo2, // Match flatNo
//             },
//             {
//               $set: {
//                 "flatList.$.ssArea": ssArea, // Update ssArea
//                 "flatList.$.balconyArea": balconyArea, // Update balconyArea
//                 "flatList.$.reraArea": reraArea2,
//                 "flatList.$.allInclusiveValue":allInclusiveValue // Update reraArea
//               },
//             },
//             { new: true } // Return the updated document
//           );

//           // Optionally handle the response or log it
//           if (!updateResponse) {
//             console.log(`FlatNo ${flatNo} not found in project.`);
//           }
//         })
//       );
// // console.log(updateResponse);
//       // Send a success response after processing is done
//       return res.send({ message: "Project flat list updated successfully.",results:results });
//     })
//     .on("error", (err) => {
//       return res.status(500).send({ error: err.message });
//     });
// });

ourProjectRouter.put("/project/updateAllInclusive", async (req, res) => {
  try {
    const { projectId, flatNo, allInclusiveValue } = req.body;

    if (!projectId || !flatNo || allInclusiveValue == null) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const project = await ourProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const flat = project.flatList.find((item) => item.flatNo === flatNo);
    if (!flat) {
      return res
        .status(404)
        .json({ message: "Flat not found in this project" });
    }

    flat.allInclusiveValue = allInclusiveValue;

    await project.save();

    return res.status(200).json({
      message: "All-Inclusive Value updated successfully",
      updatedFlat: flat,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
});

export default ourProjectRouter;
