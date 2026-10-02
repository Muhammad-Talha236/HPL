import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import MatchCard from "../components/MatchCard";
import MatchCardSkeleton from "../components/MatchCardSkeleton";
import { getCompetitionsForMatches, getMatches } from "../services/matchService";

const statusTabs = [{ label: "ALL", value: "" }, { label: "LIVE", value: "LIVE" }, { label: "UPCOMING", value: "SCHEDULED" }, { label: "RESULTS", value: "COMPLETED" }];
const queryStatusMap = { live: "LIVE", upcoming: "SCHEDULED", results: "COMPLETED" };
const statusQueryMap = { LIVE: "live", SCHEDULED: "upcoming", COMPLETED: "results" };

const MatchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [matchesState, setMatchesState] = useState({ data: [], status: "loading" });
  const [competitionsState, setCompetitionsState] = useState({ data: [], status: "loading" });
  const selectedStatus = queryStatusMap[searchParams.get("status")] || "";
  const selectedCompetition = searchParams.get("competition") || "";

  const updateFilters = (nextStatus, nextCompetition) => {
    const nextParams = new URLSearchParams();
    if (nextStatus) nextParams.set("status", statusQueryMap[nextStatus]);
    if (nextCompetition) nextParams.set("competition", nextCompetition);
    setSearchParams(nextParams);
  };

  const loadMatches = async (showLoading = true) => {
    if (showLoading) setMatchesState((previous) => ({ ...previous, status: "loading" }));
    try { const result = await getMatches({ ...(selectedStatus && { status: selectedStatus }), ...(selectedCompetition && { competition_id: selectedCompetition }) }); setMatchesState({ data: result.matches || [], status: "success" }); } catch { setMatchesState({ data: [], status: "error" }); }
  };

  useEffect(() => { let isCurrent = true; const load = async () => { try { const result = await getMatches({ ...(selectedStatus && { status: selectedStatus }), ...(selectedCompetition && { competition_id: selectedCompetition }) }); if (isCurrent) setMatchesState({ data: result.matches || [], status: "success" }); } catch { if (isCurrent) setMatchesState({ data: [], status: "error" }); } }; load(); return () => { isCurrent = false; }; }, [selectedCompetition, selectedStatus]);
  useEffect(() => { let isCurrent = true; const load = async () => { try { const competitions = await getCompetitionsForMatches(); if (isCurrent) setCompetitionsState({ data: competitions, status: "success" }); } catch { if (isCurrent) setCompetitionsState({ data: [], status: "error" }); } }; load(); return () => { isCurrent = false; }; }, []);

  const liveMatches = useMemo(() => matchesState.data.filter((match) => match.status === "LIVE"), [matchesState.data]);
  const regularMatches = useMemo(() => matchesState.data.filter((match) => match.status !== "LIVE"), [matchesState.data]);

  return <main className="min-h-screen bg-[#011427] pb-20 pt-20 text-white"><section className="border-b border-white/10 bg-[linear-gradient(135deg,#07192a,#10283d_55%,#011427)]"><div className="mx-auto max-w-7xl px-5 py-11 sm:px-6 sm:py-14 lg:px-8"><p className="text-[11px] font-bold tracking-[0.22em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p><h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-[#ffad9f] sm:text-5xl">FIXTURES &amp; RESULTS</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Follow upcoming fixtures, live action and completed HPL matches.</p></div></section><section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8" aria-labelledby="matches-directory-heading"><h2 id="matches-directory-heading" className="sr-only">Matches directory</h2><div className="flex flex-col gap-4 border-b border-white/10 pb-6"><div className="flex gap-2 overflow-x-auto pb-1" aria-label="Match status filters">{statusTabs.map((tab) => <button key={tab.label} type="button" onClick={() => updateFilters(tab.value, selectedCompetition)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold tracking-wide transition focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60 ${selectedStatus === tab.value ? "bg-[#FF553D] text-white" : "border border-white/15 text-white/60 hover:border-[#EEC058]/50 hover:text-[#EEC058]"}`}>{tab.label}</button>)}</div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label htmlFor="match-competition" className="sr-only">Filter by competition</label><select id="match-competition" value={selectedCompetition} onChange={(event) => updateFilters(selectedStatus, event.target.value)} className="h-11 rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30"><option value="">All competitions</option>{competitionsState.data.map((competition) => <option key={competition.competition_id} value={competition.competition_id}>{competition.name}</option>)}</select><p className="text-xs font-bold tracking-[0.14em] text-white/50 sm:ml-auto">{matchesState.status === "success" ? `${matchesState.data.length} MATCHES` : "MATCHES"}</p></div></div>{matchesState.status === "loading" && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <MatchCardSkeleton key={index} />)}</div>}{matchesState.status === "error" && <div role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-6"><p className="text-sm text-red-100">Unable to load matches right now.</p><button type="button" onClick={() => loadMatches()} className="mt-4 rounded-md border border-red-200/30 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-200/10 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">TRY AGAIN</button></div>}{matchesState.status === "success" && liveMatches.length > 0 && <section className="mt-8" aria-labelledby="live-now-heading"><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#FF553D]" aria-hidden="true" /><h2 id="live-now-heading" className="text-xl font-extrabold text-white">LIVE NOW</h2></div><div className="mt-4 grid gap-4 md:grid-cols-2">{liveMatches.map((match) => <MatchCard key={match.match_id} match={match} />)}</div></section>}{matchesState.status === "success" && regularMatches.length === 0 && liveMatches.length === 0 && <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">No matches are available for these filters.</div>}{matchesState.status === "success" && regularMatches.length > 0 && <section className="mt-8" aria-labelledby="matches-list-heading"><h2 id="matches-list-heading" className="text-xl font-extrabold text-white">{selectedStatus === "SCHEDULED" ? "UPCOMING FIXTURES" : selectedStatus === "COMPLETED" ? "COMPLETED RESULTS" : "ALL MATCHES"}</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{regularMatches.map((match) => <MatchCard key={match.match_id} match={match} />)}</div></section>}</section></main>;
};

export default MatchesPage;
