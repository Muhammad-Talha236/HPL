export const formatSeasonDate = (value, options = {}) => {
  if (!value) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(value));
};

export const formatSeasonRange = (startDate, endDate) =>
  `${formatSeasonDate(startDate)} — ${formatSeasonDate(endDate)}`;
