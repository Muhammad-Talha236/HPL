import { Award, ShieldCheck, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { seasonsHeroImage } from "../constants/seasonImages";

const highlights = [
  { icon: Trophy, title: "Champions", text: "Across the years" },
  { icon: Award, title: "Growing Talent", text: "From local communities" },
  { icon: ShieldCheck, title: "Stronger Hunza", text: "Through football" },
];

const SeasonsHero = () => (
  <section
    className="relative overflow-hidden bg-[#071d28] text-white"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(4, 24, 34, .95) 0%, rgba(5, 38, 38, .88) 42%, rgba(7, 29, 40, .43) 100%), url(${seasonsHeroImage})`,
      backgroundPosition: "center 44%",
      backgroundSize: "cover",
    }}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(240,183,65,.16),transparent_30%)]" />
    <div className="relative mx-auto min-h-[300px] max-w-[1200px] px-5 pb-24 pt-5 sm:px-7 sm:pb-28 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-[11px] font-medium text-white/70">
        <Link to="/" className="transition hover:text-white">Home</Link>
        <span className="mx-1.5 text-white/45">/</span>
        <span>Seasons</span>
      </nav>

      <div className="mt-9 max-w-[530px]">
        <p className="text-[10px] font-extrabold tracking-[.18em] text-[#e9bd4d]">HUNZA PREMIER LEAGUE</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">Seasons</h1>
        <p className="mt-2 max-w-[470px] text-[13px] leading-5 text-white/85">Reliving the past, celebrating the present, and building a stronger football future for Hunza.</p>
        <div className="mt-5 grid max-w-[520px] gap-3 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-2">
              <Icon size={24} strokeWidth={1.2} className="mt-0.5 shrink-0 text-[#e9bd4d]" />
              <p className="text-[10px] leading-4 text-white/75"><strong className="block text-[15px] text-white">{title}</strong>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default SeasonsHero;
