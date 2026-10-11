
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AdminSidebar from "../features/admin/components/AdminSidebar";
import AdminHeader from "../features/admin/components/AdminHeader";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-[Inter] text-[#10213F]">
      {/* Desktop sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 hidden transition-all duration-200 lg:block ${
          collapsed ? "w-[76px]" : "w-[248px]"
        }`}
      >
        <AdminSidebar
          collapsed={collapsed}
          onNavigate={() => {}}
        />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative h-full w-[260px] max-w-[85vw] shadow-2xl">
            <AdminSidebar
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main workspace */}
      <div
        className={`min-w-0 transition-all duration-200 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"
        }`}
      >
        <AdminHeader
          user={user}
          onLogout={logout}
          onMenu={() => setMobileOpen(true)}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          collapsed={collapsed}
        />

        <main
          id="admin-main-content"
          className="min-h-[calc(100vh-64px)] min-w-0 overflow-x-hidden"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
