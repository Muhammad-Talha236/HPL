import { getEmailLookupKey } from "../../utils/email.util.js";
import bcrypt from "bcryptjs";
import prisma from "../../database/prisma.js";
import { SECURITY } from "../../config/security.js";
import { validatePassword } from "../../utils/password.util.js";
import { createResetToken, hashResetToken, RESET_MESSAGE, sendPasswordResetEmail } from "../../services/passwordReset.service.js";

// Dependency injection keeps security tests offline, without touching real users.
export const createPasswordResetControllers = (db = prisma, sendEmail = sendPasswordResetEmail) => ({
  forgotPassword: async (req, res) => {
    // Respond before account lookup / SMTP work to avoid account-dependent response timing.
    res.json({ message: RESET_MESSAGE });
    let tokenId;
    try {
      const user = await db.user.findUnique({ where: { email_key: getEmailLookupKey(req.body.email) }, select: { user_id: true, email: true } });
      if (user) {
        const token = createResetToken();
        tokenId = await db.$transaction(async (tx) => {
          // Serialize issuance and consumption for this account across instances.
          await tx.$queryRaw`SELECT user_id FROM "User" WHERE user_id = ${user.user_id} FOR UPDATE`;
          const claimed = await tx.user.updateMany({ where: { user_id: user.user_id, email: user.email, OR: [{ password_reset_requested_at: null }, { password_reset_requested_at: { lte: new Date(Date.now() - 15 * 60 * 1000) } }] }, data: { password_reset_requested_at: new Date() } });
          if (!claimed.count) return null;
          await tx.passwordResetToken.updateMany({ where: { user_id: user.user_id, used_at: null }, data: { used_at: new Date() } });
          const record = await tx.passwordResetToken.create({ data: { user_id: user.user_id, token_hash: token.tokenHash, email_snapshot: user.email, expires_at: token.expiresAt } });
          return record.password_reset_token_id;
        });
        if (tokenId) {
          await sendEmail({ email: user.email, rawToken: token.rawToken });
          // Pending tokens cannot be used until delivery succeeds.
          await db.passwordResetToken.updateMany({ where: { password_reset_token_id: tokenId, used_at: null }, data: { delivered_at: new Date() } });
        }
      }
    } catch {
      console.error("Password reset request failed; check database and mail configuration");
      if (tokenId) {
        try { await db.passwordResetToken.updateMany({ where: { password_reset_token_id: tokenId }, data: { used_at: new Date() } }); }
        catch { console.error("Password reset cleanup failed; pending token remains unusable"); }
      }
    }
    return;
  },
  resetPassword: async (req, res) => {
    const invalid = () => res.status(400).json({ success: false, message: "This reset link is invalid or expired. Request a new link." });
    const hash = hashResetToken(req.body?.token);
    if (!hash) return invalid();
    const validation = validatePassword(req.body?.newPassword);
    if (!validation.valid || Buffer.byteLength(req.body?.newPassword) > 72) return res.status(400).json({ success: false, message: validation.message || "Password must be at most 72 bytes." });
    try {
      const token = await db.passwordResetToken.findUnique({ where: { token_hash: hash } });
      if (!token || token.used_at || !token.delivered_at || token.expires_at <= new Date()) return invalid();
      const password_hash = await bcrypt.hash(req.body?.newPassword, SECURITY.BCRYPT_SALT_ROUNDS);
      const consumed = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM "User" WHERE user_id = ${token.user_id} FOR UPDATE`;
        const account = await tx.user.findUnique({ where: { user_id: token.user_id }, select: { email: true } });
        if (!account || account.email !== token.email_snapshot) return false;
        const result = await tx.passwordResetToken.updateMany({ where: { token_hash: hash, used_at: null, delivered_at: { not: null }, expires_at: { gt: new Date() } }, data: { used_at: new Date() } });
        if (!result.count) return false;
        await tx.user.update({ where: { user_id: token.user_id }, data: { password_hash, session_version: { increment: 1 } } });
        await tx.passwordResetToken.updateMany({ where: { user_id: token.user_id, used_at: null }, data: { used_at: new Date() } });
        return true;
      });
      if (!consumed) return invalid();
      return res.json({ success: true, message: "Password reset successfully. Please log in with your new password." });
    } catch {
      console.error("Password reset failed");
      return res.status(503).json({ success: false, message: "Password reset is temporarily unavailable. Please try again later." });
    }
  },
});
export const { forgotPassword, resetPassword } = createPasswordResetControllers();
