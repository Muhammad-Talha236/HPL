import PreviewState from "./PreviewState";
import { formatMatchDate } from "../utils/homeFormatters";
import { Link } from "react-router-dom";

const FeaturedCompetition = ({ section }) => {
  if (section.status !== "success" || !section.data) {
    return (
      <PreviewState
        status={section.status}
        emptyMessage="No competition is available to feature yet."
        errorMessage="Competition details are unavailable right now."
      />
    );
  }

  const competition = section.data;

  return (
    <article className="overflow-hidden rounded-xl border border-[#EEC058]/25 bg-[#0B1D2F] md:grid md:grid-cols-[1.2fr_0.8fr]">
      <div className="p-6 sm:p-8">
        <span className="inline-flex rounded-full bg-[#FF553D]/15 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#ffad9f]">
          {competition.status}
        </span>
        <h3 className="mt-4 text-2xl font-extrabold text-white">{competition.name}</h3>
        <p className="mt-2 text-sm text-[#EEC058]">{competition.season?.name || "HPL Season"}</p>
        {competition.description && <p className="mt-5 max-w-xl text-sm leading-6 text-white/60">{competition.description}</p>}
        <Link to={`/competitions/${competition.competition_id}`} className="mt-5 inline-flex text-xs font-extrabold tracking-wide text-[#EEC058] transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">VIEW COMPETITION →</Link>
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-[#EEC058]/15 bg-[#EEC058]/15 md:border-l md:border-t-0">
        <div className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-wider text-white/45">FORMAT</dt><dd className="mt-2 text-sm font-bold text-white">{competition.format || "To be confirmed"}</dd></div>
        <div className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-wider text-white/45">TEAMS</dt><dd className="mt-2 text-sm font-bold text-white">{competition.max_teams || "—"}</dd></div>
        <div className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-wider text-white/45">STARTS</dt><dd className="mt-2 text-sm font-bold text-white">{formatMatchDate(competition.competition_start_date, { year: undefined })}</dd></div>
        <div className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-wider text-white/45">ENDS</dt><dd className="mt-2 text-sm font-bold text-white">{formatMatchDate(competition.competition_end_date, { year: undefined })}</dd></div>
      </dl>
    </article>
  );
};

export default FeaturedCompetition;
