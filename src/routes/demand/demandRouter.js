import { Router } from "express";
import {
  addDemand,
  deleteDemandById,
  getDemand,
  getDemandBybooking,
  getDemandBybookings,
  getDemandCountByProjectAndSlab,
  getDemandInfo,
  updateDemandHandover,
} from "../../controller/demand.controller.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
const demandRouter = Router();

demandRouter.get("/demand", authenticateToken, getDemand);
demandRouter.get(
  "/get-demand-by-booking/:booking",
  authenticateToken,
  getDemandBybooking
);
demandRouter.get(
  "/get-demand-by-bookings/:booking",
  authenticateToken,
  getDemandBybookings
);
demandRouter.post("/add-demand", authenticateToken, addDemand);
demandRouter.get(
  "/demand-by-project",
  authenticateToken,
  getDemandCountByProjectAndSlab
);
demandRouter.get("/demand-info", authenticateToken, getDemandInfo);
demandRouter.post(
  "/update-handover/:id",
  authenticateToken,
  updateDemandHandover
);
//delete demand by id
demandRouter.delete("/demand/:id", authenticateToken, deleteDemandById);

// demandRouter.post("/update-lead2-from-csv", async (req, res) => {
//   const results = [];
//   const errors = [];
//   const csvFilePath = path.join(__dirname, "10mbdemand.csv");

//   if (!fs.existsSync(csvFilePath)) {
//     return res.status(400).send("CSV file not found");
//   }
//   const require = create import.meta.url);
//   fs.createReadStream(csvFilePath)
//     .pipe(csv({}))
//     .on("data", (data) => results.push(data))
//     .on("end", async () => {
//       const dataToInsert = [];
//       for (const row of results) {
//         try {
//           const {
//             clientName,
//             flatNumbers,
//             project,
//             date,
//             payableTotalAmountBeforeDueDate,
//             slab,
//             dueDate,
//             isHandedOver,
//           } = row;
//           const handedOver = isHandedOver && isHandedOver.trim().toLowerCase() === "done";

//           const flatNoStr = flatNumbers?.toString().trim();
//           const floor = flatNoStr?.length >= 2 ? flatNoStr.slice(0, -2) : "0";
//           const number = flatNoStr?.length >= 2 ? flatNoStr.slice(-2) : flatNoStr;
//           const slabNumberMatch = slab.match(/\d+/);
//           const slabIndex = slabNumberMatch ? parseInt(slabNumberMatch[0]) : null;

//           let slabId = null;
//           if (slabIndex !== null && "project-ev-10-marina-bay-vashi-sector-10") {

//             const slabData = await slabModel.findOne({ project: "project-ev-10-marina-bay-vashi-sector-10" }).lean();

//             if (slabData) {
//               const matchingSlab = slabData.slabs.find((s) => s.index === slabIndex);
//               slabId = matchingSlab ? matchingSlab.id : null;
//             }
//           }

//           const demandData = {
//             project:"project-ev-10-marina-bay-vashi-sector-10",
//             floor: floor,
//             name: clientName,
//             number: number,
//             flatNo: flatNumbers,
//             slab: slabId,
//             date: row.date ? moment(row.date.trim(), "DD-MM-YYYY").toDate() : null,
//             payableTotalAmountBeforeDueDate: parseFloat(payableTotalAmountBeforeDueDate.replace(/,/g, "")),
//             dueDate: row.dueDate ? moment(row.dueDate.trim(), "DD-MM-YYYY").toDate() : null,
//             isHandedOver: handedOver,
//           };
//           dataToInsert.push(demandData);

//         } catch (error) {
//           errors.push(`Error processing ${row.clientName || "Unknown"}: ${error.message}`);
//         }
//       }
//       // if (dataToInsert.length > 0) {
//       //   try {
//       //     await Demand.insertMany(dataToInsert);
//       //   } catch (error) {
//       //     console.error("Bulk insert failed", error.message);
//       //   }
//       // }

//       // Respond with processed data
//       res.json({
//         message: "CSV processing completed",
//         updatedCount: results.length - errors.length,
//         dataLength: dataToInsert.length,
//         data: dataToInsert,
//       });
//     });

// });

export default demandRouter;
