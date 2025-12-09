import { Router } from "express";
const cpV2Router = Router();
cpV2Router.post("/", checkChannelPartnerEligibilty);
export default cpV2Router;
