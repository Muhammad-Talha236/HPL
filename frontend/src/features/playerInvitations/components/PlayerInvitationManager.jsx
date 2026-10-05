import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../../services/apiClient";

const emailIsValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const formattedDate = (value) => value ? new Date(value).toLocaleString() : "—";

export default function PlayerInvitationManager({ player, teams }) {
  const [invitations, setInvitations] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkedAt, setCheckedAt] = useState(0);
  const dialogTitleRef = useRef(null);
  const safeTeams = useMemo(() => (teams || []).filter((team) => Number.isInteger(Number(team.team_id))), [teams]);

  const load = useCallback(async () => {
    setState("loading"); setError("");
    try {
      const response = await apiClient.get("/player-invitations", { params: { player_id: player.player_id, page: 1, limit: 50 } });
      setInvitations(response.data.data || []); setCheckedAt(Date.now()); setState("ready");
    } catch (requestError) { setState("error"); setError(requestError.response?.data?.message || "Invitation status could not be loaded."); }
  }, [player.player_id]);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const activeTeamId = safeTeams.some((team) => String(team.team_id) === String(selectedTeamId)) ? selectedTeamId : safeTeams[0] ? String(safeTeams[0].team_id) : "";
  const livePending = invitations.find((invitation) => invitation.status === "PENDING" && new Date(invitation.expires_at).getTime() > checkedAt);
  const expiredPending = invitations.find((invitation) => invitation.status === "PENDING" && new Date(invitation.expires_at).getTime() <= checkedAt);
  const closeDialog = () => { if (!busy) { setDialog(""); setError(""); } };
  useEffect(() => {
    if (!dialog) return undefined;
    dialogTitleRef.current?.focus();
    const handleEscape = (event) => { if (event.key === "Escape" && !busy) { setDialog(""); setError(""); } };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [dialog, busy]);

  const create = async (event) => {
    event.preventDefault(); const invited_email = email.trim().toLowerCase();
    if (!emailIsValid(invited_email)) { setError("Enter a valid invitation email address."); return; }
    if (!activeTeamId) { setError("Select an eligible team."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      await apiClient.post("/player-invitations", { player_id: player.player_id, team_id: Number(activeTeamId), invited_email });
      setEmail(""); setDialog(""); setNotice("Invitation email sent successfully."); await load();
    } catch (requestError) { await load(); setError(requestError.response?.data?.message || "Invitation could not be created."); } finally { setBusy(false); }
  };
  const revoke = async () => {
    if (!livePending) return;
    setBusy(true); setError(""); setNotice("");
    try { await apiClient.post(`/player-invitations/${livePending.invitation_id}/revoke`); setDialog(""); setNotice("Invitation revoked."); await load(); }
    catch (requestError) { await load(); setError(requestError.response?.data?.message || "Invitation could not be revoked."); } finally { setBusy(false); }
  };
  const resend = async () => {
    if (!livePending || busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await apiClient.post(`/player-invitations/${livePending.invitation_id}/resend`); setNotice("Invitation email resent successfully."); await load(); }
    catch (requestError) { await load(); setError(requestError.response?.data?.message || "Invitation email could not be resent."); } finally { setBusy(false); }
  };

  return <section className="mt-5 max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="player-invitation-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-extrabold tracking-[.14em] text-[#b83729]">PLAYER ACCOUNT</p><h2 id="player-invitation-title" className="mt-1 text-xl font-extrabold text-slate-900">Invitation access</h2></div>
      {player.account_linked ? <span className="rounded bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800">ACCOUNT LINKED</span> : livePending ? <span className="rounded bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-800">INVITATION PENDING</span> : <button type="button" disabled={!safeTeams.length || state === "loading"} onClick={() => { setError(""); setDialog("create"); }} className="rounded bg-[#d94d3d] px-4 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">INVITE PLAYER</button>}
    </div>
    {player.account_linked ? <p className="mt-3 text-sm text-slate-600">This player already has a linked account. No new invitation can be sent.</p> : <p className="mt-3 text-sm text-slate-600">Send one secure invitation for an active, eligible team membership. The link expires after 72 hours.</p>}
    {notice && <p className="mt-3 text-sm font-semibold text-emerald-700" role="status">{notice}</p>}
    {state === "loading" && <p className="mt-4 text-sm text-slate-500" role="status">Loading invitation history…</p>}
    {state === "error" && <p className="mt-4 text-sm text-red-700" role="alert">{error} <button type="button" onClick={load} className="font-bold underline">RETRY</button></p>}
    {state === "ready" && <>
      {livePending && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-extrabold text-amber-900">Pending invitation</p><p className="mt-1 text-sm text-amber-900">{livePending.invited_email} · {livePending.team.name} · expires {formattedDate(livePending.expires_at)}</p><div className="mt-3 flex flex-wrap gap-4"><button type="button" disabled={busy} onClick={resend} className="text-xs font-extrabold text-[#b83729] underline disabled:cursor-not-allowed disabled:opacity-50">{busy ? "RESENDING…" : "RESEND EMAIL"}</button><button type="button" disabled={busy} onClick={() => { setError(""); setDialog("revoke"); }} className="text-xs font-extrabold text-red-700 underline disabled:cursor-not-allowed disabled:opacity-50">REVOKE INVITATION</button></div></div>}
      {!livePending && expiredPending && <p className="mt-4 text-sm text-slate-600">The latest invitation expired on {formattedDate(expiredPending.expires_at)}. A replacement may be sent; server-side expiry checks remain authoritative.</p>}
      <div className="mt-5 border-t border-slate-100 pt-4"><h3 className="text-xs font-extrabold tracking-[.12em] text-slate-500">INVITATION HISTORY</h3>{invitations.length ? <ul className="mt-3 space-y-2">{invitations.map((invitation) => <li key={invitation.invitation_id} className="rounded border border-slate-100 p-3 text-sm text-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><b>{invitation.status}</b><span className="text-xs text-slate-500">{formattedDate(invitation.created_at)}</span></div><p className="mt-1">{invitation.invited_email} · {invitation.team.name}</p><p className="mt-1 text-xs text-slate-500">Expires {formattedDate(invitation.expires_at)}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No invitation history in your authorized team scope.</p>}</div>
    </>}
    {dialog === "create" && <div role="dialog" aria-modal="true" aria-labelledby="invite-player-title" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={create} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl"><h2 ref={dialogTitleRef} tabIndex={-1} id="invite-player-title" className="text-lg font-extrabold text-slate-900">Invite {player.name}</h2><p className="mt-2 text-sm text-slate-600">The player will receive a secure invitation email with account setup and acceptance access.</p><label className="mt-4 block text-xs font-bold text-slate-600">Eligible team<select value={activeTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} required className="mt-1 w-full rounded border border-slate-300 p-2.5 text-sm">{safeTeams.map((team) => <option key={team.team_id} value={team.team_id}>{team.name}</option>)}</select></label><label className="mt-3 block text-xs font-bold text-slate-600">Invitation email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded border border-slate-300 p-2.5 text-sm" /></label>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={closeDialog} className="px-3 py-2 text-xs font-extrabold text-slate-700">CANCEL</button><button disabled={busy} className="rounded bg-[#d94d3d] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy ? "SENDING…" : "SEND INVITATION EMAIL"}</button></div></form></div>}
    {dialog === "revoke" && livePending && <div role="dialog" aria-modal="true" aria-labelledby="revoke-player-invite-title" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><h2 ref={dialogTitleRef} tabIndex={-1} id="revoke-player-invite-title" className="text-lg font-extrabold text-slate-900">Revoke invitation?</h2><p className="mt-3 text-sm text-slate-600">Revoke the pending invitation sent to {livePending.invited_email}? This cannot be undone, but invitation history will remain.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={closeDialog} className="px-3 py-2 text-xs font-extrabold text-slate-700">CANCEL</button><button type="button" disabled={busy} onClick={revoke} className="rounded bg-red-700 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy ? "REVOKING…" : "REVOKE INVITATION"}</button></div></div></div>}
  </section>;
}
