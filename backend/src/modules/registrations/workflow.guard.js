import prisma from "../../database/prisma.js";

// Legacy APIs continue serving existing club/team registrations, but cannot
// bypass the receipt, roster or finalized-participant rules for this workflow.
export const guardLegacyRegistration = async (req, res, next) => {
  try {
    const id = Number(req.params.registration_id || req.body.registration_id);
    if (Number.isInteger(id) && id > 0) {
      const r = await prisma.competitionRegistration.findUnique({ where: { registration_id: id }, select: { team_snapshot: true } });
      if (r?.team_snapshot) return res.status(409).json({ success: false, message: "Use the registration review or correction workflow for this application." });
    }
    return next();
  } catch (error) { return next(error); }
};
export const guardLegacyPayment = async (req, res, next) => {
  try {
    const p = await prisma.payment.findUnique({ where: { payment_id: Number(req.params.payment_id) }, select: { registration: { select: { team_snapshot: true } } } });
    if (p?.registration?.team_snapshot) return res.status(409).json({ success: false, message: "Use manual payment verification from the registration details." });
    return next();
  } catch (error) { return next(error); }
};
