import { Router } from "express";
import { addTeamInsight, getMyTeam, getTeam, getTeamById, getTeamReportingTo, updateCrew } from "../../controller/teamInsight.controller.js";

const teamInsightRouter = Router();

teamInsightRouter.get("/team-insights",getTeam);
teamInsightRouter.get("/team-insights/:id",getTeamById);
teamInsightRouter.get("/my-team-insight/:id",getMyTeam);
teamInsightRouter.get("/team-insight-reporting-to/:id",getTeamReportingTo);
teamInsightRouter.post("/add-team-members",addTeamInsight);
teamInsightRouter.post("/update-crew-members/:id",updateCrew);


export default teamInsightRouter;