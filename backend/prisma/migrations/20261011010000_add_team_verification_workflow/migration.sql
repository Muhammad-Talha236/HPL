-- Preserve all existing team records. The explicit default preserves the
-- current public behaviour for existing league/club teams; only teams created
-- through the new independent application workflow start as PROVISIONAL.
ALTER TABLE "public"."Team"
  ADD COLUMN "verification_status" TEXT NOT NULL DEFAULT 'VERIFIED';

CREATE TABLE "public"."TeamRegistrationRequest" (
  "team_registration_request_id" SERIAL NOT NULL,
  "applicant_user_id" INTEGER NOT NULL,
  "linked_team_id" INTEGER,
  "name" TEXT NOT NULL,
  "logo" TEXT,
  "gender" TEXT NOT NULL,
  "team_type" TEXT NOT NULL,
  "home_venue_id" INTEGER NOT NULL,
  "region" TEXT,
  "district" TEXT,
  "city" TEXT,
  "description" TEXT,
  "contact_email" TEXT NOT NULL,
  "contact_phone" TEXT NOT NULL,
  "declaration_accepted" BOOLEAN NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewed_by_user_id" INTEGER,
  "reviewed_at" TIMESTAMP(3),
  "review_reason" TEXT,
  "squad_deadline" TIMESTAMP(3),
  "first_reminder_sent_at" TIMESTAMP(3),
  "second_reminder_sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamRegistrationRequest_pkey" PRIMARY KEY ("team_registration_request_id")
);

CREATE TABLE "public"."TeamRegistrationReview" (
  "team_registration_review_id" SERIAL NOT NULL,
  "team_registration_request_id" INTEGER NOT NULL,
  "reviewer_user_id" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamRegistrationReview_pkey" PRIMARY KEY ("team_registration_review_id")
);

CREATE UNIQUE INDEX "TeamRegistrationRequest_linked_team_id_key" ON "public"."TeamRegistrationRequest"("linked_team_id");
CREATE INDEX "TeamRegistrationRequest_applicant_user_id_status_idx" ON "public"."TeamRegistrationRequest"("applicant_user_id", "status");
CREATE INDEX "TeamRegistrationRequest_status_created_at_idx" ON "public"."TeamRegistrationRequest"("status", "created_at");
CREATE INDEX "TeamRegistrationRequest_squad_deadline_status_idx" ON "public"."TeamRegistrationRequest"("squad_deadline", "status");
CREATE INDEX "TeamRegistrationReview_request_created_at_idx" ON "public"."TeamRegistrationReview"("team_registration_request_id", "created_at");

ALTER TABLE "public"."TeamRegistrationRequest" ADD CONSTRAINT "TeamRegistrationRequest_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."TeamRegistrationRequest" ADD CONSTRAINT "TeamRegistrationRequest_reviewer_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TeamRegistrationRequest" ADD CONSTRAINT "TeamRegistrationRequest_linked_team_id_fkey" FOREIGN KEY ("linked_team_id") REFERENCES "public"."Team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TeamRegistrationRequest" ADD CONSTRAINT "TeamRegistrationRequest_home_venue_id_fkey" FOREIGN KEY ("home_venue_id") REFERENCES "public"."Venue"("venue_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."TeamRegistrationReview" ADD CONSTRAINT "TeamRegistrationReview_request_id_fkey" FOREIGN KEY ("team_registration_request_id") REFERENCES "public"."TeamRegistrationRequest"("team_registration_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."TeamRegistrationReview" ADD CONSTRAINT "TeamRegistrationReview_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
