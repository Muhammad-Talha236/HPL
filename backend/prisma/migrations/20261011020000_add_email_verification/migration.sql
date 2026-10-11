ALTER TABLE "public"."User"
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "email_verified_at" TIMESTAMP(3);

CREATE TABLE "public"."EmailVerificationToken" (
  "email_verification_token_id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "token_hash" TEXT NOT NULL,
  "email_snapshot" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("email_verification_token_id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_token_hash_key"
  ON "public"."EmailVerificationToken"("token_hash");
CREATE INDEX "EmailVerificationToken_user_id_expires_at_idx"
  ON "public"."EmailVerificationToken"("user_id", "expires_at");

ALTER TABLE "public"."EmailVerificationToken"
  ADD CONSTRAINT "EmailVerificationToken_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
