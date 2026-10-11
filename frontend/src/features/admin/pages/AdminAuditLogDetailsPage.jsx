import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../../services/apiClient";

const date = (value) => value ? new Date(value).toLocaleString() : "â€”";
const formatKey = (key) => String(key).replaceAll("_", " ");
const scalar = (value) => value === null || value === undefined ? "â€”" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
const DetailTree = ({ value, depth = 0 }) => {
  if (value === null || value === undefined || typeof value !== "object") return <span className="text-[#10213F]/75">{scalar(value)}</span>;
  const entries = Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
  return <dl className={depth ? "ml-3 border-l border-slate-200 pl-3" : ""}>{entries.map(([key, item]) => <div key={key} className="border-b border-slate-200 py-2 last:border-0"><dt className="text-xs font-bold uppercase tracking-wide text-[#10213F]/45">{formatKey(key)}</dt><dd className="mt-1 break-words text-sm">{item !== null && typeof item === "object" ? <DetailTree value={item} depth={depth + 1}/> : scalar(item)}</dd></div>)}</dl>;
};

export default function AdminAuditLogDetailsPage() {
  const { auditId } = useParams(); const [state, setState] = useState({ kind: "loading", item: null });
  const load = useCallback(async () => { try { const response = await apiClient.get(`/admin/audit-logs/${auditId}`); setState({ kind: "ready", item: response.data.data }); } catch { setState({ kind: "error", item: null }); } }, [auditId]);
  useEffect(() => { const request = setTimeout(load, 0); return () => clearTimeout(request); }, [load]);
  if (state.kind === "loading") return <main className="p-8 text-slate-500">Loading audit recordâ€¦</main>; if (state.kind === "error") return <main className="p-8 text-red-100">Audit record could not be loaded. <button onClick={load} className="underline">RETRY</button></main>;
  const item = state.item;
  return <main className="min-w-0 p-5 sm:p-8"><Link to="/admin/audit-logs" className="text-sm font-bold text-[#078052]">â† AUDIT LOGS</Link><p className="mt-6 text-xs font-bold tracking-[.15em] text-[#10213F]/45">AUDIT RECORD #{item.audit_id}</p><h1 className="mt-2 break-words text-3xl font-extrabold text-[#078052]">{item.action}</h1><div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]"><aside className="rounded-xl border border-slate-200 bg-[#FFFFFF] p-5"><h2 className="font-extrabold">RECORD INFORMATION</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-[#10213F]/45">ACTOR</dt><dd>{item.actor?.name || "SYSTEM / DELETED USER"}{item.actor?.email && <small className="block text-slate-500">{item.actor.email}</small>}</dd></div><div><dt className="text-xs text-[#10213F]/45">TARGET</dt><dd>{item.entity_type}{item.entity_id ? ` #${item.entity_id}` : ""}</dd></div><div><dt className="text-xs text-[#10213F]/45">TIMESTAMP</dt><dd>{date(item.created_at)}</dd></div></dl></aside><section className="min-w-0 rounded-xl border border-slate-200 bg-[#FFFFFF] p-5"><h2 className="font-extrabold">SANITIZED DETAILS</h2><p className="mt-1 text-xs text-[#10213F]/45">Sensitive fields are redacted in this read-only audit view.</p><div className="mt-5 rounded bg-[#F8FAFC] p-4">{item.details === null || item.details === undefined ? <p className="text-sm text-slate-500">No details were recorded.</p> : <DetailTree value={item.details}/>}</div></section></div></main>;
}
