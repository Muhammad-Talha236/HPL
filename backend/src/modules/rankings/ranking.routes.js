import express from "express";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { getRankings, rebuildRankings } from "./ranking.controller.js";

const router = express.Router();

router.get("/", getRankings);
router.post("/rebuild", authenticate, authorize(ROLES.SUPER_ADMIN), rebuildRankings);

export default router;
