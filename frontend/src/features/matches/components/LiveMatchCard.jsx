import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import MatchPageTeam from "./MatchPageTeam";

const LiveMatchCard = ({ match }) => (
  <Link to={`/matches/${match.match_id}`} className="block cursor-pointer overflow-hidden rounded-lg border border-[#d6e0df] bg-[linear-gradient(135deg,#173c42,#0b2431)] text-white shadow-[0_5px_16px_rgba(15,23,42,.09)] transition hover:-translate-y-0.5 hover:border-[#8acaae] hover:shadow-[0_8px_20px_rgba(15,23,42,.16)] focus:outline-none focus:ring-2 focus:ring-[#087d50]/30">
    <div className="bg-[linear-gradient(90deg,rgba(5,25,30,.94),rgba(9,61,54,.78))] p-4">
      <div className="flex items-center justify-between gap-3 text-[8px] font-bold">
        <span className="rounded bg-[#ef3f4d] px-2 py-1 tracking-[.08em] text-white">LIVE</span>
        <span className="truncate text-white/75">{match.competition?.name || "Competition"}</span>
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <MatchPageTeam team={match.home_team} reverse dark />
        <div className="text-center"><strong className="text-[26px] leading-none tracking-[-.08em]">{match.home_score} <span className="text-white/50">-</span> {match.away_score}</strong><span className="mt-1 block text-[8px] font-bold tracking-[.12em] text-[#93e5c3]">LIVE SCORE</span></div>
        <MatchPageTeam team={match.away_team} dark />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-3 text-[9px] text-white/70"><span className="inline-flex min-w-0 items-center gap-1 truncate"><MapPin size={11} />{match.venue?.name || "Venue to be confirmed"}</span><span className="shrink-0 rounded bg-[#087d50] px-2.5 py-1.5 text-[8px] font-extrabold text-white">Follow Live</span></div>
    </div>
  </Link>
);

export default LiveMatchCard;
