import { generateRegistrationNumber } from "../../utils/playerRegistration.util.js";

import prisma from "../../database/prisma.js";

import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

// ======================================================
// PLAYER STATUS
// ======================================================

const PLAYER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

// ======================================================
// PLAYER SELECT
// ======================================================

const playerSelect = {
  player_id: true,
  name: true,
  profile_photo: true,
  date_of_birth: true,
  gender: true,
  position: true,
  phone: true,
  nationality: true,
  height_cm: true,
  weight_kg: true,
  preferred_foot: true,
  bio: true,
  registration_number: true,
  status: true,
  created_at: true,
  updated_at: true,
};

// Public player profiles must never disclose direct contact details.
// Admin controllers use their own private projection where appropriate.
const publicPlayerSelect = {
  player_id: true,
  name: true,
  profile_photo: true,
  date_of_birth: true,
  gender: true,
  position: true,
  nationality: true,
  height_cm: true,
  weight_kg: true,
  preferred_foot: true,
  bio: true,
  registration_number: true,
  status: true,
  created_at: true,
  updated_at: true,
};

// ======================================================
// GENERATE REGISTRATION NUMBER
// ======================================================

// ======================================================
// CREATE PLAYER
// ======================================================

export const createPlayer = async (req, res) => {
  try {
    const {
      name,
      profile_photo,
      date_of_birth,
      gender,
      position,
      phone,
      nationality,
      height_cm,
      weight_kg,
      preferred_foot,
      bio,
    } = req.body;

    const registrationNumber =
      generateRegistrationNumber();

    const player = await prisma.player.create({
      data: {
        name: name.trim(),

        profile_photo:
          profile_photo !== undefined &&
          profile_photo !== null
            ? profile_photo.trim()
            : undefined,

        date_of_birth:
          new Date(date_of_birth),

        gender: gender.trim(),

        position:
          position !== undefined &&
          position !== null
            ? position.trim()
            : undefined,

        phone:
          phone !== undefined &&
          phone !== null
            ? phone.trim()
            : undefined,

        nationality:
          nationality !== undefined &&
          nationality !== null
            ? nationality.trim()
            : undefined,

        height_cm: height_cm ?? undefined,
        weight_kg: weight_kg ?? undefined,
        preferred_foot:
          preferred_foot !== undefined && preferred_foot !== null
            ? preferred_foot.trim()
            : undefined,
        bio:
          bio !== undefined && bio !== null
            ? bio.trim()
            : undefined,

        profile_completed_at: new Date(),
        registration_number:
          registrationNumber,

        status:
          PLAYER_STATUS.ACTIVE,
      },

      select: playerSelect,
    });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_CREATED,

      entity_type: "PLAYER",

      entity_id:
        player.player_id,

      details: {
        name: player.name,
        gender: player.gender,
        position: player.position,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "Player created successfully",
      data: player,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "Could not generate a unique player registration number. Please try again.",
      });
    }

    console.error(
      "Create player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating the player",
    });
  }
};

// ======================================================
// GET ALL PLAYERS
// ======================================================

export const getPlayers = async (req, res) => {
  try {
    const players =
      await prisma.player.findMany({
        select: {
          ...publicPlayerSelect,
          team_players: {
            where: {
              status: "ACTIVE",
            },
            select: {
              team_player_id: true,
              player_id: true,
              team_id: true,
              jersey_number: true,
              status: true,
              team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                  status: true,
                },
              },
            },
            orderBy: {
              joined_at: "desc",
            },
          },
        },

        orderBy: {
          created_at: "desc",
        },
        take: 100,
      });

    return res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    console.error(
      "Get players error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching players",
    });
  }
};

// ======================================================
// GET PLAYER BY ID
// ======================================================

export const getPlayerById = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: {
          ...publicPlayerSelect,
          team_players: {
            where: {
              status: "ACTIVE",
            },
            select: {
              team_player_id: true,
              team_id: true,
              jersey_number: true,
              joined_at: true,
              left_at: true,
              status: true,
              team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                  status: true,
                },
              },
            },
            orderBy: {
              joined_at: "desc",
            },
          },
          match_players: {
            where: {
              match: {
                status: "COMPLETED",
              },
            },
            select: {
              team_id: true,
              match: {
                select: {
                  match_id: true,
                  competition: {
                    select: {
                      competition_id: true,
                      name: true,
                    },
                  },
                  season: {
                    select: {
                      season_id: true,
                      name: true,
                    },
                  },
                },
              },
              team: {
                select: {
                  team_id: true,
                  name: true,
                  logo: true,
                },
              },
            },
          },
          event_players: {
            where: {
              event_type: "GOAL",
              match: {
                status: "COMPLETED",
              },
            },
            select: {
              match_id: true,
            },
          },
          achievements: {
            select: {
              achievement_id: true,
              title: true,
              achievement_type: true,
              awarded_year: true,
              season: { select: { season_id: true, name: true } },
              team: { select: { team_id: true, name: true } },
              competition: { select: { competition_id: true, name: true } },
            },
            orderBy: [{ awarded_year: "desc" }, { achievement_id: "desc" }],
            take: 24,
          },
          gallery_photos: {
            select: {
              photo_id: true,
              image_url: true,
              caption: true,
              created_at: true,
            },
            orderBy: { created_at: "desc" },
            take: 24,
          },
        },
      });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    const memberships = player.team_players || [];
    const appearances = player.match_players || [];
    const goalEvents = player.event_players || [];
    const currentTeamMembership = memberships[0] || null;
    const currentTeam = currentTeamMembership?.team || null;
    const goalsByMatch = goalEvents.reduce(
      (counts, event) => ({
        ...counts,
        [event.match_id]: (counts[event.match_id] || 0) + 1,
      }),
      {}
    );
    const careerByKey = new Map();

    for (const appearance of appearances) {
      const { match, team } = appearance;
      const key = [
        match.season.season_id,
        match.competition.competition_id,
        team.team_id,
      ].join(":");
      const current = careerByKey.get(key) || {
        season: match.season,
        team,
        competition: match.competition,
        matches_played: 0,
        goals: 0,
        assists: null,
      };

      current.matches_played += 1;
      current.goals += goalsByMatch[match.match_id] || 0;
      careerByKey.set(key, current);
    }

    const {
      team_players: _memberships,
      match_players: _appearances,
      event_players: _goals,
      achievements,
      gallery_photos,
      ...publicPlayer
    } = player;

    return res.status(200).json({
      success: true,
      data: {
        ...publicPlayer,
        current_team: currentTeam
          ? {
              ...currentTeam,
              position: player.position,
              jersey_number: currentTeamMembership.jersey_number,
              is_captain: null,
            }
          : null,
        career: [...careerByKey.values()],
        achievements,
        gallery: gallery_photos,
      },
    });
  } catch (error) {
    console.error(
      "Get player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the player",
    });
  }
};

// ======================================================
// UPDATE PLAYER
// ======================================================

export const updatePlayer = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const {
      name,
      profile_photo,
      date_of_birth,
      gender,
      position,
      phone,
      nationality,
      height_cm,
      weight_kg,
      preferred_foot,
      bio,
    } = req.body;

    // --------------------------------------------------
    // CHECK PLAYER EXISTS
    // --------------------------------------------------

    const existingPlayer =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: {
          player_id: true,
          status: true,
        },
      });

    if (!existingPlayer) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // --------------------------------------------------
    // BUILD UPDATE DATA
    // --------------------------------------------------

    const updateData = {};

    if (name !== undefined) {
      updateData.name =
        name.trim();
    }

    if (profile_photo !== undefined) {
      updateData.profile_photo =
        profile_photo === null
          ? null
          : profile_photo.trim();
    }

    if (date_of_birth !== undefined) {
      updateData.date_of_birth =
        new Date(date_of_birth);
    }

    if (gender !== undefined) {
      updateData.gender =
        gender.trim();
    }

    if (position !== undefined) {
      updateData.position =
        position === null
          ? null
          : position.trim();
    }

    if (phone !== undefined) {
      updateData.phone =
        phone === null
          ? null
          : phone.trim();
    }

    if (nationality !== undefined) {
      updateData.nationality =
        nationality === null
          ? null
          : nationality.trim();
    }

    if (height_cm !== undefined) {
      updateData.height_cm = height_cm;
    }

    if (weight_kg !== undefined) {
      updateData.weight_kg = weight_kg;
    }

    if (preferred_foot !== undefined) {
      updateData.preferred_foot =
        preferred_foot === null ? null : preferred_foot.trim();
    }

    if (bio !== undefined) {
      updateData.bio = bio === null ? null : bio.trim();
    }

    // --------------------------------------------------
    // PREVENT EMPTY UPDATE
    // --------------------------------------------------

    if (
      Object.keys(updateData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one player field is required",
      });
    }

    // --------------------------------------------------
    // UPDATE WITH STATE PROTECTION
    // --------------------------------------------------

    const updated =
      await prisma.player.updateMany({
        where: {
          player_id: playerId,
          status: existingPlayer.status,
        },

        data: updateData,
      });

    if (updated.count === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Player was modified by another request. Please try again.",
      });
    }

    // --------------------------------------------------
    // GET UPDATED PLAYER
    // --------------------------------------------------

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found",
      });
    }

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_UPDATED,

      entity_type: "PLAYER",

      entity_id:
        player.player_id,

      details: {
        name: player.name,
        gender: player.gender,
        position: player.position,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Player updated successfully",
      data: player,
    });
  } catch (error) {
    console.error(
      "Update player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the player",
    });
  }
};

const profileAchievementSelect = {
  achievement_id: true,
  title: true,
  achievement_type: true,
  awarded_year: true,
  season: { select: { season_id: true, name: true } },
  team: { select: { team_id: true, name: true } },
  competition: { select: { competition_id: true, name: true } },
};

const ensurePlayerExists = async (playerId) => {
  const player = await prisma.player.findUnique({
    where: { player_id: playerId },
    select: { player_id: true },
  });

  return Boolean(player);
};

// Profile content is managed only by super administrators through the routes
// below. Public profile reads use a deliberately narrow projection above.
export const createPlayerAchievement = async (req, res, next) => {
  try {
    const playerId = Number(req.params.player_id);
    if (!(await ensurePlayerExists(playerId))) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    const achievement = await prisma.playerAchievement.create({
      data: {
        player_id: playerId,
        title: req.body.title.trim(),
        achievement_type: req.body.achievement_type.trim(),
        awarded_year: req.body.awarded_year ?? null,
        season_id: req.body.season_id ?? null,
        team_id: req.body.team_id ?? null,
        competition_id: req.body.competition_id ?? null,
      },
      select: profileAchievementSelect,
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_ACHIEVEMENT_CREATED,
      entity_type: "PLAYER_ACHIEVEMENT",
      entity_id: achievement.achievement_id,
      details: { player_id: playerId, title: achievement.title },
    });

    return res.status(201).json({ success: true, data: achievement });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(400).json({ success: false, message: "Related season, team, or competition was not found" });
    }
    next(error);
  }
};

export const deletePlayerAchievement = async (req, res, next) => {
  try {
    const playerId = Number(req.params.player_id);
    const achievementId = Number(req.params.achievement_id);
    const result = await prisma.playerAchievement.deleteMany({
      where: { achievement_id: achievementId, player_id: playerId },
    });

    if (!result.count) {
      return res.status(404).json({ success: false, message: "Achievement not found" });
    }

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_ACHIEVEMENT_DELETED,
      entity_type: "PLAYER_ACHIEVEMENT",
      entity_id: achievementId,
      details: { player_id: playerId },
    });

    return res.status(200).json({ success: true, message: "Achievement removed" });
  } catch (error) {
    next(error);
  }
};

export const addPlayerGalleryPhoto = async (req, res, next) => {
  try {
    const playerId = Number(req.params.player_id);
    if (!(await ensurePlayerExists(playerId))) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    const photo = await prisma.playerGalleryPhoto.create({
      data: {
        player_id: playerId,
        image_url: req.body.image_url.trim(),
        caption: req.body.caption ? req.body.caption.trim() : null,
      },
      select: { photo_id: true, image_url: true, caption: true, created_at: true },
    });

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_GALLERY_PHOTO_ADDED,
      entity_type: "PLAYER_GALLERY_PHOTO",
      entity_id: photo.photo_id,
      details: { player_id: playerId },
    });

    return res.status(201).json({ success: true, data: photo });
  } catch (error) {
    next(error);
  }
};

export const deletePlayerGalleryPhoto = async (req, res, next) => {
  try {
    const playerId = Number(req.params.player_id);
    const photoId = Number(req.params.photo_id);
    const result = await prisma.playerGalleryPhoto.deleteMany({
      where: { photo_id: photoId, player_id: playerId },
    });

    if (!result.count) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    await createAuditLog({
      actor_user_id: req.user.user_id,
      action: AUDIT_ACTIONS.PLAYER_GALLERY_PHOTO_DELETED,
      entity_type: "PLAYER_GALLERY_PHOTO",
      entity_id: photoId,
      details: { player_id: playerId },
    });

    return res.status(200).json({ success: true, message: "Photo removed" });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// DEACTIVATE PLAYER
// ======================================================

export const deactivatePlayer = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const updated =
      await prisma.player.updateMany({
        where: {
          player_id: playerId,
          status:
            PLAYER_STATUS.ACTIVE,
        },

        data: {
          status:
            PLAYER_STATUS.INACTIVE,
        },

        select: {
          player_id: true,
        },
      });

    if (updated.count === 0) {
      const player =
        await prisma.player.findUnique({
          where: {
            player_id: playerId,
          },

          select: {
            player_id: true,
            status: true,
          },
        });

      if (!player) {
        return res.status(404).json({
          success: false,
          message:
            "Player not found",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Player is already inactive",
      });
    }

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_DEACTIVATED,

      entity_type: "PLAYER",

      entity_id:
        playerId,

      details: {
        name: player.name,
        registration_number:
          player.registration_number,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Player deactivated successfully",
      data: player,
    });
  } catch (error) {
    console.error(
      "Deactivate player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deactivating the player",
    });
  }
};

// ======================================================
// ACTIVATE PLAYER
// ======================================================

export const activatePlayer = async (
  req,
  res
) => {
  try {
    const playerId =
      Number(req.params.player_id);

    const updated =
      await prisma.player.updateMany({
        where: {
          player_id: playerId,
          status:
            PLAYER_STATUS.INACTIVE,
        },

        data: {
          status:
            PLAYER_STATUS.ACTIVE,
        },

        select: {
          player_id: true,
        },
      });

    if (updated.count === 0) {
      const player =
        await prisma.player.findUnique({
          where: {
            player_id: playerId,
          },

          select: {
            player_id: true,
            status: true,
          },
        });

      if (!player) {
        return res.status(404).json({
          success: false,
          message:
            "Player not found",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Player is already active",
      });
    }

    const player =
      await prisma.player.findUnique({
        where: {
          player_id: playerId,
        },

        select: playerSelect,
      });

    await createAuditLog({
      actor_user_id:
        req.user.user_id,

      action:
        AUDIT_ACTIONS.PLAYER_ACTIVATED,

      entity_type: "PLAYER",

      entity_id:
        playerId,

      details: {
        name: player.name,
        registration_number:
          player.registration_number,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Player activated successfully",
      data: player,
    });
  } catch (error) {
    console.error(
      "Activate player error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while activating the player",
    });
  }
};
