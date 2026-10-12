import { useState } from "react";
import { Link } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import RecoveryLayout from "../components/RecoveryLayout";
import { resetPassword } from "../services/authService";
import { validateResetForm } from "../utils/passwordResetValidation";

export default function ResetPasswordPage() {
  const [token, setToken] = useState(() => window.__hplResetToken || "");
  const [newPassword, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState(!/^[a-f0-9]{64}$/.test(token));
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const validation = validateResetForm(newPassword, confirmPassword);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setError(""); setBusy(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true); setToken(""); setPassword(""); setConfirm(""); delete window.__hplResetToken;
    } catch (err) {
      const message = err.response?.data?.message || "Unable to reset your password. Please try again later.";
      setError(message);
      if (err.response?.status === 400 && message.includes("reset link")) { setInvalid(true); setToken(""); delete window.__hplResetToken; }
    } finally { setBusy(false); }
  }
  return <RecoveryLayout title="Reset Your Password">
    {success ? <p role="status" className="rounded-lg bg-green-50 p-4 text-[#087554]">Password reset successfully. Log in with your new password.</p> : invalid ?
      <div role="alert" className="space-y-4 text-sm"><p>This reset link is invalid or expired.</p><Link to="/forgot-password" className="font-bold text-[#087554] hover:underline">Request a new reset link</Link></div> :
      <form onSubmit={submit} noValidate className="space-y-5">
        <PasswordInput id="new-password" label="NEW PASSWORD" name="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setPassword(e.target.value)} disabled={busy} required error={errors.newPassword} />
        <p className="text-xs leading-5 text-[#66758A]">Use at least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character. Maximum 72 bytes.</p>
        <PasswordInput id="confirm-password" label="CONFIRM PASSWORD" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} disabled={busy} required error={errors.confirmPassword} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[#087554] p-3 font-bold text-white hover:bg-[#065E44] disabled:opacity-60">{busy ? "Resetting…" : "Reset Password"}</button>
      </form>}
  </RecoveryLayout>;
}
