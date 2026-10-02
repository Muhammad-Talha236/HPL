import { Link } from "react-router-dom";

import MatchScoreboard from "./MatchScoreboard";
import MatchStatusBadge from "./MatchStatusBadge";
import { formatMatchDate, formatMatchTime } from "../utils/matchFormatters";

const MatchCard = ({ match }) => <article className={`rounded-xl border bg-[#0B1D2F] p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 ${match.status === "LIVE" ? "border-[#FF553D]/55" : "border-white/10 hover:border-[#EEC058]/40"}`}><div className="flex flex-wrap items-center justify-between gap-3"><MatchStatusBadge status={match.status} /><p className="text-[10px] font-bold tracking-[0.12em] text-white/45">{match.status === "SCHEDULED" ? `${formatMatchDate(match.match_date, { year: undefined })} · ${formatMatchTime(match.start_time)}` : match.status === "LIVE" ? "LIVE SCORE" : formatMatchDate(match.match_date, { year: undefined })}</p></div><div className="mt-5"><MatchScoreboard match={match} /></div><div className="mt-5 border-t border-white/10 pt-3"><p className="truncate text-xs font-semibold text-[#EEC058]">{match.competition?.name || "Hunza Premier League"}</p><p className="mt-1 truncate text-xs text-white/50">{match.venue?.name || "Venue to be confirmed"}</p></div><Link to={`/matches/${match.match_id}`} className="mt-4 inline-flex text-xs font-extrabold tracking-wide text-[#ffad9f] transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{match.status === "LIVE" ? "VIEW LIVE MATCH" : "VIEW MATCH"} →</Link></article>;

export default MatchCard;
