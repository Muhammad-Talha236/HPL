import { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AdminHeader from "./admin/AdminHeader";
import AdminSidebar from "./admin/AdminSidebar";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  const closeDrawer = () => setDrawerOpen(false);
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const menuButton = menuButtonRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => { document.body.style.overflow = originalOverflow; menuButton?.focus(); };
  }, [drawerOpen]);

  return <div className="min-h-screen bg-[#f4f7fb] text-[#16233d] lg:pl-64">
    <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:flex"><AdminSidebar onLogout={handleLogout} /></div>
    <div className="min-h-screen min-w-0"><AdminHeader user={user} onLogout={handleLogout} onOpenDrawer={() => setDrawerOpen(true)} menuButtonRef={menuButtonRef} />
      <main className="min-w-0 overflow-x-hidden"><Outlet /></main>
    </div>
    {drawerOpen && <div className="fixed inset-0 z-50 flex lg:hidden"><button type="button" aria-label="Close admin navigation" onClick={closeDrawer} className="flex-1 bg-slate-950/60" /><div className="h-full w-64"><AdminSidebar mobile onClose={closeDrawer} onLogout={handleLogout} closeButtonRef={closeButtonRef} /></div></div>}
  </div>;
}
