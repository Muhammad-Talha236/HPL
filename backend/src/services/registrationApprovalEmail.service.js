import { sendCaptainApprovalEmail } from "./registrationMail.service.js";

// One durable job per registration is inserted in the approval transaction.
// SMTP runs only after commit. Compare-and-set claiming prevents double sends.
export function createApprovalEmailDelivery(db, send = sendCaptainApprovalEmail) {
  const deliver = async registrationId => {
    try {
      const r = await db.competitionRegistration.findUnique({ where: { registration_id: registrationId }, select: { registration_id: true, registration_status: true, team_id: true, team_snapshot: true, team: { select: { name: true } }, registered_user: { select: { name: true, email: true } }, competition: { select: { competition_id: true, name: true, season: { select: { name: true } } } } } });
      if (r?.registration_status !== "APPROVED") return false;
      const claim = await db.registrationApprovalEmail.updateMany({ where: { registration_id: registrationId, status: "PENDING" }, data: { status: "SENDING", attempts: { increment: 1 }, attempted_at: new Date(), failure_code: null } });
      if (!claim.count) return false;
      let result;
      try {
        result = await send({ email: r.registered_user.email, captainName: r.registered_user.name, teamName: r.team_snapshot?.name || r.team.name, competitionName: r.competition.name, seasonName: r.competition.season.name, competitionId: r.competition.competition_id, teamId: r.team_id, registrationId });
        if (result?.accepted !== true) throw new Error("SMTP_NOT_ACCEPTED");
      } catch {
        await db.registrationApprovalEmail.updateMany({ where: { registration_id: registrationId, status: "SENDING" }, data: { status: "FAILED", failure_code: "DELIVERY_NOT_CONFIRMED" } });
        console.error("Captain approval email delivery not confirmed", { registration_id: registrationId });
        return false;
      }
      await db.registrationApprovalEmail.updateMany({ where: { registration_id: registrationId, status: "SENDING" }, data: { status: "SENT", sent_at: new Date(), message_id: result.messageId || null } });
      return true;
    } catch {
      // If persistence fails after SMTP accepted, keep SENDING; never blindly
      // resend an uncertain job. A mail administrator must reconcile it.
      console.error("Captain approval email job unavailable", { registration_id: registrationId });
      return false;
    }
  };
  return { deliver, async drain() {
    const jobs = await db.registrationApprovalEmail.findMany({ where: { status: "PENDING" }, select: { registration_id: true }, orderBy: { created_at: "asc" }, take: 20 });
    for (const job of jobs) await deliver(job.registration_id);
  } };
}

export function startApprovalEmailWorker(db) {
  const delivery = createApprovalEmailDelivery(db); let busy = false;
  const drain = async () => { if (busy) return; busy = true; try { await delivery.drain(); } catch { console.error("Captain approval email queue unavailable"); } finally { busy = false; } };
  const timer = setInterval(drain, 60000); timer.unref();
  void drain(); return () => clearInterval(timer);
}
