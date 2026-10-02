import { formatMatchStatus } from "../utils/matchFormatters";

const MatchStatusBadge = ({ status }) => {
  const styles = { LIVE: "bg-[#FF553D]/20 text-[#ffad9f]", SCHEDULED: "bg-[#EEC058]/10 text-[#EEC058]", COMPLETED: "bg-emerald-400/10 text-emerald-300", POSTPONED: "bg-amber-400/10 text-amber-200", CANCELLED: "bg-white/10 text-white/55" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] ${styles[status] || "bg-white/10 text-white/55"}`}>{status === "LIVE" && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}{formatMatchStatus(status)}</span>;
};

export default MatchStatusBadge;
