import { useState } from "react";

const NewsImage = ({ src, alt, className = "" }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-label={alt ? `${alt} image unavailable` : undefined}
        role={alt ? "img" : undefined}
        className={`relative overflow-hidden bg-[linear-gradient(135deg,#dcece9,#b9d0cd_55%,#eff4f2)] ${className}`}
      >
        <span className="absolute bottom-3 left-3 text-[9px] font-extrabold tracking-[0.16em] text-[#0b6548]/75">
          HPL NEWS
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};

export default NewsImage;
