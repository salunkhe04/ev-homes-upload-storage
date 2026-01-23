import { Router } from "express";
import timelineTracker from "../../model/timeline/timeline.model.js";
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
// DEV: user timeline
// -----------------------------

trackerRouter.get("/user/:userId/timeline", async (req, res) => {
  const rows = await timelineTracker
    .find({ userId: req.params.userId })
    .sort({ start: 1 })
    .lean();

  res.json(rows);
});

trackerRouter.post("/timeline/:uid/approve", async (req, res) => {
  const { uid } = req.params;
  const { approved, remark, approvedBy } = req.body;

  if (typeof approved !== "boolean") {
    return res.status(400).json({ error: "approved must be boolean" });
  }

  const row = await timelineTracker.findOneAndUpdate(
    { blockUid: uid },
    {
      $set: {
        approved,
        remark: remark ?? null,
        approvedBy: approvedBy ?? "system",
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
  const rows = await timelineTracker
    .find({
      userId: req.params.userId,
      approved: null,
    })
    .sort({ start: 1 })
    .lean();

  res.json(rows);
});

trackerRouter.get("/timeline/pending/:userId", async (req, res) => {
  const rows = await timelineTracker
    .find({
      userId: req.params.userId,
      approved: null,
    })
    .sort({ start: 1 })
    .lean();

  res.json(rows);
});

export default trackerRouter;
