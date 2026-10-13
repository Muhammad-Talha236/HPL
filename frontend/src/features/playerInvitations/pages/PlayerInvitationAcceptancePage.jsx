import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import apiClient from "../../../services/apiClient";
import PasswordInput from "../../auth/components/PasswordInput";
import { validateRegisterField } from "../../auth/utils/registerValidation";
import { registerAndAcceptInvitation } from "../services/invitationOnboarding";
import logo from "../../../assets/logo.png";

export default function PlayerInvitationAcceptancePage() {
  const params = useParams();
  const [token] = useState(() => params.token || window.__hplPlayerInvitationToken || "");
  const { user, isAuthenticated, isAuthLoading, login, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState({ loading: true });
  const [setup, setSetup] = useState(false);
  const [form, setForm] = useState({ name: "", password: "", confirm_password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const load = useCallback(async () => {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { setPreview({ loading: false, valid: false }); return; }
    try { const r = await apiClient.get(`/player-invitations/accept/${token}`); setPreview({ loading: false, ...r.data.data }); }
    catch { setPreview({ loading: false, valid: false }); }
  }, [token]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const signIn = () => navigate("/login", { state: { from: { pathname: `/invitations/player/${encodeURIComponent(token)}` } } });
  const switchAccount = () => { logout(); signIn(); };
  const change = e => setForm(current => ({ ...current, [e.target.name]: e.target.value }));
  async function register(event) {
    event.preventDefault(); if (busy) return;
    const passwordError = validateRegisterField("password", { name: "", email: "", phone: "", password: form.password, confirmPassword: form.confirm_password });
    if (passwordError || form.password !== form.confirm_password) { setError(passwordError || "Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const result = await registerAndAcceptInvitation({ api: apiClient, login, token, form, accepted: setup, onRegistered: () => setForm({ name: "", password: "", confirm_password: "" }) });
      await joined(result);
    } catch (err) { setError(err.response?.data?.message || "Signup or joining could not be completed. If your account was created, sign in and retry Accept Invitation using this link."); }
    finally { setBusy(false); }
  }
  async function joined(result) {
    delete window.__hplPlayerInvitationToken;
    if (refreshUser) { try { await refreshUser(); } catch { /* Membership is already committed. */ } }
    navigate("/player", { replace: true, state: { joinedTeamName: result.data.team.name, membershipConfirmation: result.message } });
  }
  async function decide(operation) {
    if (busy) return; setBusy(true); setError("");
    try {
      const result = await apiClient.post(`/player-invitations/accept/${token}${operation === "decline" ? "/decline" : ""}`);
      delete window.__hplPlayerInvitationToken;
      if (operation === "decline") { setSuccess("Invitation declined."); setPreview({ loading: false, valid: false }); }
      else await joined(result.data);
    } catch (err) { setError(err.response?.data?.message || "Invitation cannot be accepted with this account."); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-dvh place-items-center bg-[#F4F7FB] px-4 py-10 text-[#10213F]">
    <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <img src={logo} alt="Hunza Premier League" className="mx-auto mb-5 h-16 w-16 object-contain" />
      <h1 className="text-center text-2xl font-bold">Player Invitation</h1>
      {preview.loading || isAuthLoading ? <p role="status" className="mt-6 text-sm text-slate-500">Checking invitation...</p> : !preview.valid ? <p role="status" className="mt-6 text-sm text-slate-600">{success || "This invitation is unavailable, expired, or already used. Visit My Invitations to continue an accepted invitation."}</p> : <>
        <div className="mt-6 rounded-xl bg-[#F0F7F3] p-4"><h2 className="break-words font-semibold text-[#087554]">{preview.team?.name}</h2><p className="mt-2 text-xs text-slate-500">For {preview.invited_email} | Expires {new Date(preview.expires_at).toLocaleString()}</p></div>
        <p className="mt-5 text-sm leading-6 text-slate-500">Accept this invitation with the invited account to become an active team member. Your player profile can be completed later. Your existing account and role will be preserved.</p>
        {success && <p role="status" className="mt-4 text-sm text-green-700">{success}</p>}
        {!isAuthenticated && !setup && <div className="mt-6 grid gap-3"><button onClick={signIn} className="rounded-lg bg-[#087554] p-3 text-sm font-semibold text-white">Sign in to Accept</button><button onClick={() => setSetup(true)} className="rounded-lg border border-slate-200 p-3 text-sm font-semibold">Accept Invitation &amp; Create Account</button><button disabled={busy} onClick={() => decide("decline")} className="text-xs font-semibold text-slate-500">Decline Invitation</button></div>}
        {!isAuthenticated && setup && <form onSubmit={register} className="mt-6 space-y-4">
          <p className="text-xs text-slate-500">Sign up with the invited mailbox to accept this invitation and join the team. The email link proves ownership; no separate player profile is required.</p>
          <label className="block text-xs font-semibold">Full name<input name="name" value={form.name} onChange={change} required minLength={2} maxLength={100} autoComplete="name" disabled={busy} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
          <PasswordInput id="invite-password" label="PASSWORD" name="password" value={form.password} onChange={change} autoComplete="new-password" required disabled={busy} />
          <PasswordInput id="invite-confirm" label="CONFIRM PASSWORD" name="confirm_password" value={form.confirm_password} onChange={change} autoComplete="new-password" required disabled={busy} />
          <p className="text-xs leading-5 text-slate-500">At least 8 characters with uppercase, lowercase, a number, and a special character. Maximum 72 bytes.</p>
          <button disabled={busy} className="w-full rounded-lg bg-[#087554] p-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Creating account..." : "Create Account & Join Team"}</button><button type="button" onClick={signIn} className="text-sm font-semibold text-[#087554]">Already registered? Sign in</button>
        </form>}
        {isAuthenticated && <div className="mt-6 space-y-4"><p className="break-all text-xs text-slate-500">Signed in as {user?.email}</p><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => decide("accept")} className="rounded-lg bg-[#087554] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Processing..." : "Accept Invitation"}</button><button disabled={busy} onClick={() => decide("decline")} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-50">Decline</button></div><button disabled={busy} onClick={switchAccount} className="text-xs font-semibold text-[#087554]">Not the invited account? Switch Account</button></div>}
      </>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-between gap-3 text-xs font-semibold text-[#087554]"><Link to="/">Back to HPL</Link>{isAuthenticated && <Link to="/player/invitations">My Invitations</Link>}</div>
    </section>
  </main>;
}
