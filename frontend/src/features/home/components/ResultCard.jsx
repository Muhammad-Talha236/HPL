import { formatMatchDate } from "../utils/homeFormatters";

const ResultCard = ({ match }) => (
  <article className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5 shadow-lg">
    <p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">
      {match.competition?.name || "HPL"}
    </p>
    <p className="mt-1 text-xs text-white/45">
      {formatMatchDate(match.match_date)} · FINAL
    </p>
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <span className="truncate text-sm font-bold text-white">{match.home_team?.name}</span>
        <strong className="text-xl text-[#ffad9f]">{match.home_score}</strong>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="truncate text-sm font-bold text-white/65">{match.away_team?.name}</span>
        <strong className="text-xl text-white/65">{match.away_score}</strong>
      </div>
    </div>
    <p className="mt-5 border-t border-white/10 pt-3 text-xs text-white/45">
      {match.venue?.name || "Venue to be confirmed"}
    </p>
  </article>
);

export default ResultCard;
