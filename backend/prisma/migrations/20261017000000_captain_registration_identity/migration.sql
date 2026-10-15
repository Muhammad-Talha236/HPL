-- Prepared only. Inspect existing duplicates and approve deployment first.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "CompetitionRegistration" GROUP BY competition_id, registered_by HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Captain/competition registration conflicts require manual review. Run registration-workflow-preflight.js; no records were deleted or merged.';
  END IF;
END $$;
CREATE UNIQUE INDEX "CompetitionRegistration_competition_id_registered_by_key"
 ON "CompetitionRegistration" ("competition_id", "registered_by");
CREATE TABLE "RegistrationApprovalEmail" (
 "registration_id" INTEGER NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'PENDING',
 "attempts" INTEGER NOT NULL DEFAULT 0,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "attempted_at" TIMESTAMP(3),
 "sent_at" TIMESTAMP(3),
 "message_id" TEXT,
 "failure_code" TEXT,
 CONSTRAINT "RegistrationApprovalEmail_pkey" PRIMARY KEY ("registration_id"),
 CONSTRAINT "RegistrationApprovalEmail_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "CompetitionRegistration"("registration_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "RegistrationApprovalEmail_status_created_at_idx" ON "RegistrationApprovalEmail"("status", "created_at");
COMMIT;
