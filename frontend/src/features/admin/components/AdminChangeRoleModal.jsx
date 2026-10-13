
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, ShieldCheck, X } from "lucide-react";
import { ROLES } from "../../../constants/roles";
import {
  adminUsersService,
  getAdminUsersError,
} from "../services/adminUsersService";

const labels = {
  USER: "Normal User",
  TEAM_OWNER: "Team Owner",
  CLUB_OWNER: "Club Owner",
  REFEREE: "Referee",
  SUPER_ADMIN: "Super Admin",
};

export default function AdminChangeRoleModal({
  user,
  onClose,
  onSaved,
}) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const ownsClubs = (user.owned_clubs || []).length > 0;
  const ownsTeams = (user.owned_teams || []).length > 0;
  const hasRefereeProfile = Boolean(user.referee_profile);

  const blockedByRelationship =
    (ownsClubs && role !== ROLES.CLUB_OWNER) ||
    (ownsTeams && role !== user.role) ||
    (hasRefereeProfile && role !== ROLES.REFEREE);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [saving, onClose]);

  const submit = async (event) => {
    event.preventDefault();

    if (
      saving ||
      role === user.role ||
      blockedByRelationship
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await adminUsersService.changeRole(
        user.user_id,
        role
      );

      await onSaved?.("User role updated successfully.");
      onClose();
    } catch (err) {
      setError(getAdminUsersError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-role-title"
        className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2
              id="change-role-title"
              className="text-lg font-bold text-[#10213F]"
            >
              Change User Role
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Update account permissions.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-4 p-6">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Selected User
            </p>
            <p className="mt-1 text-sm font-bold text-[#10213F]">
              {user.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Current Role
            </span>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {labels[user.role] || user.role}
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              New Role
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            >
              {Object.values(ROLES).filter(value => value !== "TEAM_OWNER").map((value) => (
                <option key={value} value={value}>
                  {labels[value] || value}
                </option>
              ))}
            </select>
          </label>

          {blockedByRelationship && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              <AlertTriangle size={17} className="shrink-0" />
              <span>
                This account has an existing club ownership,
                team ownership, or referee profile.
                Transfer or resolve the linked relationship
                before changing to an incompatible role.
              </span>
            </div>
          )}

          <div className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">
            <ShieldCheck size={17} className="shrink-0" />
            <span>
              Backend validates role permissions, linked
              relationships and Super Admin protection.
              A successful change updates account access.
            </span>
          </div>

          <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                role === user.role ||
                blockedByRelationship
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066A44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {saving ? "Updating..." : "Confirm Role Change"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
