export const formatMatchDate = (value, options = {}) => {
  if (!value) return "Date to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be confirmed";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC", ...options }).format(date);
};

export const formatMatchTime = (value) => {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time to be confirmed";
  return new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
};

export const formatMatchStatus = (status) => status?.replace(/_/g, " ") || "STATUS UNKNOWN";

export const getEventTime = (event) => event.extra_time ? `${event.minute}+${event.extra_time}'` : `${event.minute}'`;

export const getEventLabel = (event) => {
  const labels = { GOAL: "Goal", YELLOW_CARD: "Yellow card", RED_CARD: "Red card", SUBSTITUTION: "Substitution" };
  return labels[event.event_type] || formatMatchStatus(event.event_type);
};
