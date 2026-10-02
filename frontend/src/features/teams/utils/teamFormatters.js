export const getTeamInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase() || "HPL";

export const getTeamLocation = (team) =>
  [team.city, team.district, team.region].filter(Boolean).join(", ");

export const formatTeamMatchDate = (value) => {
  if (!value) return "Date to be confirmed";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(value));
};

export const formatTeamMatchTime = (value) => {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time to be confirmed"
    : new Intl.DateTimeFormat("en-PK", {
        hour: "numeric", minute: "2-digit", hour12: true,
      }).format(date);
};
