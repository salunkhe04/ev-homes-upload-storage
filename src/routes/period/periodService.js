// service/periodService.js (example)
import moment from "moment-timezone";
import periodModel from "../../model/period/period.model.js";
const TZ = "Asia/Kolkata";

const togglePeriod = (p) =>
  p === "sample-period" ? "ranking-period" : "sample-period";

/**
 * Ensure periods exist up to current week.
 * Returns an object { created: [], skipped: [], existingCurrentWeek? }
 */
export async function ensurePeriodsUpToCurrentWeek(tz = TZ) {
  const now = moment.tz(tz);

  // Current week Monday 00:00 (ISO week) and Sunday 23:59:59.999
  const currentWeekStart = now.clone().startOf("isoWeek").startOf("day");
  const currentWeekEnd = now.clone().endOf("isoWeek").endOf("day");

  // If current week's period already exists (any period type), return it.
  const existingCurrent = await periodModel.findOne({
    startDate: currentWeekStart.toDate(),
    endDate: currentWeekEnd.toDate(),
  });
  if (existingCurrent) {
    return {
      message: "current_week_exists",
      existingCurrent,
      created: [],
      skipped: [],
    };
  }

  // Find the most recent period we have (by endDate desc)
  const last = await periodModel.findOne().sort({ endDate: -1 });

  // If no last period at all -> create current week with default "sample-period"
  if (!last) {
    const created = await periodModel.create({
      period: "sample-period",
      startDate: currentWeekStart.toDate(),
      endDate: currentWeekEnd.toDate(),
    });
    return {
      message: "created_from_empty",
      created: [created],
      skipped: [],
      existingCurrent: null,
    };
  }

  const lastWeekStart = moment
    .tz(last.startDate, tz)
    .startOf("isoWeek")
    .startOf("day");
  const prevWeekStart = currentWeekStart
    .clone()
    .subtract(1, "week")
    .startOf("day");

  // Helper to try create a week's period safely (skip or return existing if concurrent)
  async function createWeekIfMissing(weekStartMoment, periodType) {
    const weekStartDate = weekStartMoment
      .clone()
      .startOf("isoWeek")
      .startOf("day")
      .toDate();
    const weekEndDate = weekStartMoment
      .clone()
      .endOf("isoWeek")
      .endOf("day")
      .toDate();

    // If anything exists for that week, return it and mark skipped
    const existing = await periodModel.findOne({
      startDate: weekStartDate,
      endDate: weekEndDate,
    });
    if (existing) return { created: null, existing };

    try {
      const created = await periodModel.create({
        period: periodType,
        startDate: weekStartDate,
        endDate: weekEndDate,
      });
      return { created, existing: null };
    } catch (err) {
      // race: someone else created it meanwhile -> return that doc
      if (err.code === 11000) {
        const doc = await periodModel.findOne({
          startDate: weekStartDate,
          endDate: weekEndDate,
        });
        return { created: null, existing: doc };
      }
      throw err;
    }
  }

  // If last period is exactly the previous week, only create current week (toggle once)
  if (lastWeekStart.isSame(prevWeekStart)) {
    const nextType = togglePeriod(last.period);
    const res = await createWeekIfMissing(currentWeekStart, nextType);
    if (res.created)
      return {
        message: "created_current_from_last_week",
        created: [res.created],
        skipped: [],
        existingCurrent: null,
      };
    // If it existed due to race
    return {
      message: "current_already_created_concurrently",
      created: [],
      skipped: [res.existing],
      existingCurrent: null,
    };
  }

  // If last period is in future (shouldn't happen) -> bail
  if (lastWeekStart.isAfter(currentWeekStart)) {
    return { message: "last_period_in_future", last, created: [], skipped: [] };
  }

  // Otherwise last is older than previous week -> fill each week from (lastWeekStart + 1 week) .. currentWeekStart
  const created = [];
  const skipped = [];

  // Expected type for the first missing week is toggle(last.period)
  let expectedType = togglePeriod(last.period);

  // Start from the week after last
  let iterWeek = lastWeekStart
    .clone()
    .add(1, "week")
    .startOf("isoWeek")
    .startOf("day");

  while (!iterWeek.isAfter(currentWeekStart, "day")) {
    // If there's already a period for this iterWeek, respect it and update expectedType accordingly
    const existing = await periodModel.findOne({
      startDate: iterWeek.toDate(),
      endDate: iterWeek.clone().endOf("isoWeek").endOf("day").toDate(),
    });

    if (existing) {
      // Respect manual override — continue chain from this existing week
      skipped.push(existing);
      expectedType = togglePeriod(existing.period);
    } else {
      // create with expectedType
      try {
        const { created: cr, existing: ex } = await createWeekIfMissing(
          iterWeek,
          expectedType
        );
        if (cr) {
          created.push(cr);
        } else if (ex) {
          // race created by other process
          skipped.push(ex);
          expectedType = togglePeriod(ex.period);
          iterWeek.add(1, "week");
          continue;
        }
        // after successful create, next expected type toggles
        expectedType = togglePeriod(expectedType);
      } catch (err) {
        // bubble up unexpected DB errors
        throw err;
      }
    }

    // next week
    iterWeek.add(1, "week");
  }

  return {
    message: "filled_chain_to_current",
    created,
    skipped,
    lastFound: last,
  };
}
