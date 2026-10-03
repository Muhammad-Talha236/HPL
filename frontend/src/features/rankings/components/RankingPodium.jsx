import { Link } from "react-router-dom";

import TeamLogo from "../../teams/components/TeamLogo";

const podiumStyles = [
  "border-[#EEC058]/60 bg-[linear-gradient(145deg,#26394a,#10263a)]",
  "border-white/25 bg-[linear-gradient(145deg,#1f354a,#0B1D2F)]",
  "border-[#d88665]/45 bg-[linear-gradient(145deg,#342b32,#0B1D2F)]",
];

const RankingPodium = ({ rankings }) => {
  const leaders = rankings.slice(0, 3);
  if (!leaders.length) return null;
  return <section aria-label="Top ranked teams" className="grid gap-4 md:grid-cols-3">{leaders.map((ranking, index) => <Link key={ranking.ranking_id} to={`/teams/${ranking.team_id}`} className={`group relative overflow-hidden rounded-xl border p-5 transition duration-200 hover:-translate-y-1 hover:border-[#FF553D]/75 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60 ${podiumStyles[index]}`}><span className="absolute right-4 top-3 text-5xl font-black leading-none text-white/[0.06]">{ranking.rank}</span><div className="flex items-center gap-4"><TeamLogo logo={ranking.team?.logo} name={ranking.team?.name} size="md" /><div className="min-w-0"><p className="text-[10px] font-extrabold tracking-[0.18em] text-[#EEC058]">#{ranking.rank} TEAM RANKING</p><h2 className="mt-1 truncate text-lg font-extrabold text-white group-hover:text-[#ffad9f]">{ranking.team?.name || "Team"}</h2><p className="mt-1 text-xs text-white/50">{ranking.matches_counted} completed match{ranking.matches_counted === 1 ? "" : "es"}</p></div></div><div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4"><span><span className="block text-[10px] font-bold tracking-[0.14em] text-white/45">RATING</span><strong className="mt-1 block text-3xl font-black text-[#ffad9f]">{ranking.rating.toFixed(2)}</strong></span><span className="text-xs font-extrabold tracking-wide text-[#EEC058]">VIEW TEAM →</span></div></Link>)}</section>;
};

export default RankingPodium;
