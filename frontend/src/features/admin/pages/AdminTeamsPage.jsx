import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import apiClient from "../../../services/apiClient";

const AdminTeamsPage = () => {
  const [filters, setFilters] = useState({ q: "", status: "", gender: "", type: "" });
  const [state, setState] = useState({ status: "loading", data: [], pagination: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const response = await apiClient.get("/admin/teams", { params: { ...filters, page: 1, limit: 20 } });
      setState({ status: "success", data: response.data.data || [], pagination: response.data.pagination });
    } catch {
      setState({ status: "error", data: [], pagination: null });
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(load, 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return <div className="p-5 sm:p-8">
    <p className="text-xs font-bold tracking-[.15em] text-[#EEC058]">MANAGEMENT</p>
    <div className="mt-2 flex justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-[#ffad9f]">TEAMS</h1><p className="mt-1 text-sm text-white/55">Manage league teams, ownership and operational status.</p></div><Link to="/admin/teams/new" className="rounded bg-[#FF553D] px-4 py-3 text-xs font-bold">CREATE TEAM</Link></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input value={filters.q} onChange={(event) => setFilter("q", event.target.value)} placeholder="Search teams" className="rounded border border-white/10 bg-[#0B1D2F] p-3 text-sm" />
      <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)} className="rounded border border-white/10 bg-[#0B1D2F] p-3 text-sm"><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>
      <select value={filters.gender} onChange={(event) => setFilter("gender", event.target.value)} className="rounded border border-white/10 bg-[#0B1D2F] p-3 text-sm"><option value="">All genders</option><option>MEN</option><option>WOMEN</option></select>
      <input value={filters.type} onChange={(event) => setFilter("type", event.target.value)} placeholder="Filter type" className="rounded border border-white/10 bg-[#0B1D2F] p-3 text-sm" />
    </div>
    {state.status === "loading" && <p className="mt-6 text-white/55">Loading teams…</p>}
    {state.status === "error" && <p className="mt-6 text-red-200">Teams could not load. <button type="button" onClick={load} className="underline">TRY AGAIN</button></p>}
    {state.status === "success" && <div className="mt-6 grid gap-3">{state.data.map((team) => <article key={team.team_id} className="grid gap-3 rounded-xl border border-white/10 bg-[#0B1D2F] p-4 lg:grid-cols-[1.2fr_1fr_.65fr_.65fr_.5fr_auto]"><b>{team.name}</b><span className="text-sm text-white/60">{team.owner.name}<small className="block">{team.owner.email}</small></span><span>{team.gender}</span><span>{team.team_type}</span><span>{team.player_count} players</span><span className="text-xs font-bold text-[#EEC058]">{team.status}</span><Link to={`/admin/teams/${team.team_id}`} className="text-xs font-bold text-[#ffad9f]">VIEW</Link></article>)}{!state.data.length && <p className="rounded border border-white/10 p-5 text-white/55">No teams match these filters.</p>}</div>}
  </div>;
};

export default AdminTeamsPage;
