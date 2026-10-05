import { useState } from "react";
import { Link } from "react-router-dom";
import { changeCurrentUserPassword } from "../../auth/services/authService";
import { getPasswordRequirements } from "../../auth/utils/registerValidation";

const blank = { current_password: "", new_password: "", confirm_password: "" };

const validate = (form) => {
  const errors = {};
  if (!form.current_password) errors.current_password = "Current password is required.";
  if (!form.new_password) errors.new_password = "New password is required.";
  if (!form.confirm_password) errors.confirm_password = "Please confirm your new password.";
  else if (form.new_password !== form.confirm_password) errors.confirm_password = "New passwords do not match.";
  return errors;
};

export default function PasswordChangePage() {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const requirements = getPasswordRequirements(form.new_password);

  const change = (event) => {
    const next = { ...form, [event.target.name]: event.target.value };
    setForm(next);
    if (errors[event.target.name]) setErrors((current) => ({ ...current, [event.target.name]: validate(next)[event.target.name] || "" }));
    if (event.target.name === "new_password" && errors.confirm_password) setErrors((current) => ({ ...current, confirm_password: validate(next).confirm_password || "" }));
    if (notice) setNotice("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) return setErrors(validationErrors);
    setErrors({});
    setNotice("");
    setSaving(true);
    try {
      await changeCurrentUserPassword(form);
      setForm(blank);
      setNotice("Your password has been changed successfully.");
    } catch (error) {
      const apiFieldErrors = Array.isArray(error.response?.data?.errors) ? error.response.data.errors.reduce((all, item) => ({ ...all, ...(item?.field ? { [item.field]: item.message } : {}) }), {}) : {};
      if (Object.keys(apiFieldErrors).length) setErrors(apiFieldErrors);
      else setNotice(error.response?.data?.message || "Your password could not be changed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 text-slate-900 sm:px-6"><div className="mx-auto max-w-2xl"><nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500"><Link to="/account" className="hover:text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">Account</Link><span aria-hidden="true"> / </span><span>Change Password</span></nav><section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><header><h1 className="text-3xl font-extrabold tracking-tight">Change Password</h1><p className="mt-2 text-sm text-slate-600">Choose a secure password for your account.</p></header>{notice && <p role={notice.includes("successfully") ? "status" : "alert"} className={`mt-5 rounded-md px-4 py-3 text-sm ${notice.includes("successfully") ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-800"}`}>{notice}</p>}<form onSubmit={save} noValidate className="mt-6 space-y-5"><PasswordField id="current-password" name="current_password" label="CURRENT PASSWORD" value={form.current_password} onChange={change} error={errors.current_password} disabled={saving} autoComplete="current-password" /><PasswordField id="new-password" name="new_password" label="NEW PASSWORD" value={form.new_password} onChange={change} error={errors.new_password} disabled={saving} autoComplete="new-password" /><PasswordField id="confirm-new-password" name="confirm_password" label="CONFIRM NEW PASSWORD" value={form.confirm_password} onChange={change} error={errors.confirm_password} disabled={saving} autoComplete="new-password" /><div className="rounded-md border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-bold tracking-[.08em] text-slate-600">PASSWORD REQUIREMENTS</p><ul className="mt-2 grid gap-1.5 text-xs text-slate-600 sm:grid-cols-2"><Requirement pass={requirements.minLength}>At least 8 characters</Requirement><Requirement pass={requirements.uppercase}>One uppercase letter</Requirement><Requirement pass={requirements.lowercase}>One lowercase letter</Requirement><Requirement pass={requirements.number}>One number</Requirement><Requirement pass={requirements.specialCharacter}>One special character</Requirement></ul></div><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><Link to="/account" className="rounded-md border border-slate-300 px-5 py-3 text-center text-xs font-extrabold tracking-wide text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">CANCEL</Link><button type="submit" disabled={saving} className="rounded-md bg-[#FF553D] px-5 py-3 text-xs font-extrabold tracking-wide text-white hover:bg-[#e94a35] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "CHANGING PASSWORD..." : "CHANGE PASSWORD"}</button></div></form></section></div></main>;
}

function PasswordField({ id, label, error, disabled, ...props }) { const [visible, setVisible] = useState(false); return <div><label htmlFor={id} className="mb-1.5 block text-[11px] font-bold tracking-[.08em] text-slate-600">{label}</label><div className="relative"><input id={id} type={visible ? "text" : "password"} required disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`h-11 w-full rounded-md border bg-white px-3.5 pr-16 text-sm text-slate-900 outline-none transition-colors focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/15 ${error ? "border-red-500" : "border-slate-300"}`} {...props} /><button type="button" disabled={disabled} onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wide text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">{visible ? "HIDE" : "SHOW"}</button></div>{error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-[11px] text-red-600">{error}</p>}</div>; }
function Requirement({ pass, children }) { return <li className={pass ? "font-medium text-green-700" : "text-slate-500"}>{pass ? "✓" : "•"} {children}</li>; }
