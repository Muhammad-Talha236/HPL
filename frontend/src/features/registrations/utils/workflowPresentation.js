export const dateLabel = value => value ? new Date(value).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "Not set";
export const feeLabel = c => c.registration_type === "FREE" ? "Free registration" : `PKR ${Number(c.registration_fee).toLocaleString("en-PK")}`;
export const hasTournament = c => Boolean((c.tournament_state && c.tournament_state !== "NOT_CONFIGURED") || (c.registration_workflow === "LEGACY" && c.format));
export const rosterLabel = c => c.registration_workflow === "LEGACY" ? c.squad_size ? `Up to ${c.squad_size} players` : "Roster limit not set" : `${c.min_players}-${c.squad_size} players`;
