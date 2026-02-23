import leadModelV2 from "../model/lead/leadV2Model.js";
import { errorRes, successRes } from "../model/response.js";
import taskModel from "../model/task.model.js";
import teamInsightModel from "../model/teamInsight.model.js";
import { teamInsightPopulate } from "../utils/constant.js";
import logger from "../utils/logger.js";

export const getTeam = async (req, res) => {
  try {
    const respDes = await teamInsightModel.find().populate(teamInsightPopulate);

    return res.send(
      successRes(200, "Get Teams", {
        data: respDes,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

export const getTeamById = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const respDes = await teamInsightModel
      .findById(id)
      .populate(teamInsightPopulate);

    if (!respDes)
      return res.send(
        successRes(404, `Team not found`, {
          data: respDes,
        }),
      );

    return res.send(
      successRes(200, `get team`, {
        data: respDes,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

// export const getTeamReportingTo = async (req, res) => {
//   const id = req.params.id;
//   try {
//     if (!id) return res.send(errorRes(403, "id is required"));

//     const respDes = await teamInsightModel
//       .find({ reportingTo: id })
//       .sort({ createdAt: -1 })
//       .populate(teamInsightPopulate);

//     return res.send(
//       successRes(200, `get team`, {
//         data: respDes,
//       })
//     );
//   } catch (error) {
// logger.error(error);
//     return res.send(errorRes(500, error.message || error));
//   }
// };

export const getTeamReportingTo = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    let teams = await teamInsightModel
      .find({ reportingTo: id })
      .populate(teamInsightPopulate);

    for (const team of teams) {
      const crewMembers = team.crew.map((c) => c.teamMember);

      const tasks = await taskModel.find(
        {
          assignTo: { $in: crewMembers },
        },
        {
          _id: 1,
        },
      );

      const taskIds = tasks.map((t) => t._id);

      const leads = await leadModelV2
        .find(
          {
            taskRef: { $in: taskIds },
            // $or: [
            //   { teamLeader: team.reportingTo },
            //   { "cycle.teamLeader": team.reportingTo },
            // ],
          },
          {
            taskRef: 1,
          },
        )
        .lean();

      const totalTasks = leads.length;

      // logger.info(totalTasks);

      // await teamInsightModel.findByIdAndUpdate(team._id, { totalTasks });
      team.totalTasks = totalTasks;
      await team.save();
    }

    return res.send(
      successRes(200, "get team", {
        data: teams,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error.message || error));
  }
};

export const getMyTeam = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    validateInsight(id);
    let teams = await teamInsightModel
      .find({ "crew.teamMember": id })
      .populate(teamInsightPopulate);

    //  let teams = await teamInsightModel
    //       .find({ reportingTo: id })
    //       .populate(teamInsightPopulate);

    // for (const team of teams) {
    //   const crewMembers = team.crew.map((c) => c.teamMember);

    //   const tasks = await taskModel.find(
    //     {
    //       assignTo: { $in: crewMembers },
    //     },
    //     {
    //       _id: 1,
    //     }
    //   );

    //   const taskIds = tasks.map((t) => t._id);

    //   const leads = await leadModelV2
    //     .find(
    //       {
    //         taskRef: { $in: taskIds },
    //         // $or: [
    //         //   { teamLeader: team.reportingTo.reportingTo },
    //         //   { "cycle.teamLeader": team.reportingTo },
    //         // ],
    //       },
    //       {
    //         taskRef: 1,
    //       }
    //     )
    //     .lean();

    //   const totalTasks = leads.length;

    //   // logger.info(totalTasks);

    //   // await teamInsightModel.findByIdAndUpdate(team._id, { totalTasks });
    //   team.totalTasks = totalTasks;
    //   await team.save();
    // }

    return res.send(
      successRes(200, `get team`, {
        data: teams,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error.message || error));
  }
};

export const addTeamInsight = async (req, res) => {
  try {
    const { teamName, reportingTo, crew } = req.body;

    if (!reportingTo) {
      return res.send(errorRes(403, "reportingTo is required"));
    }

    const newTeamId = "team-" + teamName?.replace(/\s+/g, "-").toLowerCase();
    const newTeam = await teamInsightModel.create({
      _id: newTeamId,
      teamName,
      reportingTo,
      crew,
    });

    return res.send(
      successRes(200, `Team created successfully: ${teamName}`, {
        data: newTeam,
      }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error));
  }
};

export const updateCrew = async (req, res) => {
  const id = req.params.id;
  const { crew } = req.body;

  try {
    if (!id) return res.send(errorRes(403, "id is required"));

    const team = await teamInsightModel.findById(id).select("crew.teamMember");
    if (!team) return res.send(errorRes(404, "team not found"));

    const existingIds = team.crew.map((c) => c.teamMember.toString());
    // logger.info(existingIds);

    const newIds = crew.map((c) => c.teamMember.toString());

    // logger.info(newIds);
    const alreadyExists = newIds.find((teamMember) =>
      existingIds.includes(teamMember),
    );
    // logger.info(alreadyExists);
    if (alreadyExists) {
      return res.send(errorRes(401, `These team members already exist`));
    }

    const updateTeam = await teamInsightModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { crew: { $each: crew } } },
        { new: true },
      )
      .populate(teamInsightPopulate);

    return res.send(
      successRes(200, `crew updated successfully`, { data: updateTeam }),
    );
  } catch (error) {
    logger.error(error);
    return res.send(errorRes(500, error.message || error));
  }
};

export const validateInsight = async (id) => {
  try {
    let teams = await teamInsightModel.find({ "crew.teamMember": id });
    // .populate(teamInsightPopulate);

    //  let teams = await teamInsightModel
    //       .find({ reportingTo: id })
    //       .populate(teamInsightPopulate);

    for (const team of teams) {
      const crewMembers = team.crew.map((c) => c.teamMember);

      const tasks = await taskModel.find(
        {
          assignTo: { $in: crewMembers },
        },
        {
          _id: 1,
        },
      );

      const taskIds = tasks.map((t) => t._id);

      const leads = await leadModelV2
        .find(
          {
            taskRef: { $in: taskIds },
            // $or: [
            //   { teamLeader: team.reportingTo.reportingTo },
            //   { "cycle.teamLeader": team.reportingTo },
            // ],
          },
          {
            taskRef: 1,
          },
        )
        .lean();

      const totalTasks = leads.length;

      // logger.info(totalTasks);

      // await teamInsightModel.findByIdAndUpdate(team._id, { totalTasks });
      team.totalTasks = totalTasks;
      await team.save();
    }
  } catch (error) {
    logger.error(error);
  }
};
