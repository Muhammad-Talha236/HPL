
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  RotateCcw,
  UsersRound,
  UserRound,
  ShieldCheck,
  UserX,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";

import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../constants/roles";
import { USER_STATUS } from "../../../constants/statuses";
import AdminAddUserModal from "../components/AdminAddUserModal";
import {
  adminUsersService,
  getAdminUsersError,
} from "../services/adminUsersService";

const LIMIT = 10;

const initialFilters = {
  q: "",
  role: "",
  status: "",
  sort: "newest",
};

const roleLabels = {
  USER: "Normal User",
  TEAM_OWNER: "Team Owner",
  CLUB_OWNER: "Club Owner",
  REFEREE: "Referee",
  SUPER_ADMIN: "Super Admin",
};

const statusColors = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-amber-50 text-amber-700",
  BLOCKED: "bg-rose-50 text-rose-700",
};

function formatDate(value) {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "â€”";

  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function UserAvatar({ user }) {
  const initials = String(user.name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 text-xs font-bold text-[#078052]">
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icon size={23} />
      </span>
      <div>
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-[26px] font-extrabold leading-none text-[#10213F]">
          {value === null || value === undefined
            ? "â€”"
            : Number(value).toLocaleString("en-PK")}
        </p>
      </div>
    </article>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [addOpen, setAddOpen] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.q.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.q]);

  const refresh = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await adminUsersService.list(
          {
            page,
            limit: LIMIT,
            q: debouncedSearch,
            role: filters.role,
            status: filters.status,
            sort: filters.sort,
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        setUsers(result.users);
        setPagination(result.pagination);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(getAdminUsersError(err));
        setUsers([]);
        setPagination(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [
    page,
    debouncedSearch,
    filters.role,
    filters.status,
    filters.sort,
    revision,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      setStatsLoading(true);

      try {
        const result = await adminUsersService.stats(
          controller.signal
        );
        if (!controller.signal.aborted) setStats(result);
      } catch (err) {
        if (!controller.signal.aborted) {
          setStats(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();
    return () => controller.abort();
  }, [revision]);

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
    setDebouncedSearch("");
    setPage(1);
    setMenuId(null);
  };

  const notify = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const changeStatus = async (account, action) => {
    const actionLabels = {
      activate: "Activate",
      deactivate: "Deactivate",
      block: "Block",
    };

    const confirmed = window.confirm(
      `${actionLabels[action]} ${account.name}'s account?`
    );

    if (!confirmed) return;

    setBusyId(account.user_id);
    setMenuId(null);
    setMessage("");

    try {
      await adminUsersService.changeStatus(
        account.user_id,
        action
      );

      notify(`Account ${action} action completed successfully.`);
      refresh();
    } catch (err) {
      notify(getAdminUsersError(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);
  const start = total ? (page - 1) * LIMIT + 1 : 0;
  const end = Math.min(page * LIMIT, total);

  const cards = [
    {
      label: "Total Users",
      value: stats?.total_users,
      icon: UsersRound,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Normal Users",
      value: stats?.normal_users,
      icon: UserRound,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Team Owners",
      value: stats?.team_owners,
      icon: ShieldCheck,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Inactive Users",
      value: stats?.inactive_users,
      icon: UserX,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <div className="min-w-0 space-y-5 bg-[#F4F7FB] p-4 sm:p-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500">
        <Link to="/admin" className="hover:text-[#078052]">
          Dashboard
        </Link>
        <span className="mx-2">â€º</span>
        <span className="font-medium text-slate-700">
          Users
        </span>
      </nav>

      {/* Heading */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#10213F]">
            Users Management
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Manage registered users, roles and account status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#066A44]"
        >
          <Plus size={17} />
          Add User
        </button>
      </header>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            {...card}
            value={statsLoading ? null : card.value}
          />
        ))}
      </section>

      {/* Feedback */}
      {message && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ${
            messageType === "error"
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <span>{message}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Users table card */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#10213F]">
                All Users
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Browse and manage HPL accounts
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              title="Refresh users"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={15} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_155px_145px_145px_auto]">
            <label className="relative min-w-0">
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
                placeholder="Search name, email or phone..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#078052]"
              />
            </label>

            <select
              value={filters.role}
              onChange={(event) =>
                setFilter("role", event.target.value)
              }
              aria-label="Filter by role"
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <option value="">All Roles</option>
              {Object.values(ROLES).map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role] || role}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                setFilter("status", event.target.value)
              }
              aria-label="Filter by status"
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <option value="">All Statuses</option>
              {Object.values(USER_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.sort}
              onChange={(event) =>
                setFilter("sort", event.target.value)
              }
              aria-label="Sort users"
              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name Aâ€“Z</option>
              <option value="name_desc">Name Zâ€“A</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-[#F7F9FC]">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined On</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2
                      size={22}
                      className="mx-auto animate-spin text-[#078052]"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Loading users...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((account, index) => {
                  const isSelf =
                    Number(currentUser?.user_id) ===
                    Number(account.user_id);

                  const busy = busyId === account.user_id;

                  return (
                    <tr
                      key={account.user_id}
                      className="text-xs text-slate-600 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        {start + index}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/users/${account.user_id}`}
                          className="flex items-center gap-2.5"
                        >
                          <UserAvatar user={account} />
                          <span className="max-w-[160px] truncate font-semibold text-[#10213F] hover:text-[#078052]">
                            {account.name}
                          </span>
                        </Link>
                      </td>

                      <td
                        title={account.email}
                        className="max-w-[190px] truncate px-4 py-3"
                      >
                        {account.email}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {account.phone || "â€”"}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          {roleLabels[account.role] || account.role}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(account.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                            statusColors[account.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={`/admin/users/${account.user_id}`}
                            title="View user"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={16} />
                          </Link>

                          <Link
                            to={`/admin/users/${account.user_id}`}
                            title="Edit in user details"
                            className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-[#078052]"
                          >
                            <Pencil size={16} />
                          </Link>

                          <div className="relative">
                            <button
                              type="button"
                              disabled={busy || isSelf}
                              title={
                                isSelf
                                  ? "You cannot change your own account status"
                                  : "Account actions"
                              }
                              onClick={() =>
                                setMenuId(
                                  menuId === account.user_id
                                    ? null
                                    : account.user_id
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

                            {menuId === account.user_id && (
                              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                                {account.status === "INACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeStatus(account, "activate")
                                    }
                                    className="w-full rounded-md px-3 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50"
                                  >
                                    Activate Account
                                  </button>
                                )}

                                {account.status === "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeStatus(account, "deactivate")
                                    }
                                    className="w-full rounded-md px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50"
                                  >
                                    Deactivate Account
                                  </button>
                                )}

                                {account.status !== "BLOCKED" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeStatus(account, "block")
                                    }
                                    className="w-full rounded-md px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"
                                  >
                                    Block Account
                                  </button>
                                )}

                                {account.status === "BLOCKED" && (
                                  <p className="px-3 py-2 text-xs text-slate-500">
                                    No unblocking endpoint available.
                                  </p>
                                )}
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
            Showing {start}â€“{end} of {total} users
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                setPage((value) => value - 1);
                setMenuId(null);
              }}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => {
                setPage((value) => value + 1);
                setMenuId(null);
              }}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      <AdminAddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          notify("Normal user created successfully.");
          setPage(1);
          refresh();
        }}
      />
    </div>
  );
}
