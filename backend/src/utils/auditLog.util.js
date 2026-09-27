import prisma from "../database/prisma.js";

/**
 * Create an audit log entry.
 *
 * @param {Object} data
 * @param {number|null} data.actor_user_id
 * @param {string} data.action
 * @param {string} data.entity_type
 * @param {number|null} data.entity_id
 * @param {Object|null} data.details
 */
export const createAuditLog = async ({
  actor_user_id = null,
  action,
  entity_type,
  entity_id = null,
  details = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        actor_user_id,
        action,
        entity_type,
        entity_id,
        details,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main request
    console.error("Audit log creation failed:", error);
  }
};