import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import apiClient from "../../../services/apiClient";

const inputClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#087554]";
const emptyForm = { name: "", date_of_birth: "", gender: "", position: "", preferred_foot: "", profile_photo: "" };
export default function MyPlayerPage() {
  const [editing, setEditing] = useState(false);
  const { refreshUser } = useAuth();
  const [state, setState] = useState({ loading: true, invitations: [] });
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();
  const [notice, setNotice] = useState(() => location.state?.membershipConfirmation || (location.state?.joinedTeamName ? `Welcome to ${location.state.joinedTeamName}! You are now a member of this team.` : ""));
  const load = useCallback(async () => {
    try {
      const [profile, invitations] = await Promise.all([apiClient.get("/player-invitations/me/profile"), apiClient.get("/player-invitations/me/invitations")]);
      setState({ loading: false, profile: profile.data.data, invitations: invitations.data.data });
      const existing = profile.data.data;
      if (existing) setForm({ name: existing.name || "", date_of_birth: existing.date_of_birth?.slice(0, 10) || "", gender: ["MALE", "MEN"].includes(existing.gender) ? "MALE" : ["FEMALE", "WOMEN"].includes(existing.gender) ? "FEMALE" : "", position: existing.position || "", preferred_foot: existing.preferred_foot || "", profile_photo: existing.profile_photo || "" });
    } catch (err) { setState({ loading: false, invitations: [], error: err.response?.data?.message || "Player information could not be loaded." }); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  async function save(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([key, value]) => value || ["name", "date_of_birth", "gender", "position"].includes(key)));
      const r = await apiClient.put("/player-invitations/me/profile", payload);
      setNotice(r.data.message); setEditing(false); if (refreshUser) { try { await refreshUser(); } catch { /* The completed server transition remains authoritative. */ } } await load();
    } catch (err) { setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Profile could not be completed."); }
    finally { setBusy(false); }
  }
  async function join(invitationId) {
    if (busy) return; setBusy(true); setError("");
    try {
      const r = await apiClient.post(`/player-invitations/me/invitations/${invitationId}/activate`);
      setNotice(r.data.message);
      if (refreshUser) { try { await refreshUser(); } catch { /* Membership is already committed. */ } }
      await load();
    } catch (err) { setError(err.response?.data?.message || "Team membership could not be activated."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-28 text-[#10213F] sm:px-6">
    <h1 className="text-2xl font-bold">My Player Profile</h1><p className="mt-2 text-sm text-slate-500">View your teams and football activity. Player profile details can be added later.</p>
    {state.loading ? <p role="status" className="mt-6">Loading player information…</p> : state.error ? <p role="alert" className="mt-6 text-sm text-red-700">{state.error} <button onClick={load} className="underline">Retry</button></p> : <>
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {state.profile && editing && <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Edit Player Profile</h2><p className="mt-2 text-sm leading-6 text-slate-500">Your membership is already active. These details are required for competition and match eligibility; you can complete them later.</p>
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Full name<input name="name" required minLength={2} maxLength={100} value={form.name} onChange={change} disabled={busy} autoComplete="name" className={inputClass} /></label>
          <label className="text-xs font-semibold">Date of birth<input name="date_of_birth" type="date" required min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={change} disabled={busy} className={inputClass} /></label>
          <label className="text-xs font-semibold">Gender<select name="gender" required value={form.gender} onChange={change} disabled={busy} className={inputClass}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></label>
          <label className="text-xs font-semibold">Playing position<input name="position" required maxLength={50} value={form.position} onChange={change} disabled={busy} className={inputClass} /></label>
          <label className="text-xs font-semibold">Preferred foot (optional)<select name="preferred_foot" value={form.preferred_foot} onChange={change} disabled={busy} className={inputClass}><option value="">Not specified</option><option value="LEFT">Left</option><option value="RIGHT">Right</option><option value="BOTH">Both</option></select></label>
          <label className="text-xs font-semibold">Profile photo HTTPS URL (optional)<input name="profile_photo" type="url" value={form.profile_photo} onChange={change} disabled={busy} className={inputClass} /></label>
          <button disabled={busy} className="rounded-lg bg-[#087554] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Save Player Profile"}</button>
          <button type="button" onClick={() => setEditing(false)} disabled={busy} className="text-sm text-slate-500 sm:col-span-2">Cancel</button>
        </form>
      </section>}
      {state.profile ? <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{state.profile.name}</h2><button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#087554]">Edit Player Profile (optional)</button></div><p className="mt-2 text-sm text-slate-500">{state.profile.registration_number} · {state.profile.position} · {state.profile.status}</p><h3 className="mt-5 text-sm font-semibold">My Team</h3>{state.profile.team_players.map(m => <p key={m.team_player_id} className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">{m.team.logo && <img src={m.team.logo} alt={`${m.team.name} logo`} className="h-8 w-8 rounded-full object-contain" />}{m.team.name} | {m.status} · Jersey {m.jersey_number ?? "not assigned"} · Joined {new Date(m.joined_at).toLocaleDateString()}</p>)}{!state.profile.team_players.length && <p className="mt-2 text-sm text-slate-500">No active team membership.</p>}<h3 className="mt-5 text-sm font-semibold">My Competitions</h3>{state.profile.competition_players.map(c => <p key={c.competition_player_id} className="mt-2 text-sm text-slate-600">{c.registration.competition.name}</p>)}{!state.profile.competition_players.length && <p className="mt-2 text-sm text-slate-500">No competition participation recorded.</p>}<h3 className="mt-5 text-sm font-semibold">My Match Participation</h3>{state.profile.match_players.map(m => <p key={m.match_player_id} className="mt-2 text-sm text-slate-600">{m.match.home_team.name} vs {m.match.away_team.name} · {m.minutes_played ?? "—"} minutes</p>)}{!state.profile.match_players.length && <p className="mt-2 text-sm text-slate-500">No match participation recorded.</p>}</section> : <p className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Your player profile will be created when you accept a team invitation.</p>}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-semibold">My Invitations</h2><div className="mt-4 space-y-3">{state.invitations.map(i => <article key={i.invitation_id} className="rounded-lg border border-slate-100 p-4"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm font-semibold">{i.team?.name}</p><span className="text-xs text-slate-500">{i.status === "ACCEPTED_PENDING_PROFILE" ? "Accepted / ready to join" : i.status.replaceAll("_", " ")}</span></div>{i.status === "ACCEPTED_PENDING_PROFILE" && <button disabled={busy} onClick={() => join(i.invitation_id)} className="mt-3 inline-block text-xs font-semibold text-[#087554] disabled:opacity-50">Join Team</button>}{i.status === "PENDING" && <p className="mt-2 text-xs text-slate-500">Open the secure link in your invitation email to accept or decline.</p>}</article>)}{!state.invitations.length && <p className="text-sm text-slate-500">No invitations available.</p>}</div></section>
    </>}
  </main>;
}
