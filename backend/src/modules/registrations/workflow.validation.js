import validator from "validator";

export class WorkflowError extends Error {
  constructor(message, status = 400, field) { super(message); this.status = status; this.field = field; }
}
export const requireRule = (condition, message, status = 400, field) => { if (!condition) throw new WorkflowError(message, status, field); };
export const nameKey = value => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
export const text = (value, max, required = false, field = "field") => {
  requireRule(typeof value === "string" || (!required && value == null), `Provide a valid ${field}.`, 400, field);
  const result = String(value || "").trim();
  requireRule(result.length <= max && (!required || result.length >= 2), `Provide a valid ${field}.`, 400, field);
  return result || null;
};
export const image = value => {
  if (!value) return null;
  requireRule(typeof value === "string" && value.length <= 1000 && (/^https:\/\//.test(value) || /^\/uploads\//.test(value)), "Images must use HTTPS or an existing upload path.");
  return value;
};
export const dateOnly = (value, field) => {
  requireRule(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value), `Provide a valid ${field}.`, 400, field);
  const date = new Date(`${value}T00:00:00.000Z`);
  requireRule(!Number.isNaN(+date) && date.toISOString().slice(0, 10) === value, `Provide a valid ${field}.`, 400, field);
  return date;
};
export const exactFields = (body, fields) => requireRule(body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).every(key => fields.includes(key)), "Unexpected fields are not allowed.");
export function validateAccount(body) {
  exactFields(body, ["provider", "account_title", "account_number", "bank_name", "instructions", "status"]);
  requireRule(["JAZZCASH", "EASYPAISA", "BANK_TRANSFER"].includes(body.provider), "Select a supported payment provider.", 400, "provider");
  let number = String(body.account_number || "").replace(/[\s-]/g, "").toUpperCase();
  requireRule(body.provider === "BANK_TRANSFER" ? (/^\d{8,24}$/.test(number) || validator.isIBAN(number)) : /^(?:03\d{9}|\+?923\d{9})$/.test(number), "Provide a valid receiving account number or IBAN.", 400, "account_number");
  if (body.provider !== "BANK_TRANSFER") number = number.replace(/^\+?92/, "0");
  requireRule(["ACTIVE", "INACTIVE"].includes(body.status || "ACTIVE"), "Invalid account status.");
  return { provider: body.provider, account_title: text(body.account_title, 100, true, "account title"), account_number: number, bank_name: text(body.bank_name, 100, body.provider === "BANK_TRANSFER", "bank name"), instructions: text(body.instructions, 2000), status: body.status || "ACTIVE" };
}
export function validateCompetition(body) {
  exactFields(body, ["name", "season_id", "gender", "description", "logo", "registration_start_date", "registration_end_date", "max_teams", "min_players", "squad_size", "registration_instructions", "registration_type", "registration_fee", "payment_account_ids", "publication_status"]);
  const start = dateOnly(body.registration_start_date, "registration opening date"), end = dateOnly(body.registration_end_date, "registration closing date");
  requireRule(end > start, "Closing date must be after opening date.", 400, "registration_end_date");
  requireRule(Number.isInteger(body.season_id) && body.season_id > 0, "Select a season.");
  requireRule(["MEN", "WOMEN"].includes(body.gender), "Select Men or Women.");
  requireRule(Number.isInteger(body.max_teams) && body.max_teams >= 1 && body.max_teams <= 256, "Team capacity must be between 1 and 256.");
  requireRule(Number.isInteger(body.min_players) && Number.isInteger(body.squad_size) && body.min_players >= 1 && body.squad_size >= body.min_players && body.squad_size <= 50, "Player limits must be between 1 and 50, with minimum no greater than maximum.");
  requireRule(["FREE", "PAID"].includes(body.registration_type), "Select free or paid registration.");
  const fee = body.registration_type === "FREE" ? 0 : Number(body.registration_fee);
  requireRule(Number.isFinite(fee) && fee >= 0 && fee <= 10000000 && Number(fee.toFixed(2)) === fee && (body.registration_type === "FREE" || fee > 0), "Provide a valid registration fee in PKR.");
  const ids = body.registration_type === "FREE" ? [] : body.payment_account_ids;
  requireRule(Array.isArray(ids) && ids.length <= 20 && ids.every(id => Number.isInteger(id) && id > 0) && new Set(ids).size === ids.length && (body.registration_type === "FREE" || ids.length > 0), "Select 1 to 20 active receiving accounts for paid registration.");
  requireRule(["DRAFT", "PUBLISHED"].includes(body.publication_status || "DRAFT"), "Invalid publication status.");
  return { name: text(body.name, 100, true, "competition name").replace(/\s+/g, " "), season_id: body.season_id, gender: body.gender, description: text(body.description, 2000), logo: image(body.logo), registration_start_date: start, registration_end_date: end, max_teams: body.max_teams, min_players: body.min_players, squad_size: body.squad_size, registration_type: body.registration_type, registration_fee: fee, registration_instructions: text(body.registration_instructions, 4000), publication_status: body.publication_status || "DRAFT", payment_account_ids: ids };
}
export function validateSubmission(body, competition, options = {}) {
  exactFields(body, ["competition_id", "team", "roster", "payment"]);
  exactFields(body.team, ["name", "logo", "city", "contact_phone"]);
  const team = { name: text(body.team.name, 100, true, "team name"), logo: image(body.team.logo), city: text(body.team.city, 100, true, "city / area"), contact_phone: text(body.team.contact_phone, 30, true, "contact number") };
  requireRule(/^[+\d\s()-]{7,30}$/.test(team.contact_phone), "Provide a valid contact number.");
  requireRule(Array.isArray(body.roster) && body.roster.length >= competition.min_players && body.roster.length <= competition.squad_size, `Enter ${competition.min_players}–${competition.squad_size} players.`, 400, "roster");
  const roster = body.roster.map(player => {
    exactFields(player, ["name", "date_of_birth", "position", "jersey_number", "profile_photo"]);
    const dob = dateOnly(player.date_of_birth, "date of birth");
    requireRule(dob >= new Date("1900-01-01") && dob <= new Date(), "Player date of birth is invalid.");
    requireRule(Number.isInteger(player.jersey_number) && player.jersey_number >= 1 && player.jersey_number <= 99, "Jersey numbers must be between 1 and 99.");
    return { name: text(player.name, 100, true, "player name"), date_of_birth: player.date_of_birth, position: text(player.position, 50, true, "playing position"), jersey_number: player.jersey_number, profile_photo: image(player.profile_photo) };
  });
  requireRule(new Set(roster.map(p => p.jersey_number)).size === roster.length, "Each player needs a unique jersey number.");
  requireRule(new Set(roster.map(p => `${nameKey(p.name)}:${p.date_of_birth}`)).size === roster.length, "The roster contains duplicate players.");
  if (options.payment === false) return { team, roster, payment: null };
  if (competition.registration_type === "PAID") {
    exactFields(body.payment, ["payment_account_id", "transaction_reference", "receipt_id"]);
    requireRule(Number.isInteger(body.payment.payment_account_id) && body.payment.payment_account_id > 0, "Select a receiving account.");
    requireRule(typeof body.payment.transaction_reference === "string" && /^[A-Za-z0-9_-]{4,100}$/.test(body.payment.transaction_reference.trim()), "Provide a valid transaction reference.");
    requireRule(typeof body.payment.receipt_id === "string" && /^[a-f0-9-]{36}$/.test(body.payment.receipt_id), "Upload a receipt before submitting.");
  } else requireRule(!body.payment, "Free registrations do not accept payment details.");
  return { team, roster, payment: body.payment ? { ...body.payment, transaction_reference: body.payment.transaction_reference.trim().toUpperCase() } : null };
}
