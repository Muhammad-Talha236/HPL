import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../constants/roles";
import { USER_STATUS } from "../../../constants/statuses";
import apiClient from "../../../services/apiClient";

const AdminUsersPage = () => {
  const { user: actingUser } = useAuth();
  const [filters, setFilters] = useState({ q: "", role: "", status: "" });
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    status: "loading",
    data: [],
    pagination: null,
  });
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const response = await apiClient.get("/users", {
        params: { ...filters, page, limit: 20 },
      });
      setState({
        status: "success",
        data: response.data.data || [],
        pagination: response.data.pagination || null,
      });
    } catch {
      setState({ status: "error", data: [], pagination: null });
    }
  }, [filters, page]);
  useEffect(() => {
    const timer = window.setTimeout(load, 220);
    return () => window.clearTimeout(timer);
  }, [load]);
  const changeFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const changeStatus = async (target, action) => {
    if (!window.confirm(`${action} ${target.name}'s account?`)) return;
    setMessage("");
    try {
      await apiClient.patch(`/users/${target.user_id}/${action}`);
      setMessage(`User ${action}d successfully.`);
      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Action failed. Please try again.",
      );
    }
  };
  return (
    <div className="p-5 sm:p-8">
      <p className="text-xs font-bold tracking-[.15em] text-[#EEC058]">
        MANAGEMENT
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#ffad9f]">USERS</h1>
          <p className="mt-1 text-sm text-white/55">
            Manage account access and account status.
          </p>
        </div>
        {state.pagination && (
          <p className="text-xs text-white/50">
            {state.pagination.total} total accounts
          </p>
        )}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <input
          value={filters.q}
          onChange={(event) => changeFilter("q", event.target.value)}
          placeholder="Search name or email"
          className="rounded-lg border border-white/10 bg-[#0B1D2F] p-3 text-sm outline-none focus:border-[#EEC058]"
        />
        <select
          value={filters.role}
          onChange={(event) => changeFilter("role", event.target.value)}
          className="rounded-lg border border-white/10 bg-[#0B1D2F] p-3 text-sm outline-none focus:border-[#EEC058]"
        >
          <option value="">All roles</option>
          {Object.values(ROLES).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) => changeFilter("status", event.target.value)}
          className="rounded-lg border border-white/10 bg-[#0B1D2F] p-3 text-sm outline-none focus:border-[#EEC058]"
        >
          <option value="">All statuses</option>
          {Object.values(USER_STATUS).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      {message && (
        <p className="mt-4 rounded border border-[#EEC058]/30 bg-[#EEC058]/10 p-3 text-sm text-[#f4d383]">
          {message}
        </p>
      )}
      {state.status === "loading" && (
        <p className="mt-6 text-white/55">Loading users…</p>
      )}
      {state.status === "error" && (
        <p className="mt-6 text-red-200">
          Users could not be loaded.{" "}
          <button type="button" onClick={load} className="font-bold underline">
            TRY AGAIN
          </button>
        </p>
      )}
      {state.status === "success" && (
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
          {state.data.length === 0 && (
            <p className="p-5 text-sm text-white/55">
              No user accounts match these filters.
            </p>
          )}
          {state.data.map((account) => {
            const isSelf = Number(actingUser?.user_id) === account.user_id;
            return (
              <article
                key={account.user_id}
                className="grid gap-3 border-b border-white/10 bg-[#0B1D2F] p-4 last:border-0 lg:grid-cols-[1.1fr_1.3fr_.8fr_.7fr_auto] lg:items-center"
              >
                <Link
                  to={`/admin/users/${account.user_id}`}
                  className="font-bold hover:text-[#ffad9f]"
                >
                  {account.name}
                </Link>
                <span className="truncate text-sm text-white/60">
                  {account.email}
                </span>
                <span className="text-xs font-bold text-[#EEC058]">
                  {account.role}
                </span>
                <span className="text-xs text-white/60">{account.status}</span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
                  {account.status === USER_STATUS.ACTIVE && !isSelf && (
                    <button
                      type="button"
                      onClick={() => changeStatus(account, "deactivate")}
                      className="text-red-200 hover:text-white"
                    >
                      DEACTIVATE
                    </button>
                  )}
                  {account.status === USER_STATUS.INACTIVE && (
                    <button
                      type="button"
                      onClick={() => changeStatus(account, "activate")}
                      className="text-[#EEC058] hover:text-white"
                    >
                      ACTIVATE
                    </button>
                  )}
                  {account.status !== USER_STATUS.BLOCKED && !isSelf && (
                    <button
                      type="button"
                      onClick={() => changeStatus(account, "block")}
                      className="text-red-200 hover:text-white"
                    >
                      BLOCK
                    </button>
                  )}
                  <Link
                    to={`/admin/users/${account.user_id}`}
                    className="text-white/60 hover:text-white"
                  >
                    DETAILS
                  </Link>
                </span>
              </article>
            );
          })}
        </div>
      )}
      {state.pagination?.total_pages > 1 && (
        <div className="mt-5 flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded border border-white/15 px-3 py-2 disabled:opacity-40"
          >
            PREVIOUS
          </button>
          <span className="text-white/55">
            Page {page} of {state.pagination.total_pages}
          </span>
          <button
            type="button"
            disabled={page >= state.pagination.total_pages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded border border-white/15 px-3 py-2 disabled:opacity-40"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
};
export default AdminUsersPage;
