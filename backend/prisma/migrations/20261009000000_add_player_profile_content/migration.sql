ALTER TABLE "public"."Player"
  ADD COLUMN "height_cm" INTEGER,
  ADD COLUMN "weight_kg" INTEGER,
  ADD COLUMN "preferred_foot" TEXT,
  ADD COLUMN "bio" TEXT;

CREATE TABLE "public"."PlayerAchievement" (
  "achievement_id" SERIAL NOT NULL,
  "player_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "achievement_type" TEXT NOT NULL,
  "awarded_year" INTEGER,
  "season_id" INTEGER,
  "team_id" INTEGER,
  "competition_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("achievement_id")
);

CREATE TABLE "public"."PlayerGalleryPhoto" (
  "photo_id" SERIAL NOT NULL,
  "player_id" INTEGER NOT NULL,
  "image_url" TEXT NOT NULL,
  "caption" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerGalleryPhoto_pkey" PRIMARY KEY ("photo_id")
);

CREATE INDEX "PlayerAchievement_player_id_awarded_year_idx" ON "public"."PlayerAchievement"("player_id", "awarded_year");
CREATE INDEX "PlayerAchievement_competition_id_idx" ON "public"."PlayerAchievement"("competition_id");
CREATE INDEX "PlayerAchievement_team_id_idx" ON "public"."PlayerAchievement"("team_id");
CREATE INDEX "PlayerGalleryPhoto_player_id_created_at_idx" ON "public"."PlayerGalleryPhoto"("player_id", "created_at");

ALTER TABLE "public"."PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."Season"("season_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."Competition"("competition_id") ON DELETE SET NULL ON UPDATE CASCADE;
