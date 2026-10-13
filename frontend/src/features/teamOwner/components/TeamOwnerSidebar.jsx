import { Link, NavLink } from "react-router-dom";
import { CalendarCheck, ClipboardList, ExternalLink, LayoutDashboard, LogOut, Shield, ShieldCheck, Trophy, Users, Wallet, X } from "lucide-react";
import logo from "../../../assets/logo.png";

const sections = [
  { label: "Overview", items: [{ label: "Dashboard", to: "/team", icon: LayoutDashboard, end: true }] },
  { label: "Team", items: [{ label: "My Team", to: "/team/profile", icon: Shield }, { label: "Verification", to: "/team/verification", icon: ShieldCheck }, { label: "Players", to: "/team/players", icon: Users }] },
  { label: "Competitions", items: [{ label: "Competitions", to: "/team/competitions", icon: Trophy }, { label: "Registrations", to: "/team/registrations", icon: ClipboardList }] },
  { label: "Operations", items: [{ label: "Matches", to: "/team/matches", icon: CalendarCheck }, { label: "Payments", to: "/team/payments", icon: Wallet }] },
];

export default function TeamOwnerSidebar({ user, onNavigate, onLogout, onClose, closeButtonRef }) {
  return <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#081827] text-white" aria-label="Team Owner sidebar">
    <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
      <Link to="/team" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-[#72E2A9]">
        <img src={logo} alt="HPL" className="h-10 w-10 shrink-0 object-contain" />
        <div><p className="text-sm font-bold tracking-wide">HPL PORTAL</p><p className="mt-0.5 text-[11px] text-slate-400">Team Owner</p></div>
      </Link>
      {onClose && <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close navigation" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#72E2A9]"><X size={18} /></button>}
    </div>
   
    <nav aria-label="Team Owner navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 mt-2">
      {sections.map((section, index) => <section key={section.label} className={index ? "mt-6" : ""}>
        <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">{section.label}</h2>
        <div className="space-y-1">{section.items.map(({ label, to, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#72E2A9] ${isActive ? "bg-[#087554] text-white shadow-sm" : "text-slate-300 hover:bg-white/[.075] hover:text-white"}`}>
          <Icon size={17} strokeWidth={1.8} aria-hidden="true" className="shrink-0" /><span className="min-w-0 truncate">{label}</span>
        </NavLink>)}</div>
      </section>)}
    </nav>
    <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
      <Link to="/" onClick={onNavigate} className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-xs font-medium text-slate-300 hover:bg-white/[.075] focus-visible:outline-2 focus-visible:outline-[#72E2A9]"><ExternalLink size={16} aria-hidden="true" />View public site</Link>
      <button type="button" onClick={() => { onNavigate?.(); onLogout(); }} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium text-slate-300 hover:bg-white/[.075] hover:text-white focus-visible:outline-2 focus-visible:outline-[#72E2A9]"><LogOut size={16} aria-hidden="true" />Log out</button>
    </div>
  </aside>;
}
