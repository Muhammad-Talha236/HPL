ALTER TABLE "public"."Referee" ADD COLUMN "user_id" INTEGER;
CREATE UNIQUE INDEX "Referee_user_id_key" ON "public"."Referee"("user_id");
CREATE INDEX "Referee_status_name_idx" ON "public"."Referee"("status", "name");
ALTER TABLE "public"."Referee" ADD CONSTRAINT "Referee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "public"."RefereeEvaluation" (
  "evaluation_id" SERIAL NOT NULL,
  "referee_id" INTEGER NOT NULL,
  "match_id" INTEGER NOT NULL,
  "evaluator_id" INTEGER NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefereeEvaluation_pkey" PRIMARY KEY ("evaluation_id"),
  CONSTRAINT "RefereeEvaluation_referee_id_match_id_key" UNIQUE ("referee_id", "match_id"),
  CONSTRAINT "RefereeEvaluation_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."Referee"("referee_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RefereeEvaluation_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."Match"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RefereeEvaluation_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RefereeEvaluation_score_check" CHECK ("score" >= 1 AND "score" <= 10)
);
CREATE INDEX "RefereeEvaluation_referee_id_created_at_idx" ON "public"."RefereeEvaluation"("referee_id", "created_at");
CREATE INDEX "RefereeEvaluation_match_id_idx" ON "public"."RefereeEvaluation"("match_id");
