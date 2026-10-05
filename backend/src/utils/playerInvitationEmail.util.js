import validator from "validator";

export const normalizePlayerInvitationEmail = (email) => {
  const input = String(email || "").trim();
  return validator.normalizeEmail(input) || input.toLowerCase();
};

export const maskPlayerInvitationEmail = (email) => {
  const [local, domain] = normalizePlayerInvitationEmail(email).split("@");
  if (!local || !domain) return "•••";
  return `${local.slice(0, 1)}***@${domain}`;
};
