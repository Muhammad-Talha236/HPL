import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function PortalShell({ roleLabel, brandLabel, navigation }) {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);
  const sidebar = (
    <aside className="hpl-portal-sidebar flex h-full w-72 shrink-0 flex-col p-5 text-white">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
        <Link to={navigation[0]?.to || "/"} onClick={closeDrawer} className="text-lg font-extrabold tracking-[.08em] text-[#ffad9f] focus:outline-none focus:ring-2 focus:ring-[#EEC058]">
          HPL <span className="text-white">{brandLabel}</span>
        </Link>
        <button type="button" onClick={() => logout()} className="rounded px-2 py-1 text-[10px] font-bold tracking-[.12em] text-white/45 hover:bg-white/10 hover:text-white lg:hidden">
          LOGOUT
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#087554] text-sm font-extrabold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{user?.name || roleLabel}</p>
          <p className="mt-0.5 text-[10px] font-bold tracking-[.14em] text-[#EEC058]">{roleLabel}</p>
        </div>
      </div>
      <nav aria-label={`${roleLabel} navigation`} className="mt-7 flex-1 overflow-y-auto pr-1">
        {navigation.map(({ group, label, to }) => (
          <div key={to}>
            {group && <p className="mt-5 px-3 pb-1 text-[10px] font-bold tracking-[.16em] text-white/35 first:mt-0">{group}</p>}
            <NavLink end={to === navigation[0]?.to} to={to} onClick={closeDrawer} className={({ isActive }) => `mt-1 block rounded-lg border-l-2 px-3 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[#EEC058] ${isActive ? "hpl-portal-nav-active" : "hpl-portal-nav-link"}`}>
              {label}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="mt-5 space-y-1 border-t border-white/10 pt-4">
        <Link to="/" onClick={closeDrawer} className="block rounded-lg px-3 py-2.5 text-xs font-bold tracking-wide text-[#EEC058] hover:bg-white/8">VIEW PUBLIC SITE</Link>
        <button type="button" onClick={() => logout()} className="hidden w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold tracking-wide text-white/55 hover:bg-white/8 hover:text-white lg:block">LOG OUT</button>
      </div>
    </aside>
  );

  return (
    <div className="hpl-portal">
      <div className="hidden min-h-screen lg:flex">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalHeader roleLabel={roleLabel} user={user} openDrawer={() => setDrawerOpen(true)} />
          <main className="min-w-0 flex-1 overflow-x-hidden"><Outlet /></main>
        </div>
      </div>
      <div className="min-h-screen lg:hidden">
        <PortalHeader roleLabel={roleLabel} user={user} openDrawer={() => setDrawerOpen(true)} />
        <main className="min-w-0 overflow-x-hidden"><Outlet /></main>
        {drawerOpen && <div className="fixed inset-0 z-50 flex"><button type="button" aria-label={`Close ${roleLabel.toLowerCase()} navigation`} onClick={closeDrawer} className="min-w-0 flex-1 bg-[#011427]/70 backdrop-blur-sm" />{sidebar}</div>}
      </div>
    </div>
  );
}

function PortalHeader({ roleLabel, user, openDrawer }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-[#dfe8e3] bg-white/92 px-5 text-[#14231d] shadow-[0_4px_18px_rgb(16_56_39_/_5%)] backdrop-blur sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={openDrawer} aria-label={`Open ${roleLabel.toLowerCase()} navigation`} className="rounded-lg border border-[#cbd9d1] px-3 py-2 text-xs font-bold tracking-wide text-[#087554] focus:outline-none focus:ring-2 focus:ring-[#087554]/30 lg:hidden">MENU</button>
        <p className="hidden truncate text-xs font-bold tracking-[.14em] text-[#7a8580] sm:block">HUNZA PREMIER LEAGUE · {roleLabel}</p>
      </div>
      <p className="truncate text-sm font-bold">{user?.name || roleLabel}</p>
    </header>
  );
}
