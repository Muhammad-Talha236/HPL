import express from "express";

import { getAdminAuditLogById, getAdminAuditLogs, getAuditLogFilterOptions } from "./auditLog.admin.controller.js";

import { authenticate } from "../../middleware/auth/auth.middleware.js";
import { authorize } from "../../middleware/auth/role.middleware.js";

import { ROLES } from "../../constants/roles.js";


const router = express.Router();


// ======================================================
// GET AUDIT LOGS
// ======================================================
// Only authenticated SUPER_ADMIN users can view audit logs.

router.get(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  getAdminAuditLogs
);

router.get("/options", authenticate, authorize(ROLES.SUPER_ADMIN), getAuditLogFilterOptions);
router.get("/:audit_id", authenticate, authorize(ROLES.SUPER_ADMIN), getAdminAuditLogById);


export default router;
