-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Club" (
    "club_id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "region" TEXT,
    "district" TEXT,
    "city" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "representative_name" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("club_id")
);

-- CreateTable
CREATE TABLE "public"."Competition" (
    "competition_id" SERIAL NOT NULL,
    "season_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "description" TEXT,
    "registration_fee" DECIMAL(12,2) NOT NULL,
    "registration_start_date" DATE NOT NULL,
    "registration_end_date" DATE NOT NULL,
    "competition_start_date" DATE NOT NULL,
    "competition_end_date" DATE NOT NULL,
    "max_teams" INTEGER,
    "squad_size" INTEGER,
    "format" TEXT NOT NULL,
    "eligibility_rules" TEXT,
    "refund_policy" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("competition_id")
);

-- CreateTable
CREATE TABLE "public"."CompetitionPlayer" (
    "competition_player_id" SERIAL NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionPlayer_pkey" PRIMARY KEY ("competition_player_id")
);

-- CreateTable
CREATE TABLE "public"."CompetitionRegistration" (
    "registration_id" SERIAL NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "registered_by" INTEGER NOT NULL,
    "registration_status" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionRegistration_pkey" PRIMARY KEY ("registration_id")
);

-- CreateTable
CREATE TABLE "public"."Match" (
    "match_id" SERIAL NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "season_id" INTEGER NOT NULL,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "venue_id" INTEGER NOT NULL,
    "referee_id" INTEGER NOT NULL,
    "match_date" DATE NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "status" TEXT NOT NULL,
    "home_score" INTEGER NOT NULL DEFAULT 0,
    "away_score" INTEGER NOT NULL DEFAULT 0,
    "match_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "public"."MatchEvent" (
    "event_id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "related_player_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "extra_time" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "public"."MatchPlayer" (
    "match_player_id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "starting_status" TEXT NOT NULL,
    "position" TEXT,
    "shirt_number" INTEGER,
    "minutes_played" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("match_player_id")
);

-- CreateTable
CREATE TABLE "public"."News" (
    "news_id" SERIAL NOT NULL,
    "author_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featured_image" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("news_id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "payment_id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "transaction_reference" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3),
    "refund_amount" DECIMAL(12,2),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "player_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "profile_photo" TEXT,
    "date_of_birth" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "nationality" TEXT,
    "registration_number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("player_id")
);

-- CreateTable
CREATE TABLE "public"."Referee" (
    "referee_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "profile_photo" TEXT,
    "phone" TEXT,
    "region" TEXT,
    "district" TEXT,
    "city" TEXT,
    "license_number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referee_pkey" PRIMARY KEY ("referee_id")
);

-- CreateTable
CREATE TABLE "public"."RegistrationApprovalHistory" (
    "approval_history_id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "reviewed_by" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationApprovalHistory_pkey" PRIMARY KEY ("approval_history_id")
);

-- CreateTable
CREATE TABLE "public"."Season" (
    "season_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("season_id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "team_id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "home_venue_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "gender" TEXT NOT NULL,
    "region" TEXT,
    "district" TEXT,
    "city" TEXT,
    "description" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "team_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "public"."TeamPlayer" (
    "team_player_id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "jersey_number" INTEGER,
    "joined_at" DATE NOT NULL,
    "left_at" DATE,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("team_player_id")
);

-- CreateTable
CREATE TABLE "public"."TeamStanding" (
    "standing_id" SERIAL NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "goal_difference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStanding_pkey" PRIMARY KEY ("standing_id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "user_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "profile_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."Venue" (
    "venue_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "district" TEXT,
    "city" TEXT,
    "address" TEXT,
    "capacity" INTEGER,
    "surface_type" TEXT,
    "contact_phone" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("venue_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionPlayer_competition_id_player_id_key" ON "public"."CompetitionPlayer"("competition_id" ASC, "player_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_competition_id_team_id_key" ON "public"."CompetitionRegistration"("competition_id" ASC, "team_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_match_id_player_id_key" ON "public"."MatchPlayer"("match_id" ASC, "player_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transaction_reference_key" ON "public"."Payment"("transaction_reference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Player_registration_number_key" ON "public"."Player"("registration_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Referee_license_number_key" ON "public"."Referee"("license_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TeamStanding_competition_id_team_id_key" ON "public"."TeamStanding"("competition_id" ASC, "team_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."Club" ADD CONSTRAINT "Club_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Competition" ADD CONSTRAINT "Competition_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."Season"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompetitionPlayer" ADD CONSTRAINT "CompetitionPlayer_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."Competition"("competition_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompetitionPlayer" ADD CONSTRAINT "CompetitionPlayer_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompetitionPlayer" ADD CONSTRAINT "CompetitionPlayer_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."CompetitionRegistration"("registration_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."Competition"("competition_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompetitionRegistration" ADD CONSTRAINT "CompetitionRegistration_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."Competition"("competition_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."Referee"("referee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."Season"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."Venue"("venue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchEvent" ADD CONSTRAINT "MatchEvent_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."Match"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchEvent" ADD CONSTRAINT "MatchEvent_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchEvent" ADD CONSTRAINT "MatchEvent_related_player_id_fkey" FOREIGN KEY ("related_player_id") REFERENCES "public"."Player"("player_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchEvent" ADD CONSTRAINT "MatchEvent_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchPlayer" ADD CONSTRAINT "MatchPlayer_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."Match"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchPlayer" ADD CONSTRAINT "MatchPlayer_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchPlayer" ADD CONSTRAINT "MatchPlayer_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."News" ADD CONSTRAINT "News_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."CompetitionRegistration"("registration_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistrationApprovalHistory" ADD CONSTRAINT "RegistrationApprovalHistory_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."CompetitionRegistration"("registration_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegistrationApprovalHistory" ADD CONSTRAINT "RegistrationApprovalHistory_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."Club"("club_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_home_venue_id_fkey" FOREIGN KEY ("home_venue_id") REFERENCES "public"."Venue"("venue_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamPlayer" ADD CONSTRAINT "TeamPlayer_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."Player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamPlayer" ADD CONSTRAINT "TeamPlayer_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamStanding" ADD CONSTRAINT "TeamStanding_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."Competition"("competition_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamStanding" ADD CONSTRAINT "TeamStanding_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."Team"("team_id") ON DELETE RESTRICT ON UPDATE CASCADE;

