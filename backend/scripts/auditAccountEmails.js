import "dotenv/config";
import pg from "pg";
import { getEmailLookupKey, isValidAccountEmail } from "../src/utils/email.util.js";

// Read-only and independent of the generated Prisma schema, so it works before migration.
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("sslmode", "verify-full");
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  const { rows } = await client.query('SELECT user_id, email, email_verified FROM "User" ORDER BY user_id');
  const groups = new Map();
  for (const account of rows) {
    const key = getEmailLookupKey(account.email);
    groups.set(key, [...(groups.get(key) || []), account]);
  }
  const conflicts = [...groups].filter(([, accounts]) => accounts.length > 1).map(([key, accounts]) => ({ key, accounts }));
  const invalid = rows.filter(account => !isValidAccountEmail(account.email));
  console.log(JSON.stringify({ totalAccounts: rows.length, verifiedAccounts: rows.filter(a => a.email_verified).length, conflicts, invalid,
    possiblePreviouslyStrippedGmailUserIds: rows.filter(a => /^[^.]+@(gmail|googlemail)\.com$/i.test(a.email)).map(a => a.user_id),
    notice: "Dotless Gmail storage does not prove past dot removal. Never guess originals or merge accounts automatically." }, null, 2));
  if (conflicts.length || invalid.length) process.exitCode = 1;
} catch {
  console.error("Account email audit failed; check database connectivity and configuration.");
  process.exitCode = 1;
} finally { await client.end(); }
