-- Prepared only. Apply to Neon only after explicit approval and a fresh email audit.
-- Preserve every existing User.email exactly; derive a separate immutable identity.
BEGIN;
LOCK TABLE "User" IN ACCESS EXCLUSIVE MODE;

CREATE FUNCTION hpl_email_lookup_key(address TEXT) RETURNS TEXT
LANGUAGE SQL IMMUTABLE STRICT PARALLEL SAFE AS $$
  WITH normalized AS (
    SELECT lower(btrim(address, E' \t\n\r\f' || chr(11) || chr(160) || chr(5760) ||
      chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196) || chr(8197) ||
      chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202) || chr(8232) ||
      chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279))) AS email
  ), parts AS (
    SELECT email, substring(email from '^(.*)@[^@]*$') AS local_part,
      substring(email from '@([^@]*)$') AS domain FROM normalized
  )
  SELECT CASE WHEN domain IN ('gmail.com', 'googlemail.com')
    THEN replace(split_part(local_part, '+', 1), '.', '') || '@gmail.com'
    ELSE email END FROM parts;
$$;

-- Stop atomically on collisions. No merges, deletions, or guessed email repairs.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "User" GROUP BY hpl_email_lookup_key(email) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Email identity collisions found. Run auditAccountEmails.js and resolve manually before migration.';
  END IF;
END $$;

ALTER TABLE "User" ADD COLUMN "email_key" TEXT
  GENERATED ALWAYS AS (hpl_email_lookup_key("email")) STORED NOT NULL;
CREATE UNIQUE INDEX "User_email_key_key" ON "User"("email_key");
COMMIT;
