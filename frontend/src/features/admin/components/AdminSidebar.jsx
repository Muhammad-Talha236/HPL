
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  UserRound,
  CalendarDays,
  Trophy,
  ClipboardList,
  CalendarCheck,
  MapPin,
  Flag,
  Newspaper,
  History,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";

const menuGroups = [
  {
    label: "",
    items: [
      {
        label: "Dashboard",
        to: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    label: "USERS & TEAMS",
    items: [
      { label: "Users", to: "/admin/users", icon: Users },
      { label: "Teams", to: "/admin/teams", icon: Shield },
      { label: "Players", to: "/admin/players", icon: UserRound },
    ],
  },
  {
    label: "COMPETITIONS",
    items: [
      { label: "Seasons", to: "/admin/seasons", icon: CalendarDays },
      { label: "Competitions", to: "/admin/competitions", icon: Trophy },
      {
        label: "Registrations",
        to: "/admin/registrations",
        icon: ClipboardList,
      },
    ],
  },
  {
    label: "MATCH MANAGEMENT",
    items: [
      {
        label: "Fixtures & Matches",
        to: "/admin/matches",
        icon: CalendarCheck,
      },
      { label: "Venues", to: "/admin/venues", icon: MapPin },
      { label: "Referees", to: "/admin/referees", icon: Flag },
    ],
  },
  {
    label: "CONTENT",
    items: [
      {
        label: "News & Announcements",
        to: "/admin/news",
        icon: Newspaper,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Payment Accounts", to: "/admin/settings/payment-accounts", icon: History },
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: History,
      },
    ],
  },
];

export default function AdminSidebar({
  collapsed = false,
  onNavigate,
}) {
  return (
    <aside className="relative flex h-full flex-col overflow-hidden bg-[#081827] text-white">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 opacity-[0.07]"
      >
        <ImageIcon size={190} strokeWidth={0.6} />
      </div>

      {/* Brand */}
      <div
        className={`relative flex h-[72px] shrink-0 items-center border-b border-white/10 ${
          collapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#078052] shadow-lg shadow-emerald-950/30">
          <Shield size={23} className="text-white" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold leading-tight tracking-wide">
              HUNZA
            </p>
            <p className="text-[11px] font-extrabold leading-tight text-[#2FD68D]">
              PREMIER LEAGUE
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Super Admin Panel
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Admin navigation"
        className="relative min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 py-4 [scrollbar-width:thin]"
      >
        {menuGroups.map((group, index) => (
          <div key={group.label || "dashboard"}>
            {group.label && !collapsed && (
              <p className="mb-1.5 mt-3 px-2.5 text-[10px] font-semibold tracking-[0.08em] text-slate-500">
                {group.label}
              </p>
            )}

            {group.label && collapsed && index > 0 && (
              <div className="mx-3 my-3 border-t border-white/10" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      [
                        "group flex h-[38px] items-center rounded-md",
                        "text-[12px] font-medium transition-colors",
                        collapsed
                          ? "justify-center px-2"
                          : "gap-3 px-3",
                        isActive
                          ? "bg-[#078052] text-white shadow-sm shadow-emerald-950/30"
                          : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          strokeWidth={isActive ? 2.2 : 1.9}
                          className="shrink-0"
                        />

                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>

                            {isActive && (
                              <ChevronRight
                                size={13}
                                className="opacity-75"
                              />
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar footer */}
      {!collapsed && (
        <div className="relative shrink-0 border-t border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold text-slate-400">
            HPL Administration
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Hunza Premier League
          </p>
        </div>
      )}
    </aside>
  );
}
