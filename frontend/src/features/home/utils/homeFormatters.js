export const formatMatchDate = (value, options = {}) => {
  if (!value) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
};

export const formatMatchTime = (value) => {
  if (!value) {
    return "Time to be confirmed";
  }

  const time = new Date(value);

  return Number.isNaN(time.getTime())
    ? "Time to be confirmed"
    : new Intl.DateTimeFormat("en-PK", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(time);
};

export const formatPublishedDate = (value) => {
  if (!value) {
    return "Recent update";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const getNewsExcerpt = (content, length = 120) => {
  if (!content) {
    return "";
  }

  return content.length > length
    ? `${content.slice(0, length).trim()}…`
    : content;
};
