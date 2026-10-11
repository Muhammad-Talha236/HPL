-- This migration preserves every existing Team row and its Club foreign key.
-- It only permits future independent teams to have no club.
ALTER TABLE "public"."Team" ALTER COLUMN "club_id" DROP NOT NULL;

-- No index on Team.club_id exists in the current schema or migration history.
CREATE INDEX "Team_club_id_idx" ON "public"."Team"("club_id");
