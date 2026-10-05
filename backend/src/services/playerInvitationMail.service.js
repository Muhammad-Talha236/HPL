import nodemailer from "nodemailer";
import validator from "validator";
import { getPlayerInvitationMailConfig } from "../config/playerInvitationMail.config.js";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));

let transportFactory = (config) => nodemailer.createTransport({
  service: "gmail",
  auth: { user: config.emailUser, pass: config.emailAppPassword },
});

const isSafeMailbox = (value) => typeof value === "string"
  && !/[\u0000-\u001F\u007F]/.test(value)
  && validator.isEmail(value);

export class PlayerInvitationDeliveryError extends Error {
  constructor() {
    super("Player invitation email delivery failed");
    this.name = "PlayerInvitationDeliveryError";
  }
}

export const buildPlayerInvitationEmail = ({ invited_email, player_name, team_name, club_name, expires_at, rawToken }) => {
  if (!isSafeMailbox(invited_email)) throw new PlayerInvitationDeliveryError();
  const config = getPlayerInvitationMailConfig();
  const acceptanceUrl = `${config.frontendUrl}/invitations/player/${encodeURIComponent(rawToken)}`;
  const expiry = new Date(expires_at).toUTCString();
  const safe = {
    player: escapeHtml(player_name),
    team: escapeHtml(team_name),
    club: escapeHtml(club_name),
    expiry: escapeHtml(expiry),
    url: escapeHtml(acceptanceUrl),
  };

  return {
    from: `${config.emailFromName} <${config.emailUser}>`,
    to: invited_email,
    subject: "You're invited to join Hunza Premier League",
    text: `Hello ${player_name},\n\nYou have been invited to join Hunza Premier League as a player for ${team_name} (${club_name}).\n\nAccept your invitation: ${acceptanceUrl}\n\nThis link expires on ${expiry}. If you were not expecting this invitation, you can ignore this email.`,
    html: `<p>Hello ${safe.player},</p><p>You have been invited to join <strong>Hunza Premier League</strong> as a player for <strong>${safe.team}</strong> (${safe.club}).</p><p><a href="${safe.url}">Accept your invitation</a></p><p>This link expires on ${safe.expiry}.</p><p>If you were not expecting this invitation, you can ignore this email.</p>`,
  };
};

export const sendPlayerInvitationEmail = async (invitation) => {
  const mail = buildPlayerInvitationEmail(invitation);
  try {
    await transportFactory(getPlayerInvitationMailConfig()).sendMail(mail);
  } catch {
    // Keep SMTP/provider details and the raw acceptance URL out of logs.
    console.error("Player invitation email delivery failed", { invitation_id: invitation.invitation_id });
    throw new PlayerInvitationDeliveryError();
  }
};

// Test-only seam: production code always uses Gmail through Nodemailer.
export const setPlayerInvitationMailTransportFactoryForTests = (factory) => { transportFactory = factory; };
export const resetPlayerInvitationMailTransportFactoryForTests = () => {
  transportFactory = (config) => nodemailer.createTransport({ service: "gmail", auth: { user: config.emailUser, pass: config.emailAppPassword } });
};
