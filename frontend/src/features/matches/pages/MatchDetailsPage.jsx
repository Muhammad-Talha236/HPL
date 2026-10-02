import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import MatchLineups from "../components/MatchLineups";
import MatchScoreboard from "../components/MatchScoreboard";
import MatchStatusBadge from "../components/MatchStatusBadge";
import MatchTimeline from "../components/MatchTimeline";
import { getMatchById } from "../services/matchService";
import { formatMatchDate, formatMatchTime } from "../utils/matchFormatters";

const MatchDetailsPage = () => {
  const { matchId } = useParams();
  const [state, setState] = useState({ data: null, status: "loading" });

  useEffect(() => { let isCurrent = true; const load = async () => { try { const match = await getMatchById(matchId); if (isCurrent) setState({ data: match, status: "success" }); } catch (error) { if (isCurrent) setState({ data: null, status: error.response?.status === 404 || error.response?.status === 400 ? "notFound" : "error" }); } }; load(); return () => { isCurrent = false; }; }, [matchId]);

  if (state.status === "loading") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">Loading match details…</div></main>;
  if (state.status === "notFound" || state.status === "error") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8"><h1 className="text-2xl font-extrabold">Match unavailable</h1><p className="mt-3 text-sm text-white/60">{state.status === "notFound" ? "The requested match could not be found." : "Match details are unavailable right now."}</p><Link to="/matches" className="mt-6 inline-flex text-sm font-bold text-[#EEC058] hover:text-[#ffad9f]">← BACK TO MATCHES</Link></div></main>;

  const detail = state.data;
  const match = { ...detail.match, home_team: detail.home_team, away_team: detail.away_team };
  const hasLineups = detail.squads?.home?.total || detail.squads?.away?.total;

  return <main className="min-h-screen bg-[#011427] pb-20 pt-32 text-white"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><Link to="/matches" className="text-xs font-bold tracking-wide text-[#EEC058] transition hover:text-[#ffad9f]">← ALL MATCHES</Link><section className={`mt-6 overflow-hidden rounded-xl border bg-[linear-gradient(125deg,#17334a,#0B1D2F_60%,#07192a)] p-6 sm:p-10 ${match.status === "LIVE" ? "border-[#FF553D]/60" : "border-[#EEC058]/25"}`}><div className="flex flex-wrap items-start justify-between gap-4"><div>{detail.competition && <Link to={`/competitions/${match.competition_id}`} className="text-[11px] font-bold tracking-[0.2em] text-[#EEC058] transition hover:text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{detail.competition.name}</Link>}{detail.season && <Link to={`/seasons/${match.season_id}`} className="ml-3 text-[11px] font-bold tracking-[0.15em] text-white/45 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{detail.season.name}</Link>}</div><MatchStatusBadge status={match.status} /></div><div className="mt-8"><MatchScoreboard match={match} size="hero" /></div><p className="mt-8 text-center text-sm text-white/60">{formatMatchDate(match.match_date)} · {formatMatchTime(match.start_time)}{match.status === "LIVE" ? " · Live score updates are subject to official match updates." : ""}</p></section><section className="mt-12 grid gap-4 sm:grid-cols-2"><article className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">VENUE</p><p className="mt-3 text-base font-extrabold text-white">{detail.venue?.name || "Venue to be confirmed"}</p>{detail.venue?.city && <p className="mt-1 text-sm text-white/55">{detail.venue.city}</p>}</article>{detail.referee && <article className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">MATCH OFFICIAL</p><p className="mt-3 text-base font-extrabold text-white">{detail.referee.name}</p><p className="mt-1 text-sm text-white/55">Assigned referee</p></article>}</section>{detail.events?.all?.length > 0 && <section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">MATCH EVENTS</p><h2 className="mt-3 text-2xl font-extrabold">Timeline</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7 max-w-3xl"><MatchTimeline events={detail.events.all} /></div></section>}{hasLineups ? <section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">MATCH SQUADS</p><h2 className="mt-3 text-2xl font-extrabold">Lineups</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7"><MatchLineups squads={detail.squads} /></div></section> : null}</div></main>;
};

export default MatchDetailsPage;
