import { ArrowRight, MapPin, Trophy, UserRound, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import { aboutHplAssets } from "../constants/aboutHplAssets";

const stats = [
  { key: "teams", label: "Teams", icon: UsersRound },
  { key: "players", label: "Players", icon: UserRound },
  { key: "seasons", label: "Seasons", icon: Trophy },
  { key: "venues", label: "Venues", icon: MapPin },
];

const formatCount = (value, status) => {
  if (status === "loading") return "…";
  return Number.isInteger(value) ? value.toLocaleString() : "—";
};

const AboutHPLSection = ({ statistics, hasLiveMatch = false }) => {
  const status = statistics?.status || "loading";
  const values = statistics?.data || {};

  return (
    <section id="about-hpl" className={`scroll-mt-24 overflow-hidden bg-[#fbfcfc] px-5 pb-14 text-[#101828] sm:px-6 sm:pb-16 lg:px-8 lg:pb-20 ${hasLiveMatch ? "pt-[125px] sm:pt-[135px] lg:pt-[150px]" : "pt-14 sm:pt-16 lg:pt-20"}`}>
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 xl:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] xl:gap-14">
        <div className="max-w-[570px]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-[.13em] text-[#087554]">About HPL</span>
            <span aria-hidden="true" className="h-px w-16 bg-[#8ec9b4]" />
          </div>

          <h2 className="mt-4 text-[34px] font-extrabold leading-[1.12] tracking-[-.045em] text-[#081a42] sm:text-[42px] lg:text-[46px]">
            Football for a Stronger <span className="block text-[#087554]">Hunza</span>
          </h2>

          <div className="mt-5 space-y-3 text-base leading-[1.55] text-[#53617c]">
            <p>Hunza Premier League (HPL) is a regional football platform dedicated to promoting local talent, strengthening community engagement, and building a stronger, healthier, and more united Hunza through the power of football.</p>
            <p>We bring together teams, players, and fans from across Hunza and surrounding regions to create competitive opportunities, nurture young talent, and celebrate the spirit of the game.</p>
          </div>

          <div aria-live="polite" className="mt-7 grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-[#dce7e2]">
            {stats.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex flex-col items-center text-center sm:px-3 first:sm:pl-0 last:sm:pr-0">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f7f0] text-[#087554]"><Icon size={20} strokeWidth={2.25} /></span>
                <strong className="mt-2 text-xl font-extrabold leading-none text-[#0b1741]">{formatCount(values[key], status)}</strong>
                <span className="mt-1 text-sm text-[#65718a]">{label}</span>
              </div>
            ))}
          </div>

          <Link to="/about" className="mt-7 inline-flex items-center justify-center gap-3 rounded-md bg-[#087554] px-5 py-3 text-button text-white shadow-[0_7px_18px_rgba(8,117,84,.18)] transition hover:-translate-y-0.5 hover:bg-[#066247] focus:outline-none focus:ring-2 focus:ring-[#087554]/30 focus:ring-offset-2">
            Learn More About HPL <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid min-h-[370px] grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)] gap-3 sm:min-h-[430px]">
          <img src={aboutHplAssets.footballGround} alt="Football played beneath the mountains of Hunza" className="h-full w-full rounded-xl object-cover object-center" />
          <div className="grid min-h-0 grid-rows-2 gap-3">
            <div className="relative grid min-h-0 place-items-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0a4a3a,#0c7051)] p-5">
              <div aria-hidden="true" className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[18px] border-white/10" />
              <img src={aboutHplAssets.hplLogo} alt="Hunza Premier League logo" className="relative z-10 h-auto max-h-[82%] w-[78%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,.2)]" />
            </div>
            <img src={aboutHplAssets.footballScene} alt="Football and mountain landscape" className="h-full min-h-0 w-full rounded-xl object-cover object-[64%_center]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHPLSection;
