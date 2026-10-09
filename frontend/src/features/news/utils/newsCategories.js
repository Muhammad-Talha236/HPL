const CATEGORY_CONFIG = [
  {
    key: "MATCH",
    label: "Match Reports",
    aliases: ["MATCH", "MATCH REPORT", "MATCH REPORTS", "MATCHDAY"],
    className: "bg-[#10845b]",
  },
  {
    key: "ANNOUNCEMENT",
    label: "Announcements",
    aliases: ["ANNOUNCEMENT", "ANNOUNCEMENTS"],
    className: "bg-[#2876c5]",
  },
  {
    key: "TEAM",
    label: "Team Updates",
    aliases: ["TEAM", "TEAMS", "TEAM UPDATE", "TEAM UPDATES"],
    className: "bg-[#d44c52]",
  },
  {
    key: "PLAYER",
    label: "Player Stories",
    aliases: ["PLAYER", "PLAYERS", "PLAYER STORY", "PLAYER STORIES"],
    className: "bg-[#8655b8]",
  },
  {
    key: "TOURNAMENT",
    label: "Tournaments",
    aliases: ["TOURNAMENT", "TOURNAMENTS", "LEAGUE"],
    className: "bg-[#c98216]",
  },
  {
    key: "COMMUNITY",
    label: "Community",
    aliases: ["COMMUNITY"],
    className: "bg-[#168b86]",
  },
];

const normalise = (value) => String(value || "")
  .trim()
  .toUpperCase()
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ");

const findConfig = (category) => CATEGORY_CONFIG.find((item) => (
  item.aliases.includes(normalise(category))
));

export const getNewsCategoryLabel = (category) => findConfig(category)?.label || category || "News";

export const getNewsCategoryClass = (category) => (
  findConfig(category)?.className || "bg-[#5d7187]"
);

export const getNewsCategoryFilters = (publishedCategories = []) => CATEGORY_CONFIG.map((item) => {
  const category = publishedCategories.find((value) => item.aliases.includes(normalise(value)));

  return {
    ...item,
    value: category || item.aliases[0],
  };
});
