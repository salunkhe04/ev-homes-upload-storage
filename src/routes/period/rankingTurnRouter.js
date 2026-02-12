// period.routes.js
import { Router } from "express";
import periodModel from "../../model/period/period.model.js";
import { errorRes2, successRes2 } from "../../model/response.js";
import leadModelV2 from "../../model/lead/leadV2Model.js";
import rankingTurnModel from "../../model/period/ranking.model.js";
import moment from "moment-timezone";
import { normalizeRanking } from "../../utils/helper.js";
import { rankingTurnPopulate } from "../../utils/constant.js";
import siteVisitModel from "../../model/siteVisit.model.js";
import employeeModel from "../../model/employee.model.js";

const rankingTurnRouter = Router();

// GET ranking
rankingTurnRouter.get("/turn-ranking", async (req, res) => {
  try {
    // 1. Static team list
    const teams = [
      {
        user: "ev15-deepak-karki",
        rank: 0,
        score: 0,
        leads: [],
        visits: [],
        bookings: [],
      },
      {
        user: "ev54-ranjna-gupta",
        rank: 0,
        score: 0,
        leads: [],
        visits: [],
        bookings: [],
      },
      {
        user: "ev70-jaspreet-arora",
        rank: 0,
        score: 0,
        leads: [],
        visits: [],
        bookings: [],
      },
    ];

    // 2. Get all countable leads
    const leads = await leadModelV2.find(
      {
        $or: [
          {
            isCountable: true,
          },
          {
            isCountableVisit: true,
          },
          {
            isCountableBooking: true,
          },
        ],
      },
      {
        "cycle.teamLeader": 1,
        phoneNumber: 1,
        isCountableVisit: 1,
        isCountable: 1,
        isCountableBooking: 1,
        visitRef: 1,
        bookingRef: 1,
      },
    );

    // 3. Calculate score for each team
    // teams.forEach((tm) => {
    //   const filteredLeads = leads.filter(
    //     (ele) => ele.cycle?.teamLeader === tm.user
    //   );
    //   tm.score = filteredLeads.length;
    //   // tm.leads = filteredLeads.map((ele) => ele._id);
    // });
    // 3. Calculate score for each team
    teams.forEach((tm) => {
      const filteredLeads = leads.filter(
        (ele) => ele.cycle?.teamLeader === tm.user,
      );

      // New scoring system
      let score = 0;
      filteredLeads.forEach((ele) => {
        if (ele.isCountable) score += 1;
        if (ele.isCountableVisit) score += 5;
        if (ele.isCountableBooking) score += 10;
      });

      tm.score = score;

      // optional: keep track of leads, visits, bookings separately
      tm.leads = filteredLeads
        .filter((ele) => ele.isCountable)
        .map((ele) => ele._id);
      tm.visits = filteredLeads
        .filter((ele) => ele.isCountableVisit)
        .map((ele) => ele.visitRef);
      tm.bookings = filteredLeads
        .filter((ele) => ele.isCountableBooking)
        .map((ele) => ele.bookingRef);
    });

    // 4. Sort by score
    teams.sort((a, b) => b.score - a.score);

    // 5. Assign tie-aware ranks
    let currentRank = 1;
    teams.forEach((tm, index) => {
      if (index > 0 && tm.score === teams[index - 1].score) {
        tm.rank = teams[index - 1].rank; // same rank for tie
      } else {
        tm.rank = currentRank;
      }
      currentRank++;
    });

    // 6. Find current period
    const targetDate = new Date();
    const periodFilter = {
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    };
    const currentPeriod = await periodModel.findOne(periodFilter);

    if (!currentPeriod) {
      return errorRes2(res, 404, "No active period found.");
    }

    // 7. Find or create ranking turn
    let currentRTurn = await rankingTurnModel.findOne(periodFilter);

    if (!currentRTurn) {
      const tz = "Asia/Kolkata";
      const monday = moment(targetDate).tz(tz).startOf("week").add(1, "day");
      const sunday = moment(monday).add(6, "days").endOf("day");

      currentRTurn = await rankingTurnModel.create({
        period: currentPeriod._id,
        startDate: monday.toDate(),
        endDate: sunday.toDate(),
        ranking: teams.map((t) => {
          let isMyTurn = false;
          if (t.rank === 1) {
            isMyTurn = true;
          }
          return {
            ...t,
            score: t.score ?? 0,
            user: t.user,
            leadsShouldRecieve: t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1,
            isMyTurn,
          };
        }),
        timeline: [],
      });
    } else {
      // 8. Compare with existing ranking
      // 8. Compare with existing ranking
      const dbRanks = currentRTurn.ranking.map((ele) => {
        return {
          user: ele.user,
          rank: ele.rank,
        };
      });
      const newRanks = teams.map((ele) => {
        return {
          user: ele.user,
          rank: ele.rank,
        };
      });
      const isSameRanking =
        JSON.stringify(dbRanks) === JSON.stringify(newRanks);

      // const isSameRanking =
      //   JSON.stringify(normalizeRanking(currentRTurn.ranking)) ===
      //   JSON.stringify(normalizeRanking(teams));

      if (!isSameRanking) {
        const oldRank = currentRTurn.ranking;
        currentRTurn.timeline.push(oldRank);
        currentRTurn.ranking = teams.map((t) => {
          let isMyTurn = false;
          const myOld = oldRank.find((ele) => ele.user === t.user);
          // check if my rank still same
          if (myOld.rank === t.rank) {
            // check if its was my turn
            if (myOld.isMyTurn === true) {
              isMyTurn = true;
            }
          }
          // else reset to 1st turn
          else if (t.rank === 1) {
            isMyTurn = true;
          }

          return {
            ...t,
            user: t.user,
            score: t.score ?? 0,
            leadsShouldRecieve: t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1,
            isMyTurn,
          };
        });
        await currentRTurn.save();
      } else {
        let hadChanges = false;
        // same rank
        currentRTurn.ranking.forEach((ele) => {
          //
          const user = ele.user;
          const tUser = teams.find((el2) => el2.user === user);
          if (tUser && (tUser.score < ele.score || tUser.score > ele.score)) {
            ele.score = tUser.score;
            hadChanges = true;
          }
        });
        if (hadChanges) {
          await currentRTurn.save();
        }
      }
    }
    const updatedTurn = await rankingTurnModel
      .findById(currentRTurn._id, { timeline: 0 })
      .populate(rankingTurnPopulate);

    return successRes2(res, 200, "Rankings calculated successfully", {
      data: updatedTurn,
    });
  } catch (err) {
    return errorRes2(res, 500, err?.message || "Server error");
  }
});

// for syncing missed leads if any
rankingTurnRouter.get("/leads-rank-sync", async (req, res) => {
  //
  try {
    //
    const countableLeads = [];
    const leads = await leadModelV2.find({
      isCountable: { $exists: true },
      createdAt: { $gte: new Date("2025-10-09T18:30:00.000+00:00") },
      callHistory: { $ne: [] },
    });
    leads.forEach((ele) => {
      const leadDate = moment(ele.createdAt).tz("Asia/Kolkata");

      const hasInterested = ele.callHistory.some((call) => {
        const callDate = moment(call.callDate).tz("Asia/Kolkata");
        const within20Min = callDate.isBefore(
          moment(leadDate).add(20, "minute"),
        );
        return call.interestedStatus === "interested" && within20Min;
      });

      // console.log(hasInterested);

      if (hasInterested) {
        countableLeads.push(ele);
      }
    });

    await Promise.all(
      countableLeads.map(async (ele) => {
        //
        try {
          //
          if (ele.isCountable === false) {
            //
            await leadModelV2.findByIdAndUpdate(ele._id, {
              isCountable: true,
            });
          }
        } catch (error) {
          //
        }
      }),
    );

    return successRes2(res, 200, "s", {
      total: countableLeads.length,
      data: countableLeads,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, error);
  }
});

rankingTurnRouter.get("/leads-rank-sync-for-visit", async (req, res) => {
  //
  try {
    //
    const countableLeads = [];
    const visits = await siteVisitModel.find({
      // isCountable: { $exists: true },
      createdAt: { $gte: new Date("2025-10-09T00:00:00.000+00:00") },
      source: { $ne: "walk-in" },
    });
    await Promise.all(
      visits.map(async (ele) => {
        const oldVisit = await siteVisitModel.findOne({
          phoneNumber: ele.phoneNumber,
          _id: { $ne: ele._id },
        });
        if (!oldVisit) {
          //
          countableLeads.push(ele);
        }
      }),
    );

    await Promise.all(
      countableLeads.map(async (ele) => {
        //
        try {
          //
          // if (ele.isCountable === false) {
          //
          await leadModelV2.findOneAndUpdate(
            {
              phoneNumber: ele.phoneNumber,
            },
            {
              isCountableVisit: true,
            },
          );
          // }
        } catch (error) {
          //
        }
      }),
    );

    return successRes2(res, 200, "s", {
      total: countableLeads.length,
      data: countableLeads,
    });
  } catch (error) {
    //
    return errorRes2(res, 500, error);
  }
});

rankingTurnRouter.get(
  "/leads-rank-sync-for-visit-testing",
  async (req, res) => {
    try {
      // Step 1: Fetch visits (excluding walk-ins)
      const visits = await siteVisitModel.find({
        createdAt: { $gte: new Date("2025-10-09T00:00:00.000+00:00") },
        source: { $ne: "walk-in" },
      });

      // console.log("Total visits fetched:", visits.length);

      let count = 0;

      // Step 2: Check which are first-time visits
      await Promise.all(
        visits.map(async (ele) => {
          const oldVisit = await siteVisitModel.findOne({
            phoneNumber: ele.phoneNumber,
            _id: { $ne: ele._id },
            createdAt: { $lt: ele.createdAt }, // ensure it's an older visit
          });

          if (!oldVisit) {
            count++;
            // console.log("Unique visit found for:", ele.phoneNumber);
          }
        }),
      );

      // Step 3: Just print final count
      // console.log("Total unique (first-time) visits:", count);

      // Step 4: Return response (no DB changes)
      return successRes2(res, 200, "Checked successfully", {
        totalFetched: visits.length,
        totalUniqueCountable: count,
      });
    } catch (error) {
      console.error("Error while checking visits:", error);
      return errorRes2(res, 500, error);
    }
  },
);

rankingTurnRouter.get("/ranking-count/:id", async (req, res) => {
  const id = req.params.id;

  const allCounts = {
    id: id,
    name: null,
    designation: null,

    interestedClient: 0,
    firstVisit: 0,
    booking: 0,
  };

  try {
    const empResp = await employeeModel
      .findById(id)
      .select("firstName lastName reportingTo designation");
    //
    allCounts.name = `${empResp.firstName} ${empResp.lastName}`;
    allCounts.designation = empResp.designation;

    let filter = {
      $match: {
        teamLeader: id,
      },
    };

    // console.log(filter);
    const counts = await leadModelV2.aggregate([
      filter,
      {
        $facet: {
          interestedClient: [
            {
              $match: {
                disabled: false,
                isCountable: true,
              },
            },
            { $count: "count" },
          ],
          firstVisit: [
            {
              $match: {
                disabled: false,

                isCountableVisit: true,
              },
            },
            { $count: "count" },
          ],
          booking: [
            { $match: { disabled: false, isCountableBooking: true } },
            { $count: "count" },
          ],
        },
      },
      {
        $addFields: {
          interestedClientCount: {
            $arrayElemAt: ["$interestedClient.count", 0],
          },
          firstVisitCount: { $arrayElemAt: ["$firstVisit.count", 0] },
          bookingCount: { $arrayElemAt: ["$booking.count", 0] },
        },
      },
      {
        $project: {
          interestedClientCount: 1,
          firstVisitCount: 1,
          bookingCount: 1,
        },
      },
    ]);

    const {
      interestedClientCount = 0,
      firstVisitCount = 0,
      bookingCount = 0,

      // Add other counts as required
    } = counts[0] || {};

    allCounts.interestedClient = interestedClientCount;
    allCounts.firstVisit = firstVisitCount;
    allCounts.booking = bookingCount;

    // console.log({
    //   assignTo: id,
    //   // teamLeader: empResp.reportingTo,
    //   deadline: { $gte: now },
    // });

    return successRes2(res, 200, "Dashboard Counts", { data: allCounts });
  } catch (error) {
    //
    console.log(error);
    return errorRes2(res, 500, "Internal Server Error");
  }
});

export const getCurrentRanks = async () => {
  // 1. Static team list
  const teams = [
    {
      user: "ev15-deepak-karki",
      rank: 0,
      leads: [],
      visits: [],
      bookings: [],
    },
    {
      user: "ev54-ranjna-gupta",
      rank: 0,
      leads: [],
      visits: [],
      bookings: [],
    },
    {
      user: "ev70-jaspreet-arora",
      rank: 0,
      leads: [],
      visits: [],
      bookings: [],
    },
  ];

  // 2. Get all countable leads
  const leads = await leadModelV2.find(
    {
      $or: [
        {
          isCountable: true,
        },
        {
          isCountableVisit: true,
        },
        {
          isCountableBooking: true,
        },
      ],
    },
    {
      "cycle.teamLeader": 1,
      phoneNumber: 1,
      isCountableVisit: 1,
      isCountable: 1,
      isCountableBooking: 1,
      visitRef: 1,
      bookingRef: 1,
    },
  );

  // 3. Calculate score for each team
  // teams.forEach((tm) => {
  //   const filteredLeads = leads.filter(
  //     (ele) => ele.cycle?.teamLeader === tm.user
  //   );
  //   tm.score = filteredLeads.length;
  //   // tm.leads = filteredLeads.map((ele) => ele._id);
  // });
  teams.forEach((tm) => {
    const filteredLeads = leads.filter(
      (ele) => ele.cycle?.teamLeader === tm.user,
    );

    // New scoring system
    let score = 0;
    filteredLeads.forEach((ele) => {
      if (ele.isCountable) score += 1;
      if (ele.isCountableVisit) score += 5;
      if (ele.isCountableBooking) score += 10;
    });

    tm.score = score;

    // optional: keep track of leads, visits, bookings separately
    tm.leads = filteredLeads
      .filter((ele) => ele.isCountable)
      .map((ele) => ele._id);
    tm.visits = filteredLeads
      .filter((ele) => ele.isCountableVisit)
      .map((ele) => ele.visitRef);
    tm.bookings = filteredLeads
      .filter((ele) => ele.isCountableBooking)
      .map((ele) => ele.bookingRef);
  });

  // 4. Sort by score
  teams.sort((a, b) => b.score - a.score);

  // 5. Assign tie-aware ranks
  let currentRank = 1;
  teams.forEach((tm, index) => {
    if (index > 0 && tm.score === teams[index - 1].score) {
      tm.rank = teams[index - 1].rank; // same rank for tie
    } else {
      tm.rank = currentRank;
    }
    currentRank++;
  });

  // 6. Find current period
  const targetDate = new Date();
  const periodFilter = {
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate },
  };
  const currentPeriod = await periodModel.findOne(periodFilter);

  if (!currentPeriod) {
    return errorRes2(res, 404, "No active period found.");
  }

  // 7. Find or create ranking turn
  let currentRTurn = await rankingTurnModel.findOne(periodFilter);

  if (!currentRTurn) {
    const tz = "Asia/Kolkata";
    const monday = moment(targetDate).tz(tz).startOf("week").add(1, "day");
    const sunday = moment(monday).add(6, "days").endOf("day");

    currentRTurn = await rankingTurnModel.create({
      period: currentPeriod._id,
      startDate: monday.toDate(),
      endDate: sunday.toDate(),
      ranking: teams.map((t) => {
        let isMyTurn = false;
        if (t.rank === 1) {
          isMyTurn = true;
        }
        return {
          ...t,
          score: t.score ?? 0,
          user: t.user,
          leadsShouldRecieve: t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1,
          isMyTurn,
        };
      }),
      timeline: [],
    });
  } else {
    // 8. Compare with existing ranking
    const dbRanks = currentRTurn.ranking.map((ele) => {
      return {
        user: ele.user,
        rank: ele.rank,
      };
    });
    const newRanks = teams.map((ele) => {
      return {
        user: ele.user,
        rank: ele.rank,
      };
    });
    const isSameRanking = JSON.stringify(dbRanks) === JSON.stringify(newRanks);

    if (!isSameRanking) {
      const oldRank = currentRTurn.ranking;
      currentRTurn.timeline.push(oldRank);
      currentRTurn.ranking = teams.map((t) => {
        let isMyTurn = false;
        const myOld = oldRank.find((ele) => ele.user === t.user);
        // check if my rank still same
        if (myOld.rank === t.rank) {
          // check if its was my turn
          if (myOld.isMyTurn === true) {
            isMyTurn = true;
          }
        }
        // else reset to 1st turn
        else if (t.rank === 1) {
          isMyTurn = true;
        }

        return {
          ...t,
          user: t.user,
          score: t.score ?? 0,
          leadsShouldRecieve: t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1,
          isMyTurn,
        };
      });
      await currentRTurn.save();
    } else {
      let hadChanges = false;
      // same rank
      currentRTurn.ranking.forEach((ele) => {
        //
        const user = ele.user;
        const tUser = teams.find((el2) => el2.user === user);
        if (tUser && (tUser.score < ele.score || tUser.score > ele.score)) {
          ele.score = tUser.score;
          hadChanges = true;
        }
      });
      if (hadChanges) {
        await currentRTurn.save();
      }
    }

    // if (!isSameRanking) {
    //   currentRTurn.timeline.push(currentRTurn.ranking);
    //   currentRTurn.ranking = teams.map((t) => {
    //     let isMyTurn = false;
    //     if (t.rank === 1) {
    //       isMyTurn = true;
    //     }

    //     return {
    //       ...t,
    //       user: t.user,
    //       score: t.score ?? 0,
    //       leadsShouldRecieve: t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1,
    //       isMyTurn,
    //     };
    //   });
    //   await currentRTurn.save();
    // }
  }
  return currentRTurn;
};
export default rankingTurnRouter;
