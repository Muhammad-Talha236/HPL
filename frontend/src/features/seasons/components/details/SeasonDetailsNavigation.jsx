import {
  CalendarDays,
  MapPin,
  Shield,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";

const items = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "standings", label: "Standings", icon: Trophy },
  { id: "fixtures", label: "Fixtures", icon: CalendarDays },
  { id: "teams", label: "Teams", icon: UsersRound },
  { id: "players", label: "Top Players", icon: Star },
  { id: "venues", label: "Venues", icon: MapPin },
];

const SeasonDetailsNavigation = ({ activeSection, onChange, onHighlights }) => (
  <nav
    aria-label="Season sections"
    className="inline-flex max-w-full items-center overflow-x-auto rounded-[14px] border border-white/10 bg-[#061d29]/95 p-[5px] shadow-[0_10px_28px_rgba(4,24,35,.20)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <div className="flex min-w-max items-center gap-1">
      {items.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-[9px] px-4 text-[11px] font-semibold transition-all duration-200 sm:px-5 focus:outline-none focus:ring-2 focus:ring-[#efb83f]/40 ${
              active
                ? "bg-[#efb83f] text-[#07182d] shadow-[0_4px_12px_rgba(229,169,47,.30)]"
                : "text-white/80 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <Icon size={14} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
      {onHighlights && (
        <button
          type="button"
          onClick={onHighlights}
          className="ml-1 inline-flex h-[42px] items-center justify-center gap-2 rounded-[9px] border border-white/15 px-4 text-[11px] font-semibold text-white/90 transition hover:bg-white/[0.07] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#efb83f]/40 sm:px-5"
        >
          <Star size={14} strokeWidth={1.8} />
          Season Highlights
        </button>
      )}
    </div>
  </nav>
);

export default SeasonDetailsNavigation;
