import { CalendarDays, MapPin, Shield, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { completedSeasonHeroImage } from "../../constants/seasonImages";
import { getSeasonTeamLogo } from "../../utils/seasonTeamLogo";
import { formatSeasonRange } from "../../utils/seasonFormatters";

const HeroMeta = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2 text-[10px] text-white/85"><Icon size={14} className="text-[#f1c65c]" /><span><strong className="mr-1 text-[11px] text-white">{value}</strong>{label}</span></div>
);

const CompletedSeasonHero = ({ season, metrics, champion }) => (
  <section
    className="relative min-h-[250px] overflow-hidden bg-[#091725] text-white sm:min-h-[270px]"
    style={{ backgroundImage: `linear-gradient(90deg,rgba(3,15,25,.94) 0%,rgba(4,18,28,.84) 47%,rgba(3,14,24,.40) 100%),url(${completedSeasonHeroImage})`, backgroundPosition: "center", backgroundSize: "cover" }}
  >
    <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_15%_15%,#f1c65c_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_30%,#e6a83c_0_1px,transparent_1.5px),radial-gradient(circle_at_88%_65%,#f5d978_0_1px,transparent_1.5px)] [background-size:43px_37px,61px_55px,79px_69px]" />
    <div className="relative mx-auto flex min-h-[250px] max-w-[1200px] items-stretch justify-between px-5 pb-9 pt-4 sm:min-h-[270px] sm:px-7 lg:px-8">
      <div className="max-w-xl"><nav aria-label="Breadcrumb" className="text-[9px] font-medium text-white/65"><Link to="/" className="hover:text-white">Home</Link><span className="mx-1.5">/</span><Link to="/seasons" className="hover:text-white">Seasons</Link><span className="mx-1.5">/</span><span>{season.name}</span></nav><div className="mt-6"><span className="rounded bg-[#e9eef3] px-2 py-1 text-[9px] font-extrabold text-[#2b3d54]">Completed</span><h1 className="mt-2 text-[34px] font-extrabold leading-none tracking-[-.045em] sm:text-[40px]">{season.name}</h1><div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/20 pt-4"><HeroMeta icon={CalendarDays} value={formatSeasonRange(season.start_date, season.end_date)} label="" /><HeroMeta icon={Shield} value={metrics.teamCount} label="Teams" /><HeroMeta icon={Trophy} value={metrics.totalMatches} label="Matches" /><HeroMeta icon={MapPin} value={metrics.venueCount} label="Venues" /></div></div></div>
      {champion && <Link to={`/teams/${champion.team_id}`} className="relative hidden w-[225px] items-center justify-center self-stretch text-center sm:flex"><div className="absolute inset-0 bg-[radial-gradient(circle,rgba(237,186,59,.24),transparent_65%)]" /><div className="relative"><Trophy size={47} className="mx-auto text-[#f0c452] drop-shadow-[0_4px_12px_rgba(237,186,59,.45)]" /><img src={getSeasonTeamLogo(champion.team)} alt="" className="mx-auto mt-2 h-12 w-12 object-contain" /><p className="mt-2 text-[10px] font-extrabold tracking-[.12em] text-[#f0c452]">CHAMPIONS</p><p className="mt-1 text-sm font-extrabold text-white">{champion.team?.name}</p></div></Link>}
    </div>
  </section>
);

export default CompletedSeasonHero;
