import crypto from "crypto";

export const PLAYER_INVITATION_EXPIRY_HOURS = 168;

export const hashPlayerInvitationToken = (rawToken) => crypto
  .createHash("sha256")
  .update(rawToken)
  .digest("hex");

export const createPlayerInvitationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashPlayerInvitationToken(rawToken);

  return { rawToken, tokenHash };
};

export const getPlayerInvitationExpiry = (now = new Date()) => {
  const expiresAt = new Date(now);
  expiresAt.setTime(expiresAt.getTime() + PLAYER_INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
  return expiresAt;
};
