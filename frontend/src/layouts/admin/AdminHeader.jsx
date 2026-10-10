import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Monitor } from "lucide-react";

const initials = (name) => name?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";

export default function AdminHeader({ user, onOpenDrawer, onLogout, menuButtonRef }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const close = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false); };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  return <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 border-b border-[#e4ebf0] bg-white px-4 shadow-[0_2px_10px_rgba(15,38,68,.04)] sm:px-6">
    <button ref={menuButtonRef} type="button" onClick={onOpenDrawer} aria-label="Open admin navigation" className="grid h-9 w-9 place-items-center rounded-md text-[#344054] hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087554] lg:hidden"><Menu size={20} /></button>
    <div className="hidden flex-1 lg:block"><p className="text-xs font-medium text-slate-500">HPL Administration</p></div>
    <div ref={menuRef} className="relative ml-auto">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087554]/30">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0a1733] text-xs font-bold text-white">{user?.profile_image ? <img src={user.profile_image} alt="" className="h-full w-full rounded-full object-cover" /> : initials(user?.name)}</span>
        <span className="hidden min-w-0 sm:block"><span className="block max-w-36 truncate text-xs font-bold text-[#17213a]">{user?.name || "Super Admin"}</span><span className="block text-[10px] text-slate-500">Super Admin</span></span>
        <ChevronDown size={15} className="text-slate-400" aria-hidden="true" />
      </button>
      {open && <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-48 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
        <Link to="/" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><Monitor size={15}/>View public site</Link>
        <button type="button" role="menuitem" onClick={onLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-50"><LogOut size={15}/>Log out</button>
      </div>}
    </div>
  </header>;
}
