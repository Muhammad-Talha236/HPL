import CompetitionDiscovery from "../../competitions/components/CompetitionDiscovery";
import { listApplications } from "../../registrations/services/workflowService";
import useAuth from "../../../hooks/useAuth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getCompetitionStandings } from "../../competitions/services/competitionService";
import { getMatches } from "../../matches/services/matchService";
import CompletedSeasonDetails from "../components/details/CompletedSeasonDetails";
import SeasonDetailsHero from "../components/details/SeasonDetailsHero";
import SeasonDetailsNavigation from "../components/details/SeasonDetailsNavigation";
import {
  SeasonFixtures,
  SeasonNextMatch,
  SeasonProgress,
  SeasonRecentResults,
  SeasonStandings,
  SeasonTeams,
  SeasonTopPlayers,
  SeasonVenues,
} from "../components/details/SeasonOverview";
import { getSeasonById, getSeasonCompetitions } from "../services/seasonService";
import MediaGallery from "../../media/components/MediaGallery";

const matchMoment = (match) => `${match.match_date || ""}T${String(match.start_time || "00:00").slice(11, 19)}`;

const SeasonDetailsPage = () => {
  const { seasonId } = useParams();
  const { isAuthenticated } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const loadVersion = useRef(0);
  const [registrations, setRegistrations] = useState([]);
  useEffect(() => { let live = true; if (isAuthenticated) listApplications({ limit: 50 }).then(x => live && setRegistrations(x.items)).catch(() => {}); return () => { live = false; }; }, [isAuthenticated]);
  const [activeSection, setActiveSection] = useState("overview");
  const [state, setState] = useState({ status: "loading", season: null, competitions: [], matches: [], standings: [] });

  const loadSeason = useCallback(async (showLoading = false, isCurrent = () => true) => {
    const version = ++loadVersion.current;
    if (showLoading) setState((current) => ({ ...current, status: "loading" }));

    try {
      const [season, competitions, matchData] = await Promise.all([
        getSeasonById(seasonId),
        getSeasonCompetitions(seasonId),
        selectedId ? getMatches({ competition_id: selectedId, limit: 100 }) : Promise.resolve({ matches: [] }),
      ]);
      if (version !== loadVersion.current || !isCurrent()) return;
      if (selectedId && !competitions.some(c => c.competition_id === selectedId)) { setSelectedId(null); return; }
      const matches = matchData.matches || [];
      const selectedCompetition = competitions.find((competition) => competition.competition_id === selectedId);
      const standings = selectedCompetition ? await getCompetitionStandings(selectedCompetition.competition_id) : [];
      if (version === loadVersion.current && isCurrent()) setState({ status: "success", season, competitions, matches, standings });
    } catch (error) {
      if (version === loadVersion.current && isCurrent()) setState({ status: error.response?.status === 404 ? "notFound" : "error", season: null, competitions: [], matches: [], standings: [] });
    }
  }, [seasonId, selectedId]);

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => { void loadSeason(true, () => current); }, 0);
    return () => { current = false; window.clearTimeout(timer); };
  }, [loadSeason]);

  const dashboard = useMemo(() => {
    const completed = state.matches.filter((match) => match.status === "COMPLETED");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = state.matches.filter((match) => match.status === "SCHEDULED" && new Date(match.match_date) >= today).sort((first, second) => matchMoment(first).localeCompare(matchMoment(second)));
    const recentResults = [...completed].sort((first, second) => matchMoment(second).localeCompare(matchMoment(first))).slice(0, 4);
    const teams = new Map();
    const venues = new Map();
    state.matches.forEach((match) => {
      if (match.home_team?.team_id) teams.set(match.home_team.team_id, match.home_team);
      if (match.away_team?.team_id) teams.set(match.away_team.team_id, match.away_team);
      if (match.venue?.venue_id) venues.set(match.venue.venue_id, match.venue);
    });

    return {
      primaryCompetition: state.competitions.find((competition) => competition.competition_id === selectedId) || null,
      metrics: { totalMatches: state.matches.length, completedMatches: completed.length, teamCount: teams.size, venueCount: venues.size },
      nextMatch: upcoming[0] || null,
      recentResults,
      teams: [...teams.values()].sort((first, second) => first.name.localeCompare(second.name)),
      venues: [...venues.values()].sort((first, second) => first.name.localeCompare(second.name)),
      fixtures: [...state.matches].sort((first, second) => matchMoment(first).localeCompare(matchMoment(second))),
    };
  }, [state.competitions, state.matches, selectedId]);

  if (state.status === "loading") {
    return <main className="min-h-screen bg-[#f5f9f8] pt-[76px]"><div className="h-[255px] animate-pulse bg-[#dce7e5]" /><div className="mx-auto -mt-4 max-w-[1200px] px-5 sm:px-7 lg:px-8"><div className="h-10 animate-pulse rounded bg-white" /><div className="mt-4 grid gap-3 lg:grid-cols-3"><div className="h-36 animate-pulse rounded bg-white" /><div className="h-36 animate-pulse rounded bg-white" /><div className="h-36 animate-pulse rounded bg-white" /></div></div></main>;
  }

  if (state.status === "error" || state.status === "notFound") {
    const text = state.status === "notFound" ? "The requested season could not be found." : "Season details are unavailable right now.";
    return <main className="min-h-screen bg-[#f5f9f8] px-5 pb-14 pt-28 sm:px-7"><div className="mx-auto max-w-[800px] rounded-lg border border-[#e0e9e5] bg-white p-6 text-[#26384e]"><h1 className="text-xl font-extrabold">Season unavailable</h1><p className="mt-2 text-sm text-[#6e7e91]">{text}</p><div className="mt-5 flex gap-3"><button type="button" onClick={() => loadSeason(true)} className="rounded bg-[#10965f] px-3 py-2 text-xs font-bold text-white">Try again</button><Link to="/seasons" className="px-3 py-2 text-xs font-bold text-[#10965f]">All seasons</Link></div></div></main>;
  }

  const { season } = state;
  const topScorers = season.top_scorers || [];
  const topAppearances = season.top_appearances || [];
  const hasPendingFixture = state.matches.some((match) => ["SCHEDULED", "LIVE", "POSTPONED"].includes(match.status));
  const isCompletedSeason = selectedId && season.status === "INACTIVE" && dashboard.metrics.completedMatches > 0 && !hasPendingFixture;
  const champion = isCompletedSeason && state.competitions.length === 1 && state.standings.length
    ? state.standings[0]
    : null;
  const closingMatch = isCompletedSeason
    ? [...state.matches].filter((match) => match.status === "COMPLETED").sort((first, second) => matchMoment(second).localeCompare(matchMoment(first)))[0] || null
    : null;

  if (isCompletedSeason) {
    return <><CompletedSeasonDetails season={season} metrics={dashboard.metrics} champion={champion} closingMatch={closingMatch} standings={state.standings} competition={dashboard.primaryCompetition} scorers={topScorers} appearances={topAppearances} teams={dashboard.teams} venues={dashboard.venues} fixtures={dashboard.fixtures.filter((match) => match.status === "COMPLETED")} activeSection={activeSection} onChangeSection={setActiveSection} /><div className="mx-auto max-w-[1200px] px-5 pb-12 sm:px-7 lg:px-8"><CompetitionDiscovery competitions={state.competitions} registrations={registrations} selectedId={selectedId} onTournament={id => { setState(current => ({ ...current, status: "loading" })); setSelectedId(id); setActiveSection("overview"); }} /><button className="my-5 text-sm font-bold text-emerald-700" onClick={() => setSelectedId(null)}>All competition cards</button><MediaGallery entityType="SEASON" entityId={season.season_id} title="Season gallery and highlights" /></div></>;
  }

  const overview = <>
    <div className="grid gap-3 lg:grid-cols-[.9fr_1.05fr_1fr]"><SeasonProgress metrics={dashboard.metrics} /><SeasonNextMatch match={dashboard.nextMatch} /><SeasonRecentResults matches={dashboard.recentResults} /></div>
    <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,2.15fr)_minmax(280px,.85fr)]"><SeasonStandings standings={state.standings.slice(0, 8)} competition={dashboard.primaryCompetition} compact /><SeasonTopPlayers players={topScorers} /></div>
    <div className="mt-3"><SeasonTeams teams={dashboard.teams} seasonName={season.name} /></div>
  </>;
  const selectedContent = {
    overview,
    standings: <SeasonStandings standings={state.standings} competition={dashboard.primaryCompetition} />,
    fixtures: dashboard.fixtures.length ? <SeasonFixtures matches={dashboard.fixtures} /> : <div className="rounded border border-[#e0e9e5] bg-white p-4 text-sm text-[#718095]">No fixtures are available for this season.</div>,
    teams: <SeasonTeams teams={dashboard.teams} seasonName={season.name} compact />,
    players: <SeasonTopPlayers players={topScorers} />,
    venues: <SeasonVenues venues={dashboard.venues} />,
  }[activeSection];

  return <main className="min-h-screen bg-[#f5f9f8] pb-12 pt-[76px] text-[#13223a]"><SeasonDetailsHero season={season} metrics={dashboard.metrics} competitions={selectedId ? undefined : state.competitions} /><div className="relative z-10 mx-auto -mt-3 w-full max-w-[1200px] px-5 sm:px-7 lg:px-8"><div className="mt-7"><CompetitionDiscovery competitions={state.competitions} registrations={registrations} selectedId={selectedId} onTournament={id => { setState(current => ({ ...current, status: "loading" })); setSelectedId(id); setActiveSection("overview"); }} /></div>{selectedId && <div className="mt-7"><button className="mb-4 text-sm font-bold text-emerald-700" onClick={() => setSelectedId(null)}>Back to competition discovery</button><h2 className="mb-4 text-2xl font-bold">{dashboard.primaryCompetition?.name}</h2><SeasonDetailsNavigation activeSection={activeSection} onChange={setActiveSection} /><div className="mt-4">{state.competitions.length > 1 && <p className="mb-3 text-xs text-slate-500">Fixtures and standings are for this competition. Player leaderboards cover the full season.</p>}{selectedContent}</div></div>}<div className="mt-4"><MediaGallery entityType="SEASON" entityId={season.season_id} title="Season gallery and highlights" /></div></div></main>;
};

export default function SeasonDetailsRoute() { const { seasonId } = useParams(); return <SeasonDetailsPage key={seasonId} />; }
