import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Layers3, PauseCircle, Search } from "lucide-react";
import apiClient from "../../../services/apiClient";

const date = (value) => new Date(value).toLocaleDateString();

export default function AdminSeasonsPage() {
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ kind: "loading", data: [], pagination: null, summary: {} });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, kind: "loading" }));
    try {
      const response = await apiClient.get("/admin/seasons", { params: { ...filters, page, limit: 20 } });
      setState({
        kind: "success",
        data: response.data.data || [],
        pagination: response.data.pagination,
        summary: response.data.summary || {},
      });
    } catch {
      setState({ kind: "error", data: [], pagination: null, summary: {} });
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const change = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setPage(1);
    setFilters({ q: "", status: "" });
  };

  const cards = [
    ["Total Seasons", state.summary.total, Layers3, "bg-slate-100 text-slate-600"],
    ["Active Seasons", state.summary.active, CheckCircle2, "bg-emerald-50 text-emerald-600"],
    ["Inactive Seasons", state.summary.total === undefined ? undefined : state.summary.total - (state.summary.active || 0), PauseCircle, "bg-amber-50 text-amber-600"],
    ["Upcoming by Date", state.summary.upcoming, CalendarDays, "bg-slate-100 text-slate-600"],
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-6 lg:p-8">
      <p className="text-xs font-bold tracking-[.15em] text-[#078052]">COMPETITION</p>
      <header className="mt-2 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#10213F]">Season Management</h1>
          <p className="mt-1 text-[13px] text-slate-500">Create, organize and manage football seasons.</p>
        </div>
        <Link to="/admin/seasons/new" className="rounded-lg bg-[#078052] px-4 py-2.5 text-sm font-semibold text-white">+ Create Season</Link>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, Icon, tone]) => (
          <article key={title} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={21} /></div>
            <div><p className="text-xs text-slate-500">{title}</p><p className="mt-1 text-2xl font-extrabold text-[#10213F]">{value ?? "—"}</p></div>
          </article>
        ))}
      </section>

      <section className="mt-6 min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={filters.q} onChange={(event) => change("q", event.target.value)} placeholder="Search seasons..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#078052]" />
            </label>
            <select aria-label="Filter by status" value={filters.status} onChange={(event) => change("status", event.target.value)} className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm">
              <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
            </select>
            <button type="button" onClick={reset} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Clear filters</button>
          </div>
        </div>

        {state.kind === "error" && <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Seasons could not be loaded. <button onClick={load} className="font-semibold underline">Retry</button></p>}
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50"><tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Season</th><th className="px-4 py-3">Date Range</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Competitions</th><th className="px-4 py-3">Matches</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {state.kind === "loading" ? <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-500">Loading seasons...</td></tr> : state.data.length ? state.data.map((season) => <tr key={season.season_id} className="text-sm text-slate-600 hover:bg-slate-50"><td className="px-4 py-3"><Link to={`/admin/seasons/${season.season_id}`} className="font-bold text-[#078052]">{season.name}</Link></td><td className="px-4 py-3 text-xs">{date(season.start_date)} – {date(season.end_date)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${season.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{season.status}</span></td><td className="px-4 py-3">{season.competition_count}</td><td className="px-4 py-3">{season.match_count}</td><td className="px-4 py-3 text-xs">{date(season.updated_at)}</td><td className="px-4 py-3 text-right"><Link to={`/admin/seasons/${season.season_id}`} className="font-semibold text-[#078052] hover:underline">View</Link></td></tr>) : <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">{filters.q || filters.status ? "No seasons match the current filters." : "No seasons yet."}</td></tr>}
            </tbody>
          </table>
        </div>
        {state.pagination?.total_pages > 1 && <div className="flex justify-end gap-3 border-t border-slate-100 px-4 py-3"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:opacity-40">Previous</button><span className="py-2 text-sm text-slate-500">{page} / {state.pagination.total_pages}</span><button disabled={page === state.pagination.total_pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs disabled:opacity-40">Next</button></div>}
      </section>
    </div>
  );
}
