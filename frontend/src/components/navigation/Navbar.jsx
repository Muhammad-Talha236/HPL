import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import Logo from "../common/Logo";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";
import useNotifications from "../../hooks/useNotifications";

const navItems = [
  { label: "HOME", path: "/" },
  { label: "SEASONS", path: "/seasons" },
  { label: "TEAMS", path: "/teams" },
  { label: "MATCHES", path: "/matches" },
  { label: "STANDINGS", path: "/standings" },
  { label: "NEWS", path: "/news" },
];

const formatRole = (role) => {
  if (!role) {
    return "";
  }

  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};

const getInitial = (name) => {
  if (!name) {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase();
};

const Avatar = ({ user, className }) => user?.profile_image ? <img src={user.profile_image} alt="" className={`${className} object-cover`} /> : <span className={`${className} grid place-items-center bg-[#FF553D] font-extrabold text-white`}>{getInitial(user?.name)}</span>;

const Navbar = () => {
  const navigate = useNavigate();

  const {
    user,
    isAuthenticated,
    isAuthLoading,
    logout,
  } = useAuth();
  const { unreadCount } = useNotifications();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleLogout = () => {
    logout();

    setIsUserMenuOpen(false);
    setIsMenuOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const getNavLinkClasses = ({ isActive }) =>
    [
      "relative text-sm font-semibold tracking-wide",
      "transition-colors duration-200",

      "after:absolute after:-bottom-2 after:left-0",
      "after:h-[2px] after:bg-[#FF553D]",
      "after:transition-all after:duration-200",

      isActive
        ? "text-white after:w-full"
        : "text-white/75 after:w-0 hover:text-white hover:after:w-full",
    ].join(" ");

  const anchorLinkClasses =
    "relative text-sm font-semibold tracking-wide text-white/75 transition-colors duration-200 after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-0 after:bg-[#FF553D] after:transition-all after:duration-200 hover:text-white hover:after:w-full";

  return (
    <header
      className={`
        fixed left-0 top-0 z-50 w-full
        transition-all duration-300
        ${
          isScrolled ||
          isMenuOpen ||
          isUserMenuOpen
            ? "border-b border-white/10 bg-[#011427]/95 shadow-lg backdrop-blur-md"
            : "bg-[#011427]/20 backdrop-blur-[2px]"
        }
      `}
    >
      <nav
        className="
          mx-auto flex h-20 max-w-7xl
          items-center justify-between
          px-5 sm:px-6 lg:px-8
        "
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Logo className="text-2xl" />

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-5 xl:gap-7 lg:flex">
          {navItems.map((item) => (
            item.href ? (
              <a key={item.href} href={item.href} onClick={closeMenus} className={anchorLinkClasses}>
                {item.label}
              </a>
            ) : (
              <NavLink key={item.path} to={item.path} onClick={closeMenus} className={getNavLinkClasses}>
                {item.label}
              </NavLink>
            )
          ))}
        </div>

        {/* Desktop Right Section */}
        <div className="hidden items-center lg:flex">
          {!isAuthLoading && !isAuthenticated && (
            <div className="flex items-center gap-3">
              <Button
                to="/login"
                variant="ghost"
                size="sm"
              >
                LOGIN
              </Button>

              <Button
                to="/signup"
                variant="primary"
                size="sm"
              >
                SIGN UP
              </Button>
            </div>
          )}

          {!isAuthLoading && isAuthenticated && user && (
            <>
              {user.role === "USER" && <NavLink to="/account/notifications" onClick={closeMenus} aria-label={unreadCount ? `${unreadCount > 9 ? "9+" : unreadCount} unread notifications` : "Notifications"} className="relative mr-3 grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#EEC058]/60"><span aria-hidden="true" className="text-lg">🔔</span>{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#FF553D] px-1 text-center text-[10px] font-extrabold leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}</NavLink>}
            <div
              ref={userMenuRef}
              className="relative"
            >
              {/* User Menu Button */}
              <button
                type="button"
                onClick={() =>
                  setIsUserMenuOpen(
                    (previous) => !previous
                  )
                }
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="
                  flex items-center gap-3 rounded-lg
                  border border-white/10
                  bg-white/5 px-3 py-2
                  text-left
                  transition-colors duration-200
                  hover:bg-white/10
                "
              >
                {/* Avatar */}
                <Avatar user={user} className="h-9 w-9 shrink-0 rounded-full text-sm" />

                {/* User Information */}
                <span className="max-w-[150px]">
                  <span className="block truncate text-sm font-bold text-white">
                    {user.name}
                  </span>

                  <span className="block truncate text-[11px] font-medium text-white/45">
                    {formatRole(user.role)}
                  </span>
                </span>

                {/* Dropdown Arrow */}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className={`
                    h-4 w-4 text-white/50
                    transition-transform duration-200
                    ${
                      isUserMenuOpen
                        ? "rotate-180"
                        : ""
                    }
                  `}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="
                    absolute right-0 top-[calc(100%+12px)]
                    w-64 overflow-hidden
                    rounded-lg border border-white/10
                    bg-[#0B1D2F]
                    shadow-2xl
                  "
                >
                  {/* User Details */}
                  <div className="border-b border-white/10 px-4 py-4">
                    <p className="truncate text-sm font-bold text-white">
                      {user.name}
                    </p>

                    <p className="mt-1 truncate text-xs text-white/50">
                      {user.email}
                    </p>

                    <span
                      className="
                        mt-3 inline-flex rounded-full
                        bg-[#EEC058]/10
                        px-2.5 py-1
                        text-[10px] font-bold
                        tracking-wider text-[#EEC058]
                      "
                    >
                      {formatRole(user.role).toUpperCase()}
                    </span>
                  </div>

                  {/* Logout */}
                  <div className="p-2">
                    {user.role === "USER" && <NavLink to="/account" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">MY ACCOUNT</NavLink>}
                    {user.role === "USER" && <NavLink to="/account/notifications" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">NOTIFICATIONS{unreadCount > 0 ? ` (${unreadCount > 9 ? "9+" : unreadCount})` : ""}</NavLink>}
                    {user.role === "TEAM_OWNER" && <NavLink to="/team" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">TEAM PORTAL</NavLink>}
                    {user.role === "CLUB_OWNER" && <NavLink to="/club" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">CLUB PORTAL</NavLink>}
                    {user.role === "SUPER_ADMIN" && <NavLink to="/admin" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">ADMIN PORTAL</NavLink>}
                    {user.role === "REFEREE" && <>
                      <NavLink to="/referee/dashboard" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">REFEREE DASHBOARD</NavLink>
                      <NavLink to="/referee/matches" onClick={closeMenus} role="menuitem" className="flex rounded-md px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">MY MATCHES</NavLink>
                    </>}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="
                        flex w-full items-center
                        rounded-md px-3 py-2.5
                        text-sm font-semibold
                        text-red-300
                        transition-colors
                        hover:bg-red-500/10
                        hover:text-red-200
                      "
                    >
                      LOGOUT
                    </button>
                  </div>
                </div>

              )}
            </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() =>
            setIsMenuOpen((previous) => !previous)
          }
          aria-label={
            isMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-md border border-white/15
            text-white transition-colors
            hover:bg-white/10
            lg:hidden
          "
        >
          <span className="sr-only">
            {isMenuOpen
              ? "Close menu"
              : "Open menu"}
          </span>

          <div className="flex w-5 flex-col gap-[5px]">
            <span
              className={`
                block h-[2px] w-full bg-current
                transition-transform duration-200
                ${
                  isMenuOpen
                    ? "translate-y-[7px] rotate-45"
                    : ""
                }
              `}
            />

            <span
              className={`
                block h-[2px] w-full bg-current
                transition-opacity duration-200
                ${
                  isMenuOpen
                    ? "opacity-0"
                    : ""
                }
              `}
            />

            <span
              className={`
                block h-[2px] w-full bg-current
                transition-transform duration-200
                ${
                  isMenuOpen
                    ? "-translate-y-[7px] -rotate-45"
                    : ""
                }
              `}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={`
          overflow-hidden bg-[#011427]/95
          backdrop-blur-md
          transition-all duration-300
          lg:hidden
          ${
            isMenuOpen
              ? "max-h-[700px] border-t border-white/10 opacity-100"
              : "max-h-0 border-t border-transparent opacity-0"
          }
        `}
      >
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6">
          {/* Mobile Navigation Links */}
          <div className="flex flex-col">
            {navItems.map((item) => (
              item.href ? (
                <a key={item.href} href={item.href} onClick={closeMobileMenu} className="border-b border-white/10 py-4 text-sm font-semibold tracking-wide text-white/75 transition-colors duration-200 hover:text-white">
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      "border-b border-white/10 py-4",
                      "text-sm font-semibold tracking-wide",
                      "transition-colors duration-200",
                      isActive
                        ? "text-[#FF553D]"
                        : "text-white/75 hover:text-white",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              )
            ))}
          </div>

          {/* Guest Mobile Actions */}
          {!isAuthLoading && !isAuthenticated && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                to="/login"
                variant="ghost"
                fullWidth
                onClick={closeMobileMenu}
              >
                LOGIN
              </Button>

              <Button
                to="/signup"
                variant="primary"
                fullWidth
                onClick={closeMobileMenu}
              >
                SIGN UP
              </Button>
            </div>
          )}

          {/* Authenticated Mobile User */}
          {!isAuthLoading &&
            isAuthenticated &&
            user && (
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={user} className="h-11 w-11 shrink-0 rounded-full text-base" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {user.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-white/50">
                      {user.email}
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#EEC058]">
                      {formatRole(user.role)}
                    </p>
                  </div>
                </div>

                {user.role === "USER" && <div className="mt-4 grid grid-cols-2 gap-2"><NavLink onClick={closeMobileMenu} to="/account" className="block rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">MY ACCOUNT</NavLink><NavLink onClick={closeMobileMenu} to="/account/notifications" aria-label={unreadCount ? `${unreadCount > 9 ? "9+" : unreadCount} unread notifications` : "Notifications"} className="relative block rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">NOTIFICATIONS{unreadCount > 0 && <span className="ml-1 rounded-full bg-[#FF553D] px-1.5 py-0.5 text-[10px] text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}</NavLink></div>}
                {user.role === "TEAM_OWNER" && <div className="mt-4"><NavLink onClick={closeMobileMenu} to="/team" className="block rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">TEAM PORTAL</NavLink></div>}
                {user.role === "CLUB_OWNER" && <div className="mt-4"><NavLink onClick={closeMobileMenu} to="/club" className="block rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">CLUB PORTAL</NavLink></div>}
                {user.role === "SUPER_ADMIN" && <div className="mt-4"><NavLink onClick={closeMobileMenu} to="/admin" className="block rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">ADMIN PORTAL</NavLink></div>}
                {user.role === "REFEREE" && <div className="mt-4 grid grid-cols-2 gap-2"><NavLink onClick={closeMobileMenu} to="/referee/dashboard" className="rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">DASHBOARD</NavLink><NavLink onClick={closeMobileMenu} to="/referee/matches" className="rounded border border-white/15 p-2 text-center text-xs font-bold text-[#EEC058]">MY MATCHES</NavLink></div>}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    mt-4 w-full rounded-md
                    border border-red-500/20
                    px-4 py-2.5
                    text-sm font-bold text-red-300
                    transition-colors
                    hover:bg-red-500/10
                  "
                >
                  LOGOUT
                </button>
              </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
