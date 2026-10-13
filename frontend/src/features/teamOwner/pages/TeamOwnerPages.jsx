import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import { ClipboardList, Trophy, Users, Wallet } from "lucide-react";
import { FEATURES } from "../../../constants/features";

const pageLimit = 20;
const EMPTY_LIST = [];
const DASHBOARD_EMPTY = { teams: [], counts: {}, upcoming_matches: [], recent_results: [] };
const date = (value) => value ? new Date(value).toLocaleDateString() : "—";
const amount = (value) => value === null || value === undefined ? "—" : Number(value).toLocaleString();
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";
const withoutClubReferences = (value) => {
  if (FEATURES.CLUBS_ENABLED || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(withoutClubReferences);
  const { club: _club, ...rest } = value;
  return Object.fromEntries(Object.entries(rest).map(([key, item]) => [key, withoutClubReferences(item)]));
};

function Badge({ children }) {
  return <span className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-slate-700">{children || "—"}</span>;
}

function PageHeader({ eyebrow, title, children }) {
  return <header><p className="text-xs font-extrabold tracking-[.16em] text-[#b83729]">{eyebrow}</p><h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>{children && <p className="mt-2 max-w-2xl text-sm text-slate-500">{children}</p>}</header>;
}

function Loading({ label = "Loading…" }) {
  return <div role="status" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" aria-label={label} />)}</div>;
}

function ErrorState({ message, retry }) {
  return <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{message}</p><button type="button" onClick={retry} className="mt-3 rounded border border-red-300 px-3 py-2 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#d94d3d]">RETRY</button></div>;
}

function EmptyState({ children }) {
  return <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{children}</p>;
}

function Pagination({ pagination, page, setPage }) {
  const totalPages = pagination?.total_pages || 1;
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#d94d3d]">PREVIOUS</button><span className="text-xs font-bold text-slate-500">PAGE {pagination?.page || page} OF {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#d94d3d]">NEXT</button></div>;
}

function useTeamOwnerData(path, fallback) {
  const [state, setState] = useState({ kind: "loading", data: fallback });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, kind: "loading" }));
    try {
      const response = await apiClient.get(path);
      setState({ kind: "ready", data: withoutClubReferences(response.data.data) });
    } catch (error) {
      setState({ kind: "error", data: fallback, message: errorMessage(error, "This information could not be loaded.") });
    }
  }, [path, fallback]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  return [state, load];
}

export function TeamOwnerDashboardPage() {
  const [state, load] = useTeamOwnerData("/team-owner/dashboard", DASHBOARD_EMPTY);
  const heading = <header><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#087554]">Overview</p><h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#10213F]">Team Dashboard</h1><p className="mt-2 text-sm leading-6 text-slate-500">Monitor your team operations, registrations and football activity.</p></header>;
  if (state.kind === "loading") return <main className="min-w-0" aria-busy="true">{heading}<Loading label="Loading team dashboard" /></main>;
  if (state.kind === "error") return <main className="min-w-0">{heading}<ErrorState message={state.message} retry={load} /></main>;
  const { teams = [], counts = {}, upcoming_matches: upcoming = [], recent_results: results = [] } = state.data;
  const summary = [{ label: "Players", value: counts.players, icon: Users }, { label: "Registrations", value: counts.registrations, icon: ClipboardList }, { label: "Payments", value: counts.payments, icon: Wallet }, { label: "Completed matches", value: counts.completed_matches, icon: Trophy }];
  return <main className="min-w-0">
    {heading}
    <section aria-label="Team summary" className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map(({ label, value, icon: Icon }) => <article key={label} className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,.025)]"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-slate-500">{label}</p><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EDF6F0] text-[#087554]"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span></div><p className="mt-2 text-2xl font-bold tracking-tight text-[#10213F]">{value ?? "?"}</p></article>)}
    </section>
    <section className="mt-6 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <article className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[#10213F]">My team</h2><Link to="/team/profile" className="text-xs font-semibold text-[#087554] hover:underline focus-visible:outline-2 focus-visible:outline-[#087554]">View profile ?</Link></div>
        {teams.length ? <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{teams.map(team => <div key={team.team_id} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/50 p-4"><div className="flex items-center gap-3">{team.logo ? <img src={team.logo} alt={`${team.name} logo`} className="h-11 w-11 shrink-0 rounded-lg object-contain" /> : <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#E9F2ED] text-xs font-bold text-[#087554]">{initials(team.name)}</div>}<div className="min-w-0"><p className="truncate text-sm font-semibold text-[#10213F]" title={team.name}>{team.name}</p><p className="mt-1 break-words text-xs text-slate-500">{team.gender || "?"} ? {team.team_type || "?"}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><Badge>{team.status}</Badge>{team.club?.name && <Badge>{team.club.name}</Badge>}{team.home_venue?.name && <Badge>{team.home_venue.name}</Badge>}</div></div>)}</div> : <p className="mt-4 text-sm leading-6 text-slate-500">No team is assigned to this account yet.</p>}
      </article>
      <MatchList title="Upcoming matches" matches={upcoming} empty="No scheduled matches are currently available." />
      <div className="min-w-0 xl:col-span-2"><ResultsList results={results} /></div>
    </section>
  </main>;
}

function MatchList({ title, matches, empty }) {
  return <article className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-[#10213F]">{title}</h2><div className="mt-4 space-y-3">{matches.map((match) => <div key={match.match_id} className="rounded-lg border border-slate-100 p-3 text-sm"><p className="font-bold text-slate-900">{match.home_team?.name || "Home team"} <span className="text-slate-400">vs</span> {match.away_team?.name || "Away team"}</p><p className="mt-1 text-xs text-slate-500">Scheduled {date(match.match_date)} · {match.status || "SCHEDULED"}</p></div>)}{!matches.length && <p className="text-sm text-slate-500">{empty}</p>}</div></article>;
}

function ResultsList({ results }) {
  return <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-[#10213F]">Recent results</h2><div className="mt-4 space-y-3">{results.map((match) => <div key={match.match_id} className="rounded-lg border border-slate-100 p-3"><div className="flex items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-bold text-slate-900">{match.home_team?.name || "Home team"} <span className="text-slate-400">vs</span> {match.away_team?.name || "Away team"}</p><strong className="shrink-0 text-[#b83729]">{match.home_score ?? "?"} – {match.away_score ?? "?"}</strong></div><p className="mt-1 text-xs text-slate-500">COMPLETED</p></div>)}{!results.length && <p className="text-sm text-slate-500">No completed match results are available yet.</p>}</div></article>;
}

export function TeamOwnerProfilePage() {
  const [state, load] = useTeamOwnerData("/team-owner/team", EMPTY_LIST);
  if (state.kind === "loading") return <main className="min-w-0"><PageHeader eyebrow="TEAM" title="MY TEAM">Review the identity and operational details of your assigned team.</PageHeader><Loading label="Loading team profile" /></main>;
  if (state.kind === "error") return <main className="min-w-0"><PageHeader eyebrow="TEAM" title="MY TEAM">Review the identity and operational details of your assigned team.</PageHeader><ErrorState message={state.message} retry={load} /></main>;
  const teams = state.data || [];
  return <main className="min-w-0"><PageHeader eyebrow="TEAM" title="MY TEAM">Review the identity and operational details of your assigned team.</PageHeader>{!teams.length ? <EmptyState>No team is assigned to this account yet.</EmptyState> : <section className="mt-6 grid min-w-0 gap-5 xl:grid-cols-2">{teams.map((team) => <article key={team.team_id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-4">{team.logo ? <img src={team.logo} alt={`${team.name} logo`} className="h-20 w-20 rounded-full border border-slate-200 object-contain p-1" /> : <div aria-label={`${team.name} logo unavailable`} className="grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-xl font-extrabold text-slate-600">{initials(team.name)}</div>}<div className="min-w-0"><p className="text-xs font-extrabold tracking-[.14em] text-[#b83729]">TEAM IDENTITY</p><h2 className="mt-1 truncate text-2xl font-extrabold text-slate-900">{team.name}</h2><div className="mt-2 flex flex-wrap gap-2"><Badge>{team.status}</Badge><Badge>{team.gender}</Badge><Badge>{team.team_type}</Badge></div></div></div><dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2"><Info label="Team ID" value={`#${team.team_id}`} /><Info label="Club" value={team.club?.name} /><Info label="Home venue" value={team.home_venue?.name} /><Info label="City" value={team.city} /><Info label="Created" value={date(team.created_at)} /><Info label="Description" value={team.description} /></dl></article>)}</section>}</main>;
}

function Info({ label, value }) { if (label === "Club" && !FEATURES.CLUBS_ENABLED) return null; return <div className="min-w-0"><dt className="text-[10px] font-extrabold tracking-[.12em] text-slate-500">{label.toUpperCase()}</dt><dd className="mt-1 break-words font-semibold text-slate-800">{value || "—"}</dd></div>; }

export function TeamOwnerPlayersPage() {
  const [page, setPage] = useState(1); const [state, setState] = useState({ kind: "loading", data: [], pagination: {} });
  const load = useCallback(async () => { setState((current) => ({ ...current, kind: "loading" })); try { const response = await apiClient.get("/team-owner/players", { params: { page, limit: pageLimit } }); setState({ kind: "ready", data: response.data.data || [], pagination: response.data.pagination || {} }); } catch (error) { setState({ kind: "error", data: [], pagination: {}, message: errorMessage(error, "Players could not be loaded.") }); } }, [page]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  return <main className="min-w-0"><PageHeader eyebrow="TEAM" title="PLAYERS">View the authoritative player memberships for your team.</PageHeader>{state.kind === "loading" && <Loading label="Loading players" />}{state.kind === "error" && <ErrorState message={state.message} retry={load} />}{state.kind === "ready" && <><PlayerTable players={state.data} /><PlayerCards players={state.data} />{!state.data.length && <EmptyState>No active player memberships are available yet.</EmptyState>}<Pagination pagination={state.pagination} page={page} setPage={setPage} /></>}</main>;
}

function PlayerTable({ players }) { return <section className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm lg:block"><table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-extrabold tracking-[.1em] text-slate-500"><tr><th className="px-4 py-3">PLAYER</th><th>REGISTRATION NO.</th><th>POSITION</th><th>GENDER</th><th>JERSEY</th><th>MEMBERSHIP STATUS</th><th>JOINED</th><th className="px-4">ACTION</th></tr></thead><tbody>{players.map((membership) => <tr key={membership.team_player_id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-slate-900">{membership.player?.name || "Player"}</td><td>{membership.player?.registration_number || "—"}</td><td>{membership.player?.position || "—"}</td><td>{membership.player?.gender || "—"}</td><td>{membership.jersey_number ?? "—"}</td><td><Badge>{membership.status}</Badge></td><td>{date(membership.joined_at)}</td><td className="px-4"><Link to={`/team/players/${membership.player?.player_id}`} className="text-xs font-extrabold text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#d94d3d]">VIEW</Link></td></tr>)}</tbody></table></section>; }

function PlayerCards({ players }) { return <section className="mt-6 grid gap-3 lg:hidden">{players.map((membership) => <article key={membership.team_player_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-extrabold text-slate-900">{membership.player?.name || "Player"}</h2><p className="mt-1 text-xs text-slate-500">{membership.player?.registration_number || "No registration number"}</p></div><Badge>{membership.status}</Badge></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Position" value={membership.player?.position} /><Info label="Gender" value={membership.player?.gender} /><Info label="Jersey" value={membership.jersey_number} /><Info label="Joined" value={date(membership.joined_at)} /></dl><Link to={`/team/players/${membership.player?.player_id}`} className="mt-4 inline-block text-xs font-extrabold text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#d94d3d]">VIEW PLAYER →</Link></article>)}</section>; }

export function TeamOwnerPlayerDetailsPage() {
  const { playerId } = useParams(); const [state, load] = useTeamOwnerData(`/team-owner/players/${playerId}`, null);
  const notFound = state.kind === "error" && /not found/i.test(state.message || "");
  return <main className="min-w-0"><Link to="/team/players" className="text-xs font-extrabold text-[#b83729] focus:outline-none focus:ring-2 focus:ring-[#d94d3d]">← BACK TO PLAYERS</Link>{state.kind === "loading" && <Loading label="Loading player details" />}{state.kind === "error" && <>{notFound ? <EmptyState>This player is not available in your team.</EmptyState> : <ErrorState message={state.message} retry={load} />}</>}{state.kind === "ready" && <PlayerDetails membership={state.data} />}</main>;
}

function PlayerDetails({ membership }) { const player = membership.player || {}; return <section className="mt-5 max-w-4xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-4">{player.profile_photo ? <img src={player.profile_photo} alt={`${player.name} profile`} className="h-24 w-24 rounded-full object-cover" /> : <div aria-label={`${player.name || "Player"} photo unavailable`} className="grid h-24 w-24 place-items-center rounded-full bg-slate-100 text-2xl font-extrabold text-slate-600">{initials(player.name)}</div>}<div className="min-w-0"><p className="text-xs font-extrabold tracking-[.14em] text-[#b83729]">PLAYER PROFILE</p><h1 className="mt-1 truncate text-3xl font-extrabold text-slate-900">{player.name || "Player"}</h1><p className="mt-1 text-sm text-slate-500">{player.registration_number || "Registration not recorded"}</p></div></div><dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3"><Info label="Position" value={player.position} /><Info label="Gender" value={player.gender} /><Info label="Jersey number" value={membership.jersey_number} /><Info label="Membership status" value={membership.status} /><Info label="Joined" value={date(membership.joined_at)} /><Info label="Team" value={membership.team?.name} /></dl></section>; }

function usePagedEndpoint(path, fallback) { const [page, setPage] = useState(1); const [state, setState] = useState({ kind: "loading", data: [], pagination: {} }); const load = useCallback(async () => { setState((current) => ({ ...current, kind: "loading" })); try { const response = await apiClient.get(path, { params: { page, limit: pageLimit } }); setState({ kind: "ready", data: response.data.data || [], pagination: response.data.pagination || {} }); } catch (error) { setState({ kind: "error", data: [], pagination: {}, message: errorMessage(error, fallback) }); } }, [page, path, fallback]); useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]); return { page, setPage, state, load }; }

export function TeamOwnerRegistrationsPage() {
  const { page, setPage, state, load } = usePagedEndpoint("/team-owner/registrations", "Registrations could not be loaded.");
  return <main className="min-w-0"><PageHeader eyebrow="OPERATIONS" title="REGISTRATIONS">Review competition registrations associated with your team.</PageHeader>{state.kind === "loading" && <Loading label="Loading registrations" />}{state.kind === "error" && <ErrorState message={state.message} retry={load} />}{state.kind === "ready" && <><RegistrationTable rows={state.data} /><RegistrationCards rows={state.data} />{!state.data.length && <EmptyState>No competition registrations are available yet.</EmptyState>}<Pagination pagination={state.pagination} page={page} setPage={setPage} /></>}</main>;
}

function RegistrationTable({ rows }) { return <section className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm lg:block"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-extrabold tracking-[.1em] text-slate-500"><tr><th className="px-4 py-3">COMPETITION</th><th>TEAM</th><th>REGISTRATION STATUS</th><th>PAYMENT STATUS</th><th className="px-4">ACTION</th></tr></thead><tbody>{rows.map((registration) => <tr key={registration.registration_id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-slate-900">{registration.competition?.name || "Competition"}</td><td>{registration.team?.name || "—"}</td><td><Badge>{registration.registration_status}</Badge></td><td><Badge>{registration.payment_status}</Badge></td><td className="px-4"><Link to={`/team/registrations/${registration.registration_id}`} className="text-xs font-extrabold text-[#b83729]">VIEW</Link></td></tr>)}</tbody></table></section>; }
function RegistrationCards({ rows }) { return <section className="mt-6 grid gap-3 lg:hidden">{rows.map((registration) => <article key={registration.registration_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-extrabold text-slate-900">{registration.competition?.name || "Competition"}</h2><p className="mt-1 text-sm text-slate-500">{registration.team?.name || "Team"}</p><div className="mt-4 flex flex-wrap gap-2"><Badge>{registration.registration_status}</Badge><Badge>{registration.payment_status}</Badge></div><Link to={`/team/registrations/${registration.registration_id}`} className="mt-4 inline-flex text-xs font-extrabold text-[#b83729]">VIEW</Link></article>)}</section>; }

export function TeamOwnerPaymentsPage() {
  const { page, setPage, state, load } = usePagedEndpoint("/team-owner/payments", "Payments could not be loaded.");
  return <main className="min-w-0"><PageHeader eyebrow="OPERATIONS" title="PAYMENTS">Review payment records connected to your team registrations.</PageHeader>{state.kind === "loading" && <Loading label="Loading payments" />}{state.kind === "error" && <ErrorState message={state.message} retry={load} />}{state.kind === "ready" && <><TeamOwnerPaymentTable rows={state.data} /><TeamOwnerPaymentCards rows={state.data} />{!state.data.length && <EmptyState>No payment records are available yet.</EmptyState>}<Pagination pagination={state.pagination} page={page} setPage={setPage} /></>}</main>;
}

function TeamOwnerPaymentTable({ rows }) { return <section className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm lg:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-extrabold tracking-[.1em] text-slate-500"><tr><th className="px-4 py-3">COMPETITION</th><th>TEAM</th><th>AMOUNT</th><th>STATUS</th><th>SUBMITTED</th><th className="px-4">ACTION</th></tr></thead><tbody>{rows.map((payment) => <tr key={payment.payment_id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-slate-900">{payment.registration?.competition?.name || "Competition"}</td><td>{payment.registration?.team?.name || "-"}</td><td>{amount(payment.amount)}</td><td><Badge>{payment.payment_status}</Badge></td><td>{date(payment.created_at)}</td><td className="px-4"><Link to={`/team/registrations/${payment.registration_id || ""}`} className="text-xs font-extrabold text-[#b83729]">VIEW REGISTRATION</Link></td></tr>)}</tbody></table></section>; }
function TeamOwnerPaymentCards({ rows }) { return <section className="mt-6 grid gap-3 lg:hidden">{rows.map((payment) => <article key={payment.payment_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-extrabold text-slate-900">{payment.registration?.competition?.name || "Competition"}</h2><p className="mt-1 text-sm text-slate-500">{payment.registration?.team?.name || "Team"}</p></div><Badge>{payment.payment_status}</Badge></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Amount" value={amount(payment.amount)} /><Info label="Submitted" value={date(payment.created_at)} /></dl><Link to={`/team/registrations/${payment.registration_id || ""}`} className="mt-4 inline-flex text-xs font-extrabold text-[#b83729]">VIEW REGISTRATION</Link></article>)}</section>; }

function PaymentTable({ rows }) { return <section className="mt-6 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm lg:block"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-[10px] font-extrabold tracking-[.1em] text-slate-500"><tr><th className="px-4 py-3">COMPETITION</th><th>TEAM</th><th>AMOUNT</th><th>STATUS</th><th className="px-4">SUBMITTED</th></tr></thead><tbody>{rows.map((payment) => <tr key={payment.payment_id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-slate-900">{payment.registration?.competition?.name || "Competition"}</td><td>{payment.registration?.team?.name || "—"}</td><td>{amount(payment.amount)}</td><td><Badge>{payment.payment_status}</Badge></td><td className="px-4">{date(payment.created_at)}</td></tr>)}</tbody></table></section>; }
function PaymentCards({ rows }) { return <section className="mt-6 grid gap-3 lg:hidden">{rows.map((payment) => <article key={payment.payment_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-extrabold text-slate-900">{payment.registration?.competition?.name || "Competition"}</h2><p className="mt-1 text-sm text-slate-500">{payment.registration?.team?.name || "Team"}</p></div><Badge>{payment.payment_status}</Badge></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info label="Amount" value={amount(payment.amount)} /><Info label="Submitted" value={date(payment.created_at)} /></dl></article>)}</section>; }
export { PaymentTable, PaymentCards };
