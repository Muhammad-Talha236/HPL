import { CalendarDays, Radio, Trophy } from "lucide-react";

const tabs = [
  { key: "all", label: "All Matches", icon: Trophy },
  { key: "live", label: "Live Matches", icon: Radio },
  { key: "upcoming", label: "Upcoming Matches", icon: CalendarDays },
  { key: "recent", label: "Recent Matches", icon: Trophy },
];

const MatchCategoryTabs = ({ value, counts, onChange }) => (
  <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#dfe8e5] bg-white p-1 sm:grid-cols-4" role="tablist" aria-label="Match category">
    {tabs.map(({ key, label, icon: Icon }) => (
      <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)} className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-button transition focus:outline-none focus:ring-2 focus:ring-[#087d50]/25 ${value === key ? "bg-[#087d50] text-white shadow-sm" : "text-[#5d6d80] hover:bg-[#f2f7f5]"}`}>
        <Icon size={14} /> {label}<span className={`rounded px-1.5 py-0.5 text-meta ${value === key ? "bg-white/20" : "bg-[#edf2f1] text-[#66778b]"}`}>{counts[key]}</span>
      </button>
    ))}
  </div>
);

export default MatchCategoryTabs;
