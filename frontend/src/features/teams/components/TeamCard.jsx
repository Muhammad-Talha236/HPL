import { Link } from "react-router-dom";

import TeamLogo from "./TeamLogo";
import { getTeamLocation } from "../utils/teamFormatters";

const accentColors = ["#FF9E91", "#EEC058", "#3B82F6", "#10B981", "#F59E0B", "#E11D48", "#38BDF8", "#8B5CF6"];

const TeamCard = ({ team }) => {
  const accent = accentColors[team.team_id % accentColors.length];

  return (
  <article style={{ borderTopColor: accent }} className="group flex min-h-[300px] flex-col rounded-xl border border-white/10 border-t-6 bg-[#10283d] p-5 shadow-lg transition duration-200 hover:-translate-y-1 hover:border-x-white/20 hover:border-b-white/20 hover:shadow-2xl">
    <div className="flex items-start justify-between gap-4"><TeamLogo logo={team.logo} name={team.name} /><div className="pt-1 text-right"><p className="text-[9px] font-bold tracking-[0.1em] text-[#EEC058]">TEAM PROFILE</p><p className="mt-1 text-base font-extrabold tracking-tight text-[#c7d9ef]">{team.team_type || "HPL TEAM"}</p><p className="mt-1 text-[10px] font-semibold text-white/50">{team.gender || "HPL"}</p></div></div>
    <div className="mt-6"><h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight text-[#d8e7fb]">{team.name}</h2><p className="mt-3 text-xs font-semibold text-[#ffb5ab]">⌾ {getTeamLocation(team) || team.club?.name || "Hunza Premier League"}</p></div>
    <Link to={`/teams/${team.team_id}`} className="mt-auto inline-flex min-h-12 items-center justify-center rounded-lg border border-[#EEC058]/80 px-4 py-3 text-xs font-bold tracking-wide text-[#EEC058] transition hover:bg-[#EEC058] hover:text-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">VIEW TEAM PROFILE</Link>
  </article>
  );
};

export default TeamCard;
