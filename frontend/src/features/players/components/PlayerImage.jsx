import { useState } from "react";

import { getPlayerInitials } from "../utils/playerFormatters";

const PlayerImage = ({ player, className = "", size = "card" }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = player?.profile_photo && !hasImageError;
  const isHero = size === "hero";

  return (
    <div
      className={`relative overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#274d68_0%,#10283d_44%,#07192a_100%)] ${className}`}
    >
      {hasImage ? (
        <img
          src={player.profile_photo}
          alt={`${player.name} profile`}
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center"
          aria-label={`${player?.name || "Player"} image unavailable`}
          role="img"
        >
          <svg
            viewBox="0 0 120 120"
            aria-hidden="true"
            className={`text-white/15 ${isHero ? "h-36 w-36" : "h-24 w-24"}`}
            fill="none"
          >
            <circle cx="60" cy="37" r="18" fill="currentColor" />
            <path d="M28 104c3-25 16-40 32-40s29 15 32 40" fill="currentColor" />
            <path d="M20 107h80" stroke="currentColor" strokeWidth="3" />
          </svg>
          <span className="absolute bottom-4 rounded-full border border-[#EEC058]/30 bg-[#011427]/70 px-3 py-1 text-xs font-extrabold tracking-[0.16em] text-[#EEC058]">
            {getPlayerInitials(player?.name)}
          </span>
        </div>
      )}
      {hasImage && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06182a]/70 via-transparent to-transparent" />}
    </div>
  );
};

export default PlayerImage;
