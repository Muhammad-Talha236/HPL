-- Prepared only. Explicit production approval required. No existing roster is demoted.
BEGIN;
LOCK TABLE "PlayerInvitation" IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "PlayerInvitation" WHERE status='PENDING' GROUP BY team_id,hpl_email_lookup_key(invited_email) HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Invitation email collisions require manual review before migration.';
 END IF;
END $$;
ALTER TABLE "Player" ADD COLUMN "profile_completed_at" TIMESTAMP(3);
-- Existing profiles and confirmed rosters are grandfathered, never reset to pending.
UPDATE "Player" SET "profile_completed_at" = "created_at";
DROP INDEX "PlayerInvitation_one_pending_per_player_key";
ALTER TABLE "PlayerInvitation" ALTER COLUMN "player_id" DROP NOT NULL,
 ADD COLUMN "invited_email_key" TEXT GENERATED ALWAYS AS (hpl_email_lookup_key(invited_email)) STORED NOT NULL,
 ADD COLUMN "accepted_user_id" INTEGER,
 ADD COLUMN "accepted_email_snapshot" TEXT,
 ADD COLUMN "delivered_at" TIMESTAMP(3),
 ADD COLUMN "last_sent_at" TIMESTAMP(3);
UPDATE "PlayerInvitation" SET delivered_at=created_at,last_sent_at=updated_at;
UPDATE "PlayerInvitation" AS i SET accepted_user_id=p.user_id FROM "Player" AS p WHERE i.player_id=p.player_id AND i.status='ACCEPTED';
ALTER TABLE "PlayerInvitation" ADD CONSTRAINT "PlayerInvitation_accepted_user_id_fkey" FOREIGN KEY (accepted_user_id) REFERENCES "User"(user_id) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "PlayerInvitation_one_open_per_team_email_key" ON "PlayerInvitation"(team_id,invited_email_key) WHERE status IN ('PENDING','ACCEPTED_PENDING_PROFILE');
CREATE INDEX "PlayerInvitation_accepted_user_id_status_idx" ON "PlayerInvitation"(accepted_user_id,status);
COMMIT;
