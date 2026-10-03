CREATE TABLE "public"."RefereeRanking" (
  "referee_id" INTEGER NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "evaluation_count" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefereeRanking_pkey" PRIMARY KEY ("referee_id"),
  CONSTRAINT "RefereeRanking_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."Referee"("referee_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RefereeRanking_position_idx" ON "public"."RefereeRanking"("position");
CREATE INDEX "RefereeRanking_rating_idx" ON "public"."RefereeRanking"("rating");
