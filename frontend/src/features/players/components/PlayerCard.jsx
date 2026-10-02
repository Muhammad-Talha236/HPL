import { Link } from "react-router-dom";

import PlayerImage from "./PlayerImage";
import PlayerStatusBadge from "./PlayerStatusBadge";
import PositionBadge from "./PositionBadge";
import { getCurrentMemberships } from "../utils/playerFormatters";

const PlayerCard = ({ player, memberships = [] }) => {
  const currentMemberships = getCurrentMemberships(memberships);

  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F] transition duration-200 hover:-translate-y-1 hover:border-[#EEC058]/45 hover:shadow-xl hover:shadow-black/20">
      <PlayerImage player={player} className="aspect-[16/10]" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <PositionBadge position={player.position} />
          <PlayerStatusBadge status={player.status} />
        </div>

        <h2 className="mt-4 truncate text-lg font-extrabold uppercase tracking-tight text-white">
          {player.name}
        </h2>

        <div className="mt-2 min-h-10 space-y-1">
          {currentMemberships.length > 0 ? (
            currentMemberships.slice(0, 2).map((membership) => (
              <Link
                key={membership.team_player_id}
                to={`/teams/${membership.team_id}`}
                className="flex w-fit max-w-full items-center gap-1 truncate text-xs font-semibold text-white/60 transition-colors hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50"
              >
                <span aria-hidden="true">⌾</span>
                <span className="truncate">{membership.team?.name || "Team"}</span>
                {membership.jersey_number !== null && membership.jersey_number !== undefined && (
                  <span className="shrink-0 text-[#EEC058]">#{membership.jersey_number}</span>
                )}
              </Link>
            ))
          ) : (
            <p className="text-xs text-white/40">No active team listed</p>
          )}
        </div>

        <Link
          to={`/players/${player.player_id}`}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[#EEC058]/75 px-3 text-xs font-extrabold tracking-wide text-[#EEC058] transition-colors hover:bg-[#EEC058] hover:text-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60"
        >
          VIEW PROFILE <span className="ml-2" aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
};

export default PlayerCard;
