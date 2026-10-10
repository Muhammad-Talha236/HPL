export const MEDIA_CATEGORIES = {
  branding: { folder: "hpl/branding", resourceTypes: ["image"] },
  players: { folder: "hpl/players", resourceTypes: ["image"] },
  teams: { folder: "hpl/teams", resourceTypes: ["image"] },
  news: { folder: "hpl/news", resourceTypes: ["image"] },
  "match-images": { folder: "hpl/matches/images", resourceTypes: ["image"] },
  "match-highlights": { folder: "hpl/matches/highlights", resourceTypes: ["video"] },
  seasons: { folder: "hpl/seasons", resourceTypes: ["image", "video"] },
  competitions: { folder: "hpl/competitions", resourceTypes: ["image"] },
  profiles: { folder: "hpl/profiles", resourceTypes: ["image"] },
  gallery: { folder: "hpl/gallery", resourceTypes: ["image"] },
  videos: { folder: "hpl/videos", resourceTypes: ["video"] },
  temporary: { folder: "hpl/temporary", resourceTypes: ["image", "video"] },
};

export const RESOURCE_TYPES = new Set(["image", "video"]);
export const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
export const VIDEO_FORMATS = new Set(["mp4", "webm"]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 15 * 60;

export const ENTITY_TYPES = new Set([
  "PLAYER",
  "TEAM",
  "NEWS",
  "MATCH",
  "SEASON",
  "COMPETITION",
  "USER",
]);

export const DIRECT_MEDIA_ROLES = {
  PLAYER: "PROFILE",
  TEAM: "LOGO",
  NEWS: "COVER",
  USER: "PROFILE",
};
