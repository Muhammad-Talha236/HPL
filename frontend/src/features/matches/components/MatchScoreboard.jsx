import { Link } from "react-router-dom";

import TeamLogo from "../../teams/components/TeamLogo";

const TeamIdentity = ({ team, align = "left", size = "card" }) => <Link to={`/teams/${team?.team_id}`} className={`group/team flex min-w-0 flex-col ${align === "right" ? "items-end text-right" : "items-start"} focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60`}><TeamLogo logo={team?.logo} name={team?.name} size={size === "hero" ? "lg" : undefined} /><span className="mt-2 max-w-full truncate text-sm font-extrabold text-white transition group-hover/team:text-[#EEC058] sm:text-base">{team?.name || "Team"}</span></Link>;

const MatchScoreboard = ({ match, size = "card" }) => {
  const hasScore = match.status === "LIVE" || match.status === "COMPLETED";
  const hero = size === "hero";
  return <div className={`grid items-center gap-3 ${hero ? "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-8" : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"}`}><TeamIdentity team={match.home_team} align="right" size={size} /><div className={`flex shrink-0 items-center gap-2 font-extrabold ${hero ? "text-4xl sm:text-6xl" : "text-2xl"}`}>{hasScore ? <><span className="text-[#ffad9f]">{match.home_score}</span><span className="text-white/30">–</span><span className="text-white">{match.away_score}</span></> : <span className="text-lg tracking-wide text-[#EEC058] sm:text-xl">VS</span>}</div><TeamIdentity team={match.away_team} size={size} /></div>;
};

export default MatchScoreboard;
