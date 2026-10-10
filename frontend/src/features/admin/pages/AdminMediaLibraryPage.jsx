import { useCallback, useEffect, useState } from "react";
import { Copy, Image as ImageIcon, Pencil, Plus, Trash2, Video } from "lucide-react";
import MediaUploader from "../../media/components/MediaUploader";
import {
  addHomeGalleryItem, deleteMedia, getAdminHomeGallery, getMedia, removeHomeGalleryItem, updateHomeGalleryItem, updateMedia,
} from "../../media/services/mediaService";

const errorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

export default function AdminMediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [filter, setFilter] = useState({ q: "", resource_type: "" });
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("gallery");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading"); setMessage("");
    try {
      const [mediaResponse, galleryResponse] = await Promise.all([getMedia({ ...filter, limit: 48 }), getAdminHomeGallery()]);
      setMedia(mediaResponse.data || []); setGallery(galleryResponse.data || []); setStatus("ready");
    } catch (error) { setMessage(errorMessage(error, "Media library could not load.")); setStatus("error"); }
  }, [filter]);

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);

  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); setMessage("Media URL copied."); }
    catch { setMessage("Copy is unavailable in this browser. Select the URL from the media card instead."); }
  };

  const addToGallery = async (mediaId) => {
    setBusy(true); setMessage("");
    try { await addHomeGalleryItem({ media_id: mediaId, is_published: true }); await load(); }
    catch (error) { setMessage(errorMessage(error, "Could not add this image to the home gallery.")); }
    finally { setBusy(false); }
  };

  const remove = async (mediaId) => {
    if (!window.confirm("Delete this unreferenced Cloudinary asset permanently?")) return;
    setBusy(true); setMessage("");
    try { await deleteMedia(mediaId); await load(); }
    catch (error) { setMessage(errorMessage(error, "Media could not be deleted.")); }
    finally { setBusy(false); }
  };

  const saveMetadata = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await updateMedia(editing.media_id, { title: editing.title, description: editing.description, alt_text: editing.alt_text }); setEditing(null); await load(); }
    catch (error) { setMessage(errorMessage(error, "Metadata could not be updated.")); }
    finally { setBusy(false); }
  };

  const updateGallery = async (item, data) => {
    setBusy(true); setMessage("");
    try { await updateHomeGalleryItem(item.gallery_item_id, data); await load(); }
    catch (error) { setMessage(errorMessage(error, "Gallery item could not be updated.")); }
    finally { setBusy(false); }
  };

  return <main className="p-5 text-white sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.18em] text-[#EEC058]">CENTRALIZED CLOUDINARY STORAGE</p><h1 className="mt-2 text-3xl font-extrabold text-[#ffad9f]">MEDIA LIBRARY</h1><p className="mt-2 max-w-2xl text-sm text-white/55">Upload, reuse, publish, and safely manage HPL images and video highlights.</p></div></header>
    {message && <p className="mt-5 rounded border border-white/15 bg-white/5 p-3 text-sm text-white/80">{message}</p>}
    <section className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]"><div className="rounded-xl border border-white/10 bg-[#0B1D2F] p-4"><h2 className="font-bold text-[#EEC058]">UPLOAD MEDIA</h2><label className="mt-4 block text-xs font-bold text-white/60">DESTINATION<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded border border-white/15 bg-[#07192a] p-3 text-sm text-white"><option value="gallery">Home gallery</option><option value="players">Players</option><option value="teams">Teams</option><option value="news">News</option><option value="match-images">Match images</option><option value="match-highlights">Match highlights</option><option value="seasons">Seasons</option><option value="competitions">Competitions</option><option value="videos">Video library</option></select></label><div className="mt-4"><MediaUploader key={category} category={category} onUploaded={() => load()} /></div></div>
      <div className="rounded-xl border border-white/10 bg-[#0B1D2F] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]"><input value={filter.q} onChange={(event) => setFilter((current) => ({ ...current, q: event.target.value }))} placeholder="Search filename, title, or alt text" className="rounded border border-white/15 bg-[#07192a] p-3 text-sm text-white"/><select value={filter.resource_type} onChange={(event) => setFilter((current) => ({ ...current, resource_type: event.target.value }))} className="rounded border border-white/15 bg-[#07192a] p-3 text-sm text-white"><option value="">All media</option><option value="image">Images</option><option value="video">Videos</option></select><button type="button" onClick={load} className="rounded border border-[#EEC058]/60 px-4 text-xs font-bold text-[#EEC058]">REFRESH</button></div>
        {status === "loading" ? <p className="mt-6 text-sm text-white/55">Loading media…</p> : <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">{media.map((item) => <MediaCard key={item.media_id} item={item} busy={busy} onCopy={copy} onEdit={setEditing} onDelete={remove} onAddGallery={addToGallery} />)}{!media.length && <p className="col-span-full rounded border border-dashed border-white/15 p-6 text-sm text-white/55">No media matches these filters.</p>}</div>}</div></section>
    <section className="mt-6 rounded-xl border border-white/10 bg-[#0B1D2F] p-4"><h2 className="font-bold text-[#EEC058]">HOME GALLERY</h2><p className="mt-1 text-xs text-white/55">Published images appear in the curved Home Page gallery. Removing one here keeps its Cloudinary asset available in the library.</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{gallery.map((item) => <article key={item.gallery_item_id} className="flex gap-3 rounded-lg border border-white/10 bg-[#07192a] p-3"><img src={item.media.secure_url} alt="" className="h-16 w-16 rounded object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.media.title || item.media.original_filename}</p><div className="mt-2 flex flex-wrap gap-2"><button disabled={busy} onClick={() => updateGallery(item, { is_published: !item.is_published })} className="text-[10px] font-bold text-[#EEC058]">{item.is_published ? "UNPUBLISH" : "PUBLISH"}</button><button disabled={busy} onClick={() => updateGallery(item, { display_order: Math.max(0, item.display_order - 1) })} className="text-[10px] font-bold text-white/60">MOVE UP</button><button disabled={busy} onClick={async () => { if (window.confirm("Remove this image from the home gallery?")) { await removeHomeGalleryItem(item.gallery_item_id); load(); } }} className="text-[10px] font-bold text-red-200">REMOVE</button></div></div></article>)}{!gallery.length && <p className="text-sm text-white/55">No Home Gallery images configured yet.</p>}</div></section>
    {editing && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4"><form onSubmit={saveMetadata} className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><h2 className="font-bold text-[#EEC058]">EDIT MEDIA DETAILS</h2><label className="mt-4 block text-xs font-bold text-white/60">TITLE<input value={editing.title || ""} onChange={(event) => setEditing((current) => ({ ...current, title: event.target.value }))} maxLength="160" className="mt-2 w-full rounded bg-[#07192a] p-3 text-sm"/></label><label className="mt-3 block text-xs font-bold text-white/60">ALT TEXT<input value={editing.alt_text || ""} onChange={(event) => setEditing((current) => ({ ...current, alt_text: event.target.value }))} maxLength="240" className="mt-2 w-full rounded bg-[#07192a] p-3 text-sm"/></label><label className="mt-3 block text-xs font-bold text-white/60">DESCRIPTION<textarea value={editing.description || ""} onChange={(event) => setEditing((current) => ({ ...current, description: event.target.value }))} maxLength="2000" className="mt-2 min-h-24 w-full rounded bg-[#07192a] p-3 text-sm"/></label><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="text-xs font-bold text-white/60">CANCEL</button><button disabled={busy} className="rounded bg-[#FF553D] px-4 py-2 text-xs font-bold">SAVE</button></div></form></div>}
  </main>;
}

function MediaCard({ item, busy, onCopy, onEdit, onDelete, onAddGallery }) {
  const isImage = item.resource_type === "image";
  return <article className="overflow-hidden rounded-xl border border-white/10 bg-[#07192a]"><div className="relative bg-black/30">{isImage ? <img src={item.secure_url} alt={item.alt_text || item.title || item.original_filename} className="aspect-video w-full object-cover"/> : <video src={item.secure_url} controls preload="metadata" className="aspect-video w-full"/>}<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[9px] font-bold">{isImage ? <ImageIcon size={12}/> : <Video size={12}/>} {item.resource_type.toUpperCase()}</span></div><div className="p-3"><p className="truncate text-sm font-bold">{item.title || item.original_filename}</p><p className="mt-1 truncate text-[10px] text-white/45">{item.folder} · {Math.round((item.bytes || 0) / 1024)} KB</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onCopy(item.secure_url)} className="inline-flex items-center gap-1 text-[10px] font-bold text-white/70"><Copy size={12}/>COPY URL</button><button type="button" onClick={() => onEdit(item)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#EEC058]"><Pencil size={12}/>EDIT</button>{isImage && <button disabled={busy} type="button" onClick={() => onAddGallery(item.media_id)} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-200"><Plus size={12}/>HOME</button>}<button disabled={busy || item._count?.attachments || item._count?.home_gallery_items} title={item._count?.attachments || item._count?.home_gallery_items ? "Detach media before deleting" : "Delete media"} type="button" onClick={() => onDelete(item.media_id)} className="ml-auto text-red-200 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={14}/></button></div></div></article>;
}
