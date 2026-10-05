const invalidMailConfiguration = () => new Error("Player invitation email service is not configured");
const containsHeaderControlCharacter = (value) => /[\u0000-\u001F\u007F]/.test(value);

const requiredValue = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw invalidMailConfiguration();
  return value;
};

export const getPlayerInvitationMailConfig = () => {
  const emailUser = requiredValue("EMAIL_USER");
  const emailAppPassword = requiredValue("EMAIL_APP_PASSWORD");
  const emailFromName = requiredValue("EMAIL_FROM_NAME");
  const configuredFrontendUrl = requiredValue("FRONTEND_URL");
  let frontendUrl;

  try {
    const parsed = new URL(configuredFrontendUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) throw invalidMailConfiguration();
    frontendUrl = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    throw invalidMailConfiguration();
  }

  if (!/^\S+@\S+\.\S+$/.test(emailUser) || containsHeaderControlCharacter(emailFromName)) throw invalidMailConfiguration();
  return { emailUser, emailAppPassword, emailFromName, frontendUrl };
};
