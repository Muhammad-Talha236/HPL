import express from "express";

import {
  getTeamPlayers,
  getTeamSquad,
  getTeamPlayerById,
  createTeamPlayer,
  updateTeamPlayer,
  removeTeamPlayer,
  activateTeamPlayer,
} from "./teamPlayer.controller.js";

import {
  authenticate,
} from "../../middleware/auth/auth.middleware.js";

import {
  authorize,
} from "../../middleware/auth/role.middleware.js";

import {
  ROLES,
} from "../../constants/roles.js";

import {
  teamPlayerIdValidation,
  teamSquadValidation,
  createTeamPlayerValidation,
  updateTeamPlayerValidation,
  teamPlayerStatusValidation,
} from "./teamPlayer.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

/*
  GET ALL TEAM PLAYER RECORDS

  Public endpoint.
*/
router.get(
  "/",
  getTeamPlayers
);

/*
  GET ACTIVE SQUAD OF A TEAM

  Public endpoint.

  IMPORTANT:
  This route must come before
  "/:team_player_id".
*/
router.get(
  "/team/:team_id",
  teamSquadValidation,
  handleValidationErrors,
  getTeamSquad
);

/*
  GET TEAM PLAYER BY ID

  Public endpoint.
*/
router.get(
  "/:team_player_id",
  teamPlayerIdValidation,
  handleValidationErrors,
  getTeamPlayerById
);

/*
  ADD PLAYER TO TEAM

  Only:
  - SUPER_ADMIN
  - CLUB_OWNER
  - TEAM_OWNER

  Actual ownership is checked
  inside the controller.
*/
router.post(
  "/",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  createTeamPlayerValidation,
  handleValidationErrors,
  createTeamPlayer
);

/*
  UPDATE TEAM PLAYER

  Only:
  - SUPER_ADMIN
  - CLUB_OWNER
  - TEAM_OWNER

  Controller performs ownership
  and IDOR protection.
*/
router.patch(
  "/:team_player_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  updateTeamPlayerValidation,
  handleValidationErrors,
  updateTeamPlayer
);

/*
  REMOVE PLAYER FROM TEAM

  Soft removal:
  status -> INACTIVE
  left_at -> current date
*/
router.patch(
  "/:team_player_id/remove",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.CLUB_OWNER,
    ROLES.TEAM_OWNER
  ),
  teamPlayerStatusValidation,
  handleValidationErrors,
  removeTeamPlayer
);

/*
  ACTIVATE TEAM PLAYER

  Only SUPER_ADMIN.

  This prevents team owners from
  independently restoring an old
  roster relationship without
  administrative control.
*/
router.patch(
  "/:team_player_id/activate",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN
  ),
  teamPlayerStatusValidation,
  handleValidationErrors,
  activateTeamPlayer
);

export default router;