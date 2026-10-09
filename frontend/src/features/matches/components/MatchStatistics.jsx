import TeamLogo from "../../teams/components/TeamLogo";

const countEvents = (events, teamId, type) => events.filter((event) => event.team_id === teamId && event.event_type === type).length;

const StatRow = ({ label, home, away }) => {
  const total = home + away;
  const homeWidth = total ? `${(home / total) * 100}%` : "0%";
  const awayWidth = total ? `${(away / total) * 100}%` : "0%";

  return <div className="grid grid-cols-[20px_minmax(50px,1fr)_92px_minmax(50px,1fr)_20px] items-center gap-2 text-[8px]"><strong className="text-right text-[#1f3049]">{home}</strong><span className="h-1 rounded-full bg-[#e7efec]"><span className="ml-auto block h-full rounded-full bg-[#087d50]" style={{ width: homeWidth }} /></span><span className="text-center font-bold text-[#5d6d81]">{label}</span><span className="h-1 rounded-full bg-[#e8edf5]"><span className="block h-full rounded-full bg-[#142852]" style={{ width: awayWidth }} /></span><strong className="text-[#1f3049]">{away}</strong></div>;
};

const MatchStatistics = ({ detail }) => {
  const { match, events = {}, home_team: home, away_team: away } = detail;
  const allEvents = events.all || [];
  const stats = [
    ["Goals", match.home_score, match.away_score],
    ["Yellow Cards", countEvents(allEvents, match.home_team_id, "YELLOW_CARD"), countEvents(allEvents, match.away_team_id, "YELLOW_CARD")],
    ["Red Cards", countEvents(allEvents, match.home_team_id, "RED_CARD"), countEvents(allEvents, match.away_team_id, "RED_CARD")],
    ["Substitutions", countEvents(allEvents, match.home_team_id, "SUBSTITUTION"), countEvents(allEvents, match.away_team_id, "SUBSTITUTION")],
  ];

  return <section className="mt-3 rounded-lg border border-[#e0e8e6] bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,.02)]"><h2 className="text-[11px] font-extrabold text-[#1c2b43]">Match Stats</h2><div className="mt-3 flex items-center justify-between text-[9px] font-extrabold text-[#24354b]"><span className="flex items-center gap-1.5"><TeamLogo logo={home?.logo} name={home?.name} size="sm" />{home?.name}</span><span className="flex items-center gap-1.5">{away?.name}<TeamLogo logo={away?.logo} name={away?.name} size="sm" /></span></div><div className="mt-3 space-y-2.5">{stats.map(([label, homeValue, awayValue]) => <StatRow key={label} label={label} home={homeValue} away={awayValue} />)}</div></section>;
};

export default MatchStatistics;
