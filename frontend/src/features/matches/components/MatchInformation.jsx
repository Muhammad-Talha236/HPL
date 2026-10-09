import { CalendarDays, MapPin, Shield, Trophy, UserRound } from "lucide-react";

import { formatMatchDate, formatMatchTime } from "../utils/matchFormatters";

const Row = ({ icon: Icon, label, value }) => <div className="flex items-start gap-2"><Icon size={13} className="mt-0.5 shrink-0 text-[#087d50]" /><div className="min-w-0"><p className="text-[8px] text-[#7b899a]">{label}</p><p className="truncate text-[9px] font-bold text-[#304057]">{value || "Not assigned"}</p></div></div>;

const MatchInformation = ({ detail }) => (
  <article className="rounded-lg border border-[#e0e8e6] bg-white p-3 shadow-[0_3px_12px_rgba(15,23,42,.02)]">
    <h2 className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#1c2b43]"><Shield size={14} /> Match Information</h2>
    <div className="mt-4 space-y-3"><Row icon={Trophy} label="Competition" value={detail.competition?.name} /><Row icon={Shield} label="Season" value={detail.season?.name} /><Row icon={CalendarDays} label="Date" value={formatMatchDate(detail.match?.match_date)} /><Row icon={CalendarDays} label="Kickoff" value={formatMatchTime(detail.match?.start_time)} /><Row icon={MapPin} label="Stadium" value={detail.venue?.name} /><Row icon={UserRound} label="Referee" value={detail.referee?.name} /></div>
  </article>
);

export default MatchInformation;
