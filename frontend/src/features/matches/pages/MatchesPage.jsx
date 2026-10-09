import { useEffect, useMemo, useState } from "react";
import { Radio, Trophy } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import matchesBanner from "../../../assets/hunza-football-hero-alt.png";
import LiveMatchCard from "../components/LiveMatchCard";
import MatchCategoryTabs from "../components/MatchCategoryTabs";
import MatchCardSkeleton from "../components/MatchCardSkeleton";
import MatchFilters from "../components/MatchFilters";
import RecentMatchRow from "../components/RecentMatchRow";
import UpcomingMatchCard from "../components/UpcomingMatchCard";
import {
  getCompetitionsForMatches,
  getMatches,
  getSeasonsForMatches,
  getTeamsForMatches,
} from "../services/matchService";

const filterKeys = ["competition", "season", "team", "dateFrom", "dateTo"];

const readFilters = (params) => ({
  competition: params.get("competition") || "",
  season: params.get("season") || "",
  team: params.get("team") || "",
  dateFrom: params.get("from") || "",
  dateTo: params.get("to") || "",
});

const MatchSection = ({ title, count, live = false, action, children }) => (
  <section className="mt-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {live ? <Radio size={15} className="text-[#e6424e]" /> : <Trophy size={15} className="text-[#13223a]" />}
        <h2 className="text-[14px] font-extrabold text-[#15243b]">{title}</h2>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${live ? "bg-red-50 text-[#d63240]" : "bg-[#edf2f1] text-[#657489]"}`}>{count}</span>
      </div>
      {action}
    </div>
    <div className="mt-2">{children}</div>
  </section>
);

const SectionEmpty = ({ children }) => <div className="rounded-lg border border-dashed border-[#dce6e2] bg-white px-4 py-5 text-center text-[10px] text-[#718095]">{children}</div>;

const MatchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [tab, setTab] = useState("all");
  const [matchesState, setMatchesState] = useState({ data: [], status: "loading" });
  const [filterData, setFilterData] = useState({ competitions: [], seasons: [], teams: [], status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  const requestParams = useMemo(() => ({
    ...(filters.competition ? { competition_id: filters.competition } : {}),
    ...(filters.season ? { season_id: filters.season } : {}),
    ...(filters.team ? { team_id: filters.team } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
  }), [filters]);

  useEffect(() => {
    const controller = new AbortController();

    getMatches({ ...requestParams, signal: controller.signal })
      .then((result) => setMatchesState({ data: result.matches || [], status: "success" }))
      .catch((error) => {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setMatchesState({ data: [], status: "error" });
        }
      });

    return () => controller.abort();
  }, [requestParams, reloadToken]);

  useEffect(() => {
    let active = true;

    Promise.all([getCompetitionsForMatches(), getSeasonsForMatches(), getTeamsForMatches()])
      .then(([competitions, seasons, teams]) => {
        if (active) setFilterData({ competitions, seasons, teams, status: "success" });
      })
      .catch(() => {
        if (active) setFilterData({ competitions: [], seasons: [], teams: [], status: "error" });
      });

    return () => {
      active = false;
    };
  }, []);

  const liveMatches = useMemo(() => matchesState.data.filter((match) => match.status === "LIVE"), [matchesState.data]);
  const upcomingMatches = useMemo(() => matchesState.data.filter((match) => match.status === "SCHEDULED"), [matchesState.data]);
  const recentMatches = useMemo(() => matchesState.data.filter((match) => match.status === "COMPLETED").sort((left, right) => new Date(right.match_date) - new Date(left.match_date)), [matchesState.data]);

  useEffect(() => {
    if (!liveMatches.length) return undefined;

    const interval = window.setInterval(() => {
      getMatches(requestParams)
        .then((result) => setMatchesState({ data: result.matches || [], status: "success" }))
        .catch(() => {});
    }, 30000);

    return () => window.clearInterval(interval);
  }, [liveMatches.length, requestParams]);

  const updateUrl = (nextFilters) => {
    const next = {};
    if (nextFilters.competition) next.competition = nextFilters.competition;
    if (nextFilters.season) next.season = nextFilters.season;
    if (nextFilters.team) next.team = nextFilters.team;
    if (nextFilters.dateFrom) next.from = nextFilters.dateFrom;
    if (nextFilters.dateTo) next.to = nextFilters.dateTo;
    setSearchParams(next);
  };

  const changeFilter = (key, value) => {
    const nextFilters = { ...filters, [key]: value };
    if (key === "dateFrom" && nextFilters.dateTo && value > nextFilters.dateTo) nextFilters.dateTo = "";
    setMatchesState((current) => ({ ...current, status: "loading" }));
    setFilters(nextFilters);
    updateUrl(nextFilters);
  };

  const resetFilters = () => {
    const cleared = Object.fromEntries(filterKeys.map((key) => [key, ""]));
    setMatchesState((current) => ({ ...current, status: "loading" }));
    setFilters(cleared);
    setSearchParams({});
  };

  const counts = { all: matchesState.data.length, live: liveMatches.length, upcoming: upcomingMatches.length, recent: recentMatches.length };
  const preview = tab === "all";
  const sectionAction = (nextTab, label) => <button type="button" onClick={() => setTab(nextTab)} className="text-[9px] font-extrabold text-[#087d50] transition hover:text-[#055f3d]">{label} →</button>;

  return (
    <main className="min-h-screen bg-[#f6f9f8] pb-12 pt-[76px] text-[#13223a]">
      <section className="relative h-[132px] overflow-hidden border-b border-[#e4ece9] bg-[#e8f0ef]" style={{ backgroundImage: `linear-gradient(90deg,rgba(247,251,250,.97),rgba(247,251,250,.83) 42%,rgba(232,240,239,.18)),url(${matchesBanner})`, backgroundPosition: "center 31%", backgroundSize: "cover" }}>
        <div className="mx-auto h-full max-w-[1200px] px-5 py-4 sm:px-7 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-[10px] font-semibold text-[#526275]"><Link to="/" className="transition hover:text-[#087d50]">Home</Link><span className="mx-1.5 text-[#a2adba]">›</span><span>Matches</span></nav>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-[-.04em] text-[#10203b]">Matches</h1>
          <p className="mt-1 text-[10px] font-medium text-[#5f7085]">Browse live matches, upcoming fixtures and recent results from Hunza Premier League.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pt-3 sm:px-7 lg:px-8">
        <MatchFilters competitions={filterData.competitions} seasons={filterData.seasons} teams={filterData.teams} filters={filters} onChange={changeFilter} onReset={resetFilters} loading={filterData.status === "loading"} />
        <div className="mt-3"><MatchCategoryTabs value={tab} counts={counts} onChange={setTab} /></div>

        {matchesState.status === "loading" && <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <MatchCardSkeleton key={index} />)}</div>}
        {matchesState.status === "error" && <section role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-[#9b2830]"><p className="text-[11px] font-medium">Unable to load matches right now.</p><button type="button" onClick={() => setReloadToken((value) => value + 1)} className="mt-2 rounded border border-current/25 px-3 py-1.5 text-[9px] font-bold">Try again</button></section>}

        {matchesState.status === "success" && (preview || tab === "live") && <MatchSection title="Live Matches" count={liveMatches.length} live action={preview ? sectionAction("live", "View All Live") : null}>{liveMatches.length ? <div className="grid gap-3 md:grid-cols-2">{(preview ? liveMatches.slice(0, 2) : liveMatches).map((match) => <LiveMatchCard key={match.match_id} match={match} />)}</div> : <SectionEmpty>No live matches currently.</SectionEmpty>}</MatchSection>}

        {matchesState.status === "success" && (preview || tab === "upcoming") && <MatchSection title="Upcoming Matches" count={upcomingMatches.length} action={preview ? sectionAction("upcoming", "View All") : null}>{upcomingMatches.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(preview ? upcomingMatches.slice(0, 4) : upcomingMatches).map((match) => <UpcomingMatchCard key={match.match_id} match={match} />)}</div> : <SectionEmpty>No upcoming matches found.</SectionEmpty>}</MatchSection>}

        {matchesState.status === "success" && (preview || tab === "recent") && <MatchSection title="Recent Matches" count={recentMatches.length} action={preview ? sectionAction("recent", "View All") : null}>{recentMatches.length ? <div className="overflow-hidden rounded-lg border border-[#e0e8e6] bg-white">{(preview ? recentMatches.slice(0, 3) : recentMatches).map((match) => <RecentMatchRow key={match.match_id} match={match} />)}</div> : <SectionEmpty>No recent results available.</SectionEmpty>}</MatchSection>}
      </section>
    </main>
  );
};

export default MatchesPage;
