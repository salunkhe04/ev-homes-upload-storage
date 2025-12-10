import { Router } from "express";
import onboarExhibModel from "../../model/onboardExhib/onboardExhib.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import displaySlotModel from "../../model/onboardExhib/displaySlots.model.js";
import mongoose from "mongoose";
//
const onbExhibRouter = Router();
//
onbExhibRouter.get("/onboards", async (req, res) => {
  try {
    //
    const projs = await onboarExhibModel.find();

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
    const total = await onboarExhibModel.countDocuments({}/*, { session }*/);
    const [newProj] = await onboarExhibModel.create([ { ...req.body, id: total + 1 } ]/*, { session }*/);

    // Atomically increment counter (upsert display doc if missing)
    // Ensure slots array exists on insert
    const slotsDoc = await displaySlotModel.findOneAndUpdate(
      { _id: "main" },
      {
        $inc: { counter: 1 },
        $setOnInsert: { slots: [null, null, null, null, null, null] }
      },
      { new: true, upsert: true/*, session*/ }
    );

    // compute slot index (counter is 1-based)
    const seq = slotsDoc.counter; // 1,2,3,...
    const slotIndex = (seq - 1) % 6; // 0..5

    // Set the slot to the new onboarding id
    await displaySlotModel.updateOne(
      { _id: "main" },
      { $set: { [`slots.${slotIndex}`]: newProj._id } },
      // { session }
    );

    // await session.commitTransaction();
    // session.endSession();

    return successRes2(res, 200, "boarding added and slot updated", {
      data: newProj,
      slotIndex
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return errorRes2(res, 500, `${error}`);
  }
});


// GET: send 6 slots (populated)
onbExhibRouter.get("/onboard-slots", async (req, res) => {
  try {
    const slotsDoc = await displaySlotModel.findById("main")
      .populate({ path: "slots", model: "onboardExhib" })
      .lean();

    // if no slots doc yet, create default
    if (!slotsDoc) {
      const empty = { _id: "main", counter: 0, slots: [null, null, null, null, null, null] };
      await displaySlotModel.create(empty);
      return successRes2(res, 200, "slots created (empty)", { slots: empty.slots });
    }

    // ensure we always return array length 6
    const slots = Array(6)
      .fill(null)
      .map((_, i) => (slotsDoc.slots && slotsDoc.slots[i]) ? slotsDoc.slots[i] : null);

    return successRes2(res, 200, "display slots", { data:slots, counter: slotsDoc.counter });
  } catch (err) {
    return errorRes2(res, 500, `${err}`);
  }
});


export default onbExhibRouter;
