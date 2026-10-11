
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import {
  adminTeamDetailsService,
  getTeamDetailsError,
} from "../services/adminTeamDetailsService";

const PAGE_SIZE = 10;

export default function AdminTeamPlayersTab({ teamId }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [position, setPosition] = useState("");
  const [page, setPage] = useState(1);

  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result =
          await adminTeamDetailsService.getPlayers(
            teamId,
            {
              page,
              limit: PAGE_SIZE,
              q: search,
              position,
              status,
            },
            controller.signal
          );

        if (controller.signal.aborted) return;

        setPlayers(result.players);
        setPagination(result.pagination);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getTeamDetailsError(err));
        setPlayers([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [teamId, page, search, status, position]);

  const total = pagination?.total ?? 0;
  const totalPages = Math.max(
    1,
    pagination?.total_pages ?? 1
  );

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#078052]" />
          <h2 className="text-base font-bold text-[#10213F]">
            Team Players
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Browse the complete team roster.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search player..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#078052]"
            />
          </label>

          <input
            type="text"
            value={position}
            onChange={(event) => {
              setPosition(event.target.value);
              setPage(1);
            }}
            placeholder="Position (exact value)"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#078052]"
          />

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Player membership status"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs"
          >
            <option value="ACTIVE">Active Players</option>
            <option value="INACTIVE">Inactive Players</option>
          </select>
        </div>
      </header>

      {error && (
        <p role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left">
          <thead className="bg-[#F7F9FC]">
            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Player</th>
              <th className="px-5 py-3">Position</th>
              <th className="px-5 py-3">Jersey</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Profile</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Loader2
                    size={22}
                    className="mx-auto animate-spin text-[#078052]"
                  />
                </td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-sm text-slate-500"
                >
                  No players found.
                </td>
              </tr>
            ) : (
              players.map((membership) => {
                const player = membership.player;

                return (
                  <tr
                    key={membership.team_player_id}
                    className="text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 font-bold text-[#078052]">
                          {player.profile_photo ? (
                            <img
                              src={player.profile_photo}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            player.name?.charAt(0) || "P"
                          )}
                        </div>
                        <span className="font-semibold text-[#10213F]">
                          {player.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      {player.position || "â€”"}
                    </td>

                    <td className="px-5 py-3">
                      {membership.jersey_number ?? "â€”"}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`rounded-md px-2.5 py-1 font-semibold ${
                          membership.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {membership.status}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/players/${player.player_id}`}
                        className="font-semibold text-[#078052] hover:underline"
                      >
                        View Player
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <p className="text-xs text-slate-500">
          {total
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}â€“${Math.min(page * PAGE_SIZE, total)} of ${total}`
            : "No players"}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
            aria-label="Previous page"
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs font-semibold">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
            aria-label="Next page"
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
