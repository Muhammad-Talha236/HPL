import { Link } from "react-router-dom";

import TeamLogo from "../../teams/components/TeamLogo";
import { formatGoalDifference } from "../utils/standingsFormatters";

const Position = ({ value }) => (
  <span
    className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-extrabold ${
      value === 1
        ? "bg-[#0b8a5a] text-white"
        : "bg-[#eef2f4] text-[#516176]"
    }`}
  >
    {value}
  </span>
);

const TeamLink = ({ standing }) => (
  <Link
    to={`/teams/${standing.team_id}`}
    className="flex min-w-0 items-center gap-2.5 font-semibold text-[#1a2940] transition hover:text-[#0b7b50] focus:outline-none focus:ring-2 focus:ring-[#0b5d46]/25"
  >
    <TeamLogo logo={standing.team?.logo} name={standing.team?.name || "Team"} size="sm" />
    <span className="truncate">{standing.team?.name || "Team"}</span>
  </Link>
);

const Form = ({ results = [] }) => (
  <span className="flex min-w-[84px] justify-center gap-1">
    {results.length ? (
      results.map((result, index) => (
        <span
          key={`${result}-${index}`}
          aria-label={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
          className={`grid h-4 w-4 place-items-center rounded-[3px] text-[8px] font-extrabold ${
            result === "W"
              ? "bg-[#159568] text-white"
              : result === "D"
                ? "bg-[#f3bf49] text-[#634600]"
                : "bg-[#ef3f4d] text-white"
          }`}
        >
          {result}
        </span>
      ))
    ) : (
      <span className="text-[#95a0ae]">-</span>
    )}
  </span>
);

const StandingsTable = ({ standings }) => (
  <div className="overflow-x-auto rounded-md border border-[#e5ece9]">
    <table className="w-full min-w-[770px] border-collapse text-left">
      <thead className="bg-[#f3f7f6] text-[8px] font-bold uppercase tracking-[0.06em] text-[#708096]">
        <tr>
          <th className="w-10 px-2.5 py-2.5">#</th>
          <th className="px-2.5 py-2.5">Team</th>
          <th className="px-2 py-2.5 text-center">MP</th>
          <th className="px-2 py-2.5 text-center">W</th>
          <th className="px-2 py-2.5 text-center">D</th>
          <th className="px-2 py-2.5 text-center">L</th>
          <th className="px-2 py-2.5 text-center">GF</th>
          <th className="px-2 py-2.5 text-center">GA</th>
          <th className="px-2 py-2.5 text-center">GD</th>
          <th className="px-2.5 py-2.5 text-center">PTS</th>
          <th className="px-2.5 py-2.5 text-center">Form</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((standing, index) => {
          const position = standing.position ?? index + 1;

          return (
            <tr
              key={standing.standing_id}
              className={`border-t border-[#edf1ef] text-[10px] text-[#3d4c62] ${
                position === 1 ? "bg-[#effaf5]" : "bg-white"
              }`}
            >
              <td className="px-2.5 py-2"><Position value={position} /></td>
              <td className="max-w-[230px] px-2.5 py-2"><TeamLink standing={standing} /></td>
              <td className="px-2 py-2 text-center font-semibold">{standing.played}</td>
              <td className="px-2 py-2 text-center">{standing.wins}</td>
              <td className="px-2 py-2 text-center">{standing.draws}</td>
              <td className="px-2 py-2 text-center">{standing.losses}</td>
              <td className="px-2 py-2 text-center">{standing.goals_for}</td>
              <td className="px-2 py-2 text-center">{standing.goals_against}</td>
              <td className="px-2 py-2 text-center font-semibold">
                {formatGoalDifference(standing.goal_difference)}
              </td>
              <td className="px-2.5 py-2 text-center font-extrabold text-[#10233b]">
                {standing.points}
              </td>
              <td className="px-2.5 py-2"><Form results={standing.form} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default StandingsTable;
