import { formatMatchTime } from "../utils/homeFormatters";

const LiveMatchCard = ({ match, upcomingMatch, status }) => {
  const displayMatch = match || upcomingMatch;
  const isLive = Boolean(match);

  if (status === "loading") {
    return (
      <div className="mt-7 w-full max-w-md rounded-xl border border-white/15 bg-[#081b2d]/90 p-5 text-sm text-white/60 shadow-2xl">
        Checking the latest match status…
      </div>
    );
  }

  if (!displayMatch) {
    return (
      <div className="mt-7 w-full max-w-md rounded-xl border border-white/15 bg-[#081b2d]/90 p-5 shadow-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[#EEC058]">
          MATCH CENTRE
        </p>
        <p className="mt-3 text-lg font-bold text-white">
          No live match right now.
        </p>
        <p className="mt-1 text-sm leading-6 text-white/60">
          Check upcoming fixtures below for the next HPL match.
        </p>
      </div>
    );
  }

  return (
    <article className="mt-7 w-full max-w-md rounded-xl border border-white/15 bg-[#081b2d]/95 p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-[0.14em]">
        <span className={isLive ? "text-[#FF705e]" : "text-[#EEC058]"}>
          {isLive ? "● LIVE NOW" : "NEXT FIXTURE"}
        </span>
        <span className="text-white/50">
          {isLive ? "MATCH IN PROGRESS" : formatMatchTime(displayMatch.start_time)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-bold text-white">
            {displayMatch.home_team?.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-wider text-white/45">HOME</p>
        </div>
        <div className="flex items-center gap-2 text-3xl font-extrabold text-[#ffad9f]">
          <span>{displayMatch.home_score}</span>
          <span className="text-base text-white/35">—</span>
          <span>{displayMatch.away_score}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {displayMatch.away_team?.name}
          </p>
          <p className="mt-1 text-[10px] font-bold tracking-wider text-white/45">AWAY</p>
        </div>
      </div>

      <p className="mt-5 border-t border-white/10 pt-3 text-center text-xs text-white/55">
        {displayMatch.competition?.name || "Hunza Premier League"} · {displayMatch.venue?.name || "Venue TBC"}
      </p>
    </article>
  );
};

export default LiveMatchCard;
