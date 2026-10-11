
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  UserRound,
  History,
  Trophy,
  Activity,
} from "lucide-react";

import apiClient from "../../../services/apiClient";
import useAuth from "../../../hooks/useAuth";
import AdminStatCard from "../components/AdminStatCard";
import {
  UserRegistrationsChart,
  TeamsStatusChart,
} from "../components/AdminDashboardCharts";

const formatDateTime = (value) => {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";

  return date.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatStatus = (value) =>
  String(value || "UNKNOWN")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    SCHEDULED: "bg-blue-50 text-blue-700",
    LIVE: "bg-red-50 text-red-700",
    REJECTED: "bg-red-50 text-red-700",
    INACTIVE: "bg-slate-100 text-slate-600",
  };

  const normalized = String(status || "UNKNOWN").toUpperCase();

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${
        styles[normalized] || "bg-slate-100 text-slate-600"
      }`}
    >
      {formatStatus(normalized)}
    </span>
  );
}

function RecentActivity({ data }) {
  const rows = useMemo(() => {
    if (!data) return [];

    const users = (data.recent_users || []).map((user) => ({
      id: `user-${user.user_id}`,
      type: "User",
      description: "New user registered",
      subject: user.name,
      detail: user.email,
      date: user.created_at,
      status: user.status,
      href: `/admin/users/${user.user_id}`,
      icon: UsersRound,
      iconColor: "text-emerald-600",
    }));

    const registrations = (
      data.recent_team_registrations || []
    ).map((registration) => ({
      id: `registration-${registration.registration_id}`,
      type: "Registration",
      description: "Competition registration submitted",
      subject: registration.team?.name || "Unknown team",
      detail: registration.competition?.name || "Competition",
      date: registration.registration_date,
      status: registration.registration_status,
      href: `/admin/registrations/${registration.registration_id}`,
      icon: Trophy,
      iconColor: "text-blue-600",
    }));

    const matches = (data.recent_matches || []).map((match) => ({
      id: `match-${match.match_id}`,
      type: "Match",
      description: "Match record",
      subject: `${match.home_team?.name || "Home"} vs ${
        match.away_team?.name || "Away"
      }`,
      detail: match.competition?.name || "Competition",
      date: match.match_date,
      status: match.status,
      href: `/admin/matches/${match.match_id}`,
      icon: CalendarDays,
      iconColor: "text-violet-600",
    }));

    return [...users, ...registrations, ...matches]
      .sort((a, b) => {
        const aTime = new Date(a.date).getTime() || 0;
        const bTime = new Date(b.date).getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 8);
  }, [data]);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[#10213F]">
          <History size={18} />
          Recent Activity
        </h2>

        <span className="text-[11px] text-slate-500">
          Latest available records
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#F7F9FC]">
            <tr className="text-[11px] font-semibold text-slate-500">
              <th className="w-12 px-4 py-3">#</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">User / Team</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => {
              const Icon = row.icon;

              return (
                <tr
                  key={row.id}
                  className="text-xs text-slate-600 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">{index + 1}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={16}
                        className={row.iconColor}
                      />
                      <span>{row.type}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">
                    {row.description}
                  </td>

                  <td className="px-4 py-3">
                    <p className="max-w-[220px] truncate font-semibold text-[#10213F]">
                      {row.subject}
                    </p>
                    <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-slate-400">
                      {row.detail}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDateTime(row.date)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      to={row.href}
                      className="inline-flex items-center gap-1 font-semibold text-[#078052] hover:underline"
                    >
                      View <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No recent records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const years = useMemo(
    () =>
      Array.from(
        { length: 5 },
        (_, index) => currentYear - index
      ),
    [currentYear]
  );

  const loadDashboard = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get(
          "/admin/dashboard",
          {
            params: { year },
            signal,
          }
        );

        if (!signal?.aborted) {
          setData(response.data.data);
        }
      } catch (err) {
        if (
          err.code === "ERR_CANCELED" ||
          signal?.aborted
        ) {
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard information."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [year]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadDashboard(controller.signal);

    return () => controller.abort();
  }, [loadDashboard]);

  const today = new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date());

  const summary = data?.summary;

  return (
    <div className="min-w-0 space-y-5 bg-[#F4F7FB] p-4 sm:p-6">
      {/* Welcome section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[25px] font-extrabold leading-tight tracking-tight text-[#10213F] sm:text-[29px]">
            Welcome back,{" "}
            <span className="text-[#078052]">
              {user?.name || "HPL Super Admin"}
            </span>
          </h1>

          <p className="mt-1.5 text-xs text-slate-500 sm:text-[13px]">
            Manage seasons, teams, players, matches and keep
            Hunza Premier League running smoothly.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-[#078052]">
            <CalendarDays size={18} />
          </div>

          <div>
            <p className="text-xs font-bold text-[#10213F]">
              {today}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Hunza, Pakistan
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <p className="text-sm text-rose-700">
            {error}
            {data ? " Showing previously loaded data." : ""}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-700"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Initial loading */}
      {loading && !data && (
        <div className="space-y-4" aria-busy="true">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-[110px] animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <div className="h-[330px] animate-pulse rounded-xl bg-slate-200 xl:col-span-3" />
            <div className="h-[330px] animate-pulse rounded-xl bg-slate-200 xl:col-span-2" />
          </div>
        </div>
      )}

      {/* Loaded dashboard */}
      {data && (
        <>
          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              title="Total Users"
              value={summary?.users?.total}
              growth={summary?.users?.monthly_growth}
              icon={UsersRound}
              variant="green"
            />

            <AdminStatCard
              title="Total Teams"
              value={summary?.teams?.total}
              growth={summary?.teams?.monthly_growth}
              icon={ShieldCheck}
              variant="blue"
            />

            <AdminStatCard
              title="Total Players"
              value={summary?.players?.total}
              growth={summary?.players?.monthly_growth}
              icon={UserRound}
              variant="purple"
            />

            <AdminStatCard
              title="Active Seasons"
              value={summary?.active_seasons?.total}
              growth={summary?.active_seasons?.monthly_growth}
              icon={CalendarDays}
              variant="red"
              footer="Currently active seasons"
            />
          </section>

          {/* Charts */}
          <section className="grid min-w-0 gap-4 xl:grid-cols-5">
            <div className="min-w-0 xl:col-span-3">
              <UserRegistrationsChart
                months={data.user_registration_trend?.months || []}
                year={year}
                years={years}
                onYearChange={setYear}
              />
            </div>

            <div className="min-w-0 xl:col-span-2">
              <TeamsStatusChart
                statuses={data.team_statuses || []}
              />
            </div>
          </section>

          {/* Recent Activity */}
          <RecentActivity data={data} />

          {/* Quick navigation */}
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Manage Users",
                icon: UsersRound,
                to: "/admin/users",
              },
              {
                label: "Manage Teams",
                icon: ShieldCheck,
                to: "/admin/teams",
              },
              {
                label: "Manage Matches",
                icon: Activity,
                to: "/admin/matches",
              },
            ].map(({ label, icon: Icon, to }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-[#10213F] transition hover:border-emerald-300 hover:text-[#078052]"
              >
                <span className="flex items-center gap-2">
                  <Icon size={17} className="text-[#078052]" />
                  {label}
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </section>
        </>
      )}

      {!loading && !data && !error && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Dashboard data is unavailable.
        </div>
      )}
    </div>
  );
}
