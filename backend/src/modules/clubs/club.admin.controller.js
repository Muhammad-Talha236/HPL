import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";
import { AUDIT_ACTIONS } from "../../constants/auditActions.js";
import { createAuditLog } from "../../utils/auditLog.util.js";

const ownerSelect = { user_id: true, name: true, email: true, role: true, status: true };
const clubListSelect = {
  club_id: true, name: true, logo: true, region: true, district: true, city: true, status: true, created_at: true,
  owner: { select: ownerSelect }, _count: { select: { teams: true } },
};

export const getAdminClubs = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 20);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const status = req.query.status; const ownerId = req.query.owner_id === undefined ? undefined : Number(req.query.owner_id);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50 || q.length > 100 || (ownerId !== undefined && (!Number.isInteger(ownerId) || ownerId < 1))) return res.status(400).json({ success: false, message: "Invalid club query" });
    if (status && !["PENDING", "ACTIVE", "INACTIVE", "REJECTED"].includes(status)) return res.status(400).json({ success: false, message: "Invalid club status filter" });
    const where = { ...(status ? { status } : {}), ...(ownerId ? { owner_id: ownerId } : {}), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) };
    const [clubs, total] = await Promise.all([prisma.club.findMany({ where, select: clubListSelect, orderBy: [{ created_at: "desc" }, { club_id: "desc" }], skip: (page - 1) * limit, take: limit }), prisma.club.count({ where })]);
    return res.json({ success: true, data: clubs.map(({ _count, ...club }) => ({ ...club, team_count: _count.teams })), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const approveClubRegistration = async (req, res, next) => {
  try {
    const clubId = Number(req.params.club_id);
    if (!Number.isInteger(clubId) || clubId < 1) return res.status(400).json({ success: false, message: "Club ID must be a valid positive integer" });

    const pendingClub = await prisma.club.findUnique({ where: { club_id: clubId }, select: { club_id: true, owner_id: true, status: true, name: true } });
    if (!pendingClub) return res.status(404).json({ success: false, message: "Club not found" });
    if (pendingClub.status !== "PENDING") return res.status(409).json({ success: false, message: "Only pending club registrations can be approved" });

    const approvedClub = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({ where: { user_id: pendingClub.owner_id }, select: { user_id: true, role: true, status: true } });
      if (!owner) throw new Error("CLUB_OWNER_NOT_FOUND");
      if (owner.status !== "ACTIVE" || owner.role !== ROLES.USER) throw new Error("CLUB_OWNER_ROLE_CONFLICT");

      const updatedClub = await tx.club.updateMany({ where: { club_id: clubId, status: "PENDING" }, data: { status: "ACTIVE" } });
      if (updatedClub.count !== 1) throw new Error("CLUB_REVIEW_CONFLICT");

      const updatedOwner = await tx.user.updateMany({ where: { user_id: owner.user_id, role: ROLES.USER }, data: { role: ROLES.CLUB_OWNER } });
      if (updatedOwner.count !== 1) throw new Error("CLUB_REVIEW_CONFLICT");

      await tx.notification.create({
        data: {
          user_id: owner.user_id,
          title: "Club registration approved",
          message: `Your club registration for ${pendingClub.name} has been approved.`,
          notification_type: "CLUB",
          reference_type: "CLUB",
          reference_id: clubId,
        },
      });

      return tx.club.findUnique({ where: { club_id: clubId } });
    }, { isolationLevel: "Serializable" });

    await createAuditLog({ actor_user_id: req.user.user_id, action: AUDIT_ACTIONS.CLUB_REGISTRATION_APPROVED, entity_type: "CLUB", entity_id: clubId, details: { owner_id: pendingClub.owner_id } });
    return res.json({ success: true, message: "Club registration approved", data: approvedClub });
  } catch (error) {
    if (error.message === "CLUB_OWNER_NOT_FOUND") return res.status(404).json({ success: false, message: "Club owner not found" });
    if (error.message === "CLUB_OWNER_ROLE_CONFLICT") return res.status(409).json({ success: false, message: "Club owner is no longer eligible for approval" });
    if (error.message === "CLUB_REVIEW_CONFLICT" || error.code === "P2034") return res.status(409).json({ success: false, message: "Club registration changed during review. Please try again." });
    next(error);
  }
};

export const rejectClubRegistration = async (req, res, next) => {
  try {
    const clubId = Number(req.params.club_id);
    if (!Number.isInteger(clubId) || clubId < 1) return res.status(400).json({ success: false, message: "Club ID must be a valid positive integer" });

    const rejectedClub = await prisma.$transaction(async (tx) => {
      const club = await tx.club.findUnique({ where: { club_id: clubId }, select: { club_id: true, owner_id: true, name: true, status: true } });
      if (!club) throw new Error("CLUB_NOT_FOUND");
      if (club.status !== "PENDING") throw new Error("CLUB_REVIEW_CONFLICT");
      const updated = await tx.club.updateMany({ where: { club_id: clubId, status: "PENDING" }, data: { status: "REJECTED" } });
      if (updated.count !== 1) throw new Error("CLUB_REVIEW_CONFLICT");
      await tx.notification.create({
        data: {
          user_id: club.owner_id,
          title: "Club registration rejected",
          message: `Your club registration for ${club.name} was rejected.`,
          notification_type: "CLUB",
          reference_type: "CLUB",
          reference_id: clubId,
        },
      });
      return tx.club.findUnique({ where: { club_id: clubId } });
    });

    await createAuditLog({ actor_user_id: req.user.user_id, action: AUDIT_ACTIONS.CLUB_REGISTRATION_REJECTED, entity_type: "CLUB", entity_id: clubId });
    return res.json({ success: true, message: "Club registration rejected", data: rejectedClub });
  } catch (error) {
    if (error.message === "CLUB_NOT_FOUND") return res.status(404).json({ success: false, message: "Club not found" });
    if (error.message === "CLUB_REVIEW_CONFLICT") return res.status(409).json({ success: false, message: "Only pending club registrations can be rejected" });
    next(error);
  }
};

export const getAdminClubById = async (req, res, next) => {
  try {
    const clubId = Number(req.params.club_id);
    if (!Number.isInteger(clubId) || clubId < 1) return res.status(400).json({ success: false, message: "Club ID must be a valid positive integer" });
    const club = await prisma.club.findUnique({ where: { club_id: clubId }, select: { ...clubListSelect, description: true, contact_email: true, contact_phone: true, representative_name: true, updated_at: true, teams: { select: { team_id: true, name: true, gender: true, team_type: true, status: true }, orderBy: { team_id: "asc" }, take: 50 } } });
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    const { _count, ...data } = club;
    return res.json({ success: true, data: { ...data, team_count: _count.teams } });
  } catch (error) { next(error); }
};
