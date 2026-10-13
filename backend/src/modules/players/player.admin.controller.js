import prisma from "../../database/prisma.js";
import { createAuditLog } from "../../utils/auditLog.util.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";

const playerBase = {
  player_id: true, name: true, profile_photo: true, gender: true, position: true,
  nationality: true, registration_number: true, status: true, created_at: true,
  team_players: {
    where: { status: "ACTIVE" },
    select: {
      jersey_number: true,
      team: { select: { team_id: true, name: true, logo: true, owner: { select: { user_id: true, name: true } }, club: { select: { name: true } } } },
    },
    take: 2,
  },
};

const playerDetail = {
  player_id: true, name: true, profile_photo: true, date_of_birth: true, gender: true,
  position: true, phone: true, nationality: true, height_cm: true, weight_kg: true,
  preferred_foot: true, bio: true, registration_number: true, status: true,
  created_at: true, updated_at: true,
  team_players: {
    select: {
      team_player_id: true, jersey_number: true, joined_at: true, left_at: true, status: true,
      team: { select: { team_id: true, name: true, gender: true, owner: { select: { user_id: true, name: true, email: true } }, club: { select: { club_id: true, name: true } } } },
    },
    orderBy: { joined_at: "desc" },
    take: 100,
  },
};

const validStatus = ["ACTIVE", "INACTIVE"];

export const getAdminPlayers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const { status, gender, position } = req.query;
    const teamId = req.query.team_id === undefined ? undefined : Number(req.query.team_id);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || q.length > 100 || (status && !validStatus.includes(status)) || (gender && !["MALE", "FEMALE"].includes(gender)) || (position && String(position).length > 50) || (teamId !== undefined && (!Number.isInteger(teamId) || teamId < 1))) {
      return res.status(400).json({ success: false, message: "Invalid player query" });
    }
    const where = {
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { registration_number: { contains: q, mode: "insensitive" } }, { team_players: { some: { status: "ACTIVE", team: { name: { contains: q, mode: "insensitive" } } } } }] } : {}),
      ...(status ? { status } : {}),
      ...(gender ? { gender } : {}),
      ...(position ? { position: { contains: position, mode: "insensitive" } } : {}),
      ...(teamId ? { team_players: { some: { team_id: teamId, status: "ACTIVE" } } } : {}),
    };
    const [players, total, totalPlayers, activePlayers, suspendedPlayers, assignedPlayers] = await Promise.all([
      prisma.player.findMany({ where, select: playerBase, orderBy: [{ created_at: "desc" }, { player_id: "desc" }], skip: (page - 1) * limit, take: limit }),
      prisma.player.count({ where }),
      prisma.player.count(),
      prisma.player.count({ where: { status: "ACTIVE" } }),
      prisma.player.count({ where: { status: "INACTIVE" } }),
      prisma.player.count({ where: { status: "ACTIVE", team_players: { some: { status: "ACTIVE" } } } }),
    ]);
    return res.json({ success: true, data: players, summary: { total: totalPlayers, active: activePlayers, unassigned: totalPlayers - assignedPlayers, suspended: suspendedPlayers }, pagination: { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    next(error);
  }
};

export const getAdminPlayerById = async (req, res, next) => {
  try {
    const id = Number(req.params.player_id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: "Player ID must be a positive integer" });
    const player = await prisma.player.findUnique({ where: { player_id: id }, select: playerDetail });
    if (!player) return res.status(404).json({ success: false, message: "Player not found" });
    const [matches, events, audits] = await Promise.all([
      prisma.matchPlayer.count({ where: { player_id: id, match: { status: "COMPLETED" } } }),
      prisma.matchEvent.findMany({ where: { player_id: id, match: { status: "COMPLETED" } }, select: { event_type: true } }),
      prisma.auditLog.findMany({ where: { entity_type: "PLAYER", entity_id: id }, select: { audit_id: true, action: true, details: true, created_at: true, actor: { select: { user_id: true, name: true } } }, orderBy: { created_at: "desc" }, take: 100 }),
    ]);
    const count = (type) => events.filter((event) => event.event_type === type).length;
    return res.json({ success: true, data: { ...player, statistics: { appearances: matches, goals: count("GOAL"), assists: null, yellow_cards: count("YELLOW_CARD"), red_cards: count("RED_CARD") }, administrative_history: audits } });
  } catch (error) {
    next(error);
  }
};

const updateDataFromBody = (body) => Object.fromEntries(["name", "profile_photo", "date_of_birth", "gender", "position", "phone", "nationality", "height_cm", "weight_kg", "preferred_foot", "bio"].filter((field) => body[field] !== undefined).map((field) => [field, field === "date_of_birth" ? new Date(body[field]) : typeof body[field] === "string" ? body[field].trim() : body[field]]));

export const updateAdminPlayer = async (req, res, next) => {
  try {
    const id = Number(req.params.player_id);
    const existing = await prisma.player.findUnique({ where: { player_id: id }, select: { player_id: true } });
    if (!existing) return res.status(404).json({ success: false, message: "Player not found" });
    const data = updateDataFromBody(req.body);
    const player = await prisma.player.update({ where: { player_id: id }, data, select: playerBase });
    await createAuditLog({ actor_user_id: req.user.user_id, action: AUDIT_ACTIONS.PLAYER_UPDATED, entity_type: "PLAYER", entity_id: id, details: { fields: Object.keys(data) } });
    return res.json({ success: true, data: player });
  } catch (error) {
    next(error);
  }
};

const changePlayerStatus = (status, action) => async (req, res, next) => {
  try {
    const id = Number(req.params.player_id);
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (action === AUDIT_ACTIONS.PLAYER_SUSPENDED && reason.length < 5) return res.status(400).json({ success: false, message: "A suspension reason of at least 5 characters is required" });
    const result = await prisma.player.updateMany({ where: { player_id: id, status: status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }, data: { status } });
    if (result.count !== 1) return res.status(409).json({ success: false, message: status === "INACTIVE" ? "Player is already suspended or does not exist" : "Player is not suspended or does not exist" });
    await createAuditLog({ actor_user_id: req.user.user_id, action, entity_type: "PLAYER", entity_id: id, details: { reason: reason || null } });
    return res.json({ success: true, message: status === "INACTIVE" ? "Player suspended successfully" : "Player reinstated successfully" });
  } catch (error) {
    next(error);
  }
};

export const suspendAdminPlayer = changePlayerStatus("INACTIVE", AUDIT_ACTIONS.PLAYER_SUSPENDED);
export const reinstateAdminPlayer = changePlayerStatus("ACTIVE", AUDIT_ACTIONS.PLAYER_REINSTATED);
