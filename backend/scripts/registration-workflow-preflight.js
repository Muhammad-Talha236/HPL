import "dotenv/config";
import prisma from "../src/database/prisma.js";

// Read-only inspection. Works before the new columns exist; prints IDs and
// aggregate counts, never credentials, contact details or payment proofs.
let phase = "connection";
const started = Date.now();
try {
  // Resolve cold TLS/Neon connection startup before acquiring an interactive
  // transaction slot; only this harmless read runs outside READ ONLY mode.
  await prisma.$queryRaw`SELECT 1::int AS connected`;
  phase = "transaction start";
  const report = await prisma.$transaction(async tx => {
    phase = "read-only setup";
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    phase = "record counts";
    const counts = await tx.$queryRaw`SELECT (SELECT count(*)::int FROM "Competition") AS competitions, (SELECT count(*)::int FROM "CompetitionRegistration") AS registrations, (SELECT count(*)::int FROM "Team") AS teams, (SELECT count(*)::int FROM "Player") AS players, (SELECT count(*)::int FROM "Payment") AS payments`;
    phase = "competition name conflicts";
    const competitionNameConflicts = await tx.$queryRaw`SELECT season_id, array_agg(competition_id ORDER BY competition_id) AS competition_ids FROM "Competition" GROUP BY season_id, lower(regexp_replace(btrim(name), '\\s+', ' ', 'g')) HAVING count(*) > 1`;
    phase = "registration name conflicts";
    const registrationNameConflicts = await tx.$queryRaw`SELECT r.competition_id, array_agg(r.registration_id ORDER BY r.registration_id) AS registration_ids FROM "CompetitionRegistration" r JOIN "Team" t USING(team_id) GROUP BY r.competition_id, lower(regexp_replace(btrim(t.name), '\\s+', ' ', 'g')) HAVING count(*) > 1`;
    phase = "payment reference conflicts";
    const paymentReferenceConflicts = await tx.$queryRaw`SELECT array_agg(payment_id ORDER BY payment_id) AS payment_ids FROM "Payment" GROUP BY upper(btrim(transaction_reference)) HAVING count(*) > 1`;
    phase = "captain registration conflicts";
    const captainRegistrationConflicts = await tx.$queryRaw`SELECT competition_id, registered_by, array_agg(registration_id ORDER BY registration_id) AS registration_ids FROM "CompetitionRegistration" GROUP BY competition_id, registered_by HAVING count(*) > 1`;
    return { inspected_at: new Date().toISOString(), counts: counts[0], captainRegistrationConflicts, competitionNameConflicts, registrationNameConflicts, paymentReferenceConflicts, safe_to_apply_workflow_migration: !captainRegistrationConflicts.length && !competitionNameConflicts.length && !registrationNameConflicts.length && !paymentReferenceConflicts.length };
  }, { timeout: 10000, maxWait: 2000 });
  console.log(JSON.stringify(report, null, 2));
  if (!report.safe_to_apply_workflow_migration) process.exitCode = 2;
} catch (error) {
  console.error("Registration workflow preflight failed", { code: error.code || "UNAVAILABLE", phase, elapsed_ms: Date.now() - started, message: String(error.message).replace(/\w+:\/\/\S+/g, "[connection]").slice(-500) }); process.exitCode = 1;
} finally { await prisma.$disconnect(); }
