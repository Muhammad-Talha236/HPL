-- Prepared for review only. Back up and run the read-only preflight before approved deployment.
BEGIN;

-- Abort safely on ambiguous existing names; do not merge, rename or delete data.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "Competition" GROUP BY season_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Competition name collisions require manual review. Run the registration workflow preflight first.';
  END IF;
  IF EXISTS (SELECT 1 FROM "CompetitionRegistration" r JOIN "Team" t USING(team_id) GROUP BY r.competition_id, lower(regexp_replace(btrim(t.name), '\s+', ' ', 'g')) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Existing team registration name collisions require manual review. No data changed.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Payment" GROUP BY upper(btrim(transaction_reference)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Existing payment reference collisions require manual review. No data changed.';
  END IF;
END $$;
-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "home_venue_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "logo" TEXT,
ADD COLUMN     "min_players" INTEGER NOT NULL DEFAULT 11,
ADD COLUMN     "participants_finalized_at" TIMESTAMP(3),
ADD COLUMN     "participants_finalized_by" INTEGER,
ADD COLUMN     "publication_status" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "registration_closed_at" TIMESTAMP(3),
ADD COLUMN     "registration_instructions" TEXT,
ADD COLUMN     "registration_type" TEXT NOT NULL DEFAULT 'PAID',
ADD COLUMN     "registration_workflow" TEXT NOT NULL DEFAULT 'LEGACY',
ADD COLUMN     "tournament_state" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
ALTER COLUMN "competition_start_date" DROP NOT NULL,
ALTER COLUMN "competition_end_date" DROP NOT NULL,
ALTER COLUMN "format" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CompetitionRegistration" ADD COLUMN     "fee_snapshot" DECIMAL(12,2),
ADD COLUMN     "roster_snapshot" JSONB,
ADD COLUMN     "team_name_key" TEXT,
ADD COLUMN     "team_snapshot" JSONB,
ALTER COLUMN "team_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "proof_history" JSONB,
ADD COLUMN     "receipt_id" TEXT,
ADD COLUMN     "receiving_account_snapshot" JSONB,
ADD COLUMN     "verification_reason" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" INTEGER;

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "payment_account_id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "account_title" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_name" TEXT,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("payment_account_id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "receipt_id" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "public_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_registration_id" INTEGER,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("receipt_id")
);

-- CreateTable
CREATE TABLE "_CompetitionPaymentAccounts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompetitionPaymentAccounts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_provider_account_number_key" ON "PaymentAccount"("provider", "account_number");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_public_id_key" ON "PaymentReceipt"("public_id");

-- CreateIndex
CREATE INDEX "PaymentReceipt_owner_id_created_at_idx" ON "PaymentReceipt"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "_CompetitionPaymentAccounts_B_index" ON "_CompetitionPaymentAccounts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRegistration_competition_id_team_name_key_key" ON "CompetitionRegistration"("competition_id", "team_name_key");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receipt_id_key" ON "Payment"("receipt_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "PaymentReceipt"("receipt_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_consumed_registration_id_fkey" FOREIGN KEY ("consumed_registration_id") REFERENCES "CompetitionRegistration"("registration_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetitionPaymentAccounts" ADD CONSTRAINT "_CompetitionPaymentAccounts_A_fkey" FOREIGN KEY ("A") REFERENCES "Competition"("competition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetitionPaymentAccounts" ADD CONSTRAINT "_CompetitionPaymentAccounts_B_fkey" FOREIGN KEY ("B") REFERENCES "PaymentAccount"("payment_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing tournaments and registrations keep their records, formats and fixtures.
UPDATE "Competition" c SET registration_type = CASE WHEN registration_fee = 0 THEN 'FREE' ELSE 'PAID' END,
 tournament_state = CASE
  WHEN EXISTS (SELECT 1 FROM "Match" m WHERE m.competition_id=c.competition_id AND m.status='LIVE') THEN 'ONGOING'
  WHEN EXISTS (SELECT 1 FROM "Match" m WHERE m.competition_id=c.competition_id AND m.status='COMPLETED')
   AND NOT EXISTS (SELECT 1 FROM "Match" m WHERE m.competition_id=c.competition_id AND m.status IN ('SCHEDULED','LIVE','POSTPONED')) THEN 'COMPLETED'
  WHEN c.format IS NOT NULL THEN 'CONFIGURED' ELSE 'NOT_CONFIGURED' END;
UPDATE "CompetitionRegistration" r SET fee_snapshot=c.registration_fee,
 team_name_key=lower(regexp_replace(btrim(t.name), '\s+', ' ', 'g'))
 FROM "Competition" c, "Team" t WHERE r.competition_id=c.competition_id AND r.team_id=t.team_id;
-- Database identity protection also covers concurrent name submissions and casing.
CREATE UNIQUE INDEX "Competition_season_normalized_name_key" ON "Competition" (season_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

CREATE UNIQUE INDEX "Payment_normalized_reference_key" ON "Payment" (upper(btrim(transaction_reference)));

COMMIT;
