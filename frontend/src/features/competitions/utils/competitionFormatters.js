export const formatCompetitionDate = (value, options = {}) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
};

export const formatCompetitionRange = (startDate, endDate) => {
  if (!startDate && !endDate) return "Dates to be confirmed";
  if (!endDate) return `From ${formatCompetitionDate(startDate)}`;
  if (!startDate) return `Until ${formatCompetitionDate(endDate)}`;
  return `${formatCompetitionDate(startDate)} – ${formatCompetitionDate(endDate)}`;
};

export const formatCompetitionTime = (value) => {
  if (!value) return "Time to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time to be confirmed";

  return new Intl.DateTimeFormat("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatLabel = (value) => value?.replace(/_/g, " ") || "Not available";
