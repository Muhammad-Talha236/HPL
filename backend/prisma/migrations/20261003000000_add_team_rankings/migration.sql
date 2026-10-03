-- Overall, cross-competition HPL team rankings. Ratings are stored separately
-- from competition standings and are rebuilt deterministically from matches.
CREATE TABLE "public"."TeamRanking" (
    "ranking_id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "matches_counted" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "last_match_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRanking_pkey" PRIMARY KEY ("ranking_id")
);

CREATE UNIQUE INDEX "TeamRanking_team_id_gender_key" ON "public"."TeamRanking"("team_id", "gender");
CREATE INDEX "TeamRanking_gender_rank_idx" ON "public"."TeamRanking"("gender", "rank");
CREATE INDEX "TeamRanking_team_id_idx" ON "public"."TeamRanking"("team_id");

ALTER TABLE "public"."TeamRanking"
  ADD CONSTRAINT "TeamRanking_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
