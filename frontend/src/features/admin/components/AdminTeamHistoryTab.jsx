
import { useEffect, useState } from "react";
import { History, Loader2, UserRound } from "lucide-react";
import {
  adminTeamDetailsService,
  getTeamDetailsError,
} from "../services/adminTeamDetailsService";

function formatDate(value) {
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
}

export default function AdminTeamHistoryTab({ teamId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result =
          await adminTeamDetailsService.getHistory(
            teamId,
            controller.signal
          );

        if (!controller.signal.aborted) {
          setEntries(result);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getTeamDetailsError(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [teamId]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[#078052]" />
          <h2 className="text-base font-bold text-[#10213F]">
            Team Activity History
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Latest recorded team audit events.
        </p>
      </header>

      <div className="p-5">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2
              size={23}
              className="animate-spin text-[#078052]"
            />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No recorded team activity.
          </p>
        ) : (
          <ol className="space-y-0">
            {entries.map((entry, index) => (
              <li
                key={entry.audit_id}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                {index !== entries.length - 1 && (
                  <span className="absolute left-[15px] top-9 bottom-0 w-px bg-slate-200" />
                )}

                <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#078052]">
                  <History size={15} />
                </span>

                <div className="min-w-0 flex-1 rounded-lg border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#10213F]">
                      {String(entry.action || "UNKNOWN")
                        .replaceAll("_", " ")}
                    </h3>

                    <time className="text-[11px] text-slate-400">
                      {formatDate(entry.created_at)}
                    </time>
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <UserRound size={14} />
                    {entry.actor?.name || "Actor unavailable"}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Audit ID #{entry.audit_id}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
