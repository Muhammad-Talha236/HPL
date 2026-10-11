import crypto from "node:crypto";
import nodemailer from "nodemailer";
import validator from "validator";
import { getPlayerInvitationMailConfig } from "../config/playerInvitationMail.config.js";

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_MINUTES = 30;
let transportFactory = (config) => nodemailer.createTransport({
  service: "gmail",
  auth: { user: config.emailUser, pass: config.emailAppPassword },
});

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const expiryMinutes = () => {
  const value = Number(process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES || DEFAULT_EXPIRY_MINUTES);
  return Number.isInteger(value) && value >= 5 && value <= 1440 ? value : DEFAULT_EXPIRY_MINUTES;
};

export const createVerificationToken = () => {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + expiryMinutes() * 60 * 1000);
  return { rawToken, tokenHash: hashToken(rawToken), expiresAt };
};

export const getVerificationTokenHash = (rawToken) => (
  typeof rawToken === "string" && rawToken.length >= 40 ? hashToken(rawToken) : null
);

export const sendVerificationEmail = async ({ email, name, rawToken }) => {
  if (!validator.isEmail(email) || typeof rawToken !== "string") throw new Error("EMAIL_VERIFICATION_DELIVERY_FAILED");
  const config = getPlayerInvitationMailConfig();
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const safeName = String(name || "there").replace(/[<>]/g, "");
  try {
    await transportFactory(config).sendMail({
      from: `${config.emailFromName} <${config.emailUser}>`,
      to: email,
      subject: "Verify your Hunza Premier League account",
      text: `Hello ${safeName},\n\nVerify your HPL account email within the next ${expiryMinutes()} minutes: ${verificationUrl}\n\nIf you did not create this account, ignore this email.`,
      html: `<p>Hello ${safeName},</p><p><a href="${verificationUrl}">Verify your HPL account email</a></p><p>This link expires in ${expiryMinutes()} minutes. If you did not create this account, ignore this email.</p>`,
    });
  } catch (error) {
    console.error("Account email verification delivery failed");
    throw new Error("EMAIL_VERIFICATION_DELIVERY_FAILED", { cause: error });
  }
};

export const setEmailVerificationMailTransportFactoryForTests = (factory) => { transportFactory = factory; };
export const resetEmailVerificationMailTransportFactoryForTests = () => {
  transportFactory = (config) => nodemailer.createTransport({ service: "gmail", auth: { user: config.emailUser, pass: config.emailAppPassword } });
};
