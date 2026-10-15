import { createApprovalEmailDelivery } from "../../services/registrationApprovalEmail.service.js";
import { validateAccount, validateCompetition, validateSubmission, nameKey, requireRule, text, WorkflowError } from "./workflow.validation.js";
import { generateRegistrationNumber } from "../../utils/playerRegistration.util.js";
import { Prisma } from "@prisma/client";
import { sendRegistrationStatusEmail } from "../../services/registrationMail.service.js";
import { workflowTransaction } from "./workflow.transaction.js";

// Remote adapter round trips are sequential. Batch roster writes keep query
// count constant; the deadline includes those reads/writes and commit, not mail.
export const transactionOptions = { timeout: 10000, maxWait: 2000 };
export const registrationState = (c, now = new Date()) => {
  if (c.status !== "ACTIVE" || c.publication_status !== "PUBLISHED" || c.registration_closed_at || c.participants_finalized_at || now >= new Date(+new Date(c.registration_end_date) + 86400000)) return "CLOSED";
  return now < new Date(c.registration_start_date) ? "UPCOMING" : "OPEN";
};
const accountSnapshot = a => ({ payment_account_id: a.payment_account_id, provider: a.provider, account_title: a.account_title, account_number: a.account_number, bank_name: a.bank_name, instructions: a.instructions });
const lockedCompetition = async (tx, id) => {
  const [c] = await tx.$queryRaw`SELECT c.*, ARRAY(SELECT "B" FROM "_CompetitionPaymentAccounts" WHERE "A"=c.competition_id) AS payment_account_ids FROM "Competition" c WHERE c.competition_id=${id} FOR UPDATE OF c`;
  requireRule(c, "Competition not found.", 404); return c;
};
const adminOnly = actor => requireRule(actor?.role === "SUPER_ADMIN", "Administrator access required.", 403);
const audit = (tx, actor, action, type, id) => tx.auditLog.create({ data: { actor_user_id: actor, action, entity_type: type, entity_id: id } });
export const registrationDTO = r => ({ ...r, team: r.team || r.team_snapshot, roster: r.roster_snapshot || r.players?.map(p => ({ ...p.player, jersey_number: p.player?.team_players?.[0]?.jersey_number })), player_count: r.roster_snapshot?.length || r.players?.length || 0, payments: r.payments?.map(({ receipt_record: _receipt, ...payment }) => payment).sort((a, b) => Number(a.payment_status === "SUPERSEDED") - Number(b.payment_status === "SUPERSEDED")) });

export function createWorkflowService(db, options = {}) {
  const approvalEmail = createApprovalEmailDelivery(db, options.sendApprovalEmail);
  const transact = callback => workflowTransaction(db, callback, transactionOptions);
  const notify = async (registration, title, message, admin = false, allowEmail = true) => {
    try {
      const users = admin ? await db.user.findMany({ where: { role: "SUPER_ADMIN", status: "ACTIVE" }, select: { user_id: true } }) : [{ user_id: registration.registered_by }];
      if (users.length) await db.notification.createMany({ data: users.map(u => ({ user_id: u.user_id, title, message, notification_type: "COMPETITION_REGISTRATION", reference_type: "COMPETITION_REGISTRATION", reference_id: registration.registration_id })) });
    } catch { console.error("Competition registration notification failed", { registration_id: registration.registration_id }); }
    if (allowEmail && (options.emailEnabled ?? process.env.REGISTRATION_EMAIL_ENABLED === "true")) {
      try {
        const select = { email: true, email_verified_at: true };
        const recipients = admin ? await db.user.findMany({ where: { role: "SUPER_ADMIN", status: "ACTIVE", email_verified_at: { not: null } }, select }) : [await db.user.findUnique({ where: { user_id: registration.registered_by }, select })];
        for (const recipient of recipients) if (recipient?.email_verified_at) {
          try { await (options.sendStatusEmail || sendRegistrationStatusEmail)({ email: recipient.email, title, message, registrationId: registration.registration_id, admin }); }
          catch { console.error("Registration status email failed", { registration_id: registration.registration_id }); }
        }
      } catch { console.error("Registration email recipient lookup failed", { registration_id: registration.registration_id }); }
    }
  };
  const detail = async (id, actor) => {
    const r = await db.competitionRegistration.findUnique({ where: { registration_id: id }, include: { competition: { include: { season: true } }, registered_user: { select: { user_id: true, name: true, email: true } }, team: true, players: { include: { player: true } }, payments: { orderBy: [{ created_at: "desc" }, { payment_id: "desc" }] }, approval_history: { orderBy: { created_at: "desc" } }, approval_email: { select: { status: true, attempts: true, attempted_at: true, sent_at: true, failure_code: true } } } });
    let legacyClubAccess = false;
    if (r && !r.team_snapshot && r.registered_by !== actor.user_id && actor.role === "CLUB_OWNER" && r.team?.club_id) {
      const club = await db.club.findUnique({ where: { club_id: r.team.club_id }, select: { owner_id: true } }); legacyClubAccess = club?.owner_id === actor.user_id;
    }
    requireRule(r && (actor.role === "SUPER_ADMIN" || r.registered_by === actor.user_id || legacyClubAccess), "Registration not found.", 404); return registrationDTO(r);
  };
  const paymentData = async (tx, c, p, user, registrationId) => {
    requireRule(c.payment_account_ids.includes(p.payment_account_id), "This receiving account is not allowed for the competition.");
    const [a] = await tx.$queryRaw`SELECT * FROM "PaymentAccount" WHERE payment_account_id=${p.payment_account_id} FOR SHARE`;
    requireRule(a?.status === "ACTIVE", "Select an active receiving account.");
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${p.transaction_reference},0)) IS NULL AS locked`;
    const existing = await tx.payment.findFirst({ where: { OR: [{ transaction_reference: { equals: p.transaction_reference, mode: "insensitive" } }, { proof_history: { array_contains: [{ transaction_reference: p.transaction_reference }] } }] } });
    requireRule(!existing || existing.registration_id === registrationId, "This transaction reference was already submitted.", 409);
    const referenceRecord = !existing || existing.transaction_reference.toUpperCase() === p.transaction_reference ? existing : await tx.payment.findFirst({ where: { registration_id: registrationId, transaction_reference: { equals: p.transaction_reference, mode: "insensitive" } } });
    const receipt = await tx.paymentReceipt.findUnique({ where: { receipt_id: p.receipt_id } });
    requireRule(receipt?.owner_id === user.user_id && !receipt.consumed_registration_id && receipt.expires_at > new Date(), "Upload a new valid receipt for your account.");
    const consumed = await tx.paymentReceipt.updateMany({ where: { receipt_id: p.receipt_id, owner_id: user.user_id, consumed_registration_id: null }, data: { consumed_registration_id: registrationId } });
    requireRule(consumed.count === 1, "Receipt was already used.", 409);
    return { target_payment_id: referenceRecord?.payment_id, amount: c.registration_fee, payment_method: a.provider, transaction_reference: p.transaction_reference, payment_status: "PENDING_VERIFICATION", receipt_id: p.receipt_id, receiving_account_snapshot: accountSnapshot(a) };
  };
  return {
    detail,
    async saveAccount(body, actor, id) {
      adminOnly(actor);
      const data = validateAccount(body);
      return transact(async tx => {
        const a = id ? await tx.paymentAccount.update({ where: { payment_account_id: id }, data }) : await tx.paymentAccount.create({ data });
        await audit(tx, actor.user_id, "PAYMENT_ACCOUNT_SAVED", "PAYMENT_ACCOUNT", a.payment_account_id); return a;
      });
    },
    async saveCompetition(body, actor, id) {
      adminOnly(actor);
      const data = validateCompetition(body);
      const result = await transact(async tx => {
        if (id) {
          const current = await lockedCompetition(tx, id);
          requireRule(!current.participants_finalized_at, "Finalized competition settings are locked.", 409);
          const count = await tx.competitionRegistration.count({ where: { competition_id: id } });
          if (count) {
            const rosterApps = await tx.competitionRegistration.count({ where: { competition_id: id, team_snapshot: { not: Prisma.DbNull } } });
            const fields = ["season_id", "gender", "registration_type", "registration_fee", "squad_size", "max_teams", "registration_start_date", "registration_end_date", ...(rosterApps ? ["min_players"] : [])];
            requireRule(fields.every(k => k.includes("date") ? +new Date(current[k]) === +data[k] : String(current[k]) === String(data[k])) && (!rosterApps || JSON.stringify([...current.payment_account_ids].sort()) === JSON.stringify([...data.payment_account_ids].sort())), "Financial, roster, capacity and date settings cannot change after applications exist.", 409);
            requireRule(current.publication_status !== "PUBLISHED" || data.publication_status === "PUBLISHED", "A published competition with applications cannot become a draft.", 409);
          }
        }
        const season = await tx.season.findUnique({ where: { season_id: data.season_id } });
        requireRule(season?.status === "ACTIVE", "Select an active season.");
        requireRule(data.registration_start_date >= season.start_date && data.registration_end_date <= season.end_date, "Registration dates must fall within the season.");
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${data.season_id}:${nameKey(data.name)}`},0)) IS NULL AS locked`;
        const duplicate = await tx.competition.findFirst({ where: { season_id: data.season_id, name: { equals: data.name, mode: "insensitive" }, ...(id ? { competition_id: { not: id } } : {}) } });
        requireRule(!duplicate, "This season already has a competition with that name.", 409);
        const accounts = await tx.paymentAccount.findMany({ where: { payment_account_id: { in: data.payment_account_ids }, status: "ACTIVE" } });
        requireRule(accounts.length === data.payment_account_ids.length, "Select active receiving accounts.");
        const { payment_account_ids: ids, ...values } = data;
        const c = id ? await tx.competition.update({ where: { competition_id: id }, data: values }) : await tx.competition.create({ data: { ...values, status: "ACTIVE", format: null, registration_workflow: "MANUAL_ROSTER", tournament_state: "NOT_CONFIGURED" } });
        // Keep every statement sequential on the adapter's transaction client.
        // A single bulk insert avoids nested relation-connect queries per account.
        if (id) await tx.$executeRaw`DELETE FROM "_CompetitionPaymentAccounts" WHERE "A"=${id}`;
        if (ids.length) await tx.$executeRaw(Prisma.sql`INSERT INTO "_CompetitionPaymentAccounts" ("A", "B") VALUES ${Prisma.join(ids.map(accountId => Prisma.sql`(${c.competition_id}, ${accountId})`))}`);
        await audit(tx, actor.user_id, id ? "COMPETITION_UPDATED" : "COMPETITION_CREATED", "COMPETITION", c.competition_id); return c;
      });
      return result;
    },
    async competitionAction(id, action, actor) {
      adminOnly(actor);
      return transact(async tx => {
        const c = await lockedCompetition(tx, id);
        requireRule(c.registration_workflow === "MANUAL_ROSTER" && ["publish", "close", "finalize"].includes(action), "Invalid workflow action.", 409);
        if (action === "publish" && c.registration_type === "PAID") requireRule(c.payment_account_ids.length && await tx.paymentAccount.count({ where: { payment_account_id: { in: c.payment_account_ids }, status: "ACTIVE" } }) === c.payment_account_ids.length, "Activate the selected receiving accounts before publishing.", 409);
        if (action === "publish") requireRule(c.publication_status === "DRAFT" && !c.participants_finalized_at, "Only a draft can be published.", 409);
        else if (action === "close") requireRule(c.publication_status === "PUBLISHED" && !c.participants_finalized_at, "This competition cannot be closed.", 409);
        else {
          requireRule(registrationState(c) === "CLOSED" && c.publication_status === "PUBLISHED" && !c.participants_finalized_at, "Close registration before finalizing participants.", 409);
          const unresolved = await tx.competitionRegistration.count({ where: { competition_id: id, registration_status: { in: ["PENDING", "CHANGES_REQUESTED"] } } });
          const approved = await tx.competitionRegistration.count({ where: { competition_id: id, registration_status: "APPROVED" } });
          requireRule(!unresolved && approved > 0 && approved <= c.max_teams, "Resolve every application and confirm at least one team before finalization.", 409);
          const unpaid = await tx.competitionRegistration.count({ where: { competition_id: id, registration_status: "APPROVED", payment_status: { notIn: ["VERIFIED", "NOT_REQUIRED", "PAID"] } } });
          requireRule(!unpaid, "All approved teams must satisfy payment requirements.", 409);
          const invalidRosters = await tx.$queryRaw`SELECT r.registration_id
            FROM "CompetitionRegistration" r
            LEFT JOIN "Team" t ON t.team_id=r.team_id AND t.status='ACTIVE'
            LEFT JOIN "CompetitionPlayer" cp ON cp.registration_id=r.registration_id
            LEFT JOIN "Player" p ON p.player_id=cp.player_id
            LEFT JOIN "TeamPlayer" tp ON tp.player_id=p.player_id AND tp.team_id=t.team_id AND tp.status='ACTIVE'
            WHERE r.competition_id=${id} AND r.registration_status='APPROVED'
            GROUP BY r.registration_id,t.team_id
            HAVING t.team_id IS NULL OR r.roster_snapshot IS NULL
              OR count(cp.player_id) <> jsonb_array_length(r.roster_snapshot)
              OR count(cp.player_id) < ${c.min_players} OR count(cp.player_id) > ${c.squad_size}
              OR count(DISTINCT tp.jersey_number) <> count(cp.player_id)
              OR count(*) FILTER (WHERE cp.status <> 'ACTIVE' OR p.status <> 'ACTIVE'
                OR p.date_of_birth IS NULL OR p.position IS NULL OR btrim(p.position)=''
                OR p.gender IS NULL OR p.gender NOT IN (${c.gender},${c.gender === "MEN" ? "MALE" : "FEMALE"})
                OR tp.player_id IS NULL OR tp.jersey_number NOT BETWEEN 1 AND 99) > 0`;
          requireRule(!invalidRosters.length, "Approved teams must have complete, active and eligible competition rosters before finalization.", 409);
        }
        const data = action === "publish" ? { publication_status: "PUBLISHED" } : action === "close" ? { registration_closed_at: new Date() } : { participants_finalized_at: new Date(), participants_finalized_by: actor.user_id };
        const result = await tx.competition.update({ where: { competition_id: id }, data });
        await audit(tx, actor.user_id, `COMPETITION_${action.toUpperCase()}`, "COMPETITION", id); return result;
      });
    },
    async submit(body, user, id) {
      const result = await transact(async tx => {
        const c = await lockedCompetition(tx, body.competition_id);
        requireRule((c.registration_workflow === "MANUAL_ROSTER" ? c.tournament_state === "NOT_CONFIGURED" : c.registration_workflow === "LEGACY" && !["ONGOING", "COMPLETED"].includes(c.tournament_state) && (!c.competition_start_date || new Date() < new Date(c.competition_start_date))) && !c.participants_finalized_at, "This competition cannot receive roster applications.", 409);
        if (!id) {
          const existing = await tx.competitionRegistration.findFirst({ where: { competition_id: c.competition_id, registered_by: user.user_id }, select: { registration_id: true, registration_status: true } });
          if (existing) throw Object.assign(new WorkflowError("You already have a registration for this competition. View its status or resubmit requested corrections.", 409), { existing_registration: existing });
        }
        requireRule(c.status === "ACTIVE" && c.publication_status === "PUBLISHED", "Registration is unavailable.", 409);
        requireRule(id || registrationState(c) === "OPEN", "Registration is not open.", 409);
        const season = await tx.season.findUnique({ where: { season_id: c.season_id }, select: { status: true } });
        requireRule(season?.status === "ACTIVE", "This season is not accepting registrations.", 409);
        if (!id) requireRule(await tx.competitionRegistration.count({ where: { competition_id: c.competition_id, registration_status: "APPROVED" } }) < c.max_teams, "Competition capacity has been reached.", 409);
        requireRule(Number.isInteger(c.min_players) && Number.isInteger(c.squad_size) && c.min_players >= 1 && c.squad_size >= c.min_players && c.squad_size <= 50 && Number.isInteger(c.max_teams) && c.max_teams > 0 && (c.registration_type === "FREE" || c.payment_account_ids.length > 0), "HPL must configure roster limits and official payment accounts before new captain registrations.", 409);
        const values = validateSubmission(body, c);
        const current = id ? await tx.competitionRegistration.findUnique({ where: { registration_id: id } }) : null;
        if (id) requireRule(current?.registered_by === user.user_id && current.competition_id === c.competition_id && current.registration_status === "CHANGES_REQUESTED", "Only your own changes-requested application can be resubmitted.", 409);
        const account = await tx.user.findUnique({ where: { user_id: user.user_id }, select: { name: true, email: true, status: true } });
        requireRule(account?.status === "ACTIVE", "An active authenticated account is required.", 403);
        const snapshot = { ...values.team, representative_name: account.name, representative_email: account.email };
        const r = id ? await tx.competitionRegistration.update({ where: { registration_id: id }, data: { team_snapshot: snapshot, roster_snapshot: values.roster, team_name_key: nameKey(snapshot.name), registration_status: "PENDING", rejection_reason: null } }) : await tx.competitionRegistration.create({ data: { competition_id: c.competition_id, registered_by: user.user_id, team_snapshot: snapshot, roster_snapshot: values.roster, team_name_key: nameKey(snapshot.name), fee_snapshot: c.registration_fee, registration_status: "PENDING", payment_status: c.registration_type === "FREE" ? "NOT_REQUIRED" : "PENDING_VERIFICATION", registration_date: new Date() } });
        if (values.payment) {
          const old = id ? await tx.payment.findFirst({ where: { registration_id: id, payment_status: { not: "SUPERSEDED" } }, orderBy: [{ created_at: "desc" }, { payment_id: "desc" }] }) : null;
          if (!old || old.receipt_id !== values.payment.receipt_id || old.transaction_reference !== values.payment.transaction_reference || old.receiving_account_snapshot?.payment_account_id !== values.payment.payment_account_id) {
            const { target_payment_id, ...data } = await paymentData(tx, c, values.payment, user, r.registration_id);
            const history = old ? [...(old.proof_history || []), { receipt_id: old.receipt_id, transaction_reference: old.transaction_reference, receiving_account_snapshot: old.receiving_account_snapshot, payment_status: old.payment_status, verified_by: old.verified_by ?? null, verified_at: old.verified_at?.toISOString() || null, verification_reason: old.verification_reason ?? null, replaced_at: new Date().toISOString() }] : [];
            if (target_payment_id) await tx.payment.update({ where: { payment_id: target_payment_id }, data: { ...data, verified_by: null, verified_at: null, paid_at: null, verification_reason: null, proof_history: history } });
            else {
              await tx.payment.create({ data: { ...data, registration_id: r.registration_id, proof_history: history } });
            }
            // Reserve every prior reference permanently while allowing the same
            // application to correct/reinstate its own earlier payment proof.
            if (old && old.payment_id !== target_payment_id) await tx.payment.update({ where: { payment_id: old.payment_id }, data: { payment_status: "SUPERSEDED" } });
            await tx.competitionRegistration.update({ where: { registration_id: r.registration_id }, data: { payment_status: "PENDING_VERIFICATION" } });
          }
        }
        await audit(tx, user.user_id, id ? "REGISTRATION_RESUBMITTED" : "REGISTRATION_SUBMITTED", "COMPETITION_REGISTRATION", r.registration_id); return r;
      });
      await notify(result, "Registration submitted", "Your team and roster are pending HPL review.");
      await notify(result, "New competition application", "A team registration is ready for review.", true);
      return detail(result.registration_id, user);
    },
    async releaseName(id, reason, actor) {
      adminOnly(actor); reason = text(reason, 2000, true, "release reason");
      const found = await db.competitionRegistration.findUnique({ where: { registration_id: id }, select: { competition_id: true } }); requireRule(found, "Registration not found.", 404);
      await transact(async tx => {
        const c = await lockedCompetition(tx, found.competition_id);
        const [r] = await tx.$queryRaw`SELECT * FROM "CompetitionRegistration" WHERE registration_id=${id} FOR UPDATE`;
        requireRule(r?.registration_status === "REJECTED" && r.team_name_key && !c.participants_finalized_at, "Only a rejected, reserved name can be released before finalization.", 409);
        await tx.competitionRegistration.update({ where: { registration_id: id }, data: { team_name_key: null } });
        await tx.registrationApprovalHistory.create({ data: { registration_id: id, reviewed_by: actor.user_id, action: "NAME_RELEASED", remarks: reason } });
        await audit(tx, actor.user_id, "REGISTRATION_NAME_RELEASED", "COMPETITION_REGISTRATION", id);
      });
      return detail(id, actor);
    },
    async review(id, body, actor, paymentOnly = false) {
      adminOnly(actor);
      const found = await db.competitionRegistration.findUnique({ where: { registration_id: id }, select: { competition_id: true } });
      requireRule(found, "Registration not found.", 404);
      const result = await transact(async tx => {
        const c = await lockedCompetition(tx, found.competition_id);
        const [r] = await tx.$queryRaw`SELECT * FROM "CompetitionRegistration" WHERE registration_id=${id} FOR UPDATE`;
        requireRule(c.status === "ACTIVE" && c.publication_status === "PUBLISHED", "Competition review is unavailable.", 409);
        requireRule(r?.team_snapshot && !c.participants_finalized_at && ["PENDING", "CHANGES_REQUESTED"].includes(r.registration_status), "This application is locked or already decided.", 409);
        const reason = text(body.reason, 2000, body.action !== "APPROVE" && body.action !== "VERIFY", "review reason");
        requireRule((paymentOnly ? ["VERIFY", "REJECT"] : ["APPROVE", "REQUEST_CHANGES", "REJECT"]).includes(body.action), "Select a valid review action.");
        if (paymentOnly) {
          requireRule(r.payment_status !== "NOT_REQUIRED", "Free registrations need no payment review.", 409);
          const payment = await tx.payment.findFirst({ where: { registration_id: id, payment_status: { not: "SUPERSEDED" } }, orderBy: [{ created_at: "desc" }, { payment_id: "desc" }] });
          requireRule(payment?.receipt_id && ["PENDING_VERIFICATION", "REJECTED"].includes(payment.payment_status), "Payment is already verified or has no proof.", 409);
          const status = body.action === "VERIFY" ? "VERIFIED" : "REJECTED";
          await tx.payment.update({ where: { payment_id: payment.payment_id }, data: { payment_status: status, verified_by: actor.user_id, verified_at: new Date(), paid_at: status === "VERIFIED" ? new Date() : null, verification_reason: reason } });
          await tx.competitionRegistration.update({ where: { registration_id: id }, data: { payment_status: status, ...(status === "REJECTED" ? { registration_status: "CHANGES_REQUESTED", rejection_reason: reason } : {}) } });
        } else if (body.action === "APPROVE") {
          requireRule(r.registration_status === "PENDING" && ["VERIFIED", "NOT_REQUIRED"].includes(r.payment_status), "Paid registrations require verified payment; corrections must be resubmitted.", 409);
          const values = validateSubmission({ team: Object.fromEntries(["name", "logo", "city", "contact_phone"].map(k => [k, r.team_snapshot[k]])), roster: r.roster_snapshot }, c, { payment: false });
          const approved = await tx.competitionRegistration.count({ where: { competition_id: c.competition_id, registration_status: "APPROVED" } });
          requireRule(approved < c.max_teams, "Competition capacity has been reached.", 409);
          const team = await tx.team.create({ data: { name: values.team.name, logo: values.team.logo, city: values.team.city, contact_phone: values.team.contact_phone, contact_email: r.team_snapshot.representative_email, owner_id: r.registered_by, gender: c.gender, team_type: "COMPETITION", status: "ACTIVE", verification_status: "VERIFIED" } });
          const inputs = values.roster.map(p => ({ ...p, registration_number: generateRegistrationNumber() }));
          const players = await tx.player.createManyAndReturn({ data: inputs.map(p => ({ name: p.name, date_of_birth: new Date(p.date_of_birth), gender: c.gender === "MEN" ? "MALE" : "FEMALE", position: p.position, profile_photo: p.profile_photo, registration_number: p.registration_number, status: "ACTIVE", profile_completed_at: new Date() })) });
          const jerseys = new Map(inputs.map(p => [p.registration_number, p.jersey_number]));
          await tx.teamPlayer.createMany({ data: players.map(p => ({ team_id: team.team_id, player_id: p.player_id, jersey_number: jerseys.get(p.registration_number), joined_at: new Date(), status: "ACTIVE" })) });
          await tx.competitionPlayer.createMany({ data: players.map(p => ({ competition_id: c.competition_id, registration_id: id, player_id: p.player_id, status: "ACTIVE", registered_at: new Date() })) });
          await tx.competitionRegistration.update({ where: { registration_id: id }, data: { registration_status: "APPROVED", team_id: team.team_id, approved_at: new Date(), rejection_reason: null } });
          await tx.registrationApprovalEmail.create({ data: { registration_id: id } });
        } else await tx.competitionRegistration.update({ where: { registration_id: id }, data: { registration_status: body.action === "REJECT" ? "REJECTED" : "CHANGES_REQUESTED", rejection_reason: reason } });
        await tx.registrationApprovalHistory.create({ data: { registration_id: id, reviewed_by: actor.user_id, action: paymentOnly ? `PAYMENT_${body.action}` : body.action, remarks: reason } });
        await audit(tx, actor.user_id, paymentOnly ? `PAYMENT_${body.action}` : `REGISTRATION_${body.action}`, "COMPETITION_REGISTRATION", id); return r;
      });
      await notify(result, "Registration updated", paymentOnly ? `Payment proof: ${body.action === "VERIFY" ? "verified" : "correction required"}.` : `Registration: ${body.action.toLowerCase().replaceAll("_", " ")}.${body.reason ? ` ${body.reason}` : ""}`, false, paymentOnly || body.action !== "APPROVE");
      if (!paymentOnly && body.action === "APPROVE") await approvalEmail.deliver(id);
      return detail(id, actor);
    },
  };
}
