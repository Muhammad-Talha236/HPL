import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getEntityMedia } from "../services/mediaService";

const MediaGallery = ({ entityType, entityId, title = "Gallery" }) => {
  const [state, setState] = useState({ status: "loading", items: [] });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    getEntityMedia(entityType, entityId)
      .then((response) => active && setState({ status: "success", items: response.data || [] }))
      .catch(() => active && setState({ status: "error", items: [] }));
    return () => { active = false; };
  }, [entityId, entityType]);

  const move = (offset) => {
    setSelected((current) => {
      if (current === null || !state.items.length) return current;
      return (current + offset + state.items.length) % state.items.length;
    });
  };

  if (state.status === "loading") return <section className="mt-8"><h2 className="text-xl font-extrabold">{title}</h2><div className="mt-4 h-32 animate-pulse rounded-xl bg-white/10" /></section>;
  if (state.status === "error") return <section className="mt-8"><h2 className="text-xl font-extrabold">{title}</h2><p className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-white/55">Media is temporarily unavailable.</p></section>;
  if (!state.items.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.items.map(({ media }) => media.resource_type === "video" ? (
          <article key={media.media_id} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <video className="aspect-video w-full object-cover" controls preload="metadata" poster={media.secure_url} src={media.secure_url}>
              <track kind="captions" />
            </video>
            {(media.title || media.description) && <div className="p-3 text-xs text-white/65"><p className="font-bold text-white">{media.title}</p><p className="mt-1">{media.description}</p></div>}
          </article>
        ) : (
          <button key={media.media_id} type="button" onClick={() => setSelected(state.items.findIndex((item) => item.media.media_id === media.media_id))} className="overflow-hidden rounded-xl border border-white/10 bg-black/20 text-left">
            <img src={media.secure_url} alt={media.alt_text || media.title || "Gallery image"} loading="lazy" className="aspect-[4/3] w-full object-cover transition hover:scale-[1.02]" />
            {(media.title || media.description) && <span className="block p-3 text-xs text-white/65"><span className="font-bold text-white">{media.title}</span>{media.description && <span className="mt-1 block">{media.description}</span>}</span>}
          </button>
        ))}
      </div>
      {selected !== null && state.items[selected]?.media.resource_type === "image" && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-black/85 p-4" onClick={() => setSelected(null)}>
          <button type="button" aria-label="Close image viewer" onClick={() => setSelected(null)} className="absolute right-5 top-5 text-white"><X size={28} /></button>
          <button type="button" aria-label="Previous image" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-4 text-white"><ChevronLeft size={32} /></button>
          <img src={state.items[selected].media.secure_url} alt={state.items[selected].media.alt_text || state.items[selected].media.title || "Gallery image"} className="max-h-[88vh] max-w-[90vw] object-contain" onClick={(event) => event.stopPropagation()} />
          <button type="button" aria-label="Next image" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-4 text-white"><ChevronRight size={32} /></button>
        </div>
      )}
    </section>
  );
};

export default MediaGallery;
