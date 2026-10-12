import { useEffect } from "react";
import { Link, matchPath, NavLink, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import hplLogo from "../../assets/logo.png";
import { adminNavigation } from "./adminNavigation";

const isRouteActive = (pathname, item) => item.end
  ? pathname === item.to
  : pathname === item.to || Boolean(matchPath({ path: `${item.to}/*`, end: false }, pathname));

function AdminNavItem({ item, closeDrawer }) {
  const location = useLocation();
  const Icon = item.icon;
  const active = isRouteActive(location.pathname, item);
  return <NavLink
    to={item.to}
    onClick={closeDrawer}
    aria-current={active ? "page" : undefined}
    className={`group flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#72e2a9] ${active ? "bg-[#087554] text-white shadow-[0_5px_14px_rgba(0,0,0,.16)]" : "text-slate-300 hover:bg-white/[.075] hover:text-white"}`}
  >
    <Icon size={16} strokeWidth={1.8} className={active ? "text-white" : "text-slate-400 group-hover:text-white"} aria-hidden="true" />
    <span className="truncate">{item.label}</span>
  </NavLink>;
}

export default function AdminSidebar({ mobile = false, onClose, onLogout, closeButtonRef }) {
  useEffect(() => {
    if (!mobile) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobile, onClose]);

  return <aside className={`flex h-full w-64 shrink-0 flex-col bg-[#071a2d] text-white shadow-[10px_0_30px_rgba(2,14,29,.18)] ${mobile ? "" : ""}`} aria-label="Super Admin navigation">
    <div className="flex min-h-[76px] items-center gap-2 border-b border-white/10 px-4">
      <Link to="/admin" onClick={onClose} className="min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72e2a9]">
        <img src={hplLogo} alt="Hunza Premier League Admin Panel" className="h-11 w-auto object-contain object-left" />
      </Link>
      {mobile && <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close admin navigation" className="grid h-9 w-9 place-items-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72e2a9]"><X size={19} /></button>}
    </div>
    <p className="border-b border-white/10 px-5 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Admin Panel</p>
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="Admin navigation">
      {adminNavigation.map((section, sectionIndex) => section.items ? <div key={section.label} className={sectionIndex ? "mt-4" : ""}>
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">{section.label}</p>
        <div className="space-y-0.5">{section.items.map((item) => <AdminNavItem key={item.to} item={item} closeDrawer={onClose} />)}</div>
      </div> : <div key={section.to} className="mb-4"><AdminNavItem item={section} closeDrawer={onClose} /></div>)}
    </nav>
    <div className="border-t border-white/10 p-3">
      <Link to="/" onClick={onClose} className="flex min-h-9 items-center rounded-md px-3 text-[12px] font-medium text-slate-300 transition hover:bg-white/[.075] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72e2a9]">View public site</Link>
      <button type="button" onClick={onLogout} className="mt-1 flex min-h-9 w-full items-center gap-3 rounded-md px-3 text-left text-[12px] font-medium text-slate-300 transition hover:bg-white/[.075] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#72e2a9]"><LogOut size={15} aria-hidden="true" />Log out</button>
    </div>
  </aside>;
}
