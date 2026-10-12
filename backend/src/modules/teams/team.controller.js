import { normalizeStoredEmail } from "../../utils/email.util.js";
import prisma from "../../database/prisma.js";

import { ROLES } from "../../constants/roles.js";

import {
  createAuditLog,
} from "../../utils/auditLog.util.js";

import {
  AUDIT_ACTIONS,
} from "../../constants/auditActions.js";

// ======================================================
// TEAM STATUS
// ======================================================

const TEAM_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// MATCH STATUS
// ======================================================

const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
};

// ======================================================
// TEAM SELECT
// ======================================================

const teamSelect = {
  team_id: true,
  club_id: true,
  owner_id: true,
  home_venue_id: true,

  name: true,
  logo: true,
  gender: true,

  region: true,
  district: true,
  city: true,

  description: true,

  contact_email: true,
  contact_phone: true,

  team_type: true,
  status: true,
  verification_status: true,

  created_at: true,
  updated_at: true,

  club: {
    select: {
      club_id: true,
      name: true,
      logo: true,
    },
  },

  home_venue: {
    select: {
      venue_id: true,
      name: true,
      city: true,
      address: true,
    },
  },
};

// Public discovery must not reuse the operational/team-owner projection.
// Team contact and ownership data are managed data, not football directory data.
const publicTeamSelect = {
  team_id: true,
  name: true,
  logo: true,
  gender: true,
  region: true,
  district: true,
  city: true,
  description: true,
  team_type: true,
  status: true,
  club: { select: { club_id: true, name: true, logo: true } },
  home_venue: { select: { venue_id: true, name: true, city: true } },
};

// ======================================================
// TEAM OWNERSHIP CHECK
// ======================================================

const canManageTeam = async ({
  req,
  team,
}) => {
  if (
    !req.user ||
    !team ||
    (req.user.status !== undefined && req.user.status !== TEAM_STATUS.ACTIVE)
  ) {
    return false;
  }

  // Super Admin can manage every team
  if (
    req.user.role === ROLES.SUPER_ADMIN
  ) {
    return true;
  }

  // Team Owner can manage own team
  if (
    req.user.role === ROLES.TEAM_OWNER &&
    team.owner_id === req.user.user_id
  ) {
    return true;
  }

  // Club Owner can manage teams
  // belonging to their own club
  if (
    req.user.role === ROLES.CLUB_OWNER
  ) {
    // Independent teams have no club. A club owner must never gain access
    // merely because the relation is optional.
    if (team.club_id === null || team.club_id === undefined) {
      return false;
    }

    const club =
      await prisma.club.findUnique({
        where: {
          club_id: team.club_id,
        },

        select: {
          owner_id: true,
        },
      });

    return (
      club &&
      club.owner_id === req.user.user_id
    );
  }

  return false;
};

// ======================================================
// CREATE INDEPENDENT TEAM
// ======================================================

export const createIndependentTeam = async (
  req,
  res
) => {
  try {
    const authenticatedUserId = Number(req.user?.user_id);

    if (!Number.isInteger(authenticatedUserId) || authenticatedUserId < 1) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    // Deliberately allow-list writable fields. owner_id, club_id, role, and
    // status are derived by the server and are never read from the request.
    const {
      home_venue_id,
      name,
      logo,
      gender,
      region,
      district,
      city,
      description,
      contact_email,
      contact_phone,
      team_type,
    } = req.body;

    const venueId = Number(home_venue_id);
    const normalizedName =
      typeof name === "string" ? name.trim() : "";
    const normalizedGender =
      typeof gender === "string" ? gender.trim() : "";
    const normalizedTeamType =
      typeof team_type === "string" ? team_type.trim() : "";

    const optionalFields = [
      [logo, 500],
      [region, 100],
      [district, 100],
      [city, 100],
      [description, 1000],
      [contact_email, 254],
      [contact_phone, 30],
    ];

    if (
      !Number.isInteger(venueId) ||
      venueId < 1 ||
      normalizedName.length < 2 ||
      normalizedName.length > 100 ||
      !["MEN", "WOMEN"].includes(normalizedGender) ||
      !normalizedTeamType ||
      normalizedTeamType.length > 50 ||
      optionalFields.some(
        ([value, maxLength]) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== "string" || value.trim().length > maxLength)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid independent team details",
      });
    }

    const normalizedEmail =
      contact_email === undefined || contact_email === null
        ? undefined
        : normalizeStoredEmail(contact_email);

    if (
      normalizedEmail !== undefined &&
      (!normalizedEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
    ) {
      return res.status(400).json({
        success: false,
        message: "Contact email must be valid",
      });
    }

    const registration = await prisma.$transaction(
      async (tx) => {
        // The database record is the authority for identity and role; a stale
        // or forged JWT/body cannot select another owner or self-promote.
        const owner = await tx.user.findUnique({
          where: {
            user_id: authenticatedUserId,
          },
          select: {
            user_id: true,
            role: true,
            status: true,
            _count: {
              select: {
                owned_clubs: true,
                owned_teams: true,
              },
            },
            referee_profile: {
              select: {
                referee_id: true,
              },
            },
          },
        });

        if (!owner || owner.status !== TEAM_STATUS.ACTIVE) {
          throw new Error("INDEPENDENT_OWNER_INELIGIBLE");
        }

        // A normal member may receive this one narrowly-scoped role change
        // only while registering their first team. This is deliberately not a
        // reusable self-service role endpoint: club owners, referees and all
        // other roles remain governed by the existing admin role policy.
        const isFirstTimeOwner = owner.role === ROLES.USER;

        if (
          owner.role !== ROLES.USER &&
          owner.role !== ROLES.TEAM_OWNER
        ) {
          throw new Error("INDEPENDENT_OWNER_INELIGIBLE");
        }

        if (
          isFirstTimeOwner &&
          (owner._count.owned_clubs > 0 ||
            owner._count.owned_teams > 0 ||
            owner.referee_profile)
        ) {
          throw new Error("INDEPENDENT_OWNER_ROLE_CONFLICT");
        }

        const venue = await tx.venue.findUnique({
          where: {
            venue_id: venueId,
          },
          select: {
            venue_id: true,
            status: true,
          },
        });

        if (!venue) {
          throw new Error("INDEPENDENT_VENUE_NOT_FOUND");
        }

        if (venue.status !== TEAM_STATUS.ACTIVE) {
          throw new Error("INDEPENDENT_VENUE_INACTIVE");
        }

        const existingTeam = await tx.team.findFirst({
          where: {
            club_id: null,
            name: normalizedName,
          },
          select: {
            team_id: true,
          },
        });

        if (existingTeam) {
          throw new Error("INDEPENDENT_TEAM_NAME_EXISTS");
        }

        // The conditional update is the concurrency guard for first-time
        // registration. A second concurrent request cannot promote the same
        // USER twice and therefore cannot create a duplicate first team.
        if (isFirstTimeOwner) {
          const promotion = await tx.user.updateMany({
            where: {
              user_id: owner.user_id,
              role: ROLES.USER,
              status: TEAM_STATUS.ACTIVE,
            },
            data: {
              role: ROLES.TEAM_OWNER,
            },
          });

          if (promotion.count !== 1) {
            throw new Error("INDEPENDENT_OWNER_PROMOTION_CONFLICT");
          }
        }

        const team = await tx.team.create({
          data: {
            club_id: null,
            owner_id: owner.user_id,
            home_venue_id: venueId,
            name: normalizedName,
            logo:
              logo !== undefined && logo !== null
                ? logo.trim()
                : undefined,
            gender: normalizedGender,
            region:
              region !== undefined && region !== null
                ? region.trim()
                : undefined,
            district:
              district !== undefined && district !== null
                ? district.trim()
                : undefined,
            city:
              city !== undefined && city !== null
                ? city.trim()
                : undefined,
            description:
              description !== undefined && description !== null
                ? description.trim()
                : undefined,
            contact_email: normalizedEmail,
            contact_phone:
              contact_phone !== undefined && contact_phone !== null
                ? contact_phone.trim()
                : undefined,
            team_type: normalizedTeamType,
            status: TEAM_STATUS.ACTIVE,
          },
          select: teamSelect,
        });

        // Keep the team creation and narrowly-scoped role change auditable in
        // the same transaction. A failed audit insert rolls the registration
        // back rather than leaving a partially recorded ownership change.
        if (isFirstTimeOwner) {
          await tx.auditLog.create({
            data: {
              actor_user_id: owner.user_id,
              action: AUDIT_ACTIONS.USER_ROLE_UPDATED,
              entity_type: "USER",
              entity_id: owner.user_id,
              details: {
                old_role: ROLES.USER,
                new_role: ROLES.TEAM_OWNER,
                reason: "INDEPENDENT_TEAM_REGISTRATION",
              },
            },
          });
        }

        await tx.auditLog.create({
          data: {
            actor_user_id: owner.user_id,
            action: AUDIT_ACTIONS.TEAM_CREATED,
            entity_type: "TEAM",
            entity_id: team.team_id,
            details: {
              name: team.name,
              club_id: null,
              owner_id: team.owner_id,
              registration_type: "INDEPENDENT",
            },
          },
        });

        return {
          team,
          owner: {
            user_id: owner.user_id,
            role: isFirstTimeOwner ? ROLES.TEAM_OWNER : owner.role,
          },
        };
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Independent team created successfully",
      data: registration.team,
      // authenticate reloads the database identity on every request, so the
      // existing signed token remains safe and immediately reflects this
      // server-side role change. The client can refresh /auth/me from this
      // explicit session hint before routing to the team portal.
      session: registration.owner,
    });
  } catch (error) {
    const expectedErrors = {
      INDEPENDENT_OWNER_INELIGIBLE: [
        403,
        "Only an active USER or TEAM_OWNER account can create an independent team",
      ],
      INDEPENDENT_OWNER_ROLE_CONFLICT: [
        409,
        "This account has an existing platform role or ownership record and cannot be promoted through team registration",
      ],
      INDEPENDENT_OWNER_PROMOTION_CONFLICT: [
        409,
        "This account changed while registration was in progress. Please refresh and try again.",
      ],
      INDEPENDENT_VENUE_NOT_FOUND: [404, "Home venue not found"],
      INDEPENDENT_VENUE_INACTIVE: [
        400,
        "Cannot assign an inactive venue to a team",
      ],
      INDEPENDENT_TEAM_NAME_EXISTS: [
        409,
        "An independent team with this name already exists",
      ],
    };

    if (expectedErrors[error.message]) {
      const [status, message] = expectedErrors[error.message];
      return res.status(status).json({
        success: false,
        message,
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message:
          "Team creation conflicted with another request. Please try again.",
      });
    }

    console.error("Create independent team error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the team",
    });
  }
};

// ======================================================
// CREATE TEAM
// ======================================================

export const createTeam = async (
  req,
  res
) => {
  try {
    const {
      club_id,
      home_venue_id,
      name,
      logo,
      gender,
      region,
      district,
      city,
      description,
      contact_email,
      contact_phone,
      team_type,
      owner_id,
    } = req.body;

    const clubId =
      Number(club_id);

    const venueId =
      Number(home_venue_id);

    // --------------------------------------------------
    // FIND CLUB AND VENUE
    // --------------------------------------------------

    const club =
      await prisma.club.findUnique({
        where: {
          club_id: clubId,
        },

        select: {
          club_id: true,
          owner_id: true,
          status: true,
        },
      });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (
      club.status !==
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create a team under an inactive club",
      });
    }

    // --------------------------------------------------
    // OWNERSHIP CHECK
    // --------------------------------------------------

    if (
      req.user.role !==
        ROLES.SUPER_ADMIN &&
      club.owner_id !==
        req.user.user_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only create teams for your own club",
      });
    }

    const venue =
      await prisma.venue.findUnique({
        where: {
          venue_id: venueId,
        },

        select: {
          venue_id: true,
          status: true,
        },
      });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message:
          "Home venue not found",
      });
    }

    if (
      venue.status !==
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot assign an inactive venue to a team",
      });
    }

    // --------------------------------------------------
    // TEAM OWNER
    // --------------------------------------------------

    let teamOwnerId =
      req.user.role ===
      ROLES.SUPER_ADMIN
        ? club.owner_id
        : req.user.user_id;

    if (owner_id !== undefined) {
      if (req.user.role !== ROLES.SUPER_ADMIN) return res.status(403).json({ success: false, message: "Only SUPER_ADMIN can assign a team owner" });
      const selectedOwner = await prisma.user.findUnique({ where: { user_id: Number(owner_id) }, select: { user_id: true, role: true, status: true } });
      if (!selectedOwner) return res.status(404).json({ success: false, message: "Selected owner not found" });
      if (selectedOwner.role !== ROLES.TEAM_OWNER) return res.status(400).json({ success: false, message: "Selected user must have TEAM_OWNER role" });
      if (selectedOwner.status !== "ACTIVE") return res.status(400).json({ success: false, message: "Selected user account is not active" });
      teamOwnerId = selectedOwner.user_id;
    }

    // --------------------------------------------------
    // CREATE WITH TRANSACTION
    // --------------------------------------------------

    try {
      const team =
        await prisma.$transaction(
          async (tx) => {
            const existingTeam =
              await tx.team.findFirst({
                where: {
                  club_id: clubId,
                  name: name.trim(),
                },

                select: {
                  team_id: true,
                },
              });

            if (existingTeam) {
              const error =
                new Error(
                  "TEAM_NAME_EXISTS"
                );

              throw error;
            }

            return tx.team.create({
              data: {
                club_id: clubId,
                owner_id:
                  teamOwnerId,
                home_venue_id:
                  venueId,

                name:
                  name.trim(),

                logo:
                  logo !== undefined &&
                  logo !== null
                    ? logo.trim()
                    : undefined,

                gender:
                  gender.trim(),

                region:
                  region !== undefined &&
                  region !== null
                    ? region.trim()
                    : undefined,

                district:
                  district !== undefined &&
                  district !== null
                    ? district.trim()
                    : undefined,

                city:
                  city !== undefined &&
                  city !== null
                    ? city.trim()
                    : undefined,

                description:
                  description !== undefined &&
                  description !== null
                    ? description.trim()
                    : undefined,

                contact_email:
                  contact_email !== undefined &&
                  contact_email !== null
                    ? normalizeStoredEmail(contact_email)
                    : undefined,

                contact_phone:
                  contact_phone !== undefined &&
                  contact_phone !== null
                    ? contact_phone.trim()
                    : undefined,

                team_type:
                  team_type.trim(),

                status:
                  TEAM_STATUS.ACTIVE,
              },

              select:
                teamSelect,
            });
          },

          {
            isolationLevel:
              "Serializable",
          }
        );

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS.TEAM_CREATED,

        entity_type: "TEAM",

        entity_id:
          team.team_id,

        details: {
          name:
            team.name,

          club_id:
            team.club_id,

          owner_id:
            team.owner_id,
        },
      });

      return res.status(201).json({
        success: true,
        message:
          "Team created successfully",
        data: team,
      });
    } catch (error) {
      if (
        error.message ===
        "TEAM_NAME_EXISTS"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A team with this name already exists in this club",
        });
      }

      throw error;
    }
  } catch (error) {
    if (
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Team creation conflicted with another request. Please try again.",
      });
    }

    console.error(
      "Create team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the team",
    });
  }
};

// ======================================================
// GET ALL TEAMS
// ======================================================

export const getTeams = async (
  req,
  res
) => {
  try {
    const teams =
      await prisma.team.findMany({
        where: { status: "ACTIVE", verification_status: "VERIFIED" },
        select: publicTeamSelect,

        orderBy: {
          created_at: "desc",
        },

        take: 100,
      });

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error(
      "Get teams error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching teams",
    });
  }
};

// ======================================================
// GET TEAM BY ID
// ======================================================

export const getTeamById = async (
  req,
  res
) => {
  try {
    const teamId =
      Number(req.params.team_id);

    const team =
      await prisma.team.findFirst({
        where: { team_id: teamId, status: "ACTIVE", verification_status: "VERIFIED" },

        select: publicTeamSelect,
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error(
      "Get team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the team",
    });
  }
};

// ======================================================
// UPDATE TEAM
// ======================================================

export const updateTeam = async (
  req,
  res
) => {
  try {
    const teamId =
      Number(req.params.team_id);

    const existingTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
          club_id: true,
          owner_id: true,
          home_venue_id: true,
          status: true,
          name: true,
          gender: true,
        },
      });

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    const allowed =
      await canManageTeam({
        req,
        team: existingTeam,
      });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this team",
      });
    }

    const {
      home_venue_id,
      name,
      logo,
      gender,
      region,
      district,
      city,
      description,
      contact_email,
      contact_phone,
      team_type,
    } = req.body;

    if (
      req.user.role === ROLES.TEAM_OWNER &&
      gender !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Team owners cannot change team gender",
      });
    }

    // --------------------------------------------------
    // BUILD UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    if (
      home_venue_id !==
      undefined
    ) {
      const venueId =
        Number(home_venue_id);

      const venue =
        await prisma.venue.findUnique({
          where: {
            venue_id: venueId,
          },

          select: {
            venue_id: true,
            status: true,
          },
        });

      if (!venue) {
        return res.status(404).json({
          success: false,
          message:
            "Home venue not found",
        });
      }

      if (
        venue.status !==
        TEAM_STATUS.ACTIVE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot assign an inactive venue",
        });
      }

      updateData.home_venue_id =
        venueId;
    }

    if (name !== undefined) {
      const trimmedName =
        name.trim();

      // ----------------------------------------------
      // DUPLICATE TEAM NAME CHECK
      // ----------------------------------------------

      const existingName =
        await prisma.team.findFirst({
          where: {
            club_id:
              existingTeam.club_id,

            name:
              trimmedName,

            NOT: {
              team_id:
                teamId,
            },
          },

          select: {
            team_id: true,
          },
        });

      if (existingName) {
        return res.status(409).json({
          success: false,
          message:
            "A team with this name already exists in this club",
        });
      }

      updateData.name =
        trimmedName;
    }

    if (logo !== undefined) {
      updateData.logo =
        logo === null
          ? null
          : logo.trim();
    }

    if (gender !== undefined) {
      updateData.gender =
        gender.trim();
    }

    if (region !== undefined) {
      updateData.region =
        region === null
          ? null
          : region.trim();
    }

    if (district !== undefined) {
      updateData.district =
        district === null
          ? null
          : district.trim();
    }

    if (city !== undefined) {
      updateData.city =
        city === null
          ? null
          : city.trim();
    }

    if (description !== undefined) {
      updateData.description =
        description === null
          ? null
          : description.trim();
    }

    if (
      contact_email !==
      undefined
    ) {
      updateData.contact_email =
        contact_email === null
          ? null
          : normalizeStoredEmail(contact_email);
    }

    if (
      contact_phone !==
      undefined
    ) {
      updateData.contact_phone =
        contact_phone === null
          ? null
          : contact_phone.trim();
    }

    if (
      team_type !== undefined
    ) {
      updateData.team_type =
        team_type.trim();
    }

    // --------------------------------------------------
    // EMPTY UPDATE
    // --------------------------------------------------

    if (
      Object.keys(updateData)
        .length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one team field is required",
      });
    }

    // --------------------------------------------------
    // UPDATE WITH STATE PROTECTION
    // --------------------------------------------------

    const result =
      await prisma.team.updateMany({
        where: {
          team_id: teamId,

          owner_id:
            existingTeam.owner_id,

          club_id:
            existingTeam.club_id,

          status:
            existingTeam.status,
        },

        data:
          updateData,
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Team was modified by another request. Please try again.",
      });
    }

    // --------------------------------------------------
    // GET UPDATED TEAM
    // --------------------------------------------------

    const updatedTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select:
          teamSelect,
      });

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message:
          "Team no longer exists",
      });
    }

    // --------------------------------------------------
    // AUDIT
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.TEAM_UPDATED,

      entity_type:
        "TEAM",

      entity_id:
        teamId,

      details: {
        previous_name:
          existingTeam.name,

        new_name:
          updatedTeam.name,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Team updated successfully",

      data:
        updatedTeam,
    });
  } catch (error) {
    console.error(
      "Update team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the team",
    });
  }
};

// ======================================================
// DEACTIVATE TEAM
// ======================================================

export const deactivateTeam = async (
  req,
  res
) => {
  try {
    const teamId =
      Number(req.params.team_id);

    const team =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
          club_id: true,
          owner_id: true,
          name: true,
          status: true,
        },
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // --------------------------------------------------
    // AUTHORIZATION
    // --------------------------------------------------

    const allowed =
      await canManageTeam({
        req,
        team,
      });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to deactivate this team",
      });
    }

    if (
      team.status ===
      TEAM_STATUS.INACTIVE
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Team is already inactive",
      });
    }

    // --------------------------------------------------
    // PROTECT SCHEDULED / LIVE MATCHES
    // --------------------------------------------------

    const activeMatch =
      await prisma.match.findFirst({
        where: {
          OR: [
            {
              home_team_id:
                teamId,
            },
            {
              away_team_id:
                teamId,
            },
          ],

          status: {
            in: [
              MATCH_STATUS.SCHEDULED,
              MATCH_STATUS.LIVE,
            ],
          },
        },

        select: {
          match_id: true,
        },
      });

    if (activeMatch) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot deactivate a team involved in a scheduled or live match",
      });
    }

    // --------------------------------------------------
    // CONDITIONAL UPDATE
    // --------------------------------------------------

    const result =
      await prisma.team.updateMany({
        where: {
          team_id: teamId,
          status:
            TEAM_STATUS.ACTIVE,
        },

        data: {
          status:
            TEAM_STATUS.INACTIVE,
        },
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Team status changed before the operation completed. Please try again.",
      });
    }

    const updatedTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select:
          teamSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.TEAM_DEACTIVATED,

      entity_type: "TEAM",

      entity_id:
        teamId,

      details: {
        previous_status:
          TEAM_STATUS.ACTIVE,

        new_status:
          TEAM_STATUS.INACTIVE,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Team deactivated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error(
      "Deactivate team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the team",
    });
  }
};

// ======================================================
// ACTIVATE TEAM
// ======================================================

export const activateTeam = async (
  req,
  res
) => {
  try {
    const teamId =
      Number(req.params.team_id);

    const team =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select: {
          team_id: true,
          club_id: true,
          owner_id: true,
          name: true,
          status: true,
        },
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // --------------------------------------------------
    // ONLY SUPER ADMIN
    // --------------------------------------------------

    if (
      req.user.role !==
      ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Super Admin can activate a team",
      });
    }

    if (
      team.status ===
      TEAM_STATUS.ACTIVE
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Team is already active",
      });
    }

    // --------------------------------------------------
    // CLUB MUST BE ACTIVE (club-based teams only)
    // --------------------------------------------------

    if (team.club_id !== null) {
      const club =
        await prisma.club.findUnique({
          where: {
            club_id:
              team.club_id,
          },

          select: {
            club_id: true,
            status: true,
          },
        });

      if (!club) {
        return res.status(404).json({
          success: false,
          message:
            "Team's club not found",
        });
      }

      if (
        club.status !==
        TEAM_STATUS.ACTIVE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot activate a team under an inactive club",
        });
      }
    }

    // --------------------------------------------------
    // CONDITIONAL UPDATE
    // --------------------------------------------------

    const result =
      await prisma.team.updateMany({
        where: {
          team_id: teamId,
          status:
            TEAM_STATUS.INACTIVE,
        },

        data: {
          status:
            TEAM_STATUS.ACTIVE,
        },
      });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Team status changed before the operation completed. Please try again.",
      });
    }

    const updatedTeam =
      await prisma.team.findUnique({
        where: {
          team_id: teamId,
        },

        select:
          teamSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.TEAM_ACTIVATED,

      entity_type: "TEAM",

      entity_id:
        teamId,

      details: {
        previous_status:
          TEAM_STATUS.INACTIVE,

        new_status:
          TEAM_STATUS.ACTIVE,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Team activated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    console.error(
      "Activate team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the team",
    });
  }
};

// ======================================================
// TRANSFER TEAM OWNERSHIP
// ======================================================

export const transferTeamOwnership =
  async (
    req,
    res
  ) => {
    try {
      const teamId =
        Number(
          req.params.team_id
        );

      const newOwnerId =
        Number(
          req.body.owner_id
        );

      // ------------------------------------------------
      // GET TEAM
      // ------------------------------------------------

      const team =
        await prisma.team.findUnique({
          where: {
            team_id: teamId,
          },

          select: {
            team_id: true,
            club_id: true,
            owner_id: true,
            status: true,
          },
        });

      if (!team) {
        return res.status(404).json({
          success: false,
          message:
            "Team not found",
        });
      }

      // ------------------------------------------------
      // AUTHORIZATION
      // ------------------------------------------------

      const allowed =
        await canManageTeam({
          req,
          team,
        });

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to transfer this team",
        });
      }

      // ------------------------------------------------
      // CURRENT OWNER
      // ------------------------------------------------

      if (
        team.owner_id ===
        newOwnerId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This user is already the team owner",
        });
      }

      // ------------------------------------------------
      // NEW OWNER
      // ------------------------------------------------

      const newOwner =
        await prisma.user.findUnique({
          where: {
            user_id:
              newOwnerId,
          },

          select: {
            user_id: true,
            role: true,
            status: true,
          },
        });

      if (!newOwner) {
        return res.status(404).json({
          success: false,
          message:
            "New owner not found",
        });
      }

      if (
        newOwner.role !==
        ROLES.TEAM_OWNER
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected user must have TEAM_OWNER role",
        });
      }

      if (
        newOwner.status !==
        "ACTIVE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New owner must have an active account",
        });
      }

      // ------------------------------------------------
      // TRANSACTION
      // ------------------------------------------------

      const updatedTeam =
        await prisma.$transaction(
          async (tx) => {
            const result =
              await tx.team.updateMany({
                where: {
                  team_id:
                    teamId,

                  owner_id:
                    team.owner_id,
                },

                data: {
                  owner_id:
                    newOwnerId,
                },
              });

            if (
              result.count === 0
            ) {
              const error =
                new Error(
                  "TEAM_OWNER_CHANGED"
                );

              throw error;
            }

            return tx.team.findUnique({
              where: {
                team_id:
                  teamId,
              },

              select:
                teamSelect,
            });
          },

          {
            isolationLevel:
              "Serializable",
          }
        );

      // ------------------------------------------------
      // AUDIT
      // ------------------------------------------------

      await createAuditLog({
        actor_user_id:
          req.user.user_id,

        action:
          AUDIT_ACTIONS
            .TEAM_OWNERSHIP_TRANSFERRED,

        entity_type:
          "TEAM",

        entity_id:
          teamId,

        details: {
          old_owner_id:
            team.owner_id,

          new_owner_id:
            newOwnerId,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Team ownership transferred successfully",
        data: updatedTeam,
      });
    } catch (error) {
      if (
        error.message ===
        "TEAM_OWNER_CHANGED"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Team ownership changed before the transfer completed. Please try again.",
        });
      }

      if (
        error.code === "P2034"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Ownership transfer conflicted with another request. Please try again.",
        });
      }

      console.error(
        "Transfer team ownership error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while transferring team ownership",
      });
    }
  };
