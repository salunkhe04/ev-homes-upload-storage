import { Router } from "express";
import onboarExhibModel from "../../model/onboardExhib/onboardExhib.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import displaySlotModel from "../../model/onboardExhib/displaySlots.model.js";
import mongoose from "mongoose";
import { onBoardExhibPopulations } from "../../utils/constant.js";
//
const onbExhibRouter = Router();
//
onbExhibRouter.get("/onboards", async (req, res) => {
  try {
    //
    const projs = await onboarExhibModel
      .find()
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
    const projs = await onboarExhibModel.findById(id);

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

  console.log(req.body);
 // const cleanedBody = cleanObject(req.body);
  try {
    // if (!feedback) {
    //   return res.send(errorRes(403, "Remark is required"));
    // }
    const newLead = await onboarExhibModel.findByIdAndUpdate(
      id,
      {
        ...req.body,
      },
      { new: true }
    );

    return successRes2(res, 200, "updated successfully", {
      data: newLead,
    });
  } catch (e) {
    return errorRes2(res, 500, `${error}`);
  }
});

export default onbExhibRouter;
