
import { useEffect, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import {
  adminUsersService,
  getAdminUsersError,
} from "../services/adminUsersService";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function AdminAddUserModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () =>
      document.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (name.length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        "Password must contain at least 8 characters, uppercase, lowercase, number and special character."
      );
      return;
    }

    setSaving(true);

    try {
      await adminUsersService.createNormalUser({
        name,
        email,
        phone: form.phone.trim() || undefined,
        password,
      });

      setForm(emptyForm);
      setShowPassword(false);
      onCreated?.();
      onClose?.();
    } catch (err) {
      setError(getAdminUsersError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-heading"
        className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2
              id="add-user-heading"
              className="text-lg font-bold text-[#10213F]"
            >
              Add New User
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a normal HPL user account.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close modal"
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
              className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          {[
            ["name", "Full Name", "text", "Enter full name"],
            ["email", "Email Address", "email", "name@example.com"],
            ["phone", "Phone Number (Optional)", "tel", "+92..."],
          ].map(([key, label, type, placeholder]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                {label}
              </span>
              <input
                type={type}
                required={key !== "phone"}
                value={form[key]}
                onChange={(event) =>
                  update(key, event.target.value)
                }
                placeholder={placeholder}
                maxLength={key === "name" ? 100 : undefined}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
              />
            </label>
          ))}

          <div>
            <label
              htmlFor="new-user-password"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Password
            </label>

            <input
              id="new-user-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(event) =>
                update("password", event.target.value)
              }
              placeholder="Enter a strong password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
            />

            <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) =>
                  setShowPassword(event.target.checked)
                }
              />
              Show password
            </label>
          </div>

          <p className="rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">
            This creates a normal user through the existing
            registration endpoint. Team Owner and Referee roles
            follow their own application workflows.
            Share credentials securely.
          </p>

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
                <UserPlus size={16} />
              )}
              {saving ? "Creating..." : "Create User"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
