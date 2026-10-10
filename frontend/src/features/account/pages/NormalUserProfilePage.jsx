import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, ChevronRight, CircleUserRound, Edit3, MapPin, Trophy, UsersRound } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import { getMyCompetitions, getMyMatches, getMyProfile, updateMyProfile, uploadProfilePhoto } from "../services/profileService";

const TABS = [
  { id: "profile", label: "Profile", icon: CircleUserRound },
  { id: "competitions", label: "Competitions", icon: Trophy },
  { id: "matches", label: "Matches", icon: CalendarDays },
];
const formatRole = (value) => String(value || "USER").toLowerCase().split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Not provided";
const inputDate = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const initial = (name) => name?.trim()?.[0]?.toUpperCase() || "U";
const handle = (email) => email?.split("@")[0] || "member";

function Avatar({ user, large = false, preview = "" }) {
  const src = preview || user?.profile_image;
  const size = large ? "h-24 w-24 sm:h-[108px] sm:w-[108px]" : "h-12 w-12";
  return src ? <img src={src} alt={`${user?.name || "User"} profile`} className={`${size} shrink-0 rounded-full border-2 border-white object-cover shadow-sm`} /> : <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[#0B5D46] text-2xl font-extrabold text-white shadow-sm`}>{initial(user?.name)}</span>;
}

export default function NormalUserProfilePage() {
  const { refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((item) => item.id === params.get("tab")) ? params.get("tab") : "profile";
  const [state, setState] = useState({ status: "loading", profile: null, competitions: [], matches: [] });
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const [profile, competitions, matches] = await Promise.all([getMyProfile(), getMyCompetitions(), getMyMatches()]);
      setState({ status: "success", profile: profile.data, competitions: competitions.data || [], matches: matches.data || [] });
    } catch (error) {
      setState({ status: "error", profile: null, competitions: [], matches: [], message: error.response?.data?.message || "Your profile could not be loaded." });
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);
  const selectTab = (next) => setParams(next === "profile" ? {} : { tab: next });
  const tabKeyDown = (event) => {
    const current = TABS.findIndex((item) => item.id === tab);
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    selectTab(TABS[next].id);
    document.getElementById(`profile-tab-${TABS[next].id}`)?.focus();
  };

  if (state.status === "loading") return <main className="min-h-screen bg-[#f5f8fb] px-4 pb-16 pt-24 sm:px-6"><div className="mx-auto h-96 max-w-6xl animate-pulse rounded-xl bg-white" role="status" aria-label="Loading profile" /></main>;
  if (state.status === "error") return <main className="min-h-screen bg-[#f5f8fb] px-4 pb-16 pt-24 sm:px-6"><div className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700" role="alert">{state.message}<button type="button" onClick={load} className="ml-4 rounded border border-red-300 px-3 py-1.5 font-semibold">Try again</button></div></main>;
  const user = state.profile;

  return <main className="min-h-screen bg-[#f5f8fb] px-4 pb-16 pt-24 text-[#10213f] sm:px-6"><div className="mx-auto max-w-6xl">
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-slate-500"><Link to="/" className="hover:text-[#0B5D46]">Home</Link><ChevronRight size={14}/><span>Users</span><ChevronRight size={14}/><span className="truncate text-slate-700">{user.name}</span></nav>
    {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <section className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_6px_22px_rgba(15,36,67,.06)]">
      <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:px-7 sm:py-5"><Avatar user={user} large/><div className="min-w-0 flex-1"><h1 className="truncate text-2xl font-extrabold tracking-tight text-[#0a1733]">{user.name}</h1><p className="mt-0.5 text-sm text-slate-500">@{handle(user.email)}</p><div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><UsersRound size={15}/>{formatRole(user.role)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15}/>{user.location || "Location not provided"}</span><span className="inline-flex items-center gap-1.5"><CalendarDays size={15}/>Joined {formatDate(user.created_at)}</span></div></div><button type="button" onClick={() => setEditing(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-slate-800 transition hover:border-[#0B5D46] hover:text-[#0B5D46]"><Edit3 size={14}/>Edit Profile</button></div>
      <div role="tablist" aria-label="Profile content" onKeyDown={tabKeyDown} className="grid grid-cols-3 border-t border-slate-100">{TABS.map(({ id, label, icon: Icon }) => <button key={id} id={`profile-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`profile-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => selectTab(id)} className={`flex items-center justify-center gap-2 border-b-2 px-2 py-3.5 text-xs font-semibold transition ${tab === id ? "border-[#07944b] text-[#07944b]" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}><Icon size={16}/>{label}</button>)}</div>
    </section>
    <section id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-tab-${tab}`} className="mt-3">{tab === "profile" && <ProfileInformation user={user} onEdit={() => setEditing(true)}/>} {tab === "competitions" && <Competitions items={state.competitions}/>} {tab === "matches" && <Matches items={state.matches}/>}</section>
  </div>{editing && <EditProfileDialog user={user} onClose={() => setEditing(false)} onSaved={async (message) => { setEditing(false); setNotice(message); await Promise.all([refreshUser(), load()]); }}/>}</main>;
}

function ProfileInformation({ user, onEdit }) { const rows = [["Full Name", user.name], ["Email", user.email], ["Phone Number", user.phone], ["Location", user.location], ["Date of Birth", formatDate(user.date_of_birth)], ["Member Since", formatDate(user.created_at)]]; return <article className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-[0_6px_22px_rgba(15,36,67,.05)] sm:px-8"><header className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"><h2 className="flex items-center gap-3 text-sm font-bold text-[#0a1733]"><CircleUserRound size={18}/>Personal Information</h2><button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-[#0B5D46] hover:text-[#0B5D46]"><Edit3 size={13}/>Edit Profile</button></header><dl className="pt-1">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[9.3rem_1fr] gap-4 border-b border-slate-100 py-2.5 text-xs last:border-0 sm:text-sm"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-[#1b2944]">{value || "Not provided"}</dd></div>)}</dl></article>; }
function Empty({ children, to, label }) { return <div className="rounded-xl border border-slate-100 bg-white p-8 text-center shadow-[0_6px_22px_rgba(15,36,67,.05)]"><p className="text-sm text-slate-500">{children}</p><Link to={to} className="mt-4 inline-flex rounded-md border border-[#0B5D46] px-3 py-2 text-xs font-bold text-[#0B5D46]">{label}</Link></div>; }
function Competitions({ items }) { return items.length ? <div className="grid gap-3">{items.map((item) => <Link key={item.competition_id} to={`/competitions/${item.competition_id}`} className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_6px_22px_rgba(15,36,67,.05)] transition hover:border-[#0B5D46]/40"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-[#0a1733]">{item.name}</h2><p className="mt-1 text-xs text-slate-500">{item.season?.name || "Season not provided"} · {item.team?.name || "Team not provided"}</p></div><span className="rounded-full bg-[#edf8f1] px-2.5 py-1 text-[10px] font-bold text-[#0B5D46]">{item.participation_status}</span></div><p className="mt-3 text-xs text-slate-600">{item.participation_role} · {item.status}</p></Link>)}</div> : <Empty to="/competitions" label="Browse Competitions">No competition participation yet.</Empty>; }
function Matches({ items }) { return items.length ? <div className="grid gap-3">{items.map((item) => <Link key={item.match_id} to={`/matches/${item.match_id}`} className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_6px_22px_rgba(15,36,67,.05)] transition hover:border-[#0B5D46]/40"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold text-[#0a1733]">{item.home_team.name} <span className="px-1 text-slate-400">{item.status === "COMPLETED" || item.status === "LIVE" ? `${item.home_score} – ${item.away_score}` : "vs"}</span> {item.away_team.name}</p><span className="text-xs font-semibold text-[#0B5D46]">{item.status}</span></div><p className="mt-2 text-xs text-slate-500">{item.competition.name} · {formatDate(item.match_date)} · {item.venue?.name || "Venue not provided"}</p></Link>)}</div> : <Empty to="/matches" label="Browse Matches">No matches associated with your profile yet.</Empty>; }

function EditProfileDialog({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "", location: user.location || "", date_of_birth: inputDate(user.date_of_birth) });
  const [file, setFile] = useState(null); const [preview, setPreview] = useState(""); const [errors, setErrors] = useState({}); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const set = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); };
  const choose = (next) => { if (!next) return; if (!next.type.startsWith("image/") || next.size > 10 * 1024 * 1024) { setErrors((current) => ({ ...current, photo: "Choose a supported image up to 10 MB." })); return; } if (preview) URL.revokeObjectURL(preview); setFile(next); setPreview(URL.createObjectURL(next)); setErrors((current) => ({ ...current, photo: "" })); };
  const save = async (event) => { event.preventDefault(); const next = {}; if (form.name.trim().length < 2) next.name = "Enter your full name."; if (form.phone.trim() && !/^\+?[0-9][0-9\s-]{6,24}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number."; if (form.date_of_birth && new Date(`${form.date_of_birth}T00:00:00`) >= new Date()) next.date_of_birth = "Date of birth must be in the past."; if (Object.keys(next).length) return setErrors(next); setSaving(true); setMessage(""); try { if (file) await uploadProfilePhoto(file); await updateMyProfile({ name: form.name.trim(), phone: form.phone.trim() || null, location: form.location.trim() || null, date_of_birth: form.date_of_birth || null }); await onSaved("Your profile has been saved."); } catch (error) { setMessage(error.response?.data?.message || error.message || "Your profile could not be saved."); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/35 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" className="mx-auto my-8 w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="edit-profile-title" className="text-lg font-extrabold text-[#0a1733]">Edit Profile</h2><p className="mt-1 text-xs text-slate-500">Email, role, and membership date are protected account details.</p></div><button type="button" onClick={onClose} disabled={saving} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Close</button></div>{message && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>}<form onSubmit={save} noValidate className="mt-5 space-y-4"><div className="flex items-center gap-4"><Avatar user={user} preview={preview}/><label className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-[#0B5D46] hover:border-[#0B5D46]">Replace photo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => choose(event.target.files?.[0])} disabled={saving}/></label></div>{errors.photo && <p className="text-xs text-red-600">{errors.photo}</p>}<Fields label="Full Name" value={form.name} onChange={(value) => set("name", value)} error={errors.name} required/><div className="grid gap-4 sm:grid-cols-2"><Fields label="Phone Number" value={form.phone} onChange={(value) => set("phone", value)} error={errors.phone} type="tel"/><Fields label="Location" value={form.location} onChange={(value) => set("location", value)} error={errors.location}/></div><Fields label="Date of Birth" value={form.date_of_birth} onChange={(value) => set("date_of_birth", value)} error={errors.date_of_birth} type="date" max={new Date().toISOString().slice(0, 10)}/><label className="block text-xs font-semibold text-slate-600">Email<input readOnly value={user.email} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"/></label><div className="flex justify-end gap-3 pt-2"><button type="button" disabled={saving} onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-bold">Cancel</button><button disabled={saving} className="rounded-md bg-[#0B5D46] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button></div></form></div></div>;
}
function Fields({ label, value, onChange, error, type = "text", ...props }) { return <label className="block text-xs font-semibold text-slate-600">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`mt-1.5 h-10 w-full rounded-md border px-3 text-sm text-[#0a1733] outline-none focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/10 ${error ? "border-red-400" : "border-slate-200"}`} {...props}/>{error && <span className="mt-1 block text-[11px] text-red-600">{error}</span>}</label>; }
