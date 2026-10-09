import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

import { getSeasonImage, seasonImageFallback } from "../constants/seasonImages";
import SeasonStatusBadge from "./SeasonStatusBadge";
import { formatSeasonRange } from "../utils/seasonFormatters";

const SeasonCard = ({ season }) => (
  <Link
    to={`/seasons/${season.season_id}`}
    className="group block overflow-hidden rounded-lg border border-[#dfe9e4] bg-white shadow-[0_6px_20px_rgba(24,53,48,.055)] transition hover:-translate-y-0.5 hover:border-[#bcd9cc] hover:shadow-[0_10px_25px_rgba(24,53,48,.11)] focus:outline-none focus:ring-2 focus:ring-[#139d65]/35"
    aria-label={`View ${season.name}`}
  >
    <article>
      <div className="relative h-28 overflow-hidden bg-[#dce8e6]">
        <img src={getSeasonImage(season.season_id)} onError={(event) => { event.currentTarget.src = seasonImageFallback; }} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute right-2 top-2"><SeasonStatusBadge status={season.status} /></span>
      </div>
      <div className="p-3">
        <h3 className="truncate text-[13px] font-extrabold text-[#1a2a40]">{season.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-[#758297]"><CalendarDays size={11} /> {formatSeasonRange(season.start_date, season.end_date)}</p>
        <span className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#dcf4e6] text-[#108b59] transition group-hover:bg-[#109a62] group-hover:text-white"><ArrowRight size={13} /></span>
      </div>
    </article>
  </Link>
);

export default SeasonCard;
