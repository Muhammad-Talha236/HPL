import { CalendarDays, Clock3, MapPin, Trophy, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import matchTeamPlaceholder from "../../../assets/match-team-placeholder.png";
import TeamLogo from "../../teams/components/TeamLogo";
import { formatMatchDate, formatMatchTime, formatMatchStatus } from "../utils/matchFormatters";

const Team = ({ team }) => <Link to={`/teams/${team?.team_id}`} className="flex min-w-0 flex-col items-center gap-1 text-center text-[10px] font-extrabold text-white transition hover:text-[#a8efcf]"><TeamLogo logo={team?.logo || matchTeamPlaceholder} name={team?.name || "Team"} size="lg" /><span className="max-w-full truncate">{team?.name || "Team"}</span></Link>;

const Meta = ({ icon: Icon, children }) => <span className="inline-flex items-center gap-1 text-[8px] text-white/80"><Icon size={11} />{children}</span>;

const MatchDetailsScoreboard = ({ detail }) => {
  const { match, home_team: home, away_team: away } = detail;
  const scored = match.status === "LIVE" || match.status === "COMPLETED";
  const status = match.status === "COMPLETED" ? "FT" : formatMatchStatus(match.status);

  return (
    <section className="min-h-[190px] overflow-hidden rounded-lg border border-[#203a50] bg-[radial-gradient(circle_at_50%_0%,rgba(63,105,115,.42),transparent_42%),linear-gradient(125deg,#071827,#102f3e_55%,#071827)] p-3 text-white shadow-[0_8px_22px_rgba(15,23,42,.14)] sm:p-4">
      <div className="flex items-center justify-center gap-1.5 text-center"><Trophy size={12} className="text-[#98e6c3]" /><Link to={`/competitions/${match.competition_id}`} className="text-[9px] font-extrabold text-[#a8efcf] hover:text-white">{detail.competition?.name || "Competition"}</Link></div><p className="mt-0.5 text-center text-[8px] text-white/70">{detail.season?.name || "Season"}</p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4"><Team team={home} /><div className="min-w-[96px] text-center">{scored ? <strong className="block text-[32px] leading-none tracking-[-.09em] sm:text-[38px]">{match.home_score} <span className="text-white/40">-</span> {match.away_score}</strong> : <strong className="block text-[23px] tracking-[.12em] text-[#d9ebdf]">VS</strong>}<span className={`mt-2 inline-flex rounded px-2 py-1 text-[8px] font-extrabold ${match.status === "LIVE" ? "bg-[#ed3e4b] text-white" : "bg-white/15 text-white"}`}>{status}</span>{match.status === "LIVE" && <span className="mt-1 block text-[8px] text-white/65">Live score</span>}</div><Team team={away} /></div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-white/15 pt-2.5"><Meta icon={CalendarDays}>{formatMatchDate(match.match_date, { year: undefined })}</Meta><Meta icon={Clock3}>{formatMatchTime(match.start_time)}</Meta><Meta icon={MapPin}>{detail.venue?.name || "Venue to be confirmed"}</Meta><Meta icon={UserRound}>{detail.referee?.name || "Referee not assigned"}</Meta></div>
    </section>
  );
};

export default MatchDetailsScoreboard;
