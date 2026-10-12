import { useState } from "react";
import AuthInput from "../components/AuthInput";
import RecoveryLayout from "../components/RecoveryLayout";
import { requestPasswordReset } from "../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254) { setError("Please enter a valid email address."); return; }
    setError(""); setBusy(true);
    try { setMessage((await requestPasswordReset(email.trim())).message); }
    catch (err) { setError(err.response?.data?.message || "Unable to send your request. Please try again later."); }
    finally { setBusy(false); }
  }
  return <RecoveryLayout title="Forgot Password?">
    <p className="mb-6 text-sm text-[#66758A]">Enter your email address and we'll send you a link to reset your password.</p>
    {message ? <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-[#087554]">{message}</p> :
      <form onSubmit={submit} noValidate className="space-y-5">
        <AuthInput id="reset-email" label="EMAIL ADDRESS" type="email" name="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} autoComplete="email" required disabled={busy} error={error} />
        <button disabled={busy} className="w-full rounded-lg bg-[#087554] p-3 font-bold text-white hover:bg-[#065E44] disabled:opacity-60">{busy ? "Sending…" : "Send Reset Link"}</button>
      </form>}
  </RecoveryLayout>;
}
