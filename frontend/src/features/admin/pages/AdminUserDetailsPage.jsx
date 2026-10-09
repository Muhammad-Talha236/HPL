import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../constants/roles";
import { USER_STATUS } from "../../../constants/statuses";
import apiClient from "../../../services/apiClient";
import { FEATURES } from "../../../constants/features";

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
const Badge = ({ children, coral = false }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${coral ? "border-[#ffad9f]/35 bg-[#ffad9f]/10 text-[#ffad9f]" : "border-[#EEC058]/35 bg-[#EEC058]/10 text-[#f4d383]"}`}>{children}</span>;

const AdminUserDetailsPage = () => {
  const { userId } = useParams();
  const { user: actingUser } = useAuth();
  const [state, setState] = useState({ status: "loading", data: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [nextRole, setNextRole] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const load = useCallback(async () => {
    setState({ status: "loading", data: null });
    try { const response = await apiClient.get(`/admin/users/${userId}`); setState({ status: "success", data: response.data.data }); }
    catch (error) { setState({ status: error.response?.status === 404 ? "not-found" : "error", data: null }); }
  }, [userId]);
  useEffect(() => {
    const timer = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const account = state.data;
  const isSelf = account && Number(actingUser?.user_id) === account.user_id;
  const statusAction = async (action) => {
    if (!account || !window.confirm(`${action} ${account.name}'s account?`)) return;
    setPending(true); setFeedback("");
    try { await apiClient.patch(`/users/${account.user_id}/${action}`); setFeedback(`User ${action}d successfully.`); await load(); }
    catch (error) { setFeedback(error.response?.data?.message || "Action failed. Please try again."); }
    finally { setPending(false); }
  };
  const submitRoleChange = async (event) => {
    event.preventDefault();
    if (!account || !nextRole || nextRole === account.role) return;
    setPending(true); setFeedback("");
    try { await apiClient.patch(`/users/${account.user_id}/role`, { role: nextRole }); setModalOpen(false); setFeedback("User role updated successfully."); await load(); }
    catch (error) { setFeedback(error.response?.data?.message || "Role could not be updated."); }
    finally { setPending(false); }
  };
  if (state.status === "loading") return <div className="p-8 text-white/55">Loading user details…</div>;
  if (state.status === "not-found") return <div className="p-8"><p className="text-sm text-white/55">User account was not found.</p><Link to="/admin/users" className="mt-4 inline-block text-sm font-bold text-[#EEC058]">← BACK TO USERS</Link></div>;
  if (state.status === "error") return <div className="p-8"><p className="text-sm text-red-200">User details could not be loaded.</p><button type="button" onClick={load} className="mt-4 text-sm font-bold text-[#EEC058]">TRY AGAIN</button></div>;
  const links = [
    ...(FEATURES.CLUBS_ENABLED ? (account.owned_clubs || []).map((club) => ({ key: `club-${club.club_id}`, type: "Club ownership", id: club.club_id, name: club.name, status: club.status })) : []),
    ...(account.owned_teams || []).map((team) => ({ key: `team-${team.team_id}`, type: "Team ownership", id: team.team_id, name: team.name, status: team.status })),
  ];
  return <div className="p-5 sm:p-8">
    <nav className="text-sm text-white/55"><Link to="/admin/users" className="hover:text-[#EEC058]">Users</Link> <span className="mx-2">→</span> User details</nav>
    {feedback && <p className="mt-5 rounded border border-[#EEC058]/30 bg-[#EEC058]/10 p-3 text-sm text-[#f4d383]">{feedback}</p>}
    <section className="mt-5 rounded-xl border border-white/10 bg-[#0B1D2F] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"><div className="flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[#EEC058]/40 bg-[#07192a] text-lg font-extrabold text-[#EEC058]">{account.profile_image ? <img src={account.profile_image} alt="" className="h-full w-full object-cover" /> : initials(account.name)}</div><div><h1 className="text-2xl font-extrabold text-[#ffad9f]">{account.name}</h1><p className="mt-1 text-sm text-white/60">{account.email}</p><div className="mt-3 flex flex-wrap gap-2"><Badge>{account.role}</Badge><Badge coral>{account.status}</Badge></div></div></div><div className="mt-5 flex flex-wrap gap-2 sm:mt-0">{!isSelf && <button type="button" disabled={pending} onClick={() => { setNextRole(account.role); setModalOpen(true); }} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058] disabled:opacity-50">CHANGE ROLE</button>}{account.status === USER_STATUS.ACTIVE && !isSelf && <><button type="button" disabled={pending} onClick={() => statusAction("deactivate")} className="rounded border border-red-300/40 px-3 py-2 text-xs font-bold text-red-200 disabled:opacity-50">DEACTIVATE</button><button type="button" disabled={pending} onClick={() => statusAction("block")} className="rounded border border-red-300/40 px-3 py-2 text-xs font-bold text-red-200 disabled:opacity-50">BLOCK</button></>}{account.status === USER_STATUS.INACTIVE && <><button type="button" disabled={pending} onClick={() => statusAction("activate")} className="rounded border border-[#EEC058]/60 px-3 py-2 text-xs font-bold text-[#EEC058] disabled:opacity-50">ACTIVATE</button>{!isSelf && <button type="button" disabled={pending} onClick={() => statusAction("block")} className="rounded border border-red-300/40 px-3 py-2 text-xs font-bold text-red-200 disabled:opacity-50">BLOCK</button>}</>}</div></section>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><section className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><h2 className="text-sm font-extrabold tracking-[.12em] text-[#EEC058]">ACCOUNT INFORMATION</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-white/45">User ID</dt><dd className="mt-1 font-semibold">#{account.user_id}</dd></div><div><dt className="text-white/45">Phone</dt><dd className="mt-1 font-semibold">{account.phone || "Not provided"}</dd></div><div><dt className="text-white/45">Created</dt><dd className="mt-1 font-semibold">{formatDate(account.created_at)}</dd></div><div><dt className="text-white/45">Updated</dt><dd className="mt-1 font-semibold">{formatDate(account.updated_at)}</dd></div></dl></section><section className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><h2 className="text-sm font-extrabold tracking-[.12em] text-[#EEC058]">ACCESS & STATUS</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-white/45">Role</dt><dd className="mt-1"><Badge>{account.role}</Badge></dd></div><div><dt className="text-white/45">Account status</dt><dd className="mt-1"><Badge coral>{account.status}</Badge></dd></div></dl>{isSelf && <p className="mt-5 text-xs text-white/50">Your own role, deactivation and block actions are protected to prevent self-lockout.</p>}</section></div>
    <section className="mt-5 rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><h2 className="text-sm font-extrabold tracking-[.12em] text-[#EEC058]">OWNERSHIP / LINKED PROFILES</h2>{links.length === 0 && !account.referee_profile ? <p className="mt-4 text-sm text-white/55">No linked club ownership, team ownership, or referee profile.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{links.map((item) => <div key={item.key} className="rounded border border-white/10 bg-[#07192a] p-4"><p className="text-xs text-white/45">{item.type} · #{item.id}</p><p className="mt-1 font-bold">{item.name}</p><p className="mt-2 text-xs text-[#EEC058]">{item.status}</p></div>)}{account.referee_profile && <div className="rounded border border-white/10 bg-[#07192a] p-4"><p className="text-xs text-white/45">Referee identity · #{account.referee_profile.referee_id}</p><p className="mt-1 font-bold">{account.referee_profile.name}</p><p className="mt-2 text-xs text-[#EEC058]">{account.referee_profile.status} · linked to this account</p></div>}</div>}</section>
    {modalOpen && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><form onSubmit={submitRoleChange} className="w-full max-w-md rounded-xl border border-white/15 bg-[#0B1D2F] p-5 shadow-2xl"><h2 className="text-lg font-extrabold text-[#ffad9f]">CHANGE ROLE</h2><p className="mt-2 text-sm text-white/60">Change this account from <b>{account.role}</b> to a new access role. Permissions will change immediately.</p><label className="mt-5 block text-xs font-bold text-white/60">NEW ROLE<select value={nextRole} onChange={(event) => setNextRole(event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-[#07192a] p-3 text-sm outline-none focus:border-[#EEC058]">{Object.values(ROLES).map((role) => <option key={role} value={role}>{role}</option>)}</select></label><div className="mt-5 flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => setModalOpen(false)} className="px-3 py-2 text-xs font-bold text-white/60">CANCEL</button><button type="submit" disabled={pending || nextRole === account.role} className="rounded bg-[#FF553D] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{pending ? "SAVING…" : "CONFIRM CHANGE"}</button></div></form></div>}
  </div>;
};
export default AdminUserDetailsPage;
