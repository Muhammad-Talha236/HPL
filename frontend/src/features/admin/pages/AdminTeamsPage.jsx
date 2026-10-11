
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  X,
} from "lucide-react";

import AdminTeamStatCard from "../components/AdminTeamStatCard";
import {
  adminTeamsService,
  getAdminTeamsError,
} from "../services/adminTeamsService";

const PAGE_SIZE = 10;

const initialFilters = {
  q: "",
  status: "",
  gender: "",
  type: "",
};

const formatDate = (value) => {
  if (!value) return "â€”";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";

  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const readable = (value) =>
  String(value || "â€”").replaceAll("_", " ");

function TeamLogo({ team }) {
  const initials = String(team.name || "T")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 text-xs font-bold text-[#078052]">
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export default function AdminTeamsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [teams, setTeams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [options, setOptions] = useState({
    types: [],
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const [menuId, setMenuId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(filters.q.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.q]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await adminTeamsService.list(
          {
            ...filters,
            q: search,
            page,
            limit: PAGE_SIZE,
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        setTeams(result.teams);
        setPagination(result.pagination);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(getAdminTeamsError(err));
        setTeams([]);
        setPagination(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, [
    page,
    search,
    filters.status,
    filters.gender,
    filters.type,
    revision,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    setStatsLoading(true);

    adminTeamsService
      .stats(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setStats(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStats(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      });

    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const controller = new AbortController();

    adminTeamsService
      .filterOptions(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted && result) {
          setOptions(result);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  const setFilter = (key, value) => {
    setPage(1);
    setMenuId(null);
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch("");
    setPage(1);
    setMenuId(null);
  };

  const refresh = () => {
    setRevision((value) => value + 1);
  };

  const changeStatus = async (team) => {
    const action =
      team.status === "ACTIVE" ? "deactivate" : "activate";

    if (
      !window.confirm(
        `${action === "activate" ? "Activate" : "Deactivate"} ${team.name}?`
      )
    ) {
      return;
    }

    setBusyId(team.team_id);
    setMenuId(null);
    setNotice("");

    try {
      await adminTeamsService.changeStatus(
        team.team_id,
        action
      );

      setNotice(
        `Team ${action === "activate" ? "activated" : "deactivated"} successfully.`
      );
      setNoticeType("success");
      refresh();
    } catch (err) {
      setNotice(getAdminTeamsError(err));
      setNoticeType("error");
    } finally {
      setBusyId(null);
    }
  };

  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, total);

  const statCards = [
    {
      title: "Total Teams",
      value: stats?.total,
      subtitle: "All registered teams",
      icon: Shield,
      color: "blue",
    },
    {
      title: "Active Teams",
      value: stats?.active,
      subtitle: "Currently active",
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Inactive Teams",
      value: stats?.inactive,
      subtitle: "Currently inactive",
      icon: ShieldOff,
      color: "red",
    },
    {
      title: "New This Month",
      value: stats?.new_this_month,
      subtitle:
        stats?.new_last_month !== undefined
          ? `${stats.new_last_month} registered last month`
          : "Monthly registrations",
      icon: Clock3,
      color: "amber",
    },
  ];

  return (
    <main className="min-w-0 space-y-5 bg-[#F4F7FB] p-4 sm:p-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500">
        <Link to="/admin" className="hover:text-[#078052]">
          Dashboard
        </Link>
        <span className="mx-2">â€º</span>
        <span className="font-semibold text-slate-700">
          Teams
        </span>
      </nav>

      {/* Heading */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#10213F]">
            Teams Management
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Manage registered teams, ownership and operational status.
          </p>
        </div>

        <Link
          to="/admin/teams/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066A44]"
        >
          <Plus size={17} />
          Add Team
        </Link>
      </header>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <AdminTeamStatCard
            key={card.title}
            {...card}
            loading={statsLoading}
          />
        ))}
      </section>

      {/* Action feedback */}
      {notice && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            noticeType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Listing */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#10213F]">
                All Teams
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Search, filter and manage league teams.
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {/* Backend-supported filters */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_150px_150px_170px_auto]">
            <label className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={filters.q}
                onChange={(event) =>
                  setFilter("q", event.target.value)
                }
                placeholder="Search team name..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#078052]"
              />
            </label>

            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) =>
                setFilter("status", event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              aria-label="Filter by gender"
              value={filters.gender}
              onChange={(event) =>
                setFilter("gender", event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <option value="">All Genders</option>
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
            </select>

            <select
              aria-label="Filter by team type"
              value={filters.type}
              onChange={(event) =>
                setFilter("type", event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <option value="">All Team Types</option>
              {(options.types || []).map((type) => (
                <option key={type} value={type}>
                  {readable(type)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
            <button
              type="button"
              onClick={refresh}
              className="ml-3 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-[#F7F9FC]">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Gender / Type</th>
                <th className="px-4 py-3">Players</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <Loader2
                      size={22}
                      className="mx-auto animate-spin text-[#078052]"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Loading teams...
                    </p>
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No teams found for the selected filters.
                  </td>
                </tr>
              ) : (
                teams.map((team, index) => {
                  const busy = busyId === team.team_id;

                  return (
                    <tr
                      key={team.team_id}
                      className="text-xs text-slate-600 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        {from + index}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/teams/${team.team_id}`}
                          className="flex min-w-[160px] items-center gap-3"
                        >
                          <TeamLogo team={team} />
                          <span className="min-w-0">
                            <span className="block max-w-[180px] truncate font-bold text-[#10213F] hover:text-[#078052]">
                              {team.name}
                            </span>
                            <span className="mt-1 block text-[11px] text-slate-400">
                              ID #{team.team_id}
                            </span>
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        {team.club?.name || "Independent"}
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[160px] truncate font-semibold text-slate-700">
                          {team.owner?.name || "â€”"}
                        </p>
                        <p className="mt-1 max-w-[160px] truncate text-[11px] text-slate-400">
                          {team.owner?.email || ""}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {readable(team.gender)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {readable(team.team_type)}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {team.player_count ?? "â€”"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(team.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                            team.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {readable(team.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/teams/${team.team_id}`}
                            title="View team"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={16} />
                          </Link>

                          <Link
                            to={`/admin/teams/${team.team_id}/edit`}
                            title="Edit team"
                            className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-[#078052]"
                          >
                            <Pencil size={16} />
                          </Link>

                          <div className="relative">
                            <button
                              type="button"
                              disabled={busy}
                              aria-label={`Actions for ${team.name}`}
                              onClick={() =>
                                setMenuId(
                                  menuId === team.team_id
                                    ? null
                                    : team.team_id
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                            >
                              {busy ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <MoreHorizontal size={16} />
                              )}
                            </button>

                            {menuId === team.team_id && (
                              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeStatus(team)
                                  }
                                  className={`w-full rounded-md px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                                    team.status === "ACTIVE"
                                      ? "text-rose-700"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {team.status === "ACTIVE"
                                    ? "Deactivate Team"
                                    : "Activate Team"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            Showing {from}â€“{to} of {total} teams
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => {
                setPage((value) => value - 1);
                setMenuId(null);
              }}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages || loading}
              onClick={() => {
                setPage((value) => value + 1);
                setMenuId(null);
              }}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
