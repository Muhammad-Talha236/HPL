export const formatGoalDifference = (value) => `${Number(value) > 0 ? "+" : ""}${value}`;

export const getLatestStandingUpdate = (standings = []) => standings.reduce((latest, standing) => {
  if (!standing.updated_at) return latest;
  if (!latest || new Date(standing.updated_at) > new Date(latest)) return standing.updated_at;
  return latest;
}, null);

export const formatStandingsUpdatedAt = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
};
