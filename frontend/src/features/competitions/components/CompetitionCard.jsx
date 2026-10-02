import { Link } from "react-router-dom";

import CompetitionStatusBadge from "./CompetitionStatusBadge";
import { formatCompetitionRange, formatLabel } from "../utils/competitionFormatters";

const CompetitionCard = ({ competition }) => (
  <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0B1D2F] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#EEC058]/45 hover:shadow-xl hover:shadow-black/20">
    <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full border-[18px] border-[#FF553D]/10" aria-hidden="true" />
    <div className="relative flex items-start justify-between gap-4"><p className="text-[10px] font-bold tracking-[0.18em] text-[#EEC058]">HPL COMPETITION</p><CompetitionStatusBadge status={competition.status} /></div>
    <h2 className="relative mt-4 text-xl font-extrabold uppercase tracking-tight text-white">{competition.name}</h2>
    {competition.season && <Link to={`/seasons/${competition.season_id}`} className="relative mt-2 inline-flex text-sm font-semibold text-[#ffad9f] transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{competition.season.name}</Link>}
    <div className="relative mt-5 border-t border-white/10 pt-4"><p className="text-xs font-bold tracking-wide text-white/65">{formatLabel(competition.format)}</p><p className="mt-2 text-xs leading-5 text-white/45">{formatCompetitionRange(competition.competition_start_date, competition.competition_end_date)}</p></div>
    <Link to={`/competitions/${competition.competition_id}`} className="relative mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[#EEC058]/75 px-3 text-xs font-extrabold tracking-wide text-[#EEC058] transition-colors hover:bg-[#EEC058] hover:text-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">VIEW COMPETITION <span className="ml-2" aria-hidden="true">→</span></Link>
  </article>
);

export default CompetitionCard;
