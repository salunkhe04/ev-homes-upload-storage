import { Router } from "express";
import onboarExhibModel from "../../model/onboardExhib/onboardExhib.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import displaySlotModel from "../../model/onboardExhib/displaySlots.model.js";
import mongoose from "mongoose";
import { onBoardExhibPopulations } from "../../utils/constant.js";
//
import { fileURLToPath } from "url";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import multer from "multer";
import csvParser from "csv-parser";
import ExcelJS from "exceljs";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import employeeModel from "../../model/employee.model.js";
import moment from "moment-timezone";
import taskModel from "../../model/task.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const onbExhibRouter = Router();
//
onbExhibRouter.get("/onboards", async (req, res) => {
  try {
    //
    const projs = await onboarExhibModel
      .find()
      .sort({ createdAt: -1 })
      .populate(onBoardExhibPopulations);

    //   res.send(flats);
    return successRes2(res, 200, "boardings", {
      data: projs,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});
onbExhibRouter.get("/onboarding-slot/:id", async (req, res) => {
  const id = req.params.id;
  try {
    //
    const projs = await onboarExhibModel
      .findById(id)
      .populate(onBoardExhibPopulations);

    //   res.send(flats);
    return successRes2(res, 200, "boardings", {
      data: projs,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, `${error}`);
  }
});

// GET: Last 6 onboardings (newest first)
onbExhibRouter.get("/onboard-last-6", async (req, res) => {
  try {
    const projs = await onboarExhibModel
      .find()
      .sort({ createdAt: -1 }) // newest at index 0
      .limit(6); // keep only 6 items

    return successRes2(res, 200, "boardings 6", {
      data: projs,
    });
  } catch (error) {
    return errorRes2(res, 500, `${error}`);
  }
});

// POST: Add new onboarding
onbExhibRouter.post("/onboard-add", async (req, res) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();
  try {
    const { name, phoneNumber } = req.body;
    if (!name) return errorRes2(res, 401, "name required");
    if (!phoneNumber) return errorRes2(res, 401, "phoneNumber required");

    // (optional) preserve your existing id logic
    const total = await onboarExhibModel.countDocuments({} /*, { session }*/);
    const [newProj] = await onboarExhibModel.create(
      [{ ...req.body, id: total + 1 }] /*, { session }*/
    );

    // Atomically increment counter (upsert display doc if missing)
    // Ensure slots array exists on insert
    const slotsDoc = await displaySlotModel.findOneAndUpdate(
      { _id: "main" },
      {
        $inc: { counter: 1 },
        $setOnInsert: { slots: [null, null, null, null, null, null] },
      },
      { new: true, upsert: true /*, session*/ }
    );

    // compute slot index (counter is 1-based)
    const seq = slotsDoc.counter; // 1,2,3,...
    const slotIndex = (seq - 1) % 6; // 0..5

    // Set the slot to the new onboarding id
    await displaySlotModel.updateOne(
      { _id: "main" },
      { $set: { [`slots.${slotIndex}`]: newProj._id } }
      // { session }
    );

    // await session.commitTransaction();
    // session.endSession();

    return successRes2(res, 200, "boarding added and slot updated", {
      data: newProj,
      slotIndex,
    });
  } catch (error) {
    return errorRes2(res, 500, `${error}`);
  }
});

// GET: send 6 slots (populated)
onbExhibRouter.get("/onboard-slots", async (req, res) => {
  try {
    const slotsDoc = await displaySlotModel
      .findById("main")
      .populate({ path: "slots", model: "onboardExhib" })
      .lean();

    // if no slots doc yet, create default
    if (!slotsDoc) {
      const empty = {
        _id: "main",
        counter: 0,
        slots: [null, null, null, null, null, null],
      };
      await displaySlotModel.create(empty);
      return successRes2(res, 200, "slots created (empty)", {
        slots: empty.slots,
      });
    }

    // ensure we always return array length 6
    const slots = Array(6)
      .fill(null)
      .map((_, i) =>
        slotsDoc.slots && slotsDoc.slots[i] ? slotsDoc.slots[i] : null
      );

    return successRes2(res, 200, "display slots", {
      data: slots,
      counter: slotsDoc.counter,
    });
  } catch (err) {
    return errorRes2(res, 500, `${err}`);
  }
});

// POST: Add new onboarding
onbExhibRouter.post("/onboard-add-feedback", async (req, res) => {
  // const id = req.params.id;
  const {
    id,
    userId,
    tag,
    callStatus,
    leadStage,
    interestedStatus,
    interestedVisit,
    feedback,
    reminderType,
    caller,
  } = req.body;

  if (!id) return errorRes2(res, 401, "id required");

  try {
    // (optional) preserve your existing id logic
    const updated = await onboarExhibModel.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          //
          callHistory: {
            //
            caller: caller,
            callDate: new Date(),
            tag: tag,
            stage: leadStage ?? "",
            interestedStatus,
            interestedVisit,
            reminderType: reminderType,
            feedback: feedback ?? "",
          },
        },
      },
      { new: true }
    );

    return successRes2(res, 200, "boarding updated", {
      data: updated,
      slotIndex,
    });
  } catch (error) {
    return errorRes2(res, 500, `${error}`);
  }
});

// recursive cleaner - removes null, undefined, empty strings, empty arrays, and empty objects (if they become empty)
function cleanObject(value) {
  // remove null / undefined
  if (value === null || value === undefined) return undefined;

  // trim empty strings
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  // keep primitives (numbers incl. 0, booleans)
  if (typeof value !== "object") return value;

  // keep Date, RegExp, Buffer etc. as-is (they are objects but should not be traversed)
  const tag = Object.prototype.toString.call(value);
  if (
    tag === "[object Date]" ||
    tag === "[object RegExp]" ||
    tag === "[object Map]" ||
    tag === "[object Set]" ||
    tag === "[object WeakMap]" ||
    tag === "[object WeakSet]" ||
    (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(value))
  ) {
    return value;
  }

  // arrays: clean elements recursively, drop undefined elements
  if (Array.isArray(value)) {
    const cleanedArr = value
      .map((el) => cleanObject(el))
      .filter((el) => el !== undefined);
    return cleanedArr.length === 0 ? undefined : cleanedArr;
  }

  // plain object: clean each prop recursively
  const cleanedObj = Object.entries(value).reduce((acc, [k, v]) => {
    const cv = cleanObject(v);
    if (cv !== undefined) acc[k] = cv;
    return acc;
  }, {});

  // if object ended up empty, remove it
  return Object.keys(cleanedObj).length === 0 ? undefined : cleanedObj;
}

// wrapper for top-level that ensures an object is always returned
function cleanRequestBody(body) {
  const cleaned = cleanObject(body);
  // return {} if everything was removed (so DB update isn't passed undefined)
  return cleaned === undefined ? {} : cleaned;
}
//POST: update client details
onbExhibRouter.post("/update-exhib-details/:id", async (req, res) => {
  const id = req.params.id;

  const {
    name,
    projects,
    requirements,
    feedback,
    linkdinUrl,
    linkdinPhoto,
    trueCallerPhoto,

    closingManager,
    email,
    feedback2,
  } = req.body;

  // console.log(req.body);
  const cleanedBody = cleanObject(req.body);
  // console.log(cleanedBody);
  try {
    // if (!feedback) {
    //   return res.send(errorRes(403, "Remark is required"));
    // }
    const newLead = await onboarExhibModel.findByIdAndUpdate(
      id,
      {
        ...cleanedBody,
        // name,
        // projects,
        // requirements,
        // feedback,
        // linkdinUrl,
        // linkdinPhoto,
        // trueCallerPhoto,
        // closingManager,
        // email,
        // feedback2,
      },
      { new: true }
    );
    const proj = await onboarExhibModel
      .findById(id)
      .populate(onBoardExhibPopulations);

    return successRes2(res, 200, "updated successfully", {
      data: proj,
    });
  } catch (e) {
    return errorRes2(res, 500, `${error}`);
  }
});

onbExhibRouter.post("/update-exhib-details/:id", async (req, res) => {
  const id = req.params.id;

  const {
    name,
    projects,
    requirements,
    feedback,
    linkdinUrl,
    linkdinPhoto,
    trueCallerPhoto,

    closingManager,
    email,
    feedback2,
  } = req.body;

  // console.log(req.body);
  const cleanedBody = cleanObject(req.body);
  // console.log(cleanedBody);
  try {
    // if (!feedback) {
    //   return res.send(errorRes(403, "Remark is required"));
    // }
    const newLead = await onboarExhibModel.findByIdAndUpdate(
      id,
      {
        ...cleanedBody,
        // name,
        // projects,
        // requirements,
        // feedback,
        // linkdinUrl,
        // linkdinPhoto,
        // trueCallerPhoto,
        // closingManager,
        // email,
        // feedback2,
      },
      { new: true }
    );
    const proj = await onboarExhibModel
      .findById(id)
      .populate(onBoardExhibPopulations);

    return successRes2(res, 200, "updated successfully", {
      data: proj,
    });
  } catch (e) {
    return errorRes2(res, 500, `${error}`);
  }
});

onbExhibRouter.get("/matching-exhibition-clients", async (req, res) => {
  try {
    const exhibitionPath = path.join(
      __dirname,
      "formatted_exhibition_list//.csv"
    );
    const dbPath = path.join(__dirname, "ev_homes_main.onboardexhibsDB1//.csv");

    if (!fs.existsSync(exhibitionPath) || !fs.existsSync(dbPath)) {
      return res.status(400).send("One or more CSV files not found");
    }

    const timeZone = "Asia/Kolkata";
    const baseTime = moment().tz(timeZone);
    const startDate = baseTime.toDate();
    const validTill = moment(baseTime).add(2, "months").toDate();
    const tlValidTIll = moment(baseTime).add(30, "days").toDate();
    const exhibitionMap = new Map();
    const matchedRecords = [];
    const createdLeads = [];
    const previewLeads = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(exhibitionPath)
        .pipe(csv())
        .on("data", (row) => {
          if (row.phoneNumber && row.assignTo) {
            const phone = row.phoneNumber.toString().slice(-10);
            exhibitionMap.set(phone, row.assignTo);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    await new Promise((resolve, reject) => {
      fs.createReadStream(dbPath)
        .pipe(csv())
        .on("data", (row) => {
          if (!row.phoneNumber) return;

          const phone = row.phoneNumber.toString().slice(-10);

          if (exhibitionMap.has(phone)) {
            matchedRecords.push({
              name: row.name,
              phoneNumber: phone,
              assignTo: exhibitionMap.get(phone),
            });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // 3️⃣ Deduplicate by phone number
    const uniqueMatchedMap = new Map();
    matchedRecords.forEach((item) => {
      uniqueMatchedMap.set(item.phoneNumber, item);
    });
    const uniqueMatchedRecords = [...uniqueMatchedMap.values()];

    const phoneNumbers = uniqueMatchedRecords.map((item) => item.phoneNumber);

    // 4️⃣ Check existing leads in DB
    const existingLeads = await leadModelV2
      .find(
        { phoneNumber: { $in: phoneNumbers } },
        { firstName: 1, lastName: 1, phoneNumber: 1, taskRef: 1 }
      )
      .populate({
        path: "taskRef",
        select: "assignTo",
      });

    const existingPhoneSet = new Set(
      existingLeads.map((e) => e.phoneNumber.toString())
    );

    const newNumbers = uniqueMatchedRecords.filter(
      (item) => !existingPhoneSet.has(item.phoneNumber)
    );

    const assignToIds = [...new Set(newNumbers.map((n) => n.assignTo.trim()))];

    const employees = await employeeModel.find(
      { _id: { $in: assignToIds } },
      { reportingTo: 1 }
    );

    const employeeMap = employees.map((emp) => [
      emp._id.toString(),
      emp.reportingTo,
    ]);

    // // 7️⃣ Prepare new lead objects
    // const leadsToInsert = newNumbers.map((item) => {
    //   const emp = employees.find(
    //     (e) => e._id.toString() === item.assignTo.trim()
    //   );
    //   return {
    //     firstName: item.name,
    //     phoneNumber: item.phoneNumber,
    //     assignTo: item.assignTo.trim(),
    //     teamLeader: emp?.reportingTo,
    //     leadFrom: "exhibition-2025",
    //     leadType: "internal-lead",
    //     stage: "visit",

    //     startDate: startDate,
    //     validTill: validTill,
    //     project: [],
    //     address: ".",
    //     cycle: {
    //       stage: "visit",
    //       startDate: startDate,
    //       validTill: tlValidTIll,
    //       teamLeader: emp?.reportingTo,
    //       currentOrder: 1,
    //       currentDays: 29,
    //     },
    //   };
    // });

    // const previewResults = [];

    // for (const item of leadsToInsert) {
    //   const lead = await leadModelV2.create(item);

    //   const task = await taskModel.create({
    //     assignTo: item.assignTo,
    //     assignBy: item?.teamLeader,
    //     type: "live-lead",
    //     lead: lead._id,
    //     assignDate: startDate,
    //     deadline: moment(startDate).add(15, "days").toDate(),
    //     firstName: item.firstName,
    //     phoneNumber: item.phoneNumber,
    //     completed: false,
    //     transferDate: null,
    //   });

    //   await leadModelV2.updateOne(
    //     { _id: lead._id },
    //     { $set: { taskRef: task._id } }
    //   );
    // }

    return res.send({
      message: "DRY RUN ONLY — No data written to MongoDB",
      counts: {
        matchedFromCSV: uniqueMatchedRecords.length,
        alreadyInLeads: existingLeads.length,
        newLeads: newNumbers.length,
        previewCount: previewResults.length,
      },
      previewResults,
    });

  } catch (error) {
    console.error("Error processing CSV:", error);
    res.status(500).send("Internal server error");
  }
});

const normalizePhone = (value) => {
  if (!value) return null;

  const digits = value.toString().replace(/\D/g, "");

  return {
    raw: value,
    normalized: digits.length >= 10 ? digits.slice(-10) : digits,
    isValid: digits.length >= 10,
    length: digits.length,
  };
};

// onbExhibRouter.get("/matching-exhibition-clients", async (req, res) => {
//   try {
//     const exhibitionPath = path.join(
//       __dirname,
//       "cleaned_numbers_exhibition.csv"
//     );
//     const dbPath = path.join(
//       __dirname,
//       "ev_homes_main.onboardexhibsDB1.csv"
//     );

//     if (!fs.existsSync(exhibitionPath) || !fs.existsSync(dbPath)) {
//       return res.status(400).send("One or more CSV files not found");
//     }

//     // 🔹 Step 1: Load exhibition numbers into Set
//     const exhibitionPhoneSet = new Set();

//     await new Promise((resolve, reject) => {
//       fs.createReadStream(exhibitionPath)
//         .pipe(csv())
//         .on("data", (row) => {
//           const phoneObj = normalizePhone(row.phoneNumber);
//           if (phoneObj?.isValid) {
//             exhibitionPhoneSet.add(phoneObj.normalized);
//           }
//         })
//         .on("end", resolve)
//         .on("error", reject);
//     });

//     // 🔹 Step 2: Match against DB CSV (deduplicated)
//     const matchedMap = new Map();
//     const invalidNumbers = [];

//     await new Promise((resolve, reject) => {
//       fs.createReadStream(dbPath)
//         .pipe(csv())
//         .on("data", (row) => {
//           const phoneObj = normalizePhone(row.phoneNumber);
//           // // if (!phoneObj) return;

//           // // store invalid numbers separately
//           // if (!phoneObj.isValid) {
//           //   invalidNumbers.push({
//           //     name: row.name || null,
//           //     phoneNumber: phoneObj.normalized,
//           //     length: phoneObj.length,
//           //   });
//           //   return;
//           // }

//           if (exhibitionPhoneSet.has(phoneObj.normalized)) {
//             matchedMap.set(phoneObj.normalized, {
//               name: row.name || null,
//               phoneNumber: phoneObj.normalized,
//             });
//           }
//         })
//         .on("end", resolve)
//         .on("error", reject);
//     });

//     const matchedRecords = Array.from(matchedMap.values());

//     // 🔹 Step 3: Check against Lead collection
//     const phoneNumbers = matchedRecords.map((m) => m.phoneNumber);

//     const existingLeads = await leadModelV2
//       .find(
//         { phoneNumber: { $in: phoneNumbers } },
//         { firstName: 1, lastName: 1, phoneNumber: 1, taskRef: 1 }
//       )
//       .populate({
//         path: "taskRef",
//         select: "assignTo status",
//       });

//     // 🔹 Step 4: Separate new vs existing
//     const existingPhoneSet = new Set(
//       existingLeads.map((e) => e.phoneNumber.toString())
//     );

//     const newNumbers = matchedRecords.filter(
//       (item) => !existingPhoneSet.has(item.phoneNumber)
//     );

//     // 🔹 Final Response
//     return res.send({
//       message: "Matching & lead validation completed successfully",
//       counts: {
//         matchedUnique: matchedRecords.length,
//         alreadyInLeads: existingLeads.length,
//         newLeads: newNumbers.length,
//         // invalidNumbers: invalidNumbers.length,
//       },
//       existingLeads,
//       newNumbers,
//       // invalidNumbers,
//     });
//   } catch (error) {
//     console.error("Error processing CSV:", error);
//     res.status(500).send("Internal server error");
//   }
// });

//download
onbExhibRouter.get("/formatting-exhibition-xls", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "exbhition_leads_fo.csv");

    if (!fs.existsSync(filePath)) {
      return res.status(400).send("CSV file not found");
    }

    const cleanedData = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const rawPhone = row.phoneNumber;
        const name = row.name;
        const assignTo = row.assignTo;

        const result = normalizePhoneNumber(rawPhone);
        if (!result || !result.phoneNumber) return;

        cleanedData.push({
          name,
          phoneNumber: result.phoneNumber,
          assignTo,
        });
      })
      .on("end", async () => {
        // Create Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Cleaned Numbers");

        worksheet.columns = [
          { header: "Name", key: "name", width: 30 },
          { header: "Phone Number", key: "phoneNumber", width: 20 },
          { header: "Phone Number", key: "assignTo", width: 40 },
        ];

        cleanedData.forEach((item) => {
          worksheet.addRow({
            name: item.name,
            phoneNumber: item.phoneNumber,
            assignTo: item.assignTo,
          });
        });

        const outputPath = path.join(__dirname, "formatted_exhibition.xlsx");
        await workbook.xlsx.writeFile(outputPath);

        res.download(outputPath, "formatted_exhibition.xlsx", (err) => {
          if (err) {
            console.error("Download error:", err);
          }
          fs.unlinkSync(outputPath); // delete after download
        });
      });
  } catch (error) {
    console.error("Error processing CSV:", error);
    res.status(500).send("Internal server error");
  }
});

export default onbExhibRouter;
