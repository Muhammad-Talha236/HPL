import { CalendarDays, MapPin, Shield, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import seasonHeroImage from "../../../../assets/hunza-football-hero-alt.png";
import { formatSeasonRange } from "../../utils/seasonFormatters";

const HeroMeta = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2 text-[10px] text-white/85">
    <Icon size={14} className="shrink-0 text-[#b6ecce]" />
    <span><strong className="mr-1 text-[11px] text-white">{value}</strong>{label}</span>
  </div>
);

const SeasonDetailsHero = ({ season, metrics }) => (
  <section
    className="relative min-h-[236px] overflow-hidden bg-[#071d2d] text-white sm:min-h-[258px]"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(2, 21, 35, .93) 0%, rgba(2, 29, 37, .84) 48%, rgba(4, 24, 34, .37) 100%), url(${seasonHeroImage})`,
      backgroundPosition: "center 47%",
      backgroundSize: "cover",
    }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_52%,rgba(229,170,47,.24),transparent_23%)]" />
    <div className="relative mx-auto max-w-[1200px] px-5 pb-10 pt-4 sm:px-7 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-[9px] font-medium text-white/65"><Link to="/" className="hover:text-white">Home</Link><span className="mx-1.5">/</span><Link to="/seasons" className="hover:text-white">Seasons</Link><span className="mx-1.5">/</span><span>{season.name}</span></nav>
      <div className="mt-6 max-w-xl">
        {season.status === "ACTIVE" && <span className="rounded bg-[#12a568] px-2 py-1 text-[9px] font-extrabold">Ongoing</span>}
        <h1 className="mt-2 text-[34px] font-extrabold leading-none tracking-[-.045em] sm:text-[40px]">{season.name}</h1>
        {season.description && <p className="mt-2 max-w-md text-[11px] leading-4 text-white/76">{season.description}</p>}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/20 pt-4">
          <HeroMeta icon={CalendarDays} value={formatSeasonRange(season.start_date, season.end_date)} label="" />
          <HeroMeta icon={Shield} value={metrics.teamCount} label="Teams" />
          <HeroMeta icon={Trophy} value={metrics.totalMatches} label="Matches" />
          <HeroMeta icon={MapPin} value={metrics.venueCount} label="Venues" />
        </div>
      </div>
    </div>
  </section>
);

export default SeasonDetailsHero;
