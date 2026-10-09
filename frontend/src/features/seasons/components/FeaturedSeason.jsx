import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

import { featuredSeasonImage, seasonImageFallback } from "../constants/seasonImages";
import { formatSeasonRange } from "../utils/seasonFormatters";

const FeaturedSeason = ({ season }) => {
  if (!season) {
    return <section className="rounded-lg border border-[#dfe9e4] bg-white p-5 shadow-[0_10px_30px_rgba(20,48,43,.07)]"><p className="text-sm font-bold text-[#16263b]">No active season right now</p><p className="mt-1 text-xs text-[#66768a]">Please explore the completed HPL seasons below.</p></section>;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#1e7356]/30 bg-[#004b32] shadow-[0_12px_34px_rgba(9,61,49,.18)]">
      <div className="grid md:grid-cols-2">
        <div className="p-6 text-white sm:p-7">
          <span className="inline-flex rounded-md bg-[#19a86b] px-2 py-1 text-[9px] font-extrabold text-white">Ongoing Season</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em]">{season.name}</h2>
          {season.description && <p className="mt-3 max-w-md text-[12px] leading-5 text-white/78">{season.description}</p>}
          <div className="mt-5 flex items-center gap-2 text-[11px] text-white/78"><CalendarDays size={14} className="text-[#d5ed81]" /><span>{formatSeasonRange(season.start_date, season.end_date)}</span></div>
          <Link to={`/seasons/${season.season_id}`} className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-[11px] font-extrabold text-[#09523c] transition hover:bg-[#edf8f2] focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#004b32]">View Season <ArrowRight size={14} /></Link>
        </div>
        <div className="min-h-[220px] bg-[#173f46]"><img src={featuredSeasonImage} onError={(event) => { event.currentTarget.src = seasonImageFallback; }} alt="Football stadium in the mountains" className="h-full w-full object-cover" /></div>
      </div>
    </section>
  );
};

export default FeaturedSeason;
