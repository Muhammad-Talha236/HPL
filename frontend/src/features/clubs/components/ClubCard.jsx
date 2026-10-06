import { Link } from "react-router-dom";
import ClubLogo from "./ClubLogo";

const locationOf = (club) => [club.city, club.district, club.region].filter(Boolean).join(", ");

export default function ClubCard({ club }) {
  return <article className="flex min-h-[270px] flex-col rounded-xl border border-white/10 border-t-4 border-t-[#EEC058] bg-[#10283d] p-5 shadow-lg transition hover:-translate-y-1 hover:border-x-white/20 hover:border-b-white/20">
    <div className="flex items-start justify-between gap-4"><ClubLogo logo={club.logo} name={club.name} /><span className="rounded-full border border-[#EEC058]/30 bg-[#EEC058]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#EEC058]">{club.public_team_count} {club.public_team_count === 1 ? "TEAM" : "TEAMS"}</span></div>
    <div className="mt-6"><p className="text-[10px] font-bold tracking-[.16em] text-[#EEC058]">HPL CLUB</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#d8e7fb]">{club.name}</h2><p className="mt-3 min-h-10 text-sm leading-5 text-white/60">{locationOf(club) || "Hunza Premier League"}</p></div>
    <Link to={`/clubs/${club.club_id}`} className="mt-auto inline-flex min-h-12 items-center justify-center rounded-lg border border-[#EEC058]/80 px-4 py-3 text-xs font-bold tracking-wide text-[#EEC058] transition hover:bg-[#EEC058] hover:text-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">VIEW CLUB</Link>
  </article>;
}
