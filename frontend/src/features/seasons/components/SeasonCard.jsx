import { Link } from "react-router-dom";

import SeasonStatusBadge from "./SeasonStatusBadge";
import { formatSeasonRange } from "../utils/seasonFormatters";

const SeasonCard = ({ season, featured = false }) => (
  <article
    className={`rounded-xl border p-6 shadow-xl ${
      featured
        ? "border-[#EEC058]/35 bg-[linear-gradient(135deg,#17334a,#0B1D2F)]"
        : "border-white/10 bg-[#0B1D2F]"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold tracking-[0.18em] text-[#EEC058]">
          {featured ? "CURRENT CAMPAIGN" : "HPL SEASON"}
        </p>
        <h2 className="mt-3 text-2xl font-extrabold text-white">
          {season.name}
        </h2>
      </div>
      <SeasonStatusBadge status={season.status} />
    </div>

    <p className="mt-4 text-sm font-medium text-white/70">
      {formatSeasonRange(season.start_date, season.end_date)}
    </p>
    {season.description && (
      <p className="mt-4 text-sm leading-6 text-white/55">
        {season.description}
      </p>
    )}
    <Link
      to={`/seasons/${season.season_id}`}
      className="mt-6 inline-flex items-center rounded-md border border-[#FF553D]/50 px-4 py-2 text-xs font-bold tracking-wide text-[#ffad9f] transition hover:bg-[#FF553D] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50"
    >
      VIEW SEASON
    </Link>
  </article>
);

export default SeasonCard;
