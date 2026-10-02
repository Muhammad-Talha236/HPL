import { Link } from "react-router-dom";

import { formatTeamMatchDate, formatTeamMatchTime } from "../utils/teamFormatters";

const TeamMatchCard = ({ match, type }) => {
  const isResult = type === "result";
  return <article className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">{match.competition?.name || "HPL"} · {isResult ? "FINAL" : "UPCOMING"}</p><p className="mt-2 text-xs text-white/50">{formatTeamMatchDate(match.match_date)} {isResult ? "" : `· ${formatTeamMatchTime(match.start_time)}`}</p><div className="mt-5 space-y-3"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-bold text-white">{match.home_team?.name}</span>{isResult && <strong className="text-xl text-[#ffad9f]">{match.home_score}</strong>}</div><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-bold text-white/65">{match.away_team?.name}</span>{isResult && <strong className="text-xl text-white/65">{match.away_score}</strong>}</div></div><p className="mt-5 border-t border-white/10 pt-3 text-xs text-white/45">{match.venue?.name || "Venue to be confirmed"}</p><Link to={`/matches/${match.match_id}`} className="mt-4 inline-flex text-xs font-bold text-[#EEC058] transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">VIEW MATCH →</Link></article>;
};

export default TeamMatchCard;
