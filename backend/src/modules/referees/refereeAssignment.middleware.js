import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";

// Match mutations remain available to Super Admins. A referee is allowed only
// when their active, linked profile is the referee assigned to that exact match.
export const authorizeAssignedRefereeOrAdmin = async (req, res, next) => {
  try {
    if (req.user.role === ROLES.SUPER_ADMIN) return next();
    // Routes that also retain Team/Club Owner permissions call this middleware.
    // Their controller keeps its existing ownership checks; only REFEREE needs
    // the additional assignment check here.
    if (req.user.role !== ROLES.REFEREE) return next();
    const matchId = Number(req.params.match_id || req.body.match_id);
    if (!Number.isInteger(matchId) || matchId < 1) return res.status(400).json({ success: false, message: "Valid match ID is required" });
    const referee = await prisma.referee.findFirst({ where: { user_id: req.user.user_id, status: "ACTIVE" }, select: { referee_id: true } });
    if (!referee) return res.status(403).json({ success: false, message: "Active referee profile is required" });
    const match = await prisma.match.findUnique({ where: { match_id: matchId }, select: { referee_id: true } });
    if (!match || match.referee_id !== referee.referee_id) return res.status(403).json({ success: false, message: "You are not assigned to this match" });
    req.assigned_referee_id = referee.referee_id;
    return next();
  } catch (error) { return next(error); }
};

// Strict variant for match lifecycle routes, where no Team/Club owner role is
// valid. Keep this separate from event routes that retain their legacy owners.
export const authorizeMatchOfficial = async (req, res, next) => {
  if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.REFEREE) {
    return authorizeAssignedRefereeOrAdmin(req, res, next);
  }
  return res.status(403).json({ success: false, message: "Match official permission is required" });
};
