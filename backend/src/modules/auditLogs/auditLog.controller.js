import prisma from "../../database/prisma.js";

import { AUDIT_ACTIONS } from "../../constants/auditActions.js";


// ======================================================
// CONSTANTS
// ======================================================

// Maximum number of records returned per request
const MAX_LIMIT = 100;

// Prevent extremely large database offsets
const MAX_PAGE = 10000;

// Allowed audit actions
const ALLOWED_ACTIONS = new Set(
  Object.values(AUDIT_ACTIONS)
);

// Allowed entity types
const ALLOWED_ENTITY_TYPES = new Set([
  "USER",
  "CLUB",
  "TEAM",
  "VENUE",
  "PLAYER",
  "SEASON",
  "COMPETITION",
  "REGISTRATION",
  "PAYMENT",
  "REFEREE",
  "MATCH",
]);



// ======================================================
// GET AUDIT LOGS
// ======================================================

export const getAuditLogs = async (req, res) => {
  try {
    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------

    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    const page =
      rawPage === undefined
        ? 1
        : Number(rawPage);

    const limit =
      rawLimit === undefined
        ? 20
        : Number(rawLimit);


    // Validate pagination values
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > MAX_PAGE
    ) {
      return res.status(400).json({
        success: false,
        message: `Page must be between 1 and ${MAX_PAGE}`,
      });
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_LIMIT
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Limit must be an integer between 1 and 100",
      });
    }


    // Calculate database offset
    const skip = (page - 1) * limit;


    // --------------------------------------------------
    // Filters
    // --------------------------------------------------

    const { action, entity_type } = req.query;

    const where = {};


    // Validate audit action
    if (action !== undefined) {
      if (
        typeof action !== "string" ||
        !ALLOWED_ACTIONS.has(action)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid audit action",
        });
      }

      where.action = action;
    }


    // Validate entity type
    if (entity_type !== undefined) {
      if (
        typeof entity_type !== "string" ||
        !ALLOWED_ENTITY_TYPES.has(entity_type)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid entity type",
        });
      }

      where.entity_type = entity_type;
    }


    // --------------------------------------------------
    // Fetch audit logs + total count
    // --------------------------------------------------

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,

        skip,

        take: limit,

        orderBy: [
          {
            created_at: "desc",
          },
          {
            audit_id: "desc",
          },
        ],

        include: {
          actor: {
            select: {
              user_id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),

      prisma.auditLog.count({
        where,
      }),
    ]);


    // --------------------------------------------------
    // Pagination information
    // --------------------------------------------------

    const totalPages = Math.ceil(total / limit);


    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      data: logs,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

  } catch (error) {
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching audit logs",
    });
  }
};