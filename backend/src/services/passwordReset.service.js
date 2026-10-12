import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { getPlayerInvitationMailConfig } from "../config/playerInvitationMail.config.js";

export const RESET_MESSAGE = "If an account exists with this email, a password reset link has been sent.";
export const hashResetToken = (token) => typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
  ? crypto.createHash("sha256").update(token).digest("hex") : null;
export const createResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return { rawToken, tokenHash: hashResetToken(rawToken), expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
};
export const sendPasswordResetEmail = async ({ email, rawToken }) => {
  const config = getPlayerInvitationMailConfig();
  const url = new URL("/reset-password", config.frontendUrl);
  if (process.env.NODE_ENV === "production" && (url.protocol !== "https:" || /^(localhost|127\.0\.0\.1)$/.test(url.hostname))) throw new Error("RESET_MAIL_CONFIGURATION");
  url.searchParams.set("token", rawToken);
  const transport = nodemailer.createTransport({ service: "gmail", auth: { user: config.emailUser, pass: config.emailAppPassword }, connectionTimeout: 10000, socketTimeout: 15000 });
  try {
    await transport.sendMail({
      from: `${config.emailFromName} <${config.emailUser}>`, to: email,
      subject: "Reset your Hunza Premier League password",
      text: `Hunza Premier League\n\nReset your password: ${url.href}\n\nThis single-use link expires in 15 minutes. If you did not request this, ignore this email. Your password will remain unchanged.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;padding:32px;color:#0B1D2F"><h2>Hunza Premier League</h2><h1>Reset Your Password</h1><p>Use the button below to choose a new password for your HPL account.</p><p><a href="${url.href}" style="display:inline-block;padding:14px 24px;background:#087554;color:white;border-radius:8px;text-decoration:none">Reset Password</a></p><p>This single-use link expires in <strong>15 minutes</strong>.</p><p>If you did not request a password reset, you can ignore this email. Your password will remain unchanged.</p></div>`,
    });
  } finally { transport.close(); }
};
