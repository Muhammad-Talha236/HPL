import { useEffect, useMemo, useState } from "react";

import TeamCard from "../components/TeamCard";
import TeamCardSkeleton from "../components/TeamCardSkeleton";
import { getTeams } from "../services/teamService";

const TeamsPage = () => {
  const [state, setState] = useState({ data: [], status: "loading" });
  const [search, setSearch] = useState("");

  const loadTeams = async (showLoading = true) => {
    if (showLoading) {
      setState((previous) => ({ ...previous, status: "loading" }));
    }
    try { setState({ data: await getTeams(), status: "success" }); } catch { setState({ data: [], status: "error" }); }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadInitialTeams = async () => {
      try {
        const teams = await getTeams();
        if (isCurrent) {
          setState({ data: teams, status: "success" });
        }
      } catch {
        if (isCurrent) {
          setState({ data: [], status: "error" });
        }
      }
    };

    loadInitialTeams();

    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleTeams = useMemo(() => state.data.filter((team) => team.name.toLowerCase().includes(search.trim().toLowerCase())), [search, state.data]);

  return <main className="min-h-screen bg-[#011427] pb-20 pt-20 text-white"><section className="border-b border-white/10 bg-[linear-gradient(135deg,#07192a,#011427)]"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8"><p className="text-[11px] font-bold tracking-[0.22em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p><h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-[#ffad9f] sm:text-5xl">THE CONTENDERS</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">High-altitude intensity meets elite sportsmanship. Meet the teams competing for glory in the Hunza Premier League.</p></div></section><section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold tracking-[0.14em] text-white/55">{state.status === "success" ? `${visibleTeams.length} TEAMS` : "TEAMS"}</p><label htmlFor="team-search" className="sr-only">Search teams</label><input id="team-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams" className="h-10 w-full rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30 sm:max-w-xs" /></div>{state.status === "loading" && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 8 }, (_, index) => <TeamCardSkeleton key={index} />)}</div>}{state.status === "error" && <div role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-6"><p className="text-sm text-red-100">Unable to load teams right now.</p><button type="button" onClick={loadTeams} className="mt-4 rounded-md border border-red-200/30 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-200/10 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">TRY AGAIN</button></div>}{state.status === "success" && visibleTeams.length === 0 && <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">{search ? "No teams match your search." : "No teams are available yet."}</div>}{state.status === "success" && visibleTeams.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleTeams.map((team) => <TeamCard key={team.team_id} team={team} />)}</div>}</section></main>;
};

export default TeamsPage;
