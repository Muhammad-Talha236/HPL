import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../services/apiClient";

const initial = (name) => name?.trim()?.charAt(0)?.toUpperCase() || "U";

export default function AccountPage() {
  const [state, setState] = useState({ status: "loading", account: null });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const response = await apiClient.get("/auth/me");
      setState({ status: "success", account: response.data?.data || null });
    } catch (error) {
      setState({ status: "error", account: null, message: error.response?.data?.message || "Your account could not be loaded." });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl"><header><p className="text-[11px] font-bold tracking-[.2em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#ffad9f] sm:text-4xl">MY ACCOUNT</h1><p className="mt-2 text-sm text-white/60">Your HPL identity and account information.</p></header>{state.status === "loading" && <div role="status" aria-label="Loading account" className="mt-7 h-56 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />}{state.status === "error" && <section role="alert" className="mt-7 rounded-xl border border-red-400/25 bg-red-400/10 p-6"><p className="text-sm text-red-100">{state.message}</p><button type="button" onClick={load} className="mt-4 rounded border border-red-200/30 px-4 py-2 text-xs font-bold text-red-100 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">TRY AGAIN</button></section>}{state.status === "success" && state.account && <AccountCard account={state.account} />}</div></main>;
}

function AccountCard({ account }) { return <section className="mt-7 overflow-hidden rounded-xl border border-[#EEC058]/20 bg-[linear-gradient(135deg,#17334a,#0B1D2F)] shadow-xl"><div className="flex flex-wrap items-center gap-5 p-6 sm:p-8">{account.profile_image ? <img src={account.profile_image} alt={`${account.name} profile`} className="h-20 w-20 rounded-full border border-white/20 object-cover" /> : <span aria-label={`${account.name || "User"} profile image unavailable`} className="grid h-20 w-20 place-items-center rounded-full bg-[#FF553D] text-2xl font-extrabold text-white">{initial(account.name)}</span>}<div className="min-w-0"><p className="text-[10px] font-bold tracking-[.16em] text-[#EEC058]">ACCOUNT IDENTITY</p><h2 className="mt-2 truncate text-2xl font-extrabold text-white">{account.name}</h2><p className="mt-1 break-all text-sm text-white/60">{account.email}</p><span className="mt-3 inline-flex rounded-full bg-[#EEC058]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#EEC058]">{String(account.role || "USER").replaceAll("_", " ")}</span></div></div><dl className="grid border-t border-white/10 sm:grid-cols-2"><Field label="EMAIL" value={account.email} /><Field label="PHONE" value={account.phone || "Not added"} /><Field label="ACCOUNT STATUS" value={account.status || "—"} /><Field label="PROFILE" value="Manage your personal account details." /></dl><div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-3 sm:p-6"><Link to="/account/profile" className="rounded-md bg-[#FF553D] px-4 py-3 text-center text-xs font-extrabold tracking-wide text-white transition-colors hover:bg-[#e94a35] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">EDIT PROFILE</Link><Link to="/account/password" className="rounded-md border border-white/20 px-4 py-3 text-center text-xs font-extrabold tracking-wide text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#EEC058]/60">CHANGE PASSWORD</Link><Link to="/account/notifications" className="rounded-md border border-white/20 px-4 py-3 text-center text-xs font-extrabold tracking-wide text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#EEC058]/60">NOTIFICATIONS</Link></div></section>; }
function Field({ label, value }) { return <div className="min-w-0 border-b border-white/10 p-5 sm:[&:nth-child(odd)]:border-r"><dt className="text-[10px] font-bold tracking-[.14em] text-white/45">{label}</dt><dd className="mt-2 break-words text-sm font-semibold text-white">{value}</dd></div>; }
