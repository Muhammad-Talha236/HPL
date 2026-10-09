import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import MatchPageTeam from "./MatchPageTeam";
import { formatMatchDate } from "../utils/matchFormatters";

const RecentMatchRow = ({ match }) => (
  <article className="grid gap-3 border-b border-[#e8efed] px-3 py-3 last:border-b-0 md:grid-cols-[120px_minmax(0,1fr)_auto_minmax(0,1fr)_auto] md:items-center">
    <div className="text-[8px] text-[#6b7b8e]"><p className="inline-flex items-center gap-1 font-bold text-[#3a4b62]"><CalendarDays size={11} />{formatMatchDate(match.match_date, { year: undefined })}</p><p className="mt-1 truncate">{match.competition?.name || "Competition"}</p><p className="mt-0.5 inline-flex items-center gap-1 truncate"><MapPin size={10} />{match.venue?.name || "Venue to be confirmed"}</p></div>
    <MatchPageTeam team={match.home_team} reverse />
    <div className="text-center"><strong className="block whitespace-nowrap text-[16px] tracking-[-.06em] text-[#182842]">{match.home_score} - {match.away_score}</strong><span className="text-[8px] font-bold text-[#748397]">FT</span></div>
    <MatchPageTeam team={match.away_team} />
    <Link to={`/matches/${match.match_id}`} className="justify-self-start rounded border border-[#0b8657]/50 px-2.5 py-1.5 text-[8px] font-extrabold text-[#087d50] transition hover:bg-[#087d50] hover:text-white md:justify-self-end">Match Details</Link>
  </article>
);

export default RecentMatchRow;
