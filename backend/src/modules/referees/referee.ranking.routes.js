import express from "express";
import { getRefereeRankings } from "./referee.ranking.controller.js";
const router = express.Router();
router.get("/", getRefereeRankings);
export default router;
