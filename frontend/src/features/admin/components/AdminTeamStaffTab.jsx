
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import apiClient from "../../../services/apiClient";

const blank = { name: "", role: "", phone: "", email: "" };

const errorText = (error) =>
  error.response?.data?.message || "Request failed. Please try again.";

export default function AdminTeamStaffTab({ teamId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/teams/${teamId}/staff`, { signal });
      if (!signal?.aborted) setItems(response.data.data || []);
    } catch (err) {
      if (!signal?.aborted) setError(errorText(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const showForm = (item = null) => {
    setEditing(item);
    setForm(item ? {
      name: item.name || "",
      role: item.role || "",
      phone: item.phone || "",
      email: item.email || "",
    } : blank);
    setError("");
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;

    setBusy(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      };

      if (editing) {
        await apiClient.patch(
          `/teams/${teamId}/staff/${editing.staff_id}`,
          payload
        );
      } else {
        await apiClient.post(`/teams/${teamId}/staff`, payload);
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove ${item.name} from team staff?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiClient.delete(`/teams/${teamId}/staff/${item.staff_id}`);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-[#10213F]">
            <Users size={18} className="text-[#078052]" />
            Team Staff
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Coaches, managers and other staff members
          </p>
        </div>
        <button
          type="button"
          onClick={() => showForm()}
          className="flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus size={16} /> Add Staff
        </button>
      </header>

      {error && (
        <p role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#078052]" />
        </div>
      ) : items.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-500">
          No staff members registered.
        </p>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.staff_id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-[#078052]">
                  {item.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => showForm(item)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    disabled={busy}
                    onClick={() => remove(item)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-bold text-[#10213F]">{item.name}</h3>
              <p className="mt-1 text-xs font-semibold text-[#078052]">{item.role}</p>
              <p className="mt-3 break-all text-xs text-slate-500">{item.email || "No email"}</p>
              <p className="mt-1 text-xs text-slate-500">{item.phone || "No phone"}</p>
              <span className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {item.status}
              </span>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <form
            onSubmit={save}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#10213F]">
                {editing ? "Edit Staff" : "Add Staff"}
              </h3>
              <button type="button" disabled={busy} onClick={() => setOpen(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
            {[
              ["name", "Full Name", true],
              ["role", "Staff Role", true],
              ["email", "Email", false],
              ["phone", "Phone", false],
            ].map(([key, label, required]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
                <input
                  required={required}
                  type={key === "email" ? "email" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
                />
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={busy} onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={busy}
                className="rounded-lg bg-[#078052] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Saving..." : "Save Staff"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
