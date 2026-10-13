-- Prepared only; production execution requires explicit approval.
-- Preserve every existing profile and membership. Do not fabricate personal data.
BEGIN;
ALTER TABLE "Player" ALTER COLUMN "date_of_birth" DROP NOT NULL,
                     ALTER COLUMN "gender" DROP NOT NULL;
COMMIT;
