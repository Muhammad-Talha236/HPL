import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import CompetitionMatchPreview from "../components/CompetitionMatchPreview";
import CompetitionStandingsPreview from "../components/CompetitionStandingsPreview";
import CompetitionStatusBadge from "../components/CompetitionStatusBadge";
import {
  getCompetitionById,
  getCompetitionRecentResults,
  getCompetitionStandings,
  getCompetitionUpcomingMatches,
} from "../services/competitionService";
import {
  formatCompetitionRange,
  formatLabel,
} from "../utils/competitionFormatters";

const SectionState = ({ state, emptyMessage, errorMessage, children }) => {
  if (state.status === "loading") return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">Loading…</div>;
  if (state.status === "error") return <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-6 text-sm text-red-100">{errorMessage}</div>;
  if (!state.data?.length) return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">{emptyMessage}</div>;
  return children;
};

const CompetitionDetailsPage = () => {
  const { competitionId } = useParams();
  const [competitionState, setCompetitionState] = useState({ data: null, status: "loading" });
  const [standingsState, setStandingsState] = useState({ data: [], status: "loading" });
  const [resultsState, setResultsState] = useState({ data: [], status: "loading" });
  const [fixturesState, setFixturesState] = useState({ data: [], status: "loading" });

  useEffect(() => {
    let isCurrent = true;
    const setSection = (setter, value) => { if (isCurrent) setter(value); };

    const loadCompetition = async () => {
      try {
        const competition = await getCompetitionById(competitionId);
        setSection(setCompetitionState, { data: competition, status: "success" });
      } catch (error) {
        setSection(setCompetitionState, { data: null, status: error.response?.status === 404 || error.response?.status === 400 ? "notFound" : "error" });
        return;
      }

      const [standings, results, fixtures] = await Promise.allSettled([
        getCompetitionStandings(competitionId),
        getCompetitionRecentResults(competitionId),
        getCompetitionUpcomingMatches(competitionId),
      ]);

      setSection(setStandingsState, standings.status === "fulfilled" ? { data: standings.value.slice(0, 5), status: "success" } : { data: [], status: "error" });
      setSection(setResultsState, results.status === "fulfilled" ? { data: results.value, status: "success" } : { data: [], status: "error" });
      setSection(setFixturesState, fixtures.status === "fulfilled" ? { data: fixtures.value, status: "success" } : { data: [], status: "error" });
    };

    loadCompetition();
    return () => { isCurrent = false; };
  }, [competitionId]);

  if (competitionState.status === "loading") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">Loading competition details…</div></main>;
  if (competitionState.status === "notFound" || competitionState.status === "error") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8"><h1 className="text-2xl font-extrabold">Competition unavailable</h1><p className="mt-3 text-sm text-white/60">{competitionState.status === "notFound" ? "Competition not found." : "Competition details are unavailable right now."}</p><Link to="/competitions" className="mt-6 inline-flex text-sm font-bold text-[#EEC058] hover:text-[#ffad9f]">← BACK TO COMPETITIONS</Link></div></main>;

  const competition = competitionState.data;
  const overview = [["FORMAT", formatLabel(competition.format)], ["DIVISION", formatLabel(competition.gender)], ["COMPETITION DATES", formatCompetitionRange(competition.competition_start_date, competition.competition_end_date)], ["REGISTRATION WINDOW", formatCompetitionRange(competition.registration_start_date, competition.registration_end_date)], ["SQUAD SIZE", competition.squad_size ? `${competition.squad_size} players` : null], ["MAXIMUM TEAMS", competition.max_teams ? `${competition.max_teams} teams` : null]];

  return <main className="min-h-screen bg-[#011427] pb-20 pt-32 text-white"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><Link to="/competitions" className="text-xs font-bold tracking-wide text-[#EEC058] transition hover:text-[#ffad9f]">← ALL COMPETITIONS</Link><section className="relative mt-6 overflow-hidden rounded-xl border border-[#EEC058]/25 bg-[linear-gradient(125deg,#17334a,#0B1D2F_60%,#07192a)] p-6 sm:p-10"><div className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 rounded-full border-[28px] border-[#FF553D]/10" aria-hidden="true" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div><p className="text-[11px] font-bold tracking-[0.2em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p><h1 className="mt-3 max-w-4xl text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">{competition.name}</h1>{competition.season && <Link to={`/seasons/${competition.season_id}`} className="mt-4 inline-flex text-sm font-bold text-[#ffad9f] transition hover:text-[#EEC058] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">{competition.season.name} season →</Link>}</div><CompetitionStatusBadge status={competition.status} /></div>{competition.description && <p className="relative mt-7 max-w-3xl text-sm leading-7 text-white/65">{competition.description}</p>}</section><section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">COMPETITION OVERVIEW</p><h2 className="mt-3 text-2xl font-extrabold">Competition information</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{overview.filter(([, value]) => value).map(([label, value]) => <div key={label} className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-[0.14em] text-white/45">{label}</dt><dd className="mt-2 text-sm font-semibold text-white">{value}</dd></div>)}</dl></section><section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">STANDINGS PREVIEW</p><h2 className="mt-3 text-2xl font-extrabold">League table</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7"><SectionState state={standingsState} emptyMessage="No standings are available for this competition yet." errorMessage="Standings are unavailable right now."><CompetitionStandingsPreview standings={standingsState.data} /></SectionState></div></section><div className="mt-16 grid gap-12 lg:grid-cols-2"><section><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">RECENT RESULTS</p><h2 className="mt-3 text-2xl font-extrabold">Completed matches</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7 space-y-4"><SectionState state={resultsState} emptyMessage="No completed matches are available yet." errorMessage="Recent results are unavailable right now.">{resultsState.data.map((match) => <CompetitionMatchPreview key={match.match_id} match={match} type="result" />)}</SectionState></div></section><section><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">UPCOMING FIXTURES</p><h2 className="mt-3 text-2xl font-extrabold">Next matches</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7 space-y-4"><SectionState state={fixturesState} emptyMessage="No upcoming fixtures are scheduled." errorMessage="Upcoming fixtures are unavailable right now.">{fixturesState.data.map((match) => <CompetitionMatchPreview key={match.match_id} match={match} type="fixture" />)}</SectionState></div></section></div></div></main>;
};

export default CompetitionDetailsPage;
