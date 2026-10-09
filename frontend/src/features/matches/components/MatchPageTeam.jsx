import { Link } from "react-router-dom";

import TeamLogo from "../../teams/components/TeamLogo";

const MatchPageTeam = ({ team, reverse = false, dark = false }) => (
  <Link to={`/teams/${team?.team_id}`} className={`flex min-w-0 items-center gap-2 text-[10px] font-extrabold transition focus:outline-none focus:ring-2 focus:ring-[#087d50]/25 ${dark ? "text-white hover:text-[#a8efcf]" : "text-[#1c2c44] hover:text-[#087d50]"} ${reverse ? "flex-row-reverse text-right" : ""}`}>
    <TeamLogo logo={team?.logo} name={team?.name || "Team"} size="sm" />
    <span className="truncate">{team?.name || "Team"}</span>
  </Link>
);

export default MatchPageTeam;
