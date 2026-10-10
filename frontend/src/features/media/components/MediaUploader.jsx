import { useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { uploadMedia, validateMediaFile } from "../services/mediaService";

export default function MediaUploader({ category = "gallery", onUploaded, compact = false }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);

  useEffect(() => () => {
    controllerRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const chooseFile = (nextFile) => {
    const validationError = validateMediaFile(nextFile);
    setError(validationError || "");
    setFile(validationError ? null : nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(validationError || !nextFile ? "" : URL.createObjectURL(nextFile));
  };

  const submit = async () => {
    if (!file || status === "uploading") return;
    setStatus("uploading"); setError("");
    controllerRef.current = new AbortController();
    try {
      const media = await uploadMedia({ file, category, altText, signal: controllerRef.current.signal });
      setFile(null); setAltText(""); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl("");
      onUploaded?.(media);
      setStatus("success");
    } catch (uploadError) {
      if (uploadError.name !== "CanceledError" && uploadError.name !== "AbortError") setError(uploadError.message || "Upload failed. Please retry.");
      setStatus("idle");
    } finally { controllerRef.current = null; }
  };

  const cancel = () => { controllerRef.current?.abort(); setStatus("idle"); };

  return (
    <div className={`rounded-xl border border-dashed border-white/25 bg-[#07192a] ${compact ? "p-3" : "p-4"}`}>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-white/80">
        <UploadCloud size={18} className="text-[#EEC058]" />
        <span className="min-w-0 flex-1 truncate">{file?.name || "Choose an image or video"}</span>
        <span className="rounded border border-white/15 px-2 py-1 text-[10px] tracking-wide">BROWSE</span>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" disabled={status === "uploading"} onChange={(event) => chooseFile(event.target.files?.[0])} />
      </label>
      {previewUrl && <div className="mt-3 overflow-hidden rounded-lg bg-black/30">{file?.type.startsWith("video/") ? <video className="max-h-44 w-full" controls src={previewUrl} /> : <img className="max-h-44 w-full object-contain" src={previewUrl} alt="Upload preview" />}</div>}
      {file?.type.startsWith("image/") && <input value={altText} onChange={(event) => setAltText(event.target.value)} maxLength="240" placeholder="Alt text (recommended)" className="mt-3 w-full rounded bg-[#0B1D2F] p-2 text-xs text-white" />}
      {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
      {status === "success" && <p className="mt-2 text-xs text-emerald-200">Upload complete.</p>}
      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={submit} disabled={!file || status === "uploading"} className="rounded bg-[#FF553D] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{status === "uploading" ? "UPLOADING…" : "UPLOAD"}</button>{status === "uploading" && <button type="button" onClick={cancel} className="rounded border border-white/20 px-3 py-2 text-xs font-bold">CANCEL</button>}</div>
    </div>
  );
}
