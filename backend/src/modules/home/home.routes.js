import express from "express";

import { getHomeStatistics } from "./home.controller.js";

const router = express.Router();

router.get("/statistics", getHomeStatistics);

export default router;
