import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../services/apiClient";

const AdminDashboardPage = () => {
  const [state, setState] = useState({ status: "loading" });
  const load = useCallback(async () => {
    setState({ status: "loading" });
    try { const response = await apiClient.get("/admin/dashboard"); setState({ status: "success", data: response.data.data }); } catch { setState({ status: "error" }); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  if (state.status !== "success") return <div className="p-8 text-white/60">{state.status === "error" ? <><p role="alert">Dashboard unavailable.</p><button type="button" onClick={load} className="mt-4 rounded border border-[#EEC058]/70 px-3 py-2 text-xs font-bold text-[#EEC058]">RETRY</button></> : <p role="status">Loading dashboard…</p>}</div>;
  const data = state.data;
  const cards = [["TOTAL USERS", data.counts.users], ["ACTIVE CLUBS", data.counts.active_clubs], ["ACTIVE TEAMS", data.counts.active_teams], ["ACTIVE PLAYERS", data.counts.active_players], ["PENDING REGISTRATIONS", data.operations.pending_registrations], ["PENDING PAYMENTS", data.operations.pending_payments], ["UPCOMING MATCHES", data.operations.upcoming_matches], ["LIVE MATCHES", data.operations.live_matches]];
  return <div className="p-5 sm:p-8"><p className="text-xs font-bold tracking-[.16em] text-[#EEC058]">OPERATIONS OVERVIEW</p><h1 className="mt-2 text-3xl font-extrabold text-[#ffad9f]">ADMIN DASHBOARD</h1><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <article key={label} className="rounded-xl border border-white/10 bg-[#0B1D2F] p-4"><p className="text-[10px] font-bold tracking-[.12em] text-white/45">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></article>)}</div><div className="mt-8 grid gap-6 xl:grid-cols-2"><section className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><div className="flex justify-between gap-3"><h2 className="font-extrabold">UPCOMING MATCHES</h2><Link to="/admin/matches" className="text-xs font-bold text-[#EEC058] hover:text-white">MANAGE →</Link></div><div className="mt-4 space-y-3">{data.upcoming_matches.map((match) => <p key={match.match_id} className="border-b border-white/10 pb-3 text-sm last:border-0"><b>{match.home_team.name} vs {match.away_team.name}</b><span className="block text-xs text-white/55">{match.competition.name} · {new Date(match.match_date).toLocaleDateString()}</span></p>)}{!data.upcoming_matches.length && <p className="text-sm text-white/55">No upcoming matches.</p>}</div></section><section className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><Link to="/admin/audit-logs" className="font-extrabold hover:text-[#EEC058]">RECENT ACTIVITY →</Link><div className="mt-4 space-y-3">{data.recent_activity.map((item) => <p key={item.audit_id} className="border-b border-white/10 pb-3 text-sm last:border-0"><b>{item.action}</b><span className="block text-xs text-white/55">{item.actor?.name || "System"} · {new Date(item.created_at).toLocaleString()}</span></p>)}{!data.recent_activity.length && <p className="text-sm text-white/55">No recent activity.</p>}</div></section></div></div>;
};

export default AdminDashboardPage;
