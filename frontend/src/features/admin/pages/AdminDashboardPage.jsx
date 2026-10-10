import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, ChevronRight, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import apiClient from "../../../services/apiClient";
import useAuth from "../../../hooks/useAuth";

const number = new Intl.NumberFormat("en-PK");
const dateFormatter = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" });
const displayDate = (value) => (value ? dateFormatter.format(new Date(value)) : "—");
const labelFor = (value) => value?.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Unknown";

const statusBadge = (status) => ({
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  BLOCKED: "bg-rose-50 text-rose-700 ring-rose-100",
  SUSPENDED: "bg-rose-50 text-rose-700 ring-rose-100",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-100",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-200",
}[status] || "bg-slate-100 text-slate-600 ring-slate-200");

const matchBadge = (status) => ({
  LIVE: "bg-rose-50 text-rose-700 ring-rose-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-100",
  POSTPONED: "bg-amber-50 text-amber-700 ring-amber-100",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-100",
}[status] || "bg-slate-100 text-slate-600 ring-slate-200");

const Card = ({ children, className = "" }) => <article className={`min-w-0 rounded-xl border border-slate-200/80 bg-white shadow-[0_5px_18px_rgba(15,35,72,0.045)] ${className}`}>{children}</article>;

const StatCard = ({ icon: Icon, title, metric, iconClass, secondary }) => <Card className="flex min-h-[118px] items-center p-4 sm:p-5">
  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${iconClass}`}><Icon size={21} strokeWidth={2.15} /></span>
  <div className="ml-3.5 min-w-0">
    <p className="text-[13px] font-medium text-slate-500">{title}</p>
    <p className="mt-0.5 text-[29px] font-extrabold leading-none tracking-tight text-[#14213c]">{number.format(metric.total)}</p>
    {metric.monthly_growth === null ? <p className="mt-1.5 text-[11px] text-slate-400">{secondary || "No prior-month comparison"}</p> : <p className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${metric.monthly_growth >= 0 ? "text-emerald-600" : "text-rose-600"}`}><ArrowUpRight size={12} className={metric.monthly_growth < 0 ? "rotate-90" : ""} />{metric.monthly_growth >= 0 ? "+" : ""}{metric.monthly_growth}% <span className="font-normal text-slate-400">vs last month</span></p>}
  </div>
</Card>;

const TrendChart = ({ months }) => {
  const width = 720;
  const height = 242;
  const plot = { left: 45, right: 18, top: 16, bottom: 39 };
  const values = months.map((item) => item.count);
  const rawMax = Math.max(...values, 0);
  const step = Math.max(1, Math.ceil(rawMax / 4));
  const yMax = step * 4;
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const yFor = (value) => plot.top + ((yMax - value) / yMax) * plotHeight;
  const coordinates = values.map((value, index) => ({
    x: plot.left + (index * plotWidth) / Math.max(values.length - 1, 1),
    y: yFor(value),
    value,
  }));
  const points = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const baseline = plot.top + plotHeight;
  const area = `M ${plot.left} ${baseline} L ${points.replaceAll(" ", " L ")} L ${plot.left + plotWidth} ${baseline} Z`;
  const ticks = Array.from({ length: 5 }, (_, index) => index * step);

  return <div className="mt-3 min-w-0">
    <div className="h-56 sm:h-60" role="img" aria-label="Monthly user registrations trend">
      <svg viewBox={`0 0 ${width} ${height}`} className="size-full overflow-visible" preserveAspectRatio="none">
        <defs><linearGradient id="registration-area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#11a860" stopOpacity="0.28" /><stop offset="1" stopColor="#11a860" stopOpacity="0.015" /></linearGradient></defs>
        {ticks.map((tick) => { const y = yFor(tick); return <g key={tick}><line x1={plot.left} x2={plot.left + plotWidth} y1={y} y2={y} stroke="#e8eff3" strokeWidth="1" /><text x={plot.left - 9} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">{tick}</text></g>; })}
        <path d={area} fill="url(#registration-area)" />
        <polyline points={points} fill="none" stroke="#078b50" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {coordinates.map(({ x, y, value }, index) => <g key={months[index].month}><circle cx={x} cy={y} r="4" fill="white" stroke="#078b50" strokeWidth="2.3"><title>{`${months[index].label}: ${value} registration${value === 1 ? "" : "s"}`}</title></circle><text x={x} y={height - 11} textAnchor="middle" fill="#94a3b8" fontSize="10">{months[index].label}</text></g>)}
      </svg>
    </div>
  </div>;
};

const Avatar = ({ name, image, size = "size-7" }) => image ? <img src={image} alt="" className={`${size} shrink-0 rounded-full object-cover`} /> : <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700`}>{name?.trim()?.slice(0, 1)?.toUpperCase() || "?"}</span>;

const TableHeader = ({ children }) => <thead className="bg-slate-50/90 text-[11px] font-semibold text-slate-400">{children}</thead>;

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [state, setState] = useState({ status: "loading", data: null });
  const years = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear - index), [currentYear]);
  const load = useCallback(async (requestedYear = year, signal) => {
    setState((current) => ({ status: "loading", data: current.data }));
    try {
      const response = await apiClient.get("/admin/dashboard", { params: { year: requestedYear }, signal });
      setState({ status: "success", data: response.data.data });
    } catch (error) {
      if (error?.code === "ERR_CANCELED") return;
      setState((current) => ({ status: "error", data: current.data }));
    }
  }, [year]);

  useEffect(() => {
    const controller = new AbortController();
    const request = window.setTimeout(() => load(year, controller.signal), 0);
    return () => { window.clearTimeout(request); controller.abort(); };
  }, [load, year]);

  if (!state.data && state.status === "loading") return <main className="p-5 sm:p-7 xl:p-8" aria-busy="true"><div className="h-12 w-80 animate-pulse rounded-lg bg-slate-200" /><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[118px] animate-pulse rounded-xl bg-slate-200" />)}</div></main>;
  if (!state.data) return <main className="p-5 sm:p-7 xl:p-8"><Card className="border-rose-100 p-6 text-sm text-slate-600"><p role="alert">Dashboard data could not be loaded.</p><button type="button" onClick={() => load(year)} className="mt-4 rounded-lg bg-[#078052] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#05643f]">Retry</button></Card></main>;

  const { summary, user_registration_trend: trend, team_statuses: teamStatuses, recent_users: recentUsers, recent_team_registrations: registrations, recent_matches: matches } = state.data;
  const statusTotal = teamStatuses.reduce((total, item) => total + item.count, 0);
  let segmentStart = 0;
  const donutBackground = statusTotal ? `conic-gradient(${teamStatuses.map((item) => { const start = segmentStart; segmentStart += (item.count / statusTotal) * 100; return `${item.color} ${start}% ${segmentStart}%`; }).join(", ")})` : "#e8eef3";
  const today = new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date());

  return <main className="min-w-0 p-5 sm:p-7 xl:p-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0"><h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[#14213c] sm:text-[32px]">Welcome back, <span className="text-[#078052]">{user?.name || "HPL Super Admin"}</span></h1><p className="mt-1 text-sm text-slate-500">Manage seasons, teams, players, matches and keep Hunza Premier League running smoothly.</p></div>
      <Card className="shrink-0 px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-[#078052]"><CalendarDays size={18} /></span><div><p className="text-xs font-bold text-[#14213c]">{today}</p><p className="mt-0.5 text-[11px] text-slate-500">Hunza, Pakistan</p></div></div></Card>
    </header>

    {state.status === "error" && <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"><span>Showing the most recently loaded dashboard data.</span><button type="button" onClick={() => load(year)} className="font-bold underline">Retry</button></div>}

    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={UsersRound} title="Total Users" metric={summary.users} iconClass="bg-emerald-50 text-emerald-600" />
      <StatCard icon={ShieldCheck} title="Total Teams" metric={summary.teams} iconClass="bg-blue-50 text-blue-600" />
      <StatCard icon={UserRound} title="Total Players" metric={summary.players} iconClass="bg-violet-50 text-violet-600" />
      <StatCard icon={CalendarDays} title="Active Seasons" metric={summary.active_seasons} secondary="Currently active seasons" iconClass="bg-rose-50 text-rose-500" />
    </section>

    <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-5">
      <Card className="min-h-[320px] p-4 sm:p-5 xl:col-span-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-[#14213c]">User Registrations Trend</h2><p className="mt-0.5 text-xs text-slate-400">New user accounts created in {trend.year}</p></div><label className="sr-only" htmlFor="dashboard-year">Trend year</label><select id="dashboard-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#14213c] outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><TrendChart months={trend.months} /></Card>
      <Card className="min-h-[320px] p-4 sm:p-5 xl:col-span-2"><h2 className="text-base font-bold text-[#14213c]">Teams by Status</h2>{statusTotal ? <div className="mt-5 flex h-[236px] flex-col items-center justify-center gap-6 min-[470px]:flex-row min-[470px]:justify-around xl:gap-4"><div className="relative grid size-44 shrink-0 place-items-center rounded-full sm:size-48" style={{ background: donutBackground }}><div className="grid size-[118px] place-items-center rounded-full bg-white text-center"><strong className="text-[28px] leading-none tracking-tight text-[#14213c]">{number.format(statusTotal)}</strong><span className="-mt-3 text-[11px] font-semibold text-slate-400">Total Teams</span></div></div><div className="min-w-36 space-y-3">{teamStatuses.map((item) => <div key={item.status} className="flex items-center gap-2.5"><span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} /><div><p className="text-xs font-semibold text-slate-600">{item.label}</p><p className="mt-0.5 text-xs font-bold text-[#14213c]">{number.format(item.count)} <span className="font-normal text-slate-400">({Math.round((item.count / statusTotal) * 100)}%)</span></p></div></div>)}</div></div> : <div className="grid h-[236px] place-items-center text-center text-sm text-slate-400">No teams have been created yet.</div>}</Card>
    </section>

    <section className="dashboard-records mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
      <Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><h2 className="text-[14px] font-bold text-[#14213c]">Recent User Registrations</h2><Link to="/admin/users" className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-blue-600 transition hover:text-blue-700">View All <ChevronRight size={14} /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[370px] table-fixed text-left"><TableHeader><tr><th className="w-[31%] px-3 py-2">Name</th><th className="w-[29%] px-2 py-2">Email</th><th className="w-[20%] px-2 py-2">Joined On</th><th className="w-[20%] px-2 py-2">Status</th></tr></TableHeader><tbody>{recentUsers.map((account) => <tr key={account.user_id} className="border-t border-slate-100 text-[11px] text-slate-600 transition hover:bg-slate-50"><td className="px-3 py-2.5"><Link to={`/admin/users/${account.user_id}`} className="flex items-center gap-2 font-semibold text-[#14213c]"><Avatar name={account.name} image={account.profile_image} size="size-6" /><span className="truncate">{account.name}</span></Link></td><td className="truncate px-2 py-2.5 text-[10px] text-slate-500">{account.email}</td><td className="px-2 py-2.5 whitespace-nowrap text-[10px]">{displayDate(account.created_at)}</td><td className="px-2 py-2.5"><span className={`whitespace-nowrap rounded-full px-1.5 py-1 text-[9px] font-bold ring-1 ${statusBadge(account.status)}`}>{labelFor(account.status)}</span></td></tr>)}</tbody></table>{!recentUsers.length && <p className="p-5 text-sm text-slate-400">No users have registered yet.</p>}</div></Card>
      <Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><h2 className="text-[14px] font-bold text-[#14213c]">Recent Competition Registrations</h2><Link to="/admin/registrations" className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-blue-600 transition hover:text-blue-700">View All <ChevronRight size={14} /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[390px] table-fixed text-left"><TableHeader><tr><th className="w-[35%] px-3 py-2">Team Name</th><th className="w-[22%] px-2 py-2">Registered By</th><th className="w-[20%] px-2 py-2">Date</th><th className="w-[23%] px-2 py-2">Status</th></tr></TableHeader><tbody>{registrations.map((registration) => <tr key={registration.registration_id} className="border-t border-slate-100 text-[11px] text-slate-600 transition hover:bg-slate-50"><td className="px-3 py-2"><Link to={`/admin/registrations/${registration.registration_id}`} className="flex items-center gap-2 font-semibold text-[#14213c]"><Avatar name={registration.team.name} image={registration.team.logo} size="size-6" /><span className="min-w-0"><span className="block truncate">{registration.team.name}</span><span className="block truncate text-[9px] font-normal text-slate-400">{registration.competition.name}</span></span></Link></td><td className="truncate px-2 py-2 text-[10px]">{registration.registered_user.name}</td><td className="px-2 py-2 whitespace-nowrap text-[10px]">{displayDate(registration.registration_date)}</td><td className="px-2 py-2"><span className={`whitespace-nowrap rounded-full px-1.5 py-1 text-[9px] font-bold ring-1 ${statusBadge(registration.registration_status)}`}>{labelFor(registration.registration_status)}</span></td></tr>)}</tbody></table>{!registrations.length && <p className="p-5 text-sm text-slate-400">No competition registrations yet.</p>}</div></Card>
      <Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><h2 className="text-[14px] font-bold text-[#14213c]">Recent Matches</h2><Link to="/admin/matches" className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-blue-600 transition hover:text-blue-700">View All <ChevronRight size={14} /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[380px] table-fixed text-left"><TableHeader><tr><th className="w-[32%] px-3 py-2">Home Team</th><th className="w-[14%] px-1 py-2 text-center">Score</th><th className="w-[32%] px-2 py-2">Away Team</th><th className="w-[22%] px-2 py-2">Date</th></tr></TableHeader><tbody>{matches.map((match) => <tr key={match.match_id} className="border-t border-slate-100 text-[11px] text-slate-600 transition hover:bg-slate-50"><td className="px-3 py-2"><Link to={`/admin/matches/${match.match_id}`} className="flex items-center gap-2 font-semibold text-[#14213c]"><Avatar name={match.home_team.name} image={match.home_team.logo} size="size-6" /><span className="truncate">{match.home_team.name}</span></Link></td><td className="px-1 py-2 text-center text-[11px] font-extrabold text-[#14213c]">{["LIVE", "COMPLETED"].includes(match.status) ? `${match.home_score} - ${match.away_score}` : "VS"}</td><td className="px-2 py-2"><Link to={`/admin/matches/${match.match_id}`} className="flex items-center gap-2 font-semibold text-[#14213c]"><Avatar name={match.away_team.name} image={match.away_team.logo} size="size-6" /><span className="truncate">{match.away_team.name}</span></Link></td><td className="px-2 py-2"><span className="block whitespace-nowrap text-[10px]">{displayDate(match.match_date)}</span><span className={`mt-1 inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${matchBadge(match.status)}`}>{labelFor(match.status)}</span></td></tr>)}</tbody></table>{!matches.length && <p className="p-5 text-sm text-slate-400">No matches have been scheduled yet.</p>}</div></Card>
    </section>
  </main>;
}
