import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const navigation = [
  ["DASHBOARD", "/team"],
  ["MY TEAM", "/team/profile"],
  ["PLAYERS", "/team/players"],
  ["COMPETITIONS", "/team/competitions"],
  ["REGISTRATIONS", "/team/registrations"],
  ["MATCHES", "/team/matches"],
  ["PAYMENTS", "/team/payments"],
];

export default function TeamOwnerLayout() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-[#07192a] p-4 text-white">
      <Link to="/team" onClick={() => setDrawerOpen(false)} className="border-b border-white/10 pb-4 text-lg font-extrabold tracking-wide text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#EEC058]">
        HPL <span className="text-white">TEAM</span>
      </Link>
      <p className="mt-3 truncate text-xs text-white/55">{user?.name || "Team Owner"}</p>
      <nav aria-label="Team owner navigation" className="mt-4 flex-1 overflow-y-auto">
        <p className="px-3 pb-1 text-[10px] font-bold tracking-[.14em] text-white/35">OVERVIEW</p>
        {navigation.slice(0, 1).map(([label, to]) => <SidebarLink key={to} label={label} to={to} close={() => setDrawerOpen(false)} />)}
        <p className="mt-5 px-3 pb-1 text-[10px] font-bold tracking-[.14em] text-white/35">TEAM</p>
        {navigation.slice(1, 3).map(([label, to]) => <SidebarLink key={to} label={label} to={to} close={() => setDrawerOpen(false)} />)}
        <p className="mt-5 px-3 pb-1 text-[10px] font-bold tracking-[.14em] text-white/35">COMPETITIONS</p>
        {navigation.slice(3, 5).map(([label, to]) => <SidebarLink key={to} label={label} to={to} close={() => setDrawerOpen(false)} />)}
        <p className="mt-5 px-3 pb-1 text-[10px] font-bold tracking-[.14em] text-white/35">OPERATIONS</p>
        {navigation.slice(5).map(([label, to]) => <SidebarLink key={to} label={label} to={to} close={() => setDrawerOpen(false)} />)}
      </nav>
      <div className="border-t border-white/10 pt-4">
        <p className="px-3 pb-1 text-[10px] font-bold tracking-[.14em] text-white/35">ACCOUNT</p>
        <Link to="/" onClick={() => setDrawerOpen(false)} className="mt-1 block rounded-md px-3 py-2.5 text-xs font-bold text-[#EEC058] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#EEC058]">BACK TO WEBSITE</Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="hidden min-h-screen lg:flex">{sidebar}<div className="min-w-0 flex-1"><PortalHeader user={user} openDrawer={() => setDrawerOpen(true)} /><main className="min-w-0 overflow-x-hidden"><Outlet /></main></div></div>
      <div className="min-h-screen lg:hidden"><PortalHeader user={user} openDrawer={() => setDrawerOpen(true)} /><main className="min-w-0 overflow-x-hidden"><Outlet /></main>{drawerOpen && <div className="fixed inset-0 z-50 flex"><button type="button" aria-label="Close team navigation" onClick={() => setDrawerOpen(false)} className="min-w-0 flex-1 bg-black/60" />{sidebar}</div>}</div>
    </div>
  );
}

function SidebarLink({ label, to, close }) {
  return <NavLink end={to === "/team"} to={to} onClick={close} className={({ isActive }) => `mt-1 block rounded-md border-l-2 px-3 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#EEC058] ${isActive ? "border-[#FF553D] bg-[#FF553D]/15 text-white" : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"}`}>{label}</NavLink>;
}

function PortalHeader({ user, openDrawer }) {
  return <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 text-slate-900 backdrop-blur sm:px-8">
    <button type="button" onClick={openDrawer} aria-label="Open team navigation" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#d94d3d] lg:hidden">MENU</button>
    <p className="hidden text-xs font-bold tracking-[.14em] text-slate-500 sm:block">HUNZA PREMIER LEAGUE · TEAM OWNER PORTAL</p>
    <p className="truncate text-sm font-bold">{user?.name || "Team Owner"}</p>
  </header>;
}
