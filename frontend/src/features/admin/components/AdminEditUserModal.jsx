
import { useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import {
  adminUsersService,
  getAdminUsersError,
} from "../services/adminUsersService";

export default function AdminEditUserModal({
  user,
  onClose,
  onSaved,
}) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [saving, onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    if (cleanPhone.length > 30) {
      setError("Phone number cannot exceed 30 characters.");
      return;
    }

    const payload = {};

    if (cleanName !== user.name) payload.name = cleanName;

    if (cleanPhone !== (user.phone || "")) {
      payload.phone = cleanPhone || null;
    }

    if (!Object.keys(payload).length) {
      onClose();
      return;
    }

    setSaving(true);

    try {
      await adminUsersService.updateProfile(
        user.user_id,
        payload
      );

      await onSaved?.("User profile updated successfully.");
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
        aria-labelledby="edit-user-title"
        className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2
              id="edit-user-title"
              className="text-lg font-bold text-[#10213F]"
            >
              Edit User Profile
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Update basic account information.
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

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Full Name
            </span>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Phone Number
            </span>
            <input
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Email Address
            </span>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Email cannot be changed through this endpoint.
            </p>
          </label>

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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#066A44] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
