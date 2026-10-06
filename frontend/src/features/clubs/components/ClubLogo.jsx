import { useState } from "react";

const initials = (name) => String(name || "HPL").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function ClubLogo({ logo, name, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const sizes = size === "lg" ? "h-28 w-28 text-3xl sm:h-36 sm:w-36" : "h-16 w-16 text-base";
  if (logo && !failed) return <img src={logo} alt={`${name} logo`} onError={() => setFailed(true)} className={`${sizes} shrink-0 rounded-full border border-white/15 bg-[#061525] object-contain p-1.5 shadow-lg`} />;
  return <span aria-label={`${name} club mark`} className={`${sizes} grid shrink-0 place-items-center rounded-full border border-[#EEC058]/35 bg-[linear-gradient(135deg,#23435c,#0B1D2F)] font-extrabold tracking-tight text-[#ffad9f] shadow-lg`}>{initials(name)}</span>;
}
