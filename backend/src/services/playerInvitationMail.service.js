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
  const link = new URL("/player-invitation", config.frontendUrl);
  if (process.env.NODE_ENV === "production" && (link.protocol !== "https:" || /^(localhost|127\.0\.0\.1)$/.test(link.hostname))) throw new PlayerInvitationDeliveryError();
  link.searchParams.set("token", rawToken);
  const acceptanceUrl = link.href;
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
    subject: "You've Been Invited to Join a Team \u2014 HPL",
    text: `Hello ${player_name},\n\nYou have been invited to join Hunza Premier League as a player for ${team_name} (${club_name}).\n\nAccept your invitation: ${acceptanceUrl}\n\nThis invitation is valid for 7 days and expires on ${expiry}. Membership becomes active when you accept using the invited account. You can complete your player profile later. If you were not expecting this invitation, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;padding:32px;color:#0B1D2F"><h2>Hunza Premier League</h2><h1>Join ${safe.team}</h1><p>You have been invited to join <strong>${safe.team}</strong> as a player. Accept the invitation using the invited account to join the team. Player profile details can be completed later.</p><p><a href="${safe.url}" style="display:inline-block;background:#087554;color:white;padding:14px 24px;border-radius:8px;text-decoration:none">Accept Invitation</a></p><p>This invitation is valid for 7 days and expires on ${safe.expiry}.</p><p>If this invitation was not intended for you, ignore this email. Never share your invitation link.</p></div>`,
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
