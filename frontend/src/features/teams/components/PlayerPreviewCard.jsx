import { Link } from "react-router-dom";

const PlayerPreviewCard = ({ teamPlayer }) => {
  const player = teamPlayer.player;
  const initials = player?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "P";
  return <Link to={`/players/${teamPlayer.player_id}`} className="block rounded-lg border border-white/10 bg-[#0B1D2F] p-4 transition hover:border-[#EEC058]/45 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs font-extrabold text-[#EEC058]">{initials}</span><div className="min-w-0"><h3 className="truncate text-sm font-bold text-white">{player?.name}</h3><p className="mt-1 text-xs text-white/50">{player?.position || "Position to be confirmed"}</p></div>{teamPlayer.jersey_number !== null && teamPlayer.jersey_number !== undefined && <span className="ml-auto text-sm font-extrabold text-[#ffad9f]">#{teamPlayer.jersey_number}</span>}</div></Link>;
};

export default PlayerPreviewCard;
