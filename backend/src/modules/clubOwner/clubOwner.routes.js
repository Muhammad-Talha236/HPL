import express from "express";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { getClubOwnerDashboard, getClubOwnerPayments, getClubOwnerPlayer, getClubOwnerPlayers, getClubOwnerProfile, getClubOwnerTeam, getClubOwnerTeams, updateClubOwnerProfile } from "./clubOwner.controller.js";

const router = express.Router();
router.use(authenticate, authorize(ROLES.CLUB_OWNER));
router.get("/dashboard", getClubOwnerDashboard);
router.get("/profile", getClubOwnerProfile);
router.patch("/profile/:club_id", updateClubOwnerProfile);
router.get("/teams", getClubOwnerTeams);
router.get("/teams/:team_id", getClubOwnerTeam);
router.get("/players", getClubOwnerPlayers);
router.get("/players/:player_id", getClubOwnerPlayer);
router.get("/payments", getClubOwnerPayments);
export default router;
