import { RedisService } from "../app/redis";
import leadModelV2 from "../model/lead/leadV2Model.js";
import { leadPopulateOptions } from "./constant";

/*
---- need to re-validate cache ----
add feedback,
add cp,
update cp,
update lead,
add site visit,
add booking,
cancel booking,
assignTask,
assignTaskMultiple,
LinkdinUpdate,
task Transfer,
lead Transfer (trigger),
edit feedback,
reject lead,
on approve TL,
on cp note,
on Inform cp,
*/
export const getLeadById = async ({ id, ignoreCache = false }) => {
  // 1. check from cached
  const cached = await RedisService.get(`lead_${id}`, true);
  // 2. provide from cache
  if (cached && !ignoreCache) {
    return cached;
  }

  // 3. find non cached document
  const nonCachedDoc = await leadModelV2
    .findById(id, {
      updateHistory: 0,
      cycleHistory: 0,
    })
    .populate(leadPopulateOptions);
  // 4. cache new data - for 3 days.
  await RedisService.set(`lead_${id}`, nonCachedDoc, 259200);

  return nonCachedDoc;
};
export const setLeadCache = async (lead) => {
  const cached = await RedisService.set(`lead_${lead._id}`, lead, 259200);
  return cached;
};

export const deleteLeadCache = async (id) => {
  const cached = await RedisService.del(`lead_${id}`);
  return cached;
};
