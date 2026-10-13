import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import TeamOwnerSidebar from "../features/teamOwner/components/TeamOwnerSidebar";
import TeamOwnerHeader from "../features/teamOwner/components/TeamOwnerHeader";

export default function TeamOwnerLayout() {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setDrawerOpen(false); }
      if (event.key !== "Tab") return;
      const controls = drawerRef.current?.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setDrawerOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [drawerOpen]);

  return <div className="min-h-dvh bg-[#F4F7FB] text-[#10213F]">
    <div className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-64 lg:block">
      <TeamOwnerSidebar user={user} onLogout={logout} />
    </div>
    {drawerOpen && <div className="fixed inset-0 z-[60] lg:hidden">
      <button type="button" tabIndex={-1} aria-label="Close Team Owner navigation" onClick={closeDrawer} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div ref={drawerRef} id="team-owner-drawer" role="dialog" aria-modal="true" aria-label="Team Owner navigation" className="relative h-dvh w-64 max-w-[85vw] shadow-2xl">
        <TeamOwnerSidebar user={user} onLogout={logout} onNavigate={closeDrawer} onClose={closeDrawer} closeButtonRef={closeButtonRef} />
      </div>
    </div>}
    <div className="min-w-0 lg:pl-64" inert={drawerOpen ? true : undefined}>
      <TeamOwnerHeader user={user} onMenu={() => setDrawerOpen(true)} menuButtonRef={menuButtonRef} drawerOpen={drawerOpen} />
      <div id="team-owner-main-content" className="mx-auto min-h-[calc(100dvh-64px)] w-full min-w-0 max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </div>
    </div>
  </div>;
}
