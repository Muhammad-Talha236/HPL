import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { updateCurrentUser } from "../../auth/services/authService";
import apiClient from "../../../services/apiClient";

const emptyForm = { name: "", email: "", phone: "", profile_image: "" };
const initial = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "U";
const namePattern = /^[A-Za-z][A-Za-z\s'-]*$/;
const phonePattern = /^03\d{9}$/;

const apiErrors = (error) => Array.isArray(error.response?.data?.errors)
  ? error.response.data.errors.reduce((all, item) => ({ ...all, ...(item?.field ? { [item.field]: item.message } : {}) }), {})
  : {};

const validate = (form) => {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Full name is required.";
  else if (name.length < 2 || name.length > 100 || !namePattern.test(name)) errors.name = "Use 2–100 letters, spaces, apostrophes, or hyphens.";
  if (form.phone.trim() && !phonePattern.test(form.phone.trim())) errors.phone = "Enter an 11-digit mobile number starting with 03.";
  if (form.profile_image.trim() && (!/^https?:\/\//i.test(form.profile_image.trim()) || form.profile_image.trim().length > 2048)) errors.profile_image = "Use a valid HTTP or HTTPS image URL.";
  return errors;
};

export default function ProfileEditPage() {
  const { refreshUser } = useAuth();
  const [state, setState] = useState({ status: "loading" });
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setNotice("");
    try {
      const response = await apiClient.get("/auth/me");
      const account = response.data?.data;
      setForm({ name: account?.name || "", email: account?.email || "", phone: account?.phone || "", profile_image: account?.profile_image || "" });
      setState({ status: "success", account });
    } catch (error) {
      setState({ status: "error", message: error.response?.data?.message || "Your profile could not be loaded." });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const change = (event) => {
    const { name, value } = event.target;
    const next = { ...form, [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 11) : value };
    setForm(next);
    if (errors[name]) setErrors((current) => ({ ...current, [name]: validate(next)[name] || "" }));
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
      await updateCurrentUser({ name: form.name.trim(), phone: form.phone.trim() || null, profile_image: form.profile_image.trim() || null });
      const account = await refreshUser();
      setForm({ name: account.name || "", email: account.email || "", phone: account.phone || "", profile_image: account.profile_image || "" });
      setState({ status: "success", account });
      setNotice("Your profile has been saved.");
    } catch (error) {
      const fields = apiErrors(error);
      if (Object.keys(fields).length) setErrors(fields);
      else setNotice(error.response?.data?.message || "Your profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 text-slate-900 sm:px-6"><div className="mx-auto max-w-3xl"><nav aria-label="Breadcrumb" className="text-sm font-semibold text-slate-500"><Link to="/account" className="hover:text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">Account</Link><span aria-hidden="true"> / </span><span>Edit Profile</span></nav><header className="mt-5"><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Edit Profile</h1><p className="mt-2 text-sm text-slate-600">Update your personal account information.</p></header>{state.status === "loading" && <div role="status" aria-label="Loading profile" className="mt-7 h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />}{state.status === "error" && <section role="alert" className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{state.message}</p><button type="button" onClick={load} className="mt-3 rounded border border-red-300 px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400">TRY AGAIN</button></section>}{state.status === "success" && <form onSubmit={save} noValidate className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">{notice && <p role="status" className={`mb-5 rounded-md px-4 py-3 text-sm ${notice.includes("saved") ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-800"}`}>{notice}</p>}<div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6">{form.profile_image ? <img src={form.profile_image} alt={`${form.name || "User"} profile`} className="h-16 w-16 rounded-full border border-slate-200 object-cover" /> : <span aria-label={`${form.name || "User"} profile image unavailable`} className="grid h-16 w-16 place-items-center rounded-full bg-[#FF553D] text-xl font-extrabold text-white">{initial(form.name)}</span>}<div><p className="text-lg font-extrabold">{form.name || "Your profile"}</p><p className="text-sm text-slate-500">{form.email}</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><TextField id="profile-name" name="name" label="FULL NAME" value={form.name} onChange={change} error={errors.name} disabled={saving} required autoComplete="name" /><div><label htmlFor="profile-email" className="mb-1.5 block text-[11px] font-bold tracking-[.08em] text-slate-600">EMAIL ADDRESS <span className="font-medium text-slate-400">(READ ONLY)</span></label><input id="profile-email" value={form.email} readOnly aria-readonly="true" className="h-11 w-full rounded-md border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-500 outline-none" /><p className="mt-1.5 text-[11px] text-slate-500">Email changes require verification and are not available here.</p></div><TextField id="profile-phone" name="phone" label="PHONE NUMBER (OPTIONAL)" value={form.phone} onChange={change} error={errors.phone} disabled={saving} type="tel" inputMode="numeric" maxLength={11} autoComplete="tel" /><TextField id="profile-image" name="profile_image" label="PROFILE IMAGE URL (OPTIONAL)" value={form.profile_image} onChange={change} error={errors.profile_image} disabled={saving} type="url" autoComplete="url" placeholder="https://example.com/profile.jpg" /></div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to="/account" className="rounded-md border border-slate-300 px-5 py-3 text-center text-xs font-extrabold tracking-wide text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400">CANCEL</Link><button type="submit" disabled={saving} className="rounded-md bg-[#FF553D] px-5 py-3 text-xs font-extrabold tracking-wide text-white hover:bg-[#e94a35] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "SAVING CHANGES..." : "SAVE CHANGES"}</button></div></form>}</div></main>;
}

function TextField({ id, label, error, ...props }) { return <div><label htmlFor={id} className="mb-1.5 block text-[11px] font-bold tracking-[.08em] text-slate-600">{label}</label><input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`h-11 w-full rounded-md border bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/15 ${error ? "border-red-500" : "border-slate-300"}`} {...props} />{error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-[11px] text-red-600">{error}</p>}</div>; }
