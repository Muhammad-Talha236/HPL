import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, CircleUserRound, Edit3, KeyRound, Pencil, Settings2, ShieldCheck, Trash2, UserRoundCheck } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../constants/roles";
import { USER_STATUS } from "../../../constants/statuses";
import apiClient from "../../../services/apiClient";
import mountainScene from "../../../assets/hunza-football-hero-alt.png";

const dateTime = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const dateOnly = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" });
const roleNames = { USER: "Normal User", TEAM_OWNER: "Team Owner", CLUB_OWNER: "Club Owner", REFEREE: "Referee", SUPER_ADMIN: "Super Admin" };
const statusNames = { ACTIVE: "Active", INACTIVE: "Inactive", BLOCKED: "Blocked" };
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
const show = (value) => value || "Not provided";
const DateValue = ({ value, time = false }) => value ? (time ? dateTime : dateOnly).format(new Date(value)) : "Not provided";
const roleLabel = (role) => roleNames[role] || role;
const statusLabel = (status) => statusNames[status] || status;

function Pill({ value, tone = "neutral" }) {
  const colors = { active: "bg-emerald-100 text-emerald-700", inactive: "bg-rose-100 text-rose-700", blocked: "bg-red-100 text-red-700", neutral: "bg-slate-100 text-slate-600", role: "bg-white/10 text-white ring-1 ring-white/15" };
  return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${colors[tone] || colors.neutral}`}>{value}</span>;
}

function Avatar({ account, large = false }) {
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/80 bg-emerald-100 font-extrabold text-emerald-700 shadow-sm ${large ? "size-20 text-xl" : "size-9 text-xs"}`}>{account.profile_image ? <img src={account.profile_image} alt="" className="size-full object-cover" /> : initials(account.name)}</span>;
}

function DetailCard({ icon: Icon, title, action, children }) {
  return <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_18px_rgba(15,35,72,.04)] sm:p-5"><header className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[#14213c]"><Icon size={18} /><h2 className="text-base font-extrabold">{title}</h2></div>{action}</header><dl className="mt-3 divide-y divide-slate-100">{children}</dl></section>;
}

function Row({ label, children }) {
  return <div className="grid grid-cols-[42%_58%] gap-3 py-2 text-[12px] sm:text-[13px]"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 break-words font-semibold text-[#14213c]">{children}</dd></div>;
}

function Skeleton() {
  return <main className="p-5 sm:p-7 xl:p-8"><div className="h-4 w-44 animate-pulse rounded bg-slate-200" /><div className="mt-4 h-10 w-52 animate-pulse rounded bg-slate-200" /><div className="mt-5 h-28 animate-pulse rounded-xl bg-slate-200" /><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="h-72 animate-pulse rounded-xl bg-slate-200" /><div className="h-72 animate-pulse rounded-xl bg-slate-200" /></div></main>;
}

export default function AdminUserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: actingUser } = useAuth();
  const [state, setState] = useState({ status: "loading", data: null });
  const [dialog, setDialog] = useState(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", profile_image: "" });
  const [nextRole, setNextRole] = useState("");

  const load = useCallback(async (signal) => {
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const response = await apiClient.get(`/admin/users/${userId}`, { signal });
      setState({ status: "success", data: response.data.data });
    } catch (error) {
      if (error.code !== "ERR_CANCELED") setState({ status: error.response?.status === 404 ? "not-found" : "error", data: null });
    }
  }, [userId]);

  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(() => load(controller.signal), 0); return () => { window.clearTimeout(timer); controller.abort(); }; }, [load]);

  const account = state.data;
  const isSelf = account && Number(actingUser?.user_id) === account.user_id;
  const ownedTeams = account?.owned_teams || [];
  const ownedClubs = account?.owned_clubs || [];
  const beginEdit = () => { setEditForm({ name: account.name || "", phone: account.phone || "", profile_image: account.profile_image || "" }); setDialog("edit"); };
  const beginRoleChange = () => { setNextRole(account.role); setDialog("role"); };
  const closeDialog = () => { if (!pending) setDialog(null); };
  const refresh = async () => load();

  const statusAction = async () => {
    const action = account.status === USER_STATUS.ACTIVE ? "deactivate" : "activate";
    setPending(true); setFeedback(null);
    try { await apiClient.patch(`/users/${account.user_id}/${action}`); setFeedback({ type: "success", text: `User account ${action}d successfully.` }); setDialog(null); await refresh(); }
    catch (error) { setFeedback({ type: "error", text: error.response?.data?.message || "Account status could not be updated." }); }
    finally { setPending(false); }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (editForm.name.trim().length < 2) return setFeedback({ type: "error", text: "Name must contain at least two characters." });
    setPending(true); setFeedback(null);
    try { await apiClient.patch(`/users/${account.user_id}`, { name: editForm.name.trim(), phone: editForm.phone.trim() || null, profile_image: editForm.profile_image.trim() || null }); setFeedback({ type: "success", text: "User profile updated successfully." }); setDialog(null); await refresh(); }
    catch (error) { setFeedback({ type: "error", text: error.response?.data?.message || "User profile could not be updated." }); }
    finally { setPending(false); }
  };

  const saveRole = async (event) => {
    event.preventDefault();
    if (!nextRole || nextRole === account.role) return;
    setPending(true); setFeedback(null);
    try { await apiClient.patch(`/users/${account.user_id}/role`, { role: nextRole }); setFeedback({ type: "success", text: "User role updated successfully." }); setDialog(null); await refresh(); }
    catch (error) { setFeedback({ type: "error", text: error.response?.data?.message || "Role could not be updated." }); }
    finally { setPending(false); }
  };

  if (state.status === "loading") return <Skeleton />;
  if (state.status === "not-found") return <main className="p-5 sm:p-7 xl:p-8"><p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">User account was not found.</p><Link to="/admin/users" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#078052]"><ArrowLeft size={16} />Back to Users</Link></main>;
  if (state.status === "error") return <main className="p-5 sm:p-7 xl:p-8"><p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">User details could not be loaded.</p><button type="button" onClick={() => load()} className="mt-4 text-sm font-bold text-[#078052] underline">Retry</button></main>;

  const statusTone = account.status === USER_STATUS.ACTIVE ? "active" : account.status === USER_STATUS.BLOCKED ? "blocked" : "inactive";
  const teamDescription = ownedTeams.length ? ownedTeams.map((team) => team.name).join(", ") : "No registered team";
  const canChangeRole = !isSelf;
  const canChangeStatus = !isSelf && account.status !== USER_STATUS.BLOCKED;

  return <main className="min-w-0 p-5 sm:p-7 xl:p-8">
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500"><Link to="/admin" className="hover:text-[#078052]">Dashboard</Link><ChevronRight size={13} /><Link to="/admin/users" className="hover:text-[#078052]">Users</Link><ChevronRight size={13} /><span className="max-w-48 truncate">{account.name}</span></nav>
    <header className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[30px] font-extrabold leading-none tracking-tight text-[#14213c]">User Details</h1><p className="mt-1.5 text-sm text-slate-500">View and manage user information, roles, and account status.</p></div><button type="button" onClick={() => navigate("/admin/users")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-[#14213c] shadow-sm hover:border-emerald-400"><ArrowLeft size={15} />Back to Users</button></header>
    {feedback && <p role="alert" className={`mt-4 rounded-lg px-4 py-3 text-sm ${feedback.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{feedback.text}</p>}

    <section className="relative mt-5 overflow-hidden rounded-xl bg-gradient-to-r from-[#071a2d] via-[#0b2945] to-[#153653] p-4 text-white shadow-[0_10px_25px_rgba(6,27,47,.18)] sm:p-5"><img src={mountainScene} alt="" className="pointer-events-none absolute inset-y-0 right-0 w-2/3 object-cover object-right opacity-[.16] mix-blend-screen" /><div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-4"><Avatar account={account} large /><div className="min-w-0"><h2 className="truncate text-2xl font-extrabold">{account.name}</h2><p className="mt-1 truncate text-sm text-slate-200">{account.email}</p><div className="mt-3 flex flex-wrap gap-2"><Pill tone="role" value={roleLabel(account.role)} /><Pill tone={statusTone} value={statusLabel(account.status)} /></div></div></div><button type="button" onClick={beginEdit} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-white/35 bg-white/5 px-3.5 py-2 text-sm font-bold text-white hover:bg-white/15"><Pencil size={15} />Edit User</button></div></section>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <DetailCard icon={CircleUserRound} title="Account Information">
        <Row label="User ID">#{account.user_id}</Row><Row label="Full Name">{account.name}</Row><Row label="Email">{account.email}</Row><Row label="Phone Number">{show(account.phone)}</Row><Row label="Location">{show(account.location)}</Row><Row label="Date of Birth"><DateValue value={account.date_of_birth} /></Row><Row label="Joined On"><DateValue value={account.created_at} time /></Row><Row label="Last Updated"><DateValue value={account.updated_at} time /></Row>
      </DetailCard>
      <DetailCard icon={ShieldCheck} title="Access & Status" action={canChangeRole ? <button type="button" onClick={beginRoleChange} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#14213c] hover:border-emerald-400"><Edit3 size={13} />Edit Access</button> : null}>
        <Row label="Role"><Pill value={roleLabel(account.role)} /></Row><Row label="Account Status"><Pill tone={statusTone} value={statusLabel(account.status)} /></Row><Row label="Email Verified"><Pill value="Not configured" /></Row><Row label="Phone Verified"><Pill value="Not configured" /></Row><Row label="Two Factor Auth"><Pill value="Not supported" /></Row><Row label="Can Register Team"><Pill tone={account.role === ROLES.TEAM_OWNER ? "active" : "neutral"} value={account.role === ROLES.TEAM_OWNER ? "Yes" : "No"} /></Row><Row label="Registered Teams">{teamDescription}</Row>{ownedClubs.length > 0 && <Row label="Owned Clubs">{ownedClubs.map((club) => club.name).join(", ")}</Row>}{account.referee_profile && <Row label="Referee Profile">{account.referee_profile.name}</Row>}
      </DetailCard>
    </div>

    <section className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_18px_rgba(15,35,72,.04)] sm:p-5"><header className="flex items-start gap-2"><Settings2 size={19} className="mt-0.5 text-[#14213c]" /><div><h2 className="text-base font-extrabold text-[#14213c]">Account Actions</h2><p className="mt-0.5 text-xs text-slate-500">Manage user account and perform administrative actions.</p></div></header><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5"><button type="button" onClick={beginEdit} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-[#14213c] hover:border-emerald-400"><Pencil size={15} />Edit User</button><button type="button" disabled={!canChangeRole} onClick={beginRoleChange} title={!canChangeRole ? "You cannot change your own Super Admin role." : undefined} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-[#14213c] hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-45"><ShieldCheck size={15} />Change Role</button><button type="button" disabled={!canChangeStatus} onClick={() => setDialog("status")} title={!canChangeStatus ? "This status cannot be changed here." : undefined} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-50 px-3 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"><UserRoundCheck size={15} />{account.status === USER_STATUS.ACTIVE ? "Deactivate" : "Activate"}</button><button type="button" disabled title="A secure password-reset workflow has not been configured." className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-400"><KeyRound size={15} />Reset Password</button><button type="button" disabled title="User deletion is intentionally unsupported to protect league records and audit history." className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-rose-50 px-3 text-sm font-bold text-rose-300"><Trash2 size={15} />Delete User</button></div>{isSelf && <p className="mt-3 text-xs text-slate-500">Your own role and account status are protected to prevent Super Admin lockout.</p>}</section>

    {dialog && <div role="presentation" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"><div role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="mx-auto my-8 w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="user-dialog-title" className="text-lg font-extrabold text-[#14213c]">{dialog === "edit" ? "Edit User" : dialog === "role" ? "Change Role" : `${account.status === USER_STATUS.ACTIVE ? "Deactivate" : "Activate"} User`}</h2><p className="mt-1 text-xs text-slate-500">{dialog === "edit" ? "Email, role, and status are protected account fields." : dialog === "role" ? "Permissions change immediately. Ownership and referee safeguards are enforced by the server." : "This action changes the account’s ability to sign in."}</p></div><button type="button" disabled={pending} onClick={closeDialog} className="text-sm font-bold text-slate-500 hover:text-slate-800">Close</button></div>{dialog === "edit" && <form onSubmit={saveEdit} className="mt-5 space-y-4"><label className="block text-xs font-semibold text-slate-600">Full Name<input required value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label><label className="block text-xs font-semibold text-slate-600">Phone Number<input value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label><label className="block text-xs font-semibold text-slate-600">Profile Image URL <span className="font-normal text-slate-400">(optional)</span><input type="url" value={editForm.profile_image} onChange={(event) => setEditForm((current) => ({ ...current, profile_image: event.target.value }))} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label><div className="flex justify-end gap-3 pt-2"><button type="button" disabled={pending} onClick={closeDialog} className="rounded-md px-4 py-2 text-xs font-bold text-slate-500">Cancel</button><button disabled={pending} className="rounded-md bg-[#078052] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Save Changes"}</button></div></form>}{dialog === "role" && <form onSubmit={saveRole} className="mt-5"><label className="block text-xs font-semibold text-slate-600">New Role<select value={nextRole} onChange={(event) => setNextRole(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">{Object.values(ROLES).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label><div className="mt-5 flex justify-end gap-3"><button type="button" disabled={pending} onClick={closeDialog} className="rounded-md px-4 py-2 text-xs font-bold text-slate-500">Cancel</button><button disabled={pending || nextRole === account.role} className="rounded-md bg-[#078052] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Confirm Change"}</button></div></form>}{dialog === "status" && <div className="mt-5"><p className="text-sm text-slate-600">Are you sure you want to {account.status === USER_STATUS.ACTIVE ? "deactivate" : "activate"} <b>{account.name}</b>?</p><div className="mt-5 flex justify-end gap-3"><button type="button" disabled={pending} onClick={closeDialog} className="rounded-md px-4 py-2 text-xs font-bold text-slate-500">Cancel</button><button type="button" disabled={pending} onClick={statusAction} className="rounded-md bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "Updating…" : "Confirm"}</button></div></div>}</div></div>}
  </main>;
}
