import { useState } from "react";

import { getTeamInitials } from "../utils/teamFormatters";

const TeamLogo = ({ logo, name, size = "md" }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const sizeClass = size === "lg" ? "h-28 w-28 text-3xl sm:h-36 sm:w-36" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-16 w-16 text-base";

  if (logo && !hasImageError) {
    return <img src={logo} alt={`${name} logo`} onError={() => setHasImageError(true)} className={`${sizeClass} rounded-full border border-white/15 bg-[#061525] object-contain p-1.5 shadow-lg`} />;
  }

  return <span aria-label={`${name} placeholder mark`} className={`${sizeClass} grid shrink-0 place-items-center rounded-full border border-[#EEC058]/35 bg-[linear-gradient(135deg,#23435c,#0B1D2F)] font-extrabold tracking-tight text-[#ffad9f] shadow-lg`}>{getTeamInitials(name)}</span>;
};

export default TeamLogo;
