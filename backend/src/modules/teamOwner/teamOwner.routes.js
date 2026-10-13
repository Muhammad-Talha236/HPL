import express from "express";
import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";
import { ROLES } from "../../constants/roles.js";
import { competitionRegistrationDetail, competitionSquadCandidates, competitions, dashboard, matchDetail, matches, myTeam, payments, playerDetail, players, registrations, venues } from "./teamOwner.controller.js";

const router = express.Router();
router.use(authenticate, authorize(ROLES.TEAM_OWNER));
router.get("/dashboard", dashboard);
router.get("/team", myTeam);
router.get("/competitions", competitions);
router.get("/matches", matches);
router.get("/matches/:match_id", matchDetail);
router.get("/registrations/:registration_id", competitionRegistrationDetail);
router.get("/registrations/:registration_id/squad-candidates", competitionSquadCandidates);
router.get("/venues", venues);
router.get("/players", players);

router.get("/players/:player_id", playerDetail);
router.get("/registrations", registrations);
router.get("/payments", payments);
export default router;
