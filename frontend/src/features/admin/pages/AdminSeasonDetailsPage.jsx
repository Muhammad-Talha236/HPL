import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import MediaGalleryManager from "../../media/components/MediaGalleryManager";

const date = (value) => new Date(value).toLocaleDateString();
const Card = ({ title, children }) => <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#10213F]">{title}</h2><div className="mt-4 text-sm text-slate-600">{children}</div></section>;

export default function AdminSeasonDetailsPage() {
  const { seasonId } = useParams();
  const [state, setState] = useState({ kind: "loading" });
  const [dialog, setDialog] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const load = useCallback(async () => {
    try { const response = await apiClient.get(`/admin/seasons/${seasonId}`); setState({ kind: "ready", season: response.data.data }); }
    catch (error) { setState({ kind: error.response?.status === 404 ? "missing" : "error" }); }
  }, [seasonId]);
  useEffect(() => { void load(); }, [load]);
  if (state.kind !== "ready") return <div className="mx-auto w-full max-w-[1440px] p-5 text-slate-500 sm:p-8">{state.kind === "missing" ? "Season not found." : state.kind === "error" ? "Season could not be loaded." : "Loading season..."}</div>;

  const season = state.season;
  const lifecycle = async () => {
    setPending(true);
    try { const action = season.status === "ACTIVE" ? "deactivate" : "activate"; await apiClient.patch(`/seasons/${season.season_id}/${action}`); setDialog(false); setNotice(`Season ${action}d successfully.`); await load(); }
    catch (error) { setNotice(error.response?.data?.message || "Season status could not be changed."); }
    finally { setPending(false); }
  };

  return <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-6 lg:p-8">
    <Link to="/admin/seasons" className="text-xs font-semibold text-[#078052] hover:underline">← Seasons</Link>
    {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <header className="mt-5 flex flex-wrap justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div><h1 className="text-[26px] font-extrabold tracking-tight text-[#10213F]">{season.name}</h1><p className="mt-2 text-sm text-slate-500">{date(season.start_date)} – {date(season.end_date)}</p><span className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${season.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{season.status}</span></div>
      <div className="flex gap-2"><Link to={`/admin/seasons/${season.season_id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Edit Season</Link><button onClick={() => setDialog(true)} className="rounded-lg bg-[#078052] px-3 py-2 text-xs font-semibold text-white">{season.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></div>
    </header>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Competitions", season.competition_count], ["Registered Teams", season.registered_team_count], ["Total Matches", season.match_count], ["Completed Matches", season.completed_match_count]].map(([label, value]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-[#10213F]">{value ?? 0}</p></article>)}</section>
    <div className="mt-6 grid gap-5 xl:grid-cols-[2fr_1fr]">
      <main className="space-y-5">
        <Card title="SEASON INFORMATION"><p>{season.description || "No description provided."}</p><p className="mt-3">Start date: {date(season.start_date)}</p><p className="mt-2">End date: {date(season.end_date)}</p></Card>
        <Card title="COMPETITIONS">{season.competitions?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="pb-2">Competition</th><th className="pb-2">Gender</th><th className="pb-2">Status</th><th className="pb-2">Teams</th><th className="pb-2">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{season.competitions.map((competition) => <tr key={competition.competition_id}><td className="py-3 font-semibold text-[#10213F]">{competition.name}</td><td className="py-3">{competition.gender}</td><td className="py-3">{competition.status}</td><td className="py-3">{competition.approved_team_count}</td><td className="py-3"><Link to={`/admin/competitions/${competition.competition_id}`} className="font-semibold text-[#078052] hover:underline">View</Link></td></tr>)}</tbody></table></div> : <p>No competitions in this season.</p>}</Card>
        <Card title="STANDINGS / RESULTS">{season.competitions?.some((competition) => competition.standings?.length) ? <div className="space-y-5">{season.competitions.filter((competition) => competition.standings?.length).map((competition) => <div key={competition.competition_id}><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-[#10213F]">{competition.name}</h3><Link to={`/admin/competitions/${competition.competition_id}`} className="text-xs font-semibold text-[#078052]">View competition</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="pb-2">#</th><th className="pb-2">Team</th><th className="pb-2">P</th><th className="pb-2">W</th><th className="pb-2">D</th><th className="pb-2">L</th><th className="pb-2">Pts</th></tr></thead><tbody className="divide-y divide-slate-100">{competition.standings.map((standing) => <tr key={`${competition.competition_id}-${standing.team.team_id}`}><td className="py-2">{standing.position}</td><td className="py-2 font-semibold text-[#10213F]">{standing.team.name}</td><td className="py-2">{standing.played}</td><td className="py-2">{standing.wins}</td><td className="py-2">{standing.draws}</td><td className="py-2">{standing.losses}</td><td className="py-2 font-bold">{standing.points}</td></tr>)}</tbody></table></div></div>)}</div> : <p>No standings are available for this season.</p>}</Card>
        <Card title="MATCHES">{season.matches?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="pb-2">Date</th><th className="pb-2">Fixture</th><th className="pb-2">Venue</th><th className="pb-2">Status</th><th className="pb-2">Score</th></tr></thead><tbody className="divide-y divide-slate-100">{season.matches.map((match) => <tr key={match.match_id}><td className="py-3">{date(match.match_date)}</td><td className="py-3 font-semibold text-[#10213F]">{match.home_team.name} vs {match.away_team.name}</td><td className="py-3">{match.venue.name}</td><td className="py-3">{match.status}</td><td className="py-3">{match.home_score} – {match.away_score}</td></tr>)}</tbody></table></div> : <p>No fixtures or results are available for this season.</p>}</Card>
        <Card title="ACTIVITY / HISTORY">{season.activity?.length ? <div className="space-y-3">{season.activity.map((entry) => <div key={entry.audit_id} className="border-l-2 border-emerald-200 pl-3"><p className="text-sm font-semibold text-[#10213F]">{entry.action.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{entry.actor?.name || "System"} · {date(entry.created_at)}</p></div>)}</div> : <p>No administrative activity has been recorded for this season.</p>}</Card>
        <MediaGalleryManager entityType="SEASON" entityId={season.season_id} category="seasons" />
      </main>
      <aside className="space-y-5"><Card title="STATUS"><p className="font-bold text-[#078052]">{season.status}</p></Card><Card title="SYSTEM INFORMATION"><p>Season #{season.season_id}</p><p className="mt-2">Created {date(season.created_at)}</p><p className="mt-2">Updated {date(season.updated_at)}</p></Card></aside>
    </div>
    {dialog && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"><h2 className="font-bold text-[#10213F]">{season.status === "ACTIVE" ? "Deactivate" : "Activate"} Season</h2><p className="mt-3 text-sm text-slate-600">{season.status === "ACTIVE" ? `Deactivate “${season.name}”? Existing competitions and historical records will remain preserved.` : `Activate “${season.name}”?`}</p><div className="mt-6 flex justify-end gap-3"><button disabled={pending} onClick={() => setDialog(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button><button disabled={pending} onClick={lifecycle} className="rounded-lg bg-[#078052] px-3 py-2 text-xs font-semibold text-white">{pending ? "Saving..." : season.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></div></div></div>}
  </div>;
}
