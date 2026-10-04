import prisma from "../../database/prisma.js";
import { ROLES } from "../../constants/roles.js";

export const requireOwnedRegistrationForPayment = async (req, res, next) => {
  if (req.user.role !== ROLES.TEAM_OWNER) return next();
  const registrationId = Number(req.body.registration_id);
  if (!Number.isInteger(registrationId) || registrationId < 1) return next();
  try {
    const registration = await prisma.competitionRegistration.findFirst({ where: { registration_id: registrationId, team: { owner_id: req.user.user_id } }, select: { registration_id: true } });
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
    return next();
  } catch (error) { return next(error); }
};
