import prisma from "../../database/prisma.js";

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
    if (status && !["ACTIVE", "INACTIVE"].includes(status)) return res.status(400).json({ success: false, message: "Invalid club status filter" });
    const where = { ...(status ? { status } : {}), ...(ownerId ? { owner_id: ownerId } : {}), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) };
    const [clubs, total] = await prisma.$transaction([prisma.club.findMany({ where, select: clubListSelect, orderBy: [{ created_at: "desc" }, { club_id: "desc" }], skip: (page - 1) * limit, take: limit }), prisma.club.count({ where })]);
    return res.json({ success: true, data: clubs.map(({ _count, ...club }) => ({ ...club, team_count: _count.teams })), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
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
