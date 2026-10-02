import PreviewState from "./PreviewState";
import { formatMatchDate, formatMatchTime } from "../utils/homeFormatters";

const MatchDetails = ({ match }) => (
  <>
    <span className="font-bold text-white">{match.home_team?.name}</span>
    <span className="px-2 text-white/35">vs</span>
    <span className="font-bold text-white">{match.away_team?.name}</span>
  </>
);

const UpcomingMatches = ({ section }) => {
  if (section.status !== "success" || section.data.length === 0) {
    return (
      <PreviewState
        status={section.status}
        emptyMessage="No upcoming matches scheduled."
        errorMessage="Upcoming fixtures are unavailable right now."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
        <div className="grid grid-cols-[1fr_1.8fr_1.1fr] gap-6 bg-[#162c42] px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-white/50">
          <span>DATE & TIME</span><span>MATCHUP</span><span>VENUE</span>
        </div>
        {section.data.map((match) => (
          <div key={match.match_id} className="grid grid-cols-[1fr_1.8fr_1.1fr] gap-6 border-t border-white/10 bg-[#0B1D2F] px-5 py-4 text-sm">
            <span className="text-white/60">{formatMatchDate(match.match_date, { year: undefined })}<br />{formatMatchTime(match.start_time)}</span>
            <span><MatchDetails match={match} /></span>
            <span className="text-white/60">{match.venue?.name || "Venue TBC"}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:hidden">
        {section.data.map((match) => (
          <article key={match.match_id} className="rounded-xl border border-white/10 bg-[#0B1D2F] p-4">
            <p className="text-xs text-[#EEC058]">{formatMatchDate(match.match_date, { year: undefined })} · {formatMatchTime(match.start_time)}</p>
            <p className="mt-3 text-sm"><MatchDetails match={match} /></p>
            <p className="mt-3 text-xs text-white/55">{match.venue?.name || "Venue to be confirmed"}</p>
          </article>
        ))}
      </div>
    </>
  );
};

export default UpcomingMatches;
