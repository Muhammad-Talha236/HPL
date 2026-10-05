-- Add the one-to-one platform-account linkage without changing existing players.
ALTER TABLE "Player" ADD COLUMN "user_id" INTEGER;

CREATE UNIQUE INDEX "Player_user_id_key" ON "Player"("user_id");

ALTER TABLE "Player"
  ADD CONSTRAINT "Player_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Legacy invitations are preserved unchanged. Phase A does not implement
-- acceptance, and later acceptance must reject rows without scoped context.
ALTER TABLE "PlayerInvitation" ADD COLUMN "team_id" INTEGER;
ALTER TABLE "PlayerInvitation" ADD COLUMN "invited_by_user_id" INTEGER;

ALTER TABLE "PlayerInvitation"
  ADD CONSTRAINT "PlayerInvitation_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "Team"("team_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlayerInvitation"
  ADD CONSTRAINT "PlayerInvitation_invited_by_user_id_fkey"
  FOREIGN KEY ("invited_by_user_id") REFERENCES "User"("user_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PlayerInvitation_team_id_status_idx" ON "PlayerInvitation"("team_id", "status");
CREATE INDEX "PlayerInvitation_invited_by_user_id_status_idx" ON "PlayerInvitation"("invited_by_user_id", "status");

-- PostgreSQL partial index: exactly one current invitation per Player while
-- still preserving expired, revoked, and accepted invitation history.
CREATE UNIQUE INDEX "PlayerInvitation_one_pending_per_player_key"
  ON "PlayerInvitation"("player_id")
  WHERE "status" = 'PENDING';
