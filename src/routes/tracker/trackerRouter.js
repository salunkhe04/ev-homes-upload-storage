import { Router } from "express";
import timelineTracker from "../../model/timeline/timeline.model.js";
import timeTrackerConfModel from "../../model/timeline/timeTrackerConfig.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import timeTrackerActivityModel from "../../model/timeline/timelineActivity.model.js";
import moment from "moment-timezone";
import logger from "../../utils/logger.js";
const trackerRouter = Router();
// -----------------------------
// POST /agent/sync
// -----------------------------
trackerRouter.post("/agent/sync", async (req, res) => {
  const { agentId, userId, blocks } = req.body;

  const acked = [];

  for (const b of blocks) {
    await timelineTracker.updateOne(
      { blockUid: b.blockUid },
      {
        $setOnInsert: {
          blockUid: b.blockUid,
          agentId,
          userId,
          approved: null,
        },
        $set: {
          start: new Date(b.start),
          end: new Date(b.end),
          state: b.state,
          mode: b.mode,
          process: b.process,
          title: b.title,
          duration: b.duration,
          remark: b.remark,
        },
      },
      { upsert: true },
    );

    acked.push(b.blockUid);
  }

  res.json({ AckedUids: acked });
});

// -----------------------------
// POST /agent/sync
// -----------------------------
trackerRouter.post("/agent/sync-activity", async (req, res) => {
  const { agentId, userId, blocks } = req.body;

  const acked = [];

  for (const b of blocks) {
    await timeTrackerActivityModel.updateOne(
      { uid: b.uid },
      {
        $setOnInsert: {
          uid: b.uid,
          agentId,
          userId,
          startTime: new Date(b.startTime),
          date: new Date(b.date),
        },
        $set: {
          mode: b.mode,
          process: b.process,
          activity: b.activity,
          title: b.title,
          screenshotUrl: b.screenshotUrl,
          webcamUrl: b.webcamUrl,
        },
      },
      { upsert: true },
    );

    acked.push(b.uid);
  }

  res.json({ AckedUids: acked });
});

// -----------------------------
// DEV: user timeline
// -----------------------------

trackerRouter.get("/user/:userId/timeline-activity", async (req, res) => {
  const { startDate, endDate } = req.query;

  const timeZone = "Asia/Kolkata";
  const start = moment(startDate).isValid()
    ? moment(startDate).tz(timeZone).startOf("day")
    : moment().tz(timeZone).startOf("day");
  const end = moment(endDate).isValid()
    ? moment(endDate).tz(timeZone).endOf("day")
    : moment().tz(timeZone).endOf("day");

  let statusToFInd = {
    userId: req.params.userId,
    date: { $gte: start.toDate(), $lte: end.toDate() },
    $or: [
      {
        webcamUrl: { $ne: "" },
      },
      {
        screenshotUrl: { $ne: "" },
      },
    ],
  };

  // logger.info(statusToFInd);
  const rows = await timeTrackerActivityModel
    .find(statusToFInd)
    .sort({ start: 1 })
    .lean();

  return successRes2(res, 200, "acitvity", {
    total: rows.length,
    data: rows,
  });
  // res.json(rows);
});

trackerRouter.get("/timeline-config", async (req, res) => {
  // logger.info(statusToFInd);
  const rows = await timeTrackerConfModel.find().lean();

  return successRes2(res, 200, "acitvity", {
    total: rows.length,
    data: rows,
  });
  // res.json(rows);
});

trackerRouter.get("/user/:userId/timeline", async (req, res) => {
  const { startDate, endDate } = req.query;

  const timeZone = "Asia/Kolkata";
  const start = moment(startDate).isValid()
    ? moment(startDate).tz(timeZone).startOf("day")
    : moment().tz(timeZone).startOf("day");
  const end = moment(endDate).isValid()
    ? moment(endDate).tz(timeZone).endOf("day")
    : moment().tz(timeZone).endOf("day");

  let statusToFInd = {
    userId: req.params.userId,
    start: { $gte: start.toDate() },
    end: { $lte: end.toDate() },
  };

  // logger.info(statusToFInd);
  const rows = await timelineTracker
    .find(statusToFInd)
    .sort({ start: 1 })
    .lean();

  res.json(rows);
});

trackerRouter.post("/timeline-approve/:uid", async (req, res) => {
  const { uid } = req.params;
  const { approvalRemark, approvedBy } = req.body;

  const row = await timelineTracker.findOneAndUpdate(
    { blockUid: uid },
    {
      $set: {
        approved: "approved",
        approvalRemark: approvalRemark ?? null,
        approvedBy: approvedBy ?? "system-approved",
        approvedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!row) {
    return res.status(404).json({ error: "timeline_not_found" });
  }

  res.json({
    ok: true,
    uid,
    approved: row.approved,
  });
});

trackerRouter.get("/timeline/pending/:userId", async (req, res) => {
  const { startDate, endDate } = req.query;

  const timeZone = "Asia/Kolkata";
  const start = moment(startDate).isValid()
    ? moment(startDate).tz(timeZone).startOf("day")
    : moment().tz(timeZone).startOf("day");
  const end = moment(endDate).isValid()
    ? moment(endDate).tz(timeZone).endOf("day")
    : moment().tz(timeZone).endOf("day");

  let statusToFInd = {
    userId: req.params.userId,
    start: { $gte: start.toDate() },
    end: { $lte: end.toDate() },
    approved: { $ne: "approved" },
    state: { $ne: "WORK" },
  };

  const rows = await timelineTracker
    .find(statusToFInd)
    .sort({ start: 1 })
    .lean();

  return successRes2(res, 200, "pending list", {
    total: rows.length,
    data: rows,
  });
  // res.json(rows);
});

trackerRouter.get("/timeline/work-duration/:userId", async (req, res) => {
  const { startDate, endDate } = req.query;
  const timeZone = "Asia/Kolkata";

  const start = moment(startDate).isValid()
    ? moment(startDate).tz(timeZone).startOf("day").toDate()
    : moment().tz(timeZone).startOf("day").toDate();

  const end = moment(endDate).isValid()
    ? moment(endDate).tz(timeZone).endOf("day").toDate()
    : moment().tz(timeZone).endOf("day").toDate();

  const userId = req.params.userId;

  const aggregation = await timelineTracker.aggregate([
    {
      $match: {
        userId: userId,
        start: { $gte: start },
        end: { $lte: end },
      },
    },
    {
      $group: {
        _id: "$state",
        totalDuration: { $sum: "$duration" },
      },
    },
  ]);

  // ✅ Always return these 5 states
  const defaultStates = {
    WORK: 0,
    MEETING: 0,
    IDLE: 0,
    MISSING: 0,
    BREAK: 0,
  };

  // Override with actual values
  aggregation.forEach((item) => {
    if (defaultStates.hasOwnProperty(item._id)) {
      defaultStates[item._id] = item.totalDuration;
    }
  });

  return successRes2(res, 200, "state duration summary", {
    data: {
      ...defaultStates,
    },
  });
});

trackerRouter.get("/get-time-tracker-config/:id", async (req, res) => {
  const id = req.params.id;
  const agentId = req.query.agentId;
  try {
    let foundEntry = await timeTrackerConfModel
      .findOne({
        userId: id,
      })
      .lean();
    if (!foundEntry) {
      //
      foundEntry = await timeTrackerConfModel.create({
        userId: id,
        agentId: agentId,
      });
    }

    return successRes2(res, 200, "ok", {
      data: foundEntry,
    });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `${error}`);
  }
});

trackerRouter.post("/update-time-tracker-config/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  if (!id) return errorRes2(res, 401, "id required");
  try {
    let foundEntry = await timeTrackerConfModel
      .findOne({
        userId: id,
      })
      .lean();

    //
    if (!foundEntry) {
      //
      foundEntry = await timeTrackerConfModel.create({
        userId: id,
        ...body,
      });
    }
    //
    foundEntry = await timeTrackerConfModel.findOneAndUpdate(
      { userId: id },
      {
        ...body,
      },
      {
        new: true,
      },
    );

    return successRes2(res, 200, "ok", {
      data: foundEntry,
    });
  } catch (error) {
    logger.info(error);
    return errorRes2(res, 500, `${error}`);
  }
});

//apply idle or ant request
trackerRouter.post("/timeline-apply/:uid", async (req, res) => {
  const { uid } = req.params;
  const { remark } = req.body;

  const row = await timelineTracker.findOneAndUpdate(
    { blockUid: uid },
    {
      $set: {
        approved: "pending",
        remark: remark ?? null,

        applyDate: new Date(),
      },
    },
    { new: true },
  );

  if (!row) {
    return res.status(404).json({ error: "timeline_not_found" });
  }

  res.json({
    ok: true,
    uid,
    approved: row.approved,
  });
});

trackerRouter.get("/agent/:userId/approvals", async (req, res) => {
  const id = req.params.userId;

  const timeLines = await timelineTracker.find(
    {
      userId: id,
      approved: "approved",
      // approvalSync: false
    },
    { blockUid: 1, approved: 1 },
  );

  // const blockId = timeLines.map((e) => e.blockUid);

  const acked = [];

  res.json(timeLines);
});
//apply idle or ant request
trackerRouter.post("/agent/timeline-approval-sync/:uid", async (req, res) => {
  const { uid } = req.params;

  const row = await timelineTracker.findOneAndUpdate(
    { blockUid: uid },
    {
      $set: {
        approvalSync: true,
      },
    },
    { new: true },
  );

  if (!row) {
    return res.status(404).json({ error: "timeline_not_found" });
  }

  res.json({
    ok: true,
    uid,
    row,
  });
});

export default trackerRouter;
