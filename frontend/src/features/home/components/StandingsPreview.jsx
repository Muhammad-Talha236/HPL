import PreviewState from "./PreviewState";

const StandingsPreview = ({ section }) => {
  if (section.status !== "success" || section.data.length === 0) {
    return (
      <PreviewState
        status={section.status}
        emptyMessage="Standings are not available yet."
        errorMessage="Standings are unavailable right now."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-[640px] w-full border-collapse text-left text-sm">
        <thead className="bg-[#162c42] text-[10px] font-bold tracking-[0.14em] text-white/50">
          <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">TEAM</th><th className="px-3 py-3 text-center">P</th><th className="px-3 py-3 text-center">W</th><th className="px-3 py-3 text-center">D</th><th className="px-3 py-3 text-center">L</th><th className="px-3 py-3 text-center">GD</th><th className="px-4 py-3 text-center">PTS</th></tr>
        </thead>
        <tbody className="bg-[#0B1D2F]">
          {section.data.map((standing, index) => (
            <tr key={standing.standing_id} className="border-t border-white/10 text-white/70">
              <td className="px-4 py-3 font-bold text-[#EEC058]">{standing.position || index + 1}</td>
              <td className="px-4 py-3 font-bold text-white">{standing.team?.name}</td>
              <td className="px-3 py-3 text-center">{standing.played}</td><td className="px-3 py-3 text-center">{standing.wins}</td><td className="px-3 py-3 text-center">{standing.draws}</td><td className="px-3 py-3 text-center">{standing.losses}</td><td className="px-3 py-3 text-center">{standing.goal_difference > 0 ? "+" : ""}{standing.goal_difference}</td><td className="px-4 py-3 text-center font-extrabold text-white">{standing.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsPreview;
