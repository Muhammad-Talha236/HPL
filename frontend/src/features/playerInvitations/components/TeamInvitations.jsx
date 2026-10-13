import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../../../services/apiClient";

const date = value => value ? new Date(value).toLocaleString() : "—";
const labels = { PENDING: "Invited", ACCEPTED_PENDING_PROFILE: "Accepted / ready to join", ACCEPTED: "Activated / linked", EXPIRED: "Expired", REVOKED: "Revoked", DECLINED: "Declined" };

export function InvitePlayerModal({ team, onClose, onSent }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dialogRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (dialogRef.current?.querySelector("input:not([disabled]), button:not([disabled])") || dialogRef.current)?.focus();
    const keys = event => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll('input:not([disabled]), button:not([disabled])');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keys);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keys); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [onClose, busy]);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try { const response = await apiClient.post("/player-invitations", { team_id: team.team_id, invited_email: email.trim() }); setSuccess(response.data.message); onSent(); }
    catch (err) { setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Invitation request could not be sent."); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4">
    <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="invite-player-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h2 id="invite-player-title" className="text-xl font-bold text-[#10213F]">Invite Player</h2>
      <p className="mt-2 break-words text-sm font-semibold text-[#087554]">{team.name}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">An email invitation is valid for 7 days. The player joins your active roster after accepting with the invited account. Profile details can be completed later.</p>
      {success ? <><p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">{success}</p><button type="button" onClick={onClose} className="mt-5 w-full rounded-lg bg-[#087554] p-3 font-semibold text-white">Done</button></> : <form onSubmit={submit} className="mt-5">
        <label htmlFor="invited-email" className="text-xs font-semibold text-slate-600">Player email</label>
        <input id="invited-email" type="email" autoComplete="email" required maxLength={254} disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#087554] focus:ring-2 focus:ring-[#087554]/15" />
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={busy} className="rounded-lg bg-[#087554] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Send Invitation"}</button></div>
      </form>}
    </section>
  </div>;
}

export default function TeamInvitations({ teamId, refreshKey = 0 }) {
  const [state, setState] = useState({ loading: true, data: [] });
  const [page, setPage] = useState(1);
  const [view, setView] = useState("PENDING");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (!teamId) return;
    setState(current => ({ ...current, loading: true, error: "" }));
    try { const response = await apiClient.get("/player-invitations", { params: { team_id: teamId, page, limit: 20, view } }); setState({ loading: false, data: response.data.data, pagination: response.data.pagination }); }
    catch (err) { setState({ loading: false, data: [], error: err.response?.data?.message || "Invitations could not be loaded." }); }
  }, [teamId, page, view]);
  useEffect(() => { const timer = setTimeout(load, refreshKey ? 750 : 0); return () => clearTimeout(timer); }, [load, refreshKey]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  async function action(invitation, operation) {
    if (busy) return;
    setBusy(invitation.invitation_id); setNotice("");
    try { const response = await apiClient.post(`/player-invitations/${invitation.invitation_id}/${operation}`); setNotice(response.data.message); await load(); }
    catch (err) { setNotice(err.response?.data?.message || "Invitation could not be updated."); }
    finally { setBusy(null); }
  }
  return <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="pending-invitations-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="pending-invitations-title" className="text-lg font-bold text-[#10213F]">{view === "PENDING" ? "Pending Invitations" : "Invitation History"}</h2><button type="button" onClick={load} className="text-xs font-semibold text-[#087554]">Refresh</button></div>
    <div className="mt-4 flex gap-4">{["PENDING", "HISTORY"].map(item => <button key={item} type="button" aria-pressed={view === item} onClick={() => { setView(item); setPage(1); }} className={`text-xs font-semibold ${view === item ? "text-[#087554] underline" : "text-slate-500"}`}>{item === "PENDING" ? "Pending" : "History"}</button>)}</div>
    <p className="mt-2 text-sm text-slate-500">Invitation history is separate from your confirmed roster. Resends have a 15-minute cooldown.</p>
    {notice && <p role="status" className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{notice}</p>}
    {state.loading ? <p role="status" className="mt-5 text-sm text-slate-500">Loading invitations…</p> : state.error ? <p role="alert" className="mt-5 text-sm text-red-700">{state.error}</p> : <div className="mt-5 space-y-3">{state.data.map(invitation => <article key={invitation.invitation_id} className="rounded-lg border border-slate-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><p className="break-all text-sm font-semibold text-[#10213F]">{invitation.invited_email}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{invitation.status === "PENDING" && !invitation.delivered_at ? "Sending / undelivered" : labels[invitation.status] || invitation.status}</span></div>
      <p className="mt-2 text-xs leading-5 text-slate-500">Sent {date(invitation.last_sent_at || invitation.created_at)} · Expires {date(invitation.expires_at)}</p>
      <div className="mt-3 flex gap-4">{invitation.status === "PENDING" && <button type="button" disabled={Boolean(busy)} onClick={() => action(invitation, "resend")} className="text-xs font-semibold text-[#087554] disabled:opacity-50">Resend Invitation</button>}{["PENDING", "ACCEPTED_PENDING_PROFILE"].includes(invitation.status) && <button type="button" disabled={Boolean(busy)} onClick={() => action(invitation, "revoke")} className="text-xs font-semibold text-red-700 disabled:opacity-50">Revoke Invitation</button>}</div>
    </article>)}{!state.data.length && <p className="text-sm text-slate-500">No invitations in this view.</p>}</div>}
    {state.pagination?.total_pages > 1 && <div className="mt-5 flex justify-between text-xs"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {state.pagination.total_pages}</span><button disabled={page >= state.pagination.total_pages} onClick={() => setPage(value => value + 1)}>Next</button></div>}
  </section>;
}
