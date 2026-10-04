import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/statuses.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

import { createAuditLog } from "../../utils/auditLog.util.js";

/*
  Safe User SELECT

  IMPORTANT:
  password_hash is intentionally excluded.
*/
const userSelect = {
  user_id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  profile_image: true,
  created_at: true,
  updated_at: true,
};

// This projection is intentionally separate from authentication projections.
// It contains only operational relationship data a SUPER_ADMIN needs and never
// includes password hashes, tokens, or other authentication material.
const userAdminDetailSelect = {
  ...userSelect,
  owned_clubs: {
    select: {
      club_id: true,
      name: true,
      status: true,
    },
    orderBy: { club_id: "asc" },
  },
  owned_teams: {
    select: {
      team_id: true,
      name: true,
      status: true,
    },
    orderBy: { team_id: "asc" },
  },
  referee_profile: {
    select: {
      referee_id: true,
      name: true,
      status: true,
      user_id: true,
    },
  },
};

/*
  Check whether the authenticated user
  can manage the target user.

  SUPER_ADMIN:
    Can manage any user.

  Other roles:
    Can only manage their own profile.
*/
const canManageUser = (
  currentUser,
  targetUserId
) => {
  if (
    currentUser.role ===
    ROLES.SUPER_ADMIN
  ) {
    return true;
  }

  return (
    currentUser.user_id ===
    targetUserId
  );
};

/*
  GET ALL USERS

  Only SUPER_ADMIN can view the
  complete user list.
*/
export const getUsers = async (
  req,
  res,
  next
) => {
  try {
    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view all users",
      });
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const role = req.query.role;
    const status = req.query.status;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || q.length > 100) return res.status(400).json({ success: false, message: "Invalid user query" });
    if (role && !Object.values(ROLES).includes(role)) return res.status(400).json({ success: false, message: "Invalid role filter" });
    if (status && !Object.values(USER_STATUS).includes(status)) return res.status(400).json({ success: false, message: "Invalid status filter" });
    const where = { ...(role ? { role } : {}), ...(status ? { status } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) };
    const [users, total] = await prisma.$transaction([prisma.user.findMany({ where, select: userSelect, orderBy: [{ created_at: "desc" }, { user_id: "desc" }], skip: (page - 1) * limit, take: limit }), prisma.user.count({ where })]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    next(error);
  }
};

/*
  GET USER BY ID

  SUPER_ADMIN:
    Can view any user.

  Other authenticated users:
    Can only view themselves.

  This prevents IDOR.
*/
export const getUserById = async (
  req,
  res,
  next
) => {
  try {
    const userId = Number(
      req.params.user_id
    );

    if (
      !canManageUser(
        req.user,
        userId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this user",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          user_id: userId,
        },

        select: userSelect,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "Get user by ID error:",
      error
    );

    next(error);
  }
};

/*
  ADMIN USER DETAIL

  Kept under /api/admin so an administrative read cannot accidentally be
  confused with the existing self-profile endpoint.  It shares the safe,
  password-free projection above.
*/
export const getAdminUserById = async (req, res, next) => {
  try {
    const userId = Number(req.params.user_id);

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({
        success: false,
        message: "User ID must be a valid positive integer",
      });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: userAdminDetailSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Get admin user detail error:", error);
    next(error);
  }
};

/*
  UPDATE USER PROFILE

  Editable:
    - name
    - phone
    - profile_image

  NOT editable:
    - user_id
    - email
    - password_hash
    - role
    - status
*/
export const updateUser = async (
  req,
  res,
  next
) => {
  try {
    const userId = Number(
      req.params.user_id
    );

    if (
      !canManageUser(
        req.user,
        userId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this user",
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          user_id: userId,
        },

        select: {
          user_id: true,
          name: true,
          phone: true,
          profile_image: true,
          role: true,
          status: true,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = {};

    if (
      req.body.name !== undefined
    ) {
      updateData.name =
        req.body.name;
    }

    if (
      req.body.phone !== undefined
    ) {
      updateData.phone =
        req.body.phone;
    }

    if (
      req.body.profile_image !==
      undefined
    ) {
      updateData.profile_image =
        req.body.profile_image;
    }

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one profile field is required",
      });
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          user_id: userId,
        },

        data: updateData,

        select: userSelect,
      });

    return res.status(200).json({
      success: true,
      message:
        "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update user error:",
      error
    );

    next(error);
  }
};

/*
  UPDATE USER ROLE

  ONLY SUPER_ADMIN.

  Important security rule:

  The system must always retain
  at least one SUPER_ADMIN.
*/
export const updateUserRole = async (
  req,
  res,
  next
) => {
  try {
    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only SUPER_ADMIN can update user roles",
      });
    }

    const userId = Number(
      req.params.user_id
    );

    const { role } = req.body;

    const existingUser =
      await prisma.user.findUnique({
        where: {
          user_id: userId,
        },

        select: {
          user_id: true,
          role: true,
          status: true,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      existingUser.role === role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User already has this role",
      });
    }

    /*
      Prevent the currently authenticated
      SUPER_ADMIN from removing their own
      SUPER_ADMIN role.
    */
    if (
      userId === req.user.user_id &&
      existingUser.role ===
        ROLES.SUPER_ADMIN &&
      role !== ROLES.SUPER_ADMIN
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove your own SUPER_ADMIN role",
      });
    }

    const roleUpdate =
      await prisma.$transaction(
        async (tx) => {
          // Relationship checks live in the same transaction as the role
          // write. A role must continue to describe the user's linked domain
          // identity; ownership is never removed implicitly by this endpoint.
          const currentUser = await tx.user.findUnique({
            where: { user_id: userId },
            select: {
              user_id: true,
              role: true,
              _count: {
                select: {
                  owned_clubs: true,
                  owned_teams: true,
                },
              },
              referee_profile: {
                select: { referee_id: true },
              },
            },
          });

          if (!currentUser) {
            throw new Error("USER_NOT_FOUND");
          }

          if (currentUser.role === role) {
            throw new Error("USER_ROLE_UNCHANGED");
          }

          if (currentUser._count.owned_clubs > 0 && role !== ROLES.CLUB_OWNER) {
            throw new Error("USER_OWNS_CLUBS");
          }

          if (currentUser._count.owned_teams > 0 && role !== ROLES.TEAM_OWNER) {
            throw new Error("USER_OWNS_TEAMS");
          }

          if (currentUser.referee_profile && role !== ROLES.REFEREE) {
            throw new Error("USER_HAS_REFEREE_PROFILE");
          }

          /*
            If the target is a SUPER_ADMIN
            and we are removing that role,
            make sure another SUPER_ADMIN
            still exists.

            This check is performed inside
            the transaction.
          */
          if (
            currentUser.role ===
              ROLES.SUPER_ADMIN &&
            role !==
              ROLES.SUPER_ADMIN
          ) {
            const superAdminCount =
              await tx.user.count({
                where: {
                  role:
                    ROLES.SUPER_ADMIN,
                },
              });

            if (
              superAdminCount <= 1
            ) {
              throw new Error(
                "LAST_SUPER_ADMIN"
              );
            }
          }

          /*
            Conditional update protects
            against stale role information.
          */
          const result =
            await tx.user.updateMany({
              where: {
                user_id: userId,
                role: currentUser.role,
              },

              data: {
                role,
              },
            });

          if (
            result.count !== 1
          ) {
            throw new Error(
              "USER_ROLE_UPDATE_CONFLICT"
            );
          }

          const updatedUser = await tx.user.findUnique({
            where: {
              user_id: userId,
            },

            select: userSelect,
          });

          return { updatedUser, oldRole: currentUser.role };
        }
      );

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.USER_ROLE_UPDATED,

      entity_type: "USER",

      entity_id: userId,

      details: {
        old_role:
          roleUpdate.oldRole,

        new_role: role,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "User role updated successfully",
      data: roleUpdate.updatedUser,
    });
  } catch (error) {
    if (
      error.message ===
      "LAST_SUPER_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The last SUPER_ADMIN cannot be removed",
      });
    }

    if (
      error.message ===
      "USER_ROLE_UPDATE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "User role was changed by another request. Please try again.",
      });
    }

    const integrityMessages = {
      USER_NOT_FOUND: "User not found",
      USER_ROLE_UNCHANGED: "User already has this role",
      USER_OWNS_CLUBS: "User owns a club. Transfer club ownership before changing this role.",
      USER_OWNS_TEAMS: "User owns a team. Transfer team ownership before changing this role.",
      USER_HAS_REFEREE_PROFILE: "User has a linked referee profile. Remove or reassign that profile before changing this role.",
    };

    if (integrityMessages[error.message]) {
      return res.status(error.message === "USER_NOT_FOUND" ? 404 : 400).json({
        success: false,
        message: integrityMessages[error.message],
      });
    }

    console.error(
      "Update user role error:",
      error
    );

    next(error);
  }
};

/*
  DEACTIVATE USER

  ACTIVE -> INACTIVE

  Only SUPER_ADMIN.

  A user cannot deactivate
  their own account.
*/
export const deactivateUser =
  async (req, res, next) => {
    try {
      if (
        req.user.role !==
        ROLES.SUPER_ADMIN
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only SUPER_ADMIN can deactivate users",
        });
      }

      const userId = Number(
        req.params.user_id
      );

      if (
        userId === req.user.user_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot deactivate your own account",
        });
      }

      const result =
        await prisma.user.updateMany({
          where: {
            user_id: userId,
            status:
              USER_STATUS.ACTIVE,
          },

          data: {
            status:
              USER_STATUS.INACTIVE,
          },
        });

      if (result.count === 0) {
        const user =
          await prisma.user.findUnique({
            where: {
              user_id: userId,
            },

            select: {
              user_id: true,
              status: true,
            },
          });

        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "User not found",
          });
        }

        return res.status(400).json({
          success: false,
          message:
            "User is not currently active",
        });
      }

      const updatedUser =
        await prisma.user.findUnique({
          where: {
            user_id: userId,
          },

          select: userSelect,
        });

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.USER_DEACTIVATED,

        entity_type: "USER",

        entity_id: userId,

        details: {
          previous_status:
            USER_STATUS.ACTIVE,

          new_status:
            USER_STATUS.INACTIVE,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "User deactivated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error(
        "Deactivate user error:",
        error
      );

      next(error);
    }
  };

/*
  ACTIVATE USER

  INACTIVE -> ACTIVE

  Only SUPER_ADMIN.
*/
export const activateUser =
  async (req, res, next) => {
    try {
      if (
        req.user.role !==
        ROLES.SUPER_ADMIN
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only SUPER_ADMIN can activate users",
        });
      }

      const userId = Number(
        req.params.user_id
      );

      const result =
        await prisma.user.updateMany({
          where: {
            user_id: userId,
            status:
              USER_STATUS.INACTIVE,
          },

          data: {
            status:
              USER_STATUS.ACTIVE,
          },
        });

      if (result.count === 0) {
        const user =
          await prisma.user.findUnique({
            where: {
              user_id: userId,
            },

            select: {
              user_id: true,
              status: true,
            },
          });

        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "User not found",
          });
        }

        return res.status(400).json({
          success: false,
          message:
            "User is not currently inactive",
        });
      }

      const updatedUser =
        await prisma.user.findUnique({
          where: {
            user_id: userId,
          },

          select: userSelect,
        });

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.USER_ACTIVATED,

        entity_type: "USER",

        entity_id: userId,

        details: {
          previous_status:
            USER_STATUS.INACTIVE,

          new_status:
            USER_STATUS.ACTIVE,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "User activated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error(
        "Activate user error:",
        error
      );

      next(error);
    }
  };

/*
  BLOCK USER

  ACTIVE / INACTIVE -> BLOCKED

  Only SUPER_ADMIN.

  A SUPER_ADMIN cannot block
  themselves.
*/
export const blockUser = async (
  req,
  res,
  next
) => {
  try {
    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only SUPER_ADMIN can block users",
      });
    }

    const userId = Number(
      req.params.user_id
    );

    if (
      userId === req.user.user_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot block your own account",
      });
    }

    /*
      Prevent blocking the last
      SUPER_ADMIN.

      This protects against accidentally
      locking the entire administration
      out of the system.
    */
    const targetUser =
      await prisma.user.findUnique({
        where: {
          user_id: userId,
        },

        select: {
          user_id: true,
          role: true,
          status: true,
        },
      });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      targetUser.role ===
      ROLES.SUPER_ADMIN
    ) {
      const superAdminCount =
        await prisma.user.count({
          where: {
            role:
              ROLES.SUPER_ADMIN,
          },
        });

      if (
        superAdminCount <= 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The last SUPER_ADMIN cannot be blocked",
        });
      }
    }

    const result =
      await prisma.user.updateMany({
        where: {
          user_id: userId,

          status: {
            in: [
              USER_STATUS.ACTIVE,
              USER_STATUS.INACTIVE,
            ],
          },
        },

        data: {
          status:
            USER_STATUS.BLOCKED,
        },
      });

    if (result.count === 0) {
      return res.status(400).json({
        success: false,
        message:
          "User is already blocked",
      });
    }

    const updatedUser =
      await prisma.user.findUnique({
        where: {
          user_id: userId,
        },

        select: userSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.USER_BLOCKED,

      entity_type: "USER",

      entity_id: userId,

      details: {
        previous_status:
          targetUser.status,

        new_status:
          USER_STATUS.BLOCKED,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "User blocked successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(
      "Block user error:",
      error
    );

    next(error);
  }
};
