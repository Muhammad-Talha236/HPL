import express from "express";

import {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  blockUser,
} from "./user.controller.js";

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
  userIdValidation,
  updateUserValidation,
  updateUserRoleValidation,
  userStatusValidation,
} from "./user.validation.js";

import {
  handleValidationErrors,
} from "../../middleware/auth/validation.middleware.js";

const router = express.Router();

/*
  GET ALL USERS

  Only SUPER_ADMIN.

  This endpoint exposes the user list,
  so authentication and authorization
  are required.
*/
router.get(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  getUsers
);

/*
  GET USER BY ID

  Authentication required.

  Controller additionally checks:
  - SUPER_ADMIN can view any user
  - Normal user can only view themselves

  This provides IDOR protection.
*/
router.get(
  "/:user_id",
  authenticate,
  userIdValidation,
  handleValidationErrors,
  getUserById
);

/*
  UPDATE USER PROFILE

  Allowed roles:
  - SUPER_ADMIN
  - USER
  - TEAM_OWNER
  - CLUB_OWNER

  Controller performs the actual
  ownership check.
*/
router.patch(
  "/:user_id",
  authenticate,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.USER,
    ROLES.TEAM_OWNER,
    ROLES.CLUB_OWNER
  ),
  updateUserValidation,
  handleValidationErrors,
  updateUser
);

/*
  UPDATE USER ROLE

  ONLY SUPER_ADMIN.
*/
router.patch(
  "/:user_id/role",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateUserRoleValidation,
  handleValidationErrors,
  updateUserRole
);

/*
  DEACTIVATE USER

  ONLY SUPER_ADMIN.
*/
router.patch(
  "/:user_id/deactivate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  userStatusValidation,
  handleValidationErrors,
  deactivateUser
);

/*
  ACTIVATE USER

  ONLY SUPER_ADMIN.
*/
router.patch(
  "/:user_id/activate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  userStatusValidation,
  handleValidationErrors,
  activateUser
);

/*
  BLOCK USER

  ONLY SUPER_ADMIN.
*/
router.patch(
  "/:user_id/block",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  userStatusValidation,
  handleValidationErrors,
  blockUser
);

export default router;