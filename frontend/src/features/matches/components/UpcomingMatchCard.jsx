import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import TeamLogo from "../../teams/components/TeamLogo";
import { formatMatchDate, formatMatchTime } from "../utils/matchFormatters";

const UpcomingMatchCard = ({ match }) => (
  <article className="overflow-hidden rounded-lg border border-[#e0e8e6] bg-white shadow-[0_3px_12px_rgba(15,23,42,.025)]">
    <div className="bg-[linear-gradient(135deg,#203f49,#8dafab)] p-3 text-white">
      <div className="flex items-start justify-between gap-2"><span className="rounded bg-white/15 px-1.5 py-1 text-[7px] font-bold">{formatMatchDate(match.match_date, { year: undefined })}</span><span className="max-w-[115px] truncate text-right text-[7px] font-bold text-white/80">{match.competition?.name || "Competition"}</span></div>
      <p className="mt-4 text-center text-[13px] font-extrabold">{formatMatchTime(match.start_time)}</p>
      <p className="mt-1 flex items-center justify-center gap-1 truncate text-[8px] text-white/75"><MapPin size={10} />{match.venue?.name || "Venue to be confirmed"}</p>
    </div>
    <div className="p-3"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="min-w-0 text-center"><TeamLogo logo={match.home_team?.logo} name={match.home_team?.name} size="sm" /><p className="mt-1 truncate text-[8px] font-extrabold text-[#26364c]">{match.home_team?.name || "Team"}</p></div><span className="rounded bg-[#edf2f1] px-1.5 py-1 text-[8px] font-extrabold text-[#57697c]">VS</span><div className="min-w-0 text-center"><TeamLogo logo={match.away_team?.logo} name={match.away_team?.name} size="sm" /><p className="mt-1 truncate text-[8px] font-extrabold text-[#26364c]">{match.away_team?.name || "Team"}</p></div></div><Link to={`/matches/${match.match_id}`} className="mt-3 flex h-7 items-center justify-center rounded border border-[#0b8657]/50 text-[8px] font-extrabold text-[#087d50] transition hover:bg-[#087d50] hover:text-white">Match Preview</Link></div>
  </article>
);

export default UpcomingMatchCard;
