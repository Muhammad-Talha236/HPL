
import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Shirt, Trash2, X } from "lucide-react";
import apiClient from "../../../services/apiClient";

const empty = {
  kit_type: "HOME",
  name: "",
  primary_color: "",
  secondary_color: "",
  image_url: "",
};

const errorText = (err) =>
  err.response?.data?.message || "Unable to complete request.";

export default function AdminTeamKitsTab({ teamId }) {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/teams/${teamId}/kits`, { signal });
      if (!signal?.aborted) setKits(res.data.data || []);
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

  const showForm = (kit = null) => {
    setEditing(kit);
    setForm(kit ? {
      kit_type: kit.kit_type || "HOME",
      name: kit.name || "",
      primary_color: kit.primary_color || "",
      secondary_color: kit.secondary_color || "",
      image_url: kit.image_url || "",
    } : empty);
    setError("");
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        kit_type: form.kit_type,
        name: form.name.trim() || `${form.kit_type} Kit`,
        primary_color: form.primary_color.trim(),
        secondary_color: form.secondary_color.trim(),
        image_url: form.image_url.trim(),
      };

      if (editing) {
        await apiClient.patch(
          `/teams/${teamId}/kits/${editing.kit_id}`,
          payload
        );
      } else {
        await apiClient.post(`/teams/${teamId}/kits`, payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (kit) => {
    if (!window.confirm(`Delete ${kit.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiClient.delete(`/teams/${teamId}/kits/${kit.kit_id}`);
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
            <Shirt size={18} className="text-[#078052]" />
            Team Kits
          </h2>
          <p className="mt-1 text-xs text-slate-500">Home, away and third kits</p>
        </div>
        <button type="button" onClick={() => showForm()}
          className="rounded-lg bg-[#078052] px-4 py-2 text-xs font-semibold text-white">
          Add / Update Kit
        </button>
      </header>

      {error && <p role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#078052]" />
        </div>
      ) : kits.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-500">No kits registered.</p>
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {kits.map((kit) => (
            <article key={kit.kit_id} className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid h-44 place-items-center bg-slate-50">
                {kit.image_url ? (
                  <img src={kit.image_url} alt={kit.name} className="h-full w-full object-contain p-4" />
                ) : (
                  <Shirt size={65} className="text-slate-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#078052]">{kit.kit_type}</span>
                    <h3 className="mt-1 text-sm font-bold text-[#10213F]">{kit.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" aria-label="Edit kit" onClick={() => showForm(kit)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                      <Pencil size={15} />
                    </button>
                    <button type="button" aria-label="Delete kit" disabled={busy} onClick={() => remove(kit)}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Primary: {kit.primary_color || "â€”"}</span>
                  <span>Secondary: {kit.secondary_color || "â€”"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <h3 className="text-lg font-bold text-[#10213F]">{editing ? "Edit Kit" : "Add Kit"}</h3>
              <button type="button" disabled={busy} onClick={() => setOpen(false)} aria-label="Close"><X size={19} /></button>
            </div>
            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
            <label className="block">
              <span className="mb-1 block text-xs font-semibold">Kit Type</span>
              <select value={form.kit_type}
                onChange={(e) => setForm((prev) => ({ ...prev, kit_type: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm">
                {["HOME", "AWAY", "THIRD"].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            {[
              ["name", "Kit Name"],
              ["primary_color", "Primary Color"],
              ["secondary_color", "Secondary Color"],
              ["image_url", "Image URL"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-semibold">{label}</span>
                <input
                  type={key === "image_url" ? "url" : "text"}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={key === "image_url" ? "https://..." : label}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
                />
              </label>
            ))}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={busy}
                className="rounded-lg bg-[#078052] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Saving..." : "Save Kit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
