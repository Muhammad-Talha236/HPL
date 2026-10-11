
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Image as ImageIcon,
  Info,
  MapPin,
  Pencil,
  RefreshCw,
  Shield,
  Shirt,
  UserRound,
  Users,
} from "lucide-react";

import apiClient from "../../../services/apiClient";

import AdminTeamPlayersTab from "../components/AdminTeamPlayersTab";
import AdminTeamHistoryTab from "../components/AdminTeamHistoryTab";
import AdminTeamStaffTab from "../components/AdminTeamStaffTab";
import AdminTeamKitsTab from "../components/AdminTeamKitsTab";
import AdminTeamDocumentsTab from "../components/AdminTeamDocumentsTab";

// Team details navigation
const TABS = [
  { key: "overview", label: "Overview", icon: Shield },
  { key: "players", label: "Players", icon: Users },
  { key: "staff", label: "Staff", icon: UserRound },
  { key: "kits", label: "Kits", icon: Shirt },
  {
    key: "registrations",
    label: "Registrations",
    icon: CheckCircle2,
  },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "history", label: "History", icon: History },
];

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const display = (value) =>
  value === null || value === undefined || value === ""
    ? "Not provided"
    : String(value);

const getError = (error) =>
  error?.response?.data?.message ||
  "Unable to load information. Please try again.";

// Reusable information panel
function Panel({ title, icon: Icon = Info, action, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#10213f]">
          <Icon size={18} className="text-[#078052]" />
          {title}
        </h2>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

// Reusable profile field
function Field({ label, value }) {
  return (
    <div className="min-w-0 border-b border-slate-100 pb-3">
      <dt className="text-xs font-medium text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm font-medium text-[#10213f]">
        {display(value)}
      </dd>
    </div>
  );
}

function Empty({ children }) {
  return (
    <p className="py-7 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

function Status({ value }) {
  const normalized = String(value || "UNKNOWN").toUpperCase();

  const style =
    normalized === "ACTIVE" || normalized === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "PENDING"
        ? "bg-amber-50 text-amber-700"
        : normalized === "INACTIVE" || normalized === "REJECTED"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export default function AdminTeamDetailsPage() {
  const { teamId } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const tabValue = searchParams.get("tab") || "overview";

  const tab = TABS.some((item) => item.key === tabValue)
    ? tabValue
    : "overview";

  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extraError, setExtraError] = useState("");
  const [busy, setBusy] = useState(false);

  // Fetch team profile from the existing backend API.
  const loadTeam = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get(
        `/admin/teams/${teamId}`,
        { signal }
      );

      if (!signal?.aborted) {
        setTeam(response.data.data);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(getError(err));
        setTeam(null);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [teamId]);

  useEffect(() => {
    const controller = new AbortController();

    loadTeam(controller.signal);

    return () => controller.abort();
  }, [loadTeam]);

  // Fetch statistics only when the Overview tab is active.
  useEffect(() => {
    if (!team || tab !== "overview") return;

    const controller = new AbortController();

    setExtraError("");

    apiClient
      .get(`/admin/teams/${teamId}/stats`, {
        signal: controller.signal,
      })
      .then((response) => {
        if (!controller.signal.aborted) {
          setStats(response.data.data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setExtraError(getError(err));
        }
      });

    return () => controller.abort();
  }, [tab, team, teamId]);

  // URL-based tab navigation.
  const changeTab = (key) => {
    setSearchParams(
      key === "overview" ? {} : { tab: key }
    );
  };

  // Activate or deactivate the team.
  const changeOperationalStatus = async () => {
    if (!team || busy) return;

    const action =
      team.status === "ACTIVE" ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `${action === "deactivate" ? "Deactivate" : "Activate"} ${team.name}?`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await apiClient.patch(
        `/teams/${teamId}/${action}`
      );

      await loadTeam();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading team details...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <p className="mb-3 text-sm text-red-600">
          {error || "Team not found."}
        </p>

        <button
          type="button"
          onClick={() => loadTeam()}
          className="mr-4 text-sm font-semibold text-[#078052]"
        >
          Retry
        </button>

        <Link
          to="/admin/teams"
          className="text-sm text-slate-600"
        >
          Back to Teams
        </Link>
      </div>
    );
  }

  const location = [
    team.city,
    team.district,
    team.region,
  ]
    .filter(Boolean)
    .join(", ");

  const players = team.team_players || [];
  const registrations = team.registrations || [];

  return (
    <main className="min-w-0 space-y-5 bg-[#f4f7fb] p-4 text-[#10213f] sm:p-6">

      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to="/admin"
          className="hover:text-[#078052]"
        >
          Dashboard
        </Link>

        <span>â€º</span>

        <Link
          to="/admin/teams"
          className="hover:text-[#078052]"
        >
          Teams
        </Link>

        <span>â€º</span>

        <span className="truncate font-medium text-slate-700">
          {team.name}
        </span>
      </nav>

      {/* PAGE HEADER */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight">
              {team.name}
            </h1>

            <Status value={team.status} />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View complete team information, players,
            staff, kits, documents and registrations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/teams"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <ArrowLeft size={15} />
            Back
          </Link>

          <Link
            to={`/admin/teams/${teamId}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <Pencil size={15} />
            Edit Team
          </Link>

          <button
            type="button"
            disabled={busy}
            onClick={changeOperationalStatus}
            className="rounded-lg bg-[#078052] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "Processing..."
              : team.status === "ACTIVE"
                ? "Deactivate"
                : "Activate"}
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {/* TEAM PROFILE BANNER */}
      <section className="overflow-hidden rounded-xl bg-gradient-to-r from-[#06182a] via-[#122e48] to-[#254b63] px-5 py-6 text-[#10213F] shadow-sm sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-5">

          <div className="flex min-w-0 items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={`${team.name} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Shield size={38} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold">
                {team.name}
              </h2>

              <p className="mt-1 flex items-center gap-1 text-sm text-[#10213F]/80">
                <MapPin size={14} />
                {display(location)}
              </p>

              <p className="mt-2 text-xs text-[#10213F]/75">
                {display(team.team_type)} Â· {display(team.gender)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs">
            <div>
              <p className="text-slate-600">
                Registered On
              </p>

              <p className="mt-1 flex items-center gap-1 font-semibold">
                <CalendarDays size={14} />
                {formatDate(team.created_at)}
              </p>
            </div>

            <div>
              <p className="text-slate-600">
                Owner
              </p>

              <p className="mt-1 font-semibold">
                {display(team.owner?.name)}
              </p>
            </div>

            <div>
              <p className="text-slate-600">
                Operational Status
              </p>

              <p className="mt-1 font-semibold">
                {display(team.status)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION */}
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white px-2"
        role="tablist"
        aria-label="Team details sections"
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => changeTab(key)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors ${
              tab === key
                ? "border-[#078052] text-[#078052]"
                : "border-transparent text-slate-500 hover:text-[#078052]"
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {extraError && tab === "overview" && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          {extraError}
        </p>
      )}

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">

          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-4">

            {/* TEAM INFORMATION */}
            <Panel
              title="Team Information"
              icon={Info}
              action={
                <Link
                  to={`/admin/teams/${teamId}/edit`}
                  className="text-xs font-semibold text-[#078052]"
                >
                  Edit
                </Link>
              }
            >
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Team Name" value={team.name} />
                <Field label="Location" value={location} />
                <Field label="Registration Type" value={team.team_type} />
                <Field label="Gender" value={team.gender} />
                <Field label="Contact Email" value={team.contact_email} />
                <Field label="Contact Number" value={team.contact_phone} />
                <Field label="Home Ground" value={team.home_venue?.name} />
                <Field label="Team Owner" value={team.owner?.name} />
                <Field label="Created On" value={formatDate(team.created_at)} />
              </dl>
            </Panel>

            {/* PLAYERS PREVIEW */}
            <Panel
              title="Players"
              icon={Users}
              action={
                <button
                  type="button"
                  onClick={() => changeTab("players")}
                  className="text-xs font-semibold text-[#078052]"
                >
                  View All â†’
                </button>
              }
            >
              {players.length ? (
                <div className="space-y-2">
                  {players.slice(0, 5).map((membership) => (
                    <div
                      key={membership.team_player_id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <Link
                        to={`/players/${membership.player.player_id}`}
                        className="min-w-0 truncate text-sm font-medium hover:text-[#078052]"
                      >
                        {membership.player.name}
                      </Link>

                      <span className="text-xs text-slate-500">
                        {display(membership.player.position)}
                        {" Â· #"}
                        {display(membership.jersey_number)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>No active team players.</Empty>
              )}

              <p className="mt-3 text-xs text-slate-500">
                {team.player_count ?? players.length} active players
              </p>
            </Panel>
          </div>

          {/* RIGHT COLUMN */}
          <div className="min-w-0 space-y-4">

            {/* TEAM LOGO */}
            <Panel title="Team Logo" icon={ImageIcon}>
              <div className="flex flex-col items-center gap-3">
                {team.logo ? (
                  <>
                    <img
                      src={team.logo}
                      alt={`${team.name} logo`}
                      className="h-32 w-32 object-contain"
                    />

                    <a
                      href={team.logo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#078052]"
                    >
                      View Full Logo â†—
                    </a>
                  </>
                ) : (
                  <Empty>No logo uploaded.</Empty>
                )}
              </div>
            </Panel>

            {/* TEAM DETAILS */}
            <Panel title="Team Details" icon={ClipboardList}>
              <dl className="space-y-3">
                <Field label="City" value={team.city} />
                <Field label="District" value={team.district} />
                <Field label="Region" value={team.region} />
                <Field label="Description" value={team.description} />
              </dl>
            </Panel>

            {/* TEAM STATISTICS */}
            <Panel
              title={`Team Statistics${
                stats?.season ? ` Â· ${stats.season}` : ""
              }`}
              icon={CheckCircle2}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Players", stats?.total_players, "bg-blue-50 text-blue-700"],
                  ["Played", stats?.matches_played, "bg-emerald-50 text-emerald-700"],
                  ["Wins", stats?.wins, "bg-amber-50 text-amber-700"],
                  ["Losses", stats?.losses, "bg-rose-50 text-rose-700"],
                ].map(([label, value, style]) => (
                  <div
                    key={label}
                    className={`rounded-lg p-3 text-center ${style}`}
                  >
                    <p className="text-2xl font-bold">
                      {value ?? "â€”"}
                    </p>

                    <p className="mt-1 text-xs">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {!stats?.season && (
                <p className="mt-3 text-xs text-slate-500">
                  No current active season identified;
                  match statistics may be unavailable.
                </p>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* PLAYERS TAB */}
      {tab === "players" && (
        <AdminTeamPlayersTab teamId={teamId} />
      )}

      {/* STAFF TAB */}
      {tab === "staff" && (
        <AdminTeamStaffTab teamId={teamId} />
      )}

      {/* KITS TAB */}
      {tab === "kits" && (
        <AdminTeamKitsTab teamId={teamId} />
      )}

      {/* REGISTRATIONS TAB */}
      {tab === "registrations" && (
        <Panel
          title="Competition Registrations"
          icon={CheckCircle2}
        >
          {registrations.length ? (
            <div className="space-y-3">
              {registrations.map((registration) => (
                <div
                  key={registration.registration_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {registration.competition?.name ||
                        "Competition unavailable"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {registration.competition?.season?.name ||
                        "Season unavailable"}
                      {" Â· "}
                      {formatDate(registration.registration_date)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Status
                      value={registration.registration_status}
                    />

                    <Status
                      value={registration.payment_status}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              No competition registrations found.
            </Empty>
          )}
        </Panel>
      )}

      {/* DOCUMENTS TAB */}
      {tab === "documents" && (
        <AdminTeamDocumentsTab teamId={teamId} />
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <AdminTeamHistoryTab teamId={teamId} />
      )}

      {/* REFRESH */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => loadTeam()}
          disabled={loading || busy}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#078052] disabled:opacity-50"
        >
          <RefreshCw size={14} />
          Refresh team data
        </button>
      </div>
    </main>
  );
}
