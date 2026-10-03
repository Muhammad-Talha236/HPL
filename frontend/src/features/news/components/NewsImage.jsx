import { useState } from "react";

const NewsImage = ({ src, alt, className = "" }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div aria-label={alt ? `${alt} image unavailable` : undefined} role={alt ? "img" : undefined} className={`relative overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(238,192,88,.2),transparent_25%),linear-gradient(135deg,#173750,#071827)] ${className}`}><span className="absolute bottom-4 left-4 text-[10px] font-extrabold tracking-[0.18em] text-[#EEC058]/80">HPL NEWS</span></div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
};

export default NewsImage;
