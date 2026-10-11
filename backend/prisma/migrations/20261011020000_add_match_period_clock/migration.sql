-- Prepared only: do not apply this migration to Neon without explicit approval.
-- The columns support server-authoritative first-half, half-time and second-half
-- transitions. Existing status/score/event history is retained unchanged.

ALTER TABLE "public"."Match"
  ADD COLUMN "period" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "elapsed_seconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "period_started_at" TIMESTAMP(3);

-- Conservative backfill for display and later controlled administration. An
-- existing LIVE match cannot be safely inferred as first or second half, so it
-- is left explicitly UNKNOWN rather than fabricated as a football period.
UPDATE "public"."Match"
SET "period" = CASE
  WHEN "status" = 'SCHEDULED' THEN 'NOT_STARTED'
  WHEN "status" = 'LIVE' THEN 'UNKNOWN'
  WHEN "status" = 'COMPLETED' THEN 'FULL_TIME'
  ELSE 'NOT_STARTED'
END;

ALTER TABLE "public"."Match"
  ADD CONSTRAINT "Match_period_check"
  CHECK ("period" IN ('NOT_STARTED', 'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FULL_TIME', 'UNKNOWN'));

ALTER TABLE "public"."Match"
  ADD CONSTRAINT "Match_elapsed_seconds_nonnegative_check"
  CHECK ("elapsed_seconds" >= 0);
