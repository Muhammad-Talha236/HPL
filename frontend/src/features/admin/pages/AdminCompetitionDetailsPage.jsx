import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import MediaGalleryManager from "../../media/components/MediaGalleryManager";

const Card = ({ title, children }) => <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-[#10213F]">{title}</h2><div className="mt-4 text-sm text-slate-600">{children}</div></section>;
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "—";

export default function AdminCompetitionDetailsPage() {
  const { competitionId } = useParams();
  const [state, setState] = useState({ kind: "loading" });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const response = await apiClient.get(`/admin/competitions/${competitionId}`); setState({ kind: "ready", competition: response.data.data }); }
    catch { setState({ kind: "error" }); }
  }, [competitionId]);
  useEffect(() => { void load(); }, [load]);
  if (state.kind === "loading") return <div className="p-8 text-sm text-slate-500">Loading competition...</div>;
  if (state.kind === "error") return <div className="p-8 text-sm text-red-600">Competition could not be loaded. <button onClick={load} className="font-semibold underline">Retry</button></div>;
  const c = state.competition;
  const action = async () => {
    setBusy(true);
    try { await apiClient.patch(`/competitions/${c.competition_id}/${c.status === "ACTIVE" ? "deactivate" : "activate"}`); setConfirm(false); await load(); }
    catch { setState((current) => ({ ...current, actionError: "The competition status could not be changed." })); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-6 lg:p-8">
    <Link to="/admin/competitions" className="text-sm font-semibold text-[#078052]">Back to competitions</Link>
    <header className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><h1 className="text-2xl font-extrabold text-[#10213F]">{c.name}</h1><p className="mt-1 text-sm text-slate-500">{c.season?.name || "—"} · {c.gender} · {c.format}</p><span className={`mt-3 inline-block rounded-md px-2 py-1 text-xs font-semibold ${c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</span></div><div className="flex flex-wrap gap-2"><Link to={`/admin/competitions/${c.competition_id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><button onClick={() => setConfirm(true)} className="rounded-lg border border-[#078052] px-3 py-2 text-xs font-semibold text-[#078052]">{c.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></div></header>
    {state.actionError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.actionError}</p>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><main className="space-y-5"><Card title="Overview"><p>{c.description || "No description provided."}</p><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-slate-400">Registration window</dt><dd>{formatDate(c.registration_start_date)} - {formatDate(c.registration_end_date)}</dd></div><div><dt className="text-xs text-slate-400">Competition dates</dt><dd>{formatDate(c.competition_start_date)} - {formatDate(c.competition_end_date)}</dd></div><div><dt className="text-xs text-slate-400">Eligibility</dt><dd>{c.eligibility_rules || "Not specified"}</dd></div><div><dt className="text-xs text-slate-400">Registration fee</dt><dd>{String(c.registration_fee ?? "—")}</dd></div></dl></Card>
      <Card title="Registrations"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-slate-400"><tr><th className="pb-2">Team</th><th className="pb-2">Status</th><th className="pb-2">Payment</th><th className="pb-2">Submitted</th><th className="pb-2"></th></tr></thead><tbody className="divide-y divide-slate-100">{c.registrations?.map((r) => <tr key={r.registration_id}><td className="py-2 font-semibold text-[#10213F]">{r.team?.name}</td><td className="py-2">{r.registration_status}</td><td className="py-2">{r.payment_status}</td><td className="py-2">{formatDate(r.registration_date)}</td><td className="py-2 text-right"><Link className="font-semibold text-[#078052]" to={`/admin/registrations/${r.registration_id}`}>Review</Link></td></tr>)}</tbody></table></div>{!c.registrations?.length && <p>No registrations yet.</p>}<Link to="/admin/registrations" className="mt-4 inline-block font-semibold text-[#078052]">Open registration queue</Link></Card>
      <Card title="Fixtures and results"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="text-slate-400"><tr><th className="pb-2">Date</th><th className="pb-2">Match</th><th className="pb-2">Venue</th><th className="pb-2">Score</th><th className="pb-2">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{c.matches?.map((m) => <tr key={m.match_id}><td className="py-2">{formatDate(m.match_date)}</td><td className="py-2">{m.home_team?.name} vs {m.away_team?.name}</td><td className="py-2">{m.venue?.name || "—"}</td><td className="py-2 font-semibold">{m.home_score} - {m.away_score}</td><td className="py-2">{m.status}</td></tr>)}</tbody></table></div>{!c.matches?.length && <p>No fixtures scheduled.</p>}</Card>
      <Card title="Media"><MediaGalleryManager entityType="COMPETITION" entityId={c.competition_id} category="competitions" /></Card>
    </main><aside className="space-y-5"><Card title="Competition summary"><dl className="space-y-3"><div className="flex justify-between"><dt>Approved teams</dt><dd className="font-bold text-[#10213F]">{c.approved_team_count}</dd></div><div className="flex justify-between"><dt>Matches</dt><dd className="font-bold text-[#10213F]">{c.match_count}</dd></div><div className="flex justify-between"><dt>Completed matches</dt><dd className="font-bold text-[#10213F]">{c.completed_match_count}</dd></div><div className="flex justify-between"><dt>Squad size</dt><dd className="font-bold text-[#10213F]">{c.squad_size || "—"}</dd></div></dl></Card>
      <Card title="Standings">{c.standings?.length ? <div className="space-y-2">{c.standings.map((row) => <div key={row.team.team_id} className="flex justify-between text-xs"><span>{row.position || "—"}. {row.team.name}</span><b>{row.points} pts</b></div>)}</div> : <p>No standings yet.</p>}</Card>
      <Card title="Activity">{c.activity?.length ? <div className="space-y-3">{c.activity.map((item) => <div key={item.audit_id}><p className="font-semibold text-[#10213F]">{item.action}</p><p className="text-xs text-slate-400">{formatDate(item.created_at)} · {item.actor?.name || "System"}</p></div>)}</div> : <p>No activity recorded.</p>}</Card></aside></div>
    {confirm && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><h2 className="font-bold text-[#10213F]">{c.status === "ACTIVE" ? "Deactivate" : "Activate"} competition?</h2><p className="mt-2 text-sm text-slate-500">This changes availability without deleting registrations, fixtures or historical records.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setConfirm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button disabled={busy} onClick={action} className="rounded-lg bg-[#078052] px-4 py-2 text-sm font-semibold text-white">{busy ? "Saving..." : "Confirm"}</button></div></div></div>}
  </div>;
}
