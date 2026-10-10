import { useCallback, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { getMedia } from "../services/mediaService";
import MediaUploader from "./MediaUploader";

export default function MediaPicker({ label, category, resourceType = "image", value, onChange }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await getMedia({ ...(resourceType === "all" ? {} : { resource_type: resourceType }), limit: 30 }); setItems(response.data || []); }
    catch { setError("Media library could not load."); }
    finally { setLoading(false); }
  }, [resourceType]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [open, load]);
  const select = (media) => { onChange(media.secure_url, media); setOpen(false); };

  const renderPreview = (url) => resourceType === "video" ? <video className="mt-3 h-24 w-36 rounded border border-white/10 object-cover" controls preload="metadata" src={url}><track kind="captions" /></video> : <img src={url} alt="Selected media" className="mt-3 h-24 w-36 rounded border border-white/10 object-cover" />;
  const renderItem = (media) => media.resource_type === "video" ? <video className="aspect-square w-full object-cover" preload="metadata" src={media.secure_url}><track kind="captions" /></video> : <img src={media.secure_url} alt={media.alt_text || media.title || "Media library image"} className="aspect-square w-full object-cover"/>;
  return <div className="text-xs font-bold text-white/60"><span>{label.toUpperCase()}</span><div className="mt-2 flex gap-2"><input value={value || ""} onChange={(event) => onChange(event.target.value, null)} placeholder="Media URL" className="min-w-0 flex-1 rounded border border-white/15 bg-[#07192a] p-3 text-sm font-normal text-white"/><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded border border-[#EEC058]/60 px-3 text-[10px] text-[#EEC058]"><ImagePlus size={14}/>LIBRARY</button></div>{value && renderPreview(value)}{open && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] overflow-y-auto bg-black/75 p-4"><div className="mx-auto my-8 w-full max-w-4xl rounded-xl border border-white/10 bg-[#0B1D2F] p-5 text-white"><div className="flex items-center justify-between"><h2 className="font-bold text-[#EEC058]">SELECT OR UPLOAD MEDIA</h2><button type="button" onClick={() => setOpen(false)} aria-label="Close media picker"><X/></button></div><div className="mt-4 grid gap-5 lg:grid-cols-[300px_1fr]"><MediaUploader category={category} compact onUploaded={(media) => { setItems((current) => [media, ...current]); select(media); }}/><div>{error && <p className="text-sm text-red-200">{error}</p>}{loading ? <p className="text-sm text-white/60">Loading media…</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map((media) => <button key={media.media_id} type="button" onClick={() => select(media)} className="overflow-hidden rounded border border-white/10 bg-[#07192a] text-left hover:border-[#EEC058]">{renderItem(media)}<span className="block truncate p-2 text-[10px]">{media.title || media.original_filename}</span></button>)}</div>}</div></div></div></div>}</div>;
}
