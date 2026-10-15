import nodemailer from "nodemailer";
import { getAccountMailConfig } from "../config/accountMail.config.js";
import { isValidAccountEmail } from "../utils/email.util.js";
import { normalizeStoredEmail } from "../utils/email.util.js";
let approvalTransportFactory = options => nodemailer.createTransport(options);
export const setApprovalTransportFactoryForTests = factory => { approvalTransportFactory = factory; };
export const resetApprovalTransportFactoryForTests = () => { approvalTransportFactory = options => nodemailer.createTransport(options); };

export async function sendCaptainApprovalEmail({ email, captainName, teamName, competitionName, seasonName, registrationId, teamId, competitionId }, transportFactory = approvalTransportFactory) {
  if (!isValidAccountEmail(email)) throw new Error("INVALID_REGISTERED_MAILBOX");
  const config = getAccountMailConfig();
  const links = { registration: `${config.frontendUrl}/my/registrations/${registrationId}`, team: `${config.frontendUrl}/teams/${teamId}`, competition: `${config.frontendUrl}/competitions/${competitionId}` };
  if (process.env.NODE_ENV === "production" && new URL(config.frontendUrl).protocol !== "https:") throw new Error("UNSAFE_FRONTEND_URL");
  const transport = transportFactory({ service: "gmail", auth: { user: config.emailUser, pass: config.emailAppPassword }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000 });
  try {
    const result = await transport.sendMail({ from: `${config.emailFromName} <${config.emailUser}>`, to: email, subject: "Your Team Registration Has Been Approved \u2014 HPL", messageId: `<hpl-team-approval-${registrationId}@${config.emailUser.split("@")[1]}>`, text: `Hello ${captainName},\n\nCongratulations!\n\nYour team, ${teamName}, has been successfully registered for ${competitionName} in ${seasonName}.\n\nYour registration has been reviewed and approved by the Hunza Premier League administration.\n\nYou can now view your team and competition details on the HPL platform.\nRegistration: ${links.registration}\nTeam: ${links.team}\nCompetition: ${links.competition}\n\nThank you for participating in Hunza Premier League.\n\nBest regards,\nHunza Premier League Team` });
    const accepted = result.accepted?.some(address => normalizeStoredEmail(typeof address === "string" ? address : address.address) === normalizeStoredEmail(email));
    if (!accepted) throw new Error("SMTP_NOT_ACCEPTED");
    return { accepted: true, messageId: result.messageId };
  } finally { transport.close(); }
}

// Optional status delivery uses the existing account SMTP configuration.
// Called after commit, and only for a currently verified account mailbox.
export async function sendRegistrationStatusEmail({ email, title, message, registrationId, admin = false }) {
  if (!isValidAccountEmail(email)) throw new Error("INVALID_REGISTERED_MAILBOX");
  const config = getAccountMailConfig();
  const url = `${config.frontendUrl}/${admin ? "admin" : "my"}/registrations/${registrationId}`;
  const transport = nodemailer.createTransport({ service: "gmail", auth: { user: config.emailUser, pass: config.emailAppPassword }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000 });
  try {
    await transport.sendMail({ from: `${config.emailFromName} <${config.emailUser}>`, to: email, subject: `HPL - ${title}`, text: `${message}\n\nView your registration: ${url}\n\nHunza Premier League` });
  } finally { transport.close(); }
}
