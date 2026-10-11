
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import useAuth from "../../../hooks/useAuth";
import { USER_STATUS } from "../../../constants/statuses";
import AdminEditUserModal from "../components/AdminEditUserModal";
import AdminChangeRoleModal from "../components/AdminChangeRoleModal";
import {
  adminUsersService,
  getAdminUsersError,
} from "../services/adminUsersService";

const roleLabels = {
  USER: "Normal User",
  TEAM_OWNER: "Team Owner",
  CLUB_OWNER: "Club Owner",
  REFEREE: "Referee",
  SUPER_ADMIN: "Super Admin",
};

const statusStyles = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-amber-50 text-amber-700",
  BLOCKED: "bg-rose-50 text-rose-700",
};

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";

  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name) {
  return String(name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] text-slate-500">
          {label}
        </dt>
        <dd className="mt-1 break-words text-[13px] font-semibold text-[#10213F]">
          {value || "Not provided"}
        </dd>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-[#10213F]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AdminUserDetailsPage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("success");

  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const loadUser = useCallback(async (signal) => {
    try {
      const result = await adminUsersService.getById(
        userId,
        signal
      );

      if (!signal?.aborted) {
        setAccount(result);
        setError("");
      }
    } catch (err) {
      if (
        err.code === "ERR_CANCELED" ||
        signal?.aborted
      ) {
        return;
      }

      setError(getAdminUsersError(err));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setAccount(null);
    setError("");
    setFeedback("");

    loadUser(controller.signal);

    return () => controller.abort();
  }, [loadUser]);

  const reloadAfterSave = async (message) => {
    await loadUser();
    setFeedback(message);
    setFeedbackType("success");
  };

  const isSelf =
    account &&
    Number(currentUser?.user_id) ===
      Number(account.user_id);

  const changeStatus = async (action) => {
    if (!account || busyAction || isSelf) return;

    const actionLabels = {
      activate: "activate",
      deactivate: "deactivate",
      block: "block",
    };

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabels[action]} ${account.name}'s account?`
      )
    ) {
      return;
    }

    setBusyAction(action);
    setFeedback("");

    try {
      await adminUsersService.changeStatus(
        account.user_id,
        action
      );

      await loadUser();

      setFeedback(
        `Account ${action} action completed successfully.`
      );
      setFeedbackType("success");
    } catch (err) {
      setFeedback(getAdminUsersError(err));
      setFeedbackType("error");
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center gap-3 text-sm text-slate-500">
        <Loader2
          size={22}
          className="animate-spin text-[#078052]"
        />
        Loading user details...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <UserRound
            size={34}
            className="mx-auto text-slate-400"
          />
          <h2 className="mt-3 text-lg font-bold text-[#10213F]">
            User unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {error || "This user account was not found."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/admin/users"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Back to Users
            </Link>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadUser();
              }}
              className="rounded-lg bg-[#078052] px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const relationships = [
    ...(account.owned_clubs || []).map((club) => ({
      key: `club-${club.club_id}`,
      type: "Club Owner",
      name: club.name,
      id: club.club_id,
      status: club.status,
      href: `/admin/clubs/${club.club_id}`,
    })),
    ...(account.owned_teams || []).map((team) => ({
      key: `team-${team.team_id}`,
      type: "Team Owner",
      name: team.name,
      id: team.team_id,
      status: team.status,
      href: `/admin/teams/${team.team_id}`,
    })),
  ];

  return (
    <div className="min-w-0 space-y-5 bg-[#F4F7FB] p-4 sm:p-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-[#078052]">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          to="/admin/users"
          className="hover:text-[#078052]"
        >
          Users
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">
          User Details
        </span>
      </nav>

      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/users"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#078052]"
          >
            <ArrowLeft size={14} />
            Back to Users
          </Link>

          <h1 className="text-[27px] font-extrabold tracking-tight text-[#10213F]">
            User Details
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            View and manage account information and permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadUser()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Feedback */}
      {(feedback || error) && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ${
            error || feedbackType === "error"
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <span>{error || feedback}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => {
              setError("");
              setFeedback("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Profile summary */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-50 text-xl font-extrabold text-[#078052]">
              {account.profile_image ? (
                <img
                  src={account.profile_image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(account.name)
              )}
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-xl font-extrabold text-[#10213F]">
                {account.name}
              </h2>
              <p className="mt-1 break-all text-xs text-slate-500">
                {account.email}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {roleLabels[account.role] || account.role}
                </span>

                <span
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                    statusStyles[account.status] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {account.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#066A44]"
            >
              <Edit3 size={15} />
              Edit Profile
            </button>

            {!isSelf && (
              <button
                type="button"
                onClick={() => setRoleOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Shield size={15} />
                Change Role
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Information grid */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Section
          title="Personal Information"
          description="Basic user profile details"
        >
          <dl className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Full Name"
              value={account.name}
              icon={UserRound}
            />
            <InfoItem
              label="Email Address"
              value={account.email}
              icon={Mail}
            />
            <InfoItem
              label="Phone Number"
              value={account.phone}
              icon={Phone}
            />
            <InfoItem
              label="Location"
              value={account.location}
              icon={MapPin}
            />
            <InfoItem
              label="Date of Birth"
              value={
                account.date_of_birth
                  ? formatDate(account.date_of_birth)
                  : null
              }
              icon={CalendarDays}
            />
            <InfoItem
              label="User ID"
              value={`#${account.user_id}`}
              icon={UsersRound}
            />
          </dl>
        </Section>

        <Section
          title="Account & Access"
          description="Role, status and account history"
        >
          <dl className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Account Role"
              value={roleLabels[account.role] || account.role}
              icon={ShieldCheck}
            />
            <InfoItem
              label="Account Status"
              value={account.status}
              icon={Shield}
            />
            <InfoItem
              label="Registered On"
              value={formatDate(account.created_at)}
              icon={CalendarDays}
            />
            <InfoItem
              label="Last Updated"
              value={formatDate(account.updated_at)}
              icon={RefreshCw}
            />
          </dl>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-[#10213F]">
              Account Actions
            </h3>

            {isSelf ? (
              <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                You cannot deactivate, block or change your own
                administrative role from this page.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {account.status === USER_STATUS.INACTIVE && (
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={() => changeStatus("activate")}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    Activate
                  </button>
                )}

                {account.status === USER_STATUS.ACTIVE && (
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={() => changeStatus("deactivate")}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
                  >
                    <Ban size={15} />
                    Deactivate
                  </button>
                )}

                {account.status !== USER_STATUS.BLOCKED && (
                  <button
                    type="button"
                    disabled={Boolean(busyAction)}
                    onClick={() => changeStatus("block")}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                  >
                    <Ban size={15} />
                    Block Account
                  </button>
                )}

                {account.status === USER_STATUS.BLOCKED && (
                  <p className="text-xs text-slate-500">
                    This account is blocked. No unblocking
                    endpoint is currently available.
                  </p>
                )}

                {busyAction && (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Processing...
                  </span>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Linked profiles */}
      <Section
        title="Linked Profiles & Ownership"
        description="Teams, clubs and referee identities associated with this account"
      >
        {!relationships.length && !account.referee_profile ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
            <UsersRound
              size={25}
              className="mx-auto text-slate-400"
            />
            <p className="mt-2 text-xs text-slate-500">
              No linked team ownership, club ownership or
              referee profile.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {relationships.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="rounded-lg border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#078052]">
                    {item.type}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    #{item.id}
                  </span>
                </div>
                <h3 className="mt-2 truncate text-sm font-bold text-[#10213F]">
                  {item.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  {item.status}
                </p>
              </Link>
            ))}

            {account.referee_profile && (
              <Link
                to={`/admin/referees/${account.referee_profile.referee_id}`}
                className="rounded-lg border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#078052]">
                    Referee Profile
                  </span>
                  <span className="text-[11px] text-slate-400">
                    #{account.referee_profile.referee_id}
                  </span>
                </div>
                <h3 className="mt-2 truncate text-sm font-bold text-[#10213F]">
                  {account.referee_profile.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  {account.referee_profile.status}
                </p>
              </Link>
            )}
          </div>
        )}
      </Section>

      {/* Modals */}
      {editOpen && (
        <AdminEditUserModal
          user={account}
          onClose={() => setEditOpen(false)}
          onSaved={reloadAfterSave}
        />
      )}

      {roleOpen && (
        <AdminChangeRoleModal
          user={account}
          onClose={() => setRoleOpen(false)}
          onSaved={reloadAfterSave}
        />
      )}
    </div>
  );
}
