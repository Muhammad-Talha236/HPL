export const getPlayerInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "HPL";

export const getCurrentMemberships = (memberships = []) =>
  memberships.filter((membership) => membership.status === "ACTIVE");

export const groupMembershipsByPlayer = (memberships = []) =>
  memberships.reduce((groups, membership) => {
    const playerId = membership.player_id;
    groups[playerId] = [...(groups[playerId] || []), membership];
    return groups;
  }, {});

export const formatPosition = (position) =>
  position ? position.replace(/_/g, " ") : null;

export const formatPlayerDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

export const getPlayerAge = (value) => {
  if (!value) return null;

  const birthday = new Date(value);
  if (Number.isNaN(birthday.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDifference = today.getMonth() - birthday.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthday.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};
