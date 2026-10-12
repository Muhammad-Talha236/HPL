ALTER TABLE "User" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "password_reset_requested_at" TIMESTAMP(3);
CREATE TABLE "PasswordResetToken" (
 "password_reset_token_id" SERIAL NOT NULL,
 "user_id" INTEGER NOT NULL,
 "token_hash" TEXT NOT NULL,
 "email_snapshot" TEXT NOT NULL,
 "expires_at" TIMESTAMP(3) NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "delivered_at" TIMESTAMP(3),
 "used_at" TIMESTAMP(3),
 CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("password_reset_token_id"),
 CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PasswordResetToken_token_hash_key" ON "PasswordResetToken"("token_hash");
CREATE INDEX "PasswordResetToken_user_id_created_at_idx" ON "PasswordResetToken"("user_id", "created_at");
CREATE INDEX "PasswordResetToken_expires_at_idx" ON "PasswordResetToken"("expires_at");
