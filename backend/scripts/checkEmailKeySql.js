import "dotenv/config";
import pg from "pg";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getEmailLookupKey } from "../src/utils/email.util.js";

// Verify the exact migration expression using SELECT only. No functions, schema,
// or records are created/changed. Useful before approving a production migration.
const sql = await readFile(new URL("../prisma/migrations/20261013000000_account_email_identity/migration.sql", import.meta.url), "utf8");
const expression = sql.split("AS $$")[1].split("$$;")[0].trim().replace(/;$/, "").replace("btrim(address,", "btrim(sample.address,");
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("sslmode", "verify-full");
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  const existing = await client.query('SELECT email FROM "User"');
  const samples = [...existing.rows.map(r => r.email), " Mian.Talha1016@GMAIL.COM ", "mian.talha.1016+HPL@googlemail.com", "User.Name+tag@outlook.com", "User.Name+tag@yahoo.com", "User.Name+tag@club.example.com", "\u00a0Violet@Example.com\u00a0", "\uFEFFmian.talha+tag@gmail.com\uFEFF", "\vvery@example.com\v"];
  const { rows } = await client.query(`SELECT sample.address, (${expression}) AS email_key FROM unnest($1::text[]) AS sample(address)`, [samples]);
  for (const row of rows) assert.equal(row.email_key, getEmailLookupKey(row.address));
  console.log(`SQL/JavaScript email identity parity passed for ${existing.rows.length} existing accounts and ${samples.length - existing.rows.length} edge-case samples. No database changes made.`);
} catch (error) {
  console.error("SQL email identity parity check failed. Investigate before applying the migration.", { code: error.code || "UNKNOWN", position: error.position });
  process.exitCode = 1;
} finally { await client.end(); }
