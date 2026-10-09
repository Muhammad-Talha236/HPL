import mountainStadiumImage from "../../../assets/hunza-football-hero-alt.png";

// TEMPORARY UNSPLASH ASSET — replace with official HPL media later.
const temporarySeasonImages = [
  "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1518605368461-92924e2a8c2b?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=82",
];

export const seasonsHeroImage = mountainStadiumImage;
export const featuredSeasonImage = temporarySeasonImages[0];
export const seasonImageFallback = mountainStadiumImage;

export const getSeasonImage = (seasonId) => {
  const index = Math.abs(Number(seasonId) || 0) % temporarySeasonImages.length;
  return temporarySeasonImages[index];
};
