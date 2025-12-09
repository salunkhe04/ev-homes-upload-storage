import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  addShiftInfo,
  getShiftInfos,
  getShiftInfoById,
  getShiftInfoByUserId,
  updateShiftInfo,
  resetGraceAndRegularization,
  storeOverTime,
  updateShift,
} from "../../controller/emlpoyeeShiftInfo.controller.js";
import moment from "moment-timezone";
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import shiftInfoModel from "../../model/attendance/shift/employeeShiftInfo.js";
import { employeeShiftInfoPopulateOptions } from "../../utils/constant.js";
import employeeModel from "../../model/employee.model.js";
const shiftInfoRouter = Router();

shiftInfoRouter.get("/shift-infos", authenticateToken, getShiftInfos);
shiftInfoRouter.post("/add-shift-info", authenticateToken, addShiftInfo);
shiftInfoRouter.get("/shift-info/:id", authenticateToken, getShiftInfoById);
shiftInfoRouter.get("/shift-info-by-user-id/:id", getShiftInfoByUserId);
shiftInfoRouter.post(
  "/shift-info-update/:id",
  authenticateToken,
  updateShiftInfo
);

shiftInfoRouter.post("/shift-update-emp/:id", authenticateToken, updateShift);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
shiftInfoRouter.post("/update-leave-for-year", async (req, res) => {
  try {
    const emps = await employeeModel.find({
      department: "dept-marketing",
      division: { $ne: "div-vashi-sector-17" },
      status: "active",
    });
    const yearAgo = moment("2024-02-29T18:30:00.000Z")
      .tz("Asia/Kolkata")
      .toDate();
    const empsLeaves = [];

    emps.map((ele2) => {
      if (ele2?.joiningDate) {
        const doj = moment(ele2.joiningDate).tz("Asia/Kolkata");
        if (doj.isBefore(yearAgo)) {
          empsLeaves.push({
            userId: ele2?._id,
            paidLeave: 15,
            casualLeave: 7,
            joiningDate: moment(ele2.joiningDate)
              .tz("Asia/Kolkata")
              .format("DD-MM-YYYY"),
          });
        }
      }
    });
    // await Promise.all(
    //   empsLeaves.map(async (ele) => {
    //     await shiftInfoModel.findOneAndUpdate(
    //       {
    //         userId: ele.userId,
    //       },
    //       {
    //         paidLeave: ele.paidLeave,
    //         casualLeave: ele.casualLeave,
    //       }
    //     );
    //   })
    // );
    res.send({
      total: empsLeaves.length,
      data: empsLeaves,
    });
  } catch (error) {
    res.send(error);
  }
});
shiftInfoRouter.post("/update-leaves", async (req, res) => {
  const results = [];

  const emlpoyeeShiftInfo = await shiftInfoModel
    .find()
    .populate(employeeShiftInfoPopulateOptions);

  await Promise.all(
    emlpoyeeShiftInfo.map(async (ele) => {
      await shiftInfoModel.findByIdAndUpdate(ele._id, {
        regularization: ele?.shift?.regularizationDays,
        totalLateDays: 0,
      });
    })
  );
});
// Function to save updated JSON data (optional)
// const saveUpdatedData = (data) => {
//   fs.writeFileSync("updated-data.json", JSON.stringify(data, null, 2));
//   console.log("Updated data saved to updated-data.json");
// };

shiftInfoRouter.post("/reset-shift-test", async (req, res) => {
  const resp = await resetGraceAndRegularization();
  res.send(resp);
});

shiftInfoRouter.post("/overtime/:id", storeOverTime);
export default shiftInfoRouter;
