import { Link } from "react-router-dom";

import { formatCompetitionDate, formatCompetitionTime } from "../utils/competitionFormatters";

const CompetitionMatchPreview = ({ match, type }) => {
  const isResult = type === "result";
  return <article className="rounded-xl border border-white/10 bg-[#0B1D2F] p-4"><div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-[0.12em] text-white/45"><span>{formatCompetitionDate(match.match_date, { year: undefined }).toUpperCase()}</span><span>{isResult ? "COMPLETED" : formatCompetitionTime(match.start_time)}</span></div><div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2"><p className="truncate text-sm font-bold text-white">{match.home_team?.name || "Home team"}</p><p className="font-extrabold text-[#ffad9f]">{isResult ? match.home_score : ""}</p><p className="truncate text-sm font-bold text-white">{match.away_team?.name || "Away team"}</p><p className="font-extrabold text-[#ffad9f]">{isResult ? match.away_score : ""}</p></div><p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/50">{match.venue?.name || "Venue to be confirmed"}</p><Link to={`/matches/${match.match_id}`} className="mt-3 inline-flex text-xs font-bold text-[#EEC058] transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">VIEW MATCH →</Link></article>;
};

export default CompetitionMatchPreview;
