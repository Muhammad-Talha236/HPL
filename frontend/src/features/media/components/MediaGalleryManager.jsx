import { useCallback, useEffect, useState } from "react";
import {
  attachMedia,
  detachMedia,
  getManagedEntityMedia,
  reorderMediaAttachments,
  updateMediaAttachment,
} from "../services/mediaService";
import MediaPicker from "./MediaPicker";
import MediaUploader from "./MediaUploader";

const MediaGalleryManager = ({ entityType, entityId, category = "gallery" }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await getManagedEntityMedia(entityType, entityId);
      setItems(response.data || []);
    } catch {
      setStatus("Attached media could not be loaded.");
    }
  }, [entityId, entityType]);

  useEffect(() => { void load(); }, [load]);

  const add = async (media) => {
    if (!media?.media_id) return;
    setStatus("Attaching media…");
    try {
      await attachMedia(media.media_id, { entity_type: entityType, entity_id: entityId, role: "GALLERY" });
      setSelected(null);
      await load();
      setStatus("Media attached.");
    } catch (error) {
      setStatus(error.response?.data?.message || "Media could not be attached.");
    }
  };

  const remove = async (mediaId) => {
    setStatus("Removing media…");
    try {
      await detachMedia(mediaId, { entity_type: entityType, entity_id: entityId, role: "GALLERY" });
      await load();
      setStatus("Media detached.");
    } catch (error) {
      setStatus(error.response?.data?.message || "Media could not be detached.");
    }
  };

  const saveOrder = async (nextItems) => {
    setItems(nextItems);
    setStatus("Saving order…");
    try {
      await reorderMediaAttachments(entityType, entityId, nextItems.map(({ attachment_id: id }) => id));
      setStatus("Order saved.");
    } catch (error) {
      setStatus(error.response?.data?.message || "Media order could not be saved.");
      await load();
    }
  };

  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    void saveOrder(nextItems);
  };

  const togglePublished = async (attachment) => {
    setStatus("Saving publication status…");
    try {
      await updateMediaAttachment(attachment.attachment_id, { is_published: !attachment.is_published });
      await load();
      setStatus(attachment.is_published ? "Media unpublished." : "Media published.");
    } catch (error) {
      setStatus(error.response?.data?.message || "Publication status could not be saved.");
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5">
      <h2 className="text-sm font-bold text-[#EEC058]">MEDIA GALLERY</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MediaUploader category={category} compact onUploaded={add} />
        <MediaPicker label="Select from media library" category={category} resourceType="all" value={selected?.secure_url || ""} onChange={(_, media) => { if (media) { setSelected(media); void add(media); } }} />
      </div>
      {status && <p className="mt-3 text-xs text-white/60">{status}</p>}
      {items.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((attachment, index) => {
        const { media } = attachment;
        return <article key={attachment.attachment_id} className="overflow-hidden rounded-lg border border-white/10 bg-[#07192a]">
          {media.resource_type === "video" ? <video className="aspect-video w-full object-cover" controls preload="metadata" src={media.secure_url}><track kind="captions" /></video> : <img src={media.secure_url} alt={media.alt_text || media.title || "Attached media"} className="aspect-video w-full object-cover" />}
          <div className="p-2"><div className="flex items-center justify-between gap-2"><span className="truncate text-[10px] text-white/70">{media.title || media.resource_type}</span><span className={`text-[10px] font-bold ${attachment.is_published ? "text-emerald-200" : "text-white/40"}`}>{attachment.is_published ? "PUBLISHED" : "HIDDEN"}</span></div>
            <div className="mt-2 flex flex-wrap gap-1"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded border border-white/15 px-2 py-1 text-[10px] disabled:opacity-30">MOVE UP</button><button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="rounded border border-white/15 px-2 py-1 text-[10px] disabled:opacity-30">MOVE DOWN</button><button type="button" onClick={() => togglePublished(attachment)} className="rounded border border-[#EEC058]/50 px-2 py-1 text-[10px] text-[#EEC058]">{attachment.is_published ? "UNPUBLISH" : "PUBLISH"}</button><button type="button" onClick={() => remove(media.media_id)} className="rounded border border-[#ffad9f]/50 px-2 py-1 text-[10px] font-bold text-[#ffad9f]">REMOVE</button></div>
          </div>
        </article>;
      })}</div> : <p className="mt-5 text-sm text-white/45">No media attached yet.</p>}
    </section>
  );
};

export default MediaGalleryManager;
