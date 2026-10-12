import { normalizeStoredEmail } from "./email.util.js";

export const normalizePlayerInvitationEmail = normalizeStoredEmail;

export const maskPlayerInvitationEmail = (email) => {
  const [local, domain] = normalizePlayerInvitationEmail(email).split("@");
  if (!local || !domain) return "•••";
  return `${local.slice(0, 1)}***@${domain}`;
};
