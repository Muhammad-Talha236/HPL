import { Link } from "react-router-dom";

import TeamLogo from "../../teams/components/TeamLogo";

const PlayerList = ({ title, players }) => (
  <div className="min-w-0">
    <h4 className="text-[8px] font-extrabold uppercase tracking-[.05em] text-[#66768a]">{title}</h4>
    <div className="mt-1.5 space-y-1">
      {players.length ? players.map((entry) => <Link key={entry.match_player_id} to={`/players/${entry.player_id}`} className="flex min-w-0 items-center gap-1.5 text-[8px] text-[#405169] transition hover:text-[#087d50]"><span className="grid h-4 w-4 shrink-0 place-items-center rounded bg-[#edf2f1] text-[7px] font-bold">{entry.shirt_number ?? "-"}</span><span className="truncate font-semibold">{entry.player?.name || "Player"}</span></Link>) : <p className="text-[8px] text-[#93a0af]">Not announced</p>}
    </div>
  </div>
);

const LineupCard = ({ squad, team, away = false }) => {
  const players = squad?.players || [];
  const starters = players.filter((player) => player.starting_status === "STARTER");
  const substitutes = players.filter((player) => player.starting_status === "SUBSTITUTE");

  return (
    <article className="rounded-lg border border-[#e0e8e6] bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,.02)]">
      <div className="flex items-center justify-center gap-2"><TeamLogo logo={team?.logo} name={team?.name || "Team"} size="sm" /><h3 className="truncate text-[10px] font-extrabold text-[#203048]">{team?.name || "Team"} Lineup</h3></div>
      <div className={`relative mt-3 grid h-[126px] place-items-center overflow-hidden rounded-md border ${away ? "border-[#142d52] bg-[linear-gradient(135deg,#152d50,#0b172b)]" : "border-[#12945f] bg-[linear-gradient(135deg,#159661,#077847)]"}`}>
        <span className="absolute inset-x-3 top-1/2 border-t border-white/25" /><span className="absolute left-1/2 top-0 h-full border-l border-white/25" /><span className="absolute h-10 w-14 rounded-full border border-white/25" />
        {starters.length ? <div className="relative z-10 grid w-[86%] grid-cols-4 gap-x-1 gap-y-2 text-center">{starters.slice(0, 11).map((entry) => <Link key={entry.match_player_id} to={`/players/${entry.player_id}`} className="min-w-0 text-white transition hover:text-[#f7d46d]"><span className="mx-auto grid h-4 w-4 place-items-center rounded-full bg-[#071827] text-[7px] font-extrabold">{entry.shirt_number ?? "-"}</span><span className="mt-0.5 block truncate text-[6px] font-semibold">{entry.player?.name || "Player"}</span></Link>)}</div> : <p className="relative z-10 rounded bg-[#071827]/45 px-3 py-2 text-[8px] font-bold text-white">Lineup not announced</p>}
      </div>
      {starters.length > 0 && <p className="mt-1 text-center text-[7px] text-[#8c99a8]">Tactical positions unavailable</p>}
      <div className="mt-3 grid grid-cols-2 gap-3"><PlayerList title="Starting XI" players={starters} /><PlayerList title="Substitutes" players={substitutes} /></div>
    </article>
  );
};

const MatchLineups = ({ squads, homeTeam, awayTeam }) => (
  <>
    <LineupCard squad={squads.home} team={homeTeam} />
    <LineupCard squad={squads.away} team={awayTeam} away />
  </>
);

export default MatchLineups;
