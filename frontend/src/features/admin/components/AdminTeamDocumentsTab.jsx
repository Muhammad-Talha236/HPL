
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import apiClient from "../../../services/apiClient";

const blank = {
  title: "",
  category: "General",
  file_url: "",
  file_name: "",
  mime_type: "application/pdf",
};

const errorText = (err) =>
  err.response?.data?.message || "Unable to complete request.";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-PK", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "â€”";

export default function AdminTeamDocumentsTab({ teamId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/teams/${teamId}/documents`, { signal });
      if (!signal?.aborted) setDocuments(response.data.data || []);
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
      title: item.title || "",
      category: item.category || "General",
      file_url: item.file_url || "",
      file_name: item.file_name || "",
      mime_type: item.mime_type || "application/pdf",
    } : blank);
    setError("");
    setOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (editing) {
        await apiClient.patch(
          `/teams/${teamId}/documents/${editing.document_id}`,
          {
            title: form.title.trim(),
            category: form.category.trim(),
          }
        );
      } else {
        await apiClient.post(`/teams/${teamId}/documents`, {
          title: form.title.trim(),
          category: form.category.trim() || "General",
          file_url: form.file_url.trim(),
          file_name: form.file_name.trim() || form.title.trim(),
          mime_type: form.mime_type.trim() || "application/octet-stream",
          size_bytes: 0,
        });
      }

      setOpen(false);
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const archive = async (item) => {
    if (!window.confirm(`Archive "${item.title}"?`)) return;

    setBusy(true);
    setError("");
    try {
      await apiClient.delete(
        `/teams/${teamId}/documents/${item.document_id}`
      );
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
            <FileText size={18} className="text-[#078052]" />
            Team Documents
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Team records and supporting documents
          </p>
        </div>
        <button type="button" onClick={() => showForm()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#078052] px-4 py-2 text-xs font-semibold text-white">
          <Plus size={16} /> Add Document
        </button>
      </header>

      {error && <p role="alert" className="m-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#078052]" />
        </div>
      ) : documents.length === 0 ? (
        <p className="p-10 text-center text-sm text-slate-500">
          No team documents found.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <article key={doc.document_id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText size={21} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[#10213F]">{doc.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.category} Â· {formatDate(doc.created_at)}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {doc.file_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/^https:\/\//i.test(doc.file_url || "") && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    title="Open document" className="rounded-lg p-2 text-[#078052] hover:bg-emerald-50">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button type="button" title="Edit metadata" onClick={() => showForm(doc)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <Pencil size={16} />
                </button>
                <button type="button" title="Archive document" disabled={busy} onClick={() => archive(doc)}
                  className="rounded-lg p-2 text-rose-600 hover:bg-rose-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <form onSubmit={save} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <h3 className="text-lg font-bold text-[#10213F]">
                {editing ? "Edit Document" : "Add Document"}
              </h3>
              <button type="button" disabled={busy} onClick={() => setOpen(false)} aria-label="Close">
                <X size={19} />
              </button>
            </div>

            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}

            {[
              ["title", "Document Title", true],
              ["category", "Category", false],
              ...(!editing ? [
                ["file_url", "Hosted File URL (HTTPS)", true],
                ["file_name", "File Name", false],
                ["mime_type", "MIME Type", false],
              ] : []),
            ].map(([key, label, required]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
                <input
                  required={required}
                  type={key === "file_url" ? "url" : "text"}
                  pattern={key === "file_url" ? "https://.+" : undefined}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#078052]"
                />
              </label>
            ))}

            {editing && (
              <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                Existing backend only allows editing title and category.
                File replacement is not supported by this endpoint.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={busy}
                className="rounded-lg bg-[#078052] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Saving..." : "Save Document"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
