CREATE INDEX "Match_referee_status_schedule_idx"
ON "Match" ("referee_id", "status", "match_date", "start_time");
