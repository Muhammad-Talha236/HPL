import "dotenv/config";
import pg from "pg";
import { isPlayerProfileComplete, canonicalPlayerGender } from "../src/utils/playerEligibility.util.js";
import { getEmailLookupKey } from "../src/utils/email.util.js";

// Read-only preflight: independent of Prisma's new, not-yet-applied fields.
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("sslmode", "verify-full");
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  // pg.Client executes queries serially; avoid queuing parallel calls on one connection.
  const players = await client.query('SELECT player_id, name, date_of_birth, gender, position FROM "Player"');
  const memberships = await client.query('SELECT status, count(*)::int AS count FROM "TeamPlayer" GROUP BY status');
  const invitations = await client.query('SELECT invitation_id, team_id, invited_email, status FROM "PlayerInvitation"');
  const indexes = await client.query("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='PlayerInvitation'");
  const groups = new Map();
  for (const i of invitations.rows.filter(i => ["PENDING", "ACCEPTED_PENDING_PROFILE"].includes(i.status))) {
    const key = `${i.team_id}:${getEmailLookupKey(i.invited_email)}`;
    groups.set(key, [...(groups.get(key) || []), i.invitation_id]);
  }
  const collisions = [...groups].filter(([, ids]) => ids.length > 1).map(([key, invitationIds]) => ({ key, invitationIds }));
  const profilesMissingCompetitionEligibility = players.rows.filter(p => !isPlayerProfileComplete(p)).map(p => p.player_id);
  console.log(JSON.stringify({ players: players.rows.length, memberships: memberships.rows, invitations: invitations.rows.length, profilesMissingCompetitionEligibility, legacyGenderLabels: players.rows.filter(p => canonicalPlayerGender(p.gender) !== p.gender).length, collisions, invitationIndexes: indexes.rows.map(r => r.indexname), note: "Existing players and memberships are preserved. This audit changed no records." }, null, 2));
  if (collisions.length) process.exitCode = 1;
} catch (error) {
  console.error("Player onboarding audit failed", { code: error.code || "CONNECTION_FAILED" });
  process.exitCode = 1;
} finally { await client.end(); }
