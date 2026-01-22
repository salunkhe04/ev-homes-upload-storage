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
          start: new Date(b.start),
          end: new Date(b.end),
        },
        $set: {
          state: b.state,
          process: b.process,
          title: b.title,
          duration: b.duration,
        },
      },
      { upsert: true },
    );

    acked.push(b.blockUid);
  }

  res.json({ AckedUids: acked });
});

// trackerRouter.post("/agent/sync", async (req, res) => {
//   const { agentId, userId, blocks } = req.body;

//   //   console.log(req.body);
//   if (!agentId || !userId || !Array.isArray(blocks)) {
//     return res.status(400).json({ error: "invalid payload" });
//   }

//   const ackedIds = [];

//   for (const b of blocks) {
//     try {
//       const { updatedAt, createdAt, ...safePayload } = b;

//       await timelineTracker.updateOne(
//         {
//           agentId,
//           start: new Date(b.start),
//           end: new Date(b.end),
//         },
//         {
//           $setOnInsert: {
//             agentId,
//             userId,
//             ...safePayload,
//           },
//         },
//         { upsert: true },
//       );

//       // ACK local row regardless (duplicate or inserted)
//       ackedIds.push(b.id);
//     } catch (err) {
//       console.error("sync error:", err);
//     }
//   }

//   res.json({ ackedIds });
// });

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

export default trackerRouter;
