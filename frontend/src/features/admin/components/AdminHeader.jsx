
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  UserRound,
  ExternalLink,
  X,
} from "lucide-react";

const searchOptions = [
  { label: "Users", route: "/admin/users", terms: "users accounts" },
  { label: "Teams", route: "/admin/teams", terms: "teams clubs" },
  { label: "Players", route: "/admin/players", terms: "players footballers" },
  { label: "Seasons", route: "/admin/seasons", terms: "seasons" },
  {
    label: "Competitions",
    route: "/admin/competitions",
    terms: "competitions tournaments",
  },
  {
    label: "Registrations",
    route: "/admin/registrations",
    terms: "registrations approvals",
  },
  {
    label: "Fixtures & Matches",
    route: "/admin/matches",
    terms: "fixtures matches live scores",
  },
  { label: "Venues", route: "/admin/venues", terms: "venues grounds" },
  { label: "Referees", route: "/admin/referees", terms: "referees officials" },
  { label: "News", route: "/admin/news", terms: "news announcements" },
  {
    label: "Audit Logs",
    route: "/admin/audit-logs",
    terms: "audit activity history",
  },
];

const getInitials = (name) =>
  String(name || "Admin")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export default function AdminHeader({
  user,
  onLogout,
  onMenu,
  onToggleSidebar,
  collapsed,
}) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  const matches = searchOptions.filter((item) => {
    const value = query.trim().toLowerCase();
    return (
      value &&
      `${item.label} ${item.terms}`.toLowerCase().includes(value)
    );
  });

  useEffect(() => {
    const handleClick = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const goTo = (route) => {
    navigate(route);
    setQuery("");
    setSearchOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();

    if (matches.length > 0) {
      goTo(matches[0].route);
    }
  };

  const logout = () => {
    setProfileOpen(false);
    onLogout?.();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:px-6">
      {/* Left: navigation and search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleSidebar}
          className="hidden rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>

        <div
          ref={searchRef}
          className="relative min-w-0 w-full max-w-[440px]"
        >
          <form onSubmit={submitSearch}>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 transition-colors focus-within:border-[#078052] focus-within:bg-white">
              <Search
                size={16}
                className="shrink-0 text-slate-500"
              />

              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Find admin sections..."
                aria-label="Search admin sections"
                className="min-w-0 flex-1 bg-transparent text-xs text-[#10213F] outline-none placeholder:text-slate-400"
              />

              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {searchOpen && query.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              {matches.length > 0 ? (
                matches.slice(0, 7).map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => goTo(item.route)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-[#078052]"
                  >
                    <span>{item.label}</span>
                    <ExternalLink size={13} />
                  </button>
                ))
              ) : (
                <p className="px-3 py-3 text-xs text-slate-500">
                  No matching admin section.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: notifications and profile */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        {/* Notification display only.
            Connect to existing notification API in its module. */}
        <div
          title="Notification integration pending"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-600"
        >
          <Bell size={19} />
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-slate-50"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#10213F] text-xs font-bold text-white">
              {getInitials(user?.name)}
            </div>

            <div className="hidden max-w-[160px] min-w-0 sm:block">
              <p className="truncate text-xs font-bold text-[#10213F]">
                {user?.name || "Super Admin"}
              </p>
              <p className="text-[10px] text-slate-500">
                Super Admin
              </p>
            </div>

            <ChevronDown
              size={15}
              className="hidden text-slate-500 sm:block"
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+10px)] z-50 w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
            >
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-xs font-bold text-[#10213F]">
                  {user?.name || "Super Admin"}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user?.email || "Administrator"}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/account");
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                <UserRound size={15} />
                My Account
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
