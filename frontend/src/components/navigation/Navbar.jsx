import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import Logo from "../common/Logo";
import useAuth from "../../hooks/useAuth";
import useNotifications from "../../hooks/useNotifications";
import { FEATURES } from "../../constants/features";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Seasons", path: "/seasons" },
  ...(FEATURES.CLUBS_ENABLED ? [{ label: "Clubs", path: "/clubs" }] : []),
  { label: "Teams", path: "/teams4" },
  { label: "Matches", path: "/matches" },
  { label: "Standings", path: "/standings" },
  { label: "News", path: "/news" },
];

const formatRole = (role) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getInitial = (name) => {
  if (!name) return "U";

  return name.trim().charAt(0).toUpperCase();
};

const Avatar = ({ user, className = "" }) =>
  user?.profile_image ? (
    <img
      src={user.profile_image}
      alt={`${user.name || "User"} profile`}
      className={`${className} object-cover`}
    />
  ) : (
    <span
      className={`
        ${className}
        grid place-items-center
        bg-[#0B5D46]
        font-bold text-white
      `}
    >
      {getInitial(user?.name)}
    </span>
  );

const UserIcon = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M20 21a8 8 0 0 0-16 0"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    <circle
      cx="12"
      cy="7"
      r="4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const BellIcon = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M10 21h4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const userMenuRef = useRef(null);

  /*
   * Navbar shadow on scroll
   */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
   * Close desktop user dropdown when clicking outside
   */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /*
   * Escape closes mobile navigation
   */
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isMenuOpen]);

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

  /*
   * Desktop navigation link
   */
  const getNavLinkClasses = ({ isActive }) =>
    [
      "relative flex h-full items-center",
      "whitespace-nowrap px-1",
      "text-[15px] font-semibold",
      "transition-colors duration-200",

      "after:absolute",
      "after:bottom-[14px]",
      "after:left-1/2",
      "after:h-[2px]",
      "after:-translate-x-1/2",
      "after:rounded-full",
      "after:bg-[#0B5D46]",
      "after:transition-all",
      "after:duration-200",

      isActive
        ? "text-[#0A513E] after:w-full"
        : "text-[#1D2735] after:w-0 hover:text-[#0A513E] hover:after:w-full",
    ].join(" ");

  return (
    <header
      className={`
        fixed left-0 right-0 top-0 z-50
        w-full
        border-b border-[#E7ECEA]
        bg-white
        transition-shadow duration-300
        ${
          isScrolled
            ? "shadow-[0_4px_18px_rgba(15,23,42,0.08)]"
            : "shadow-none"
        }
      `}
    >
      <nav
        aria-label="Main navigation"
        className="
          relative
          flex
          h-[76px]
          w-full
          items-center
          bg-white
          px-5
          sm:px-7
          lg:px-10
          xl:px-14
          2xl:px-16
        "
      >
        {/* =========================
            LOGO
        ========================== */}

        <div className="relative z-20 flex min-w-[90px] items-center lg:min-w-[150px]">
          <Logo />
        </div>

        {/* =========================
            DESKTOP NAVIGATION
        ========================== */}

        <div
          className="
            absolute left-1/2 hidden
            h-full -translate-x-1/2
            items-center gap-5
            lg:flex
            xl:gap-7
            2xl:gap-8
          "
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMenus}
              className={getNavLinkClasses}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* =========================
            DESKTOP RIGHT SIDE
        ========================== */}

        <div className="ml-auto hidden items-center lg:flex">
          {/* Guest */}

          {!isAuthLoading && !isAuthenticated && (
            <NavLink
              to="/login"
              onClick={closeMenus}
              className="
                inline-flex min-h-[46px]
                items-center justify-center gap-2.5
                rounded-full
                bg-[#0B5D46]
                px-6
                text-[14px] font-semibold
                text-white
                shadow-[0_6px_18px_rgba(11,93,70,0.18)]
                transition-all duration-200
                hover:bg-[#084B39]
                hover:shadow-[0_8px_22px_rgba(11,93,70,0.24)]
                focus:outline-none
                focus:ring-2
                focus:ring-[#0B5D46]/30
                focus:ring-offset-2
              "
            >
              <UserIcon />
              Login
            </NavLink>
          )}

          {/* Authenticated */}

          {!isAuthLoading &&
            isAuthenticated &&
            user && (
              <div className="flex items-center">
                {/* USER Notification Bell */}

                {user.role === "USER" && (
                  <NavLink
                    to="/account/notifications"
                    onClick={closeMenus}
                    aria-label={
                      unreadCount
                        ? `${
                            unreadCount > 9
                              ? "9+"
                              : unreadCount
                          } unread notifications`
                        : "Notifications"
                    }
                    className="
                      relative mr-3 grid h-10 w-10
                      place-items-center rounded-full
                      border border-[#DDE5E1]
                      text-[#0B5D46]
                      transition-colors
                      hover:bg-[#F2F8F5]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#0B5D46]/20
                    "
                  >
                    <BellIcon />

                    {unreadCount > 0 && (
                      <span
                        className="
                          absolute -right-1 -top-1
                          min-w-[18px] rounded-full
                          bg-[#C93B32]
                          px-1 text-center
                          text-[10px] font-bold
                          leading-[18px] text-white
                        "
                      >
                        {unreadCount > 9
                          ? "9+"
                          : unreadCount}
                      </span>
                    )}
                  </NavLink>
                )}

                {/* User Menu */}

                <div
                  ref={userMenuRef}
                  className="relative"
                >
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
                      flex min-h-[46px]
                      items-center gap-2.5
                      rounded-full
                      bg-[#0B5D46]
                      py-1.5 pl-1.5 pr-4
                      text-left text-white
                      shadow-[0_6px_18px_rgba(11,93,70,0.16)]
                      transition-colors
                      hover:bg-[#084B39]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#0B5D46]/30
                      focus:ring-offset-2
                    "
                  >
                    <Avatar
                      user={user}
                      className="
                        h-8 w-8 shrink-0
                        rounded-full border-2
                        border-white/80 text-sm
                      "
                    />

                    <span className="max-w-[115px]">
                      <span className="block truncate text-sm font-semibold">
                        {user.name}
                      </span>

                      <span className="block truncate text-[10px] text-white/70">
                        {formatRole(user.role)}
                      </span>
                    </span>

                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className={`
                        h-4 w-4 text-white/75
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

                  {/* Desktop User Dropdown */}

                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      className="
                        absolute right-0
                        top-[calc(100%+12px)]
                        w-64 overflow-hidden
                        rounded-2xl
                        border border-[#E5E7EB]
                        bg-white
                        shadow-[0_18px_50px_rgba(15,23,42,0.16)]
                      "
                    >
                      {/* User Information */}

                      <div className="border-b border-[#EEF0F2] px-4 py-4">
                        <p className="truncate text-sm font-bold text-[#18202C]">
                          {user.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#697386]">
                          {user.email}
                        </p>

                        <span
                          className="
                            mt-3 inline-flex
                            rounded-full
                            bg-[#EEF7F3]
                            px-2.5 py-1
                            text-[10px] font-bold
                            tracking-wider
                            text-[#0B5D46]
                          "
                        >
                          {formatRole(
                            user.role
                          ).toUpperCase()}
                        </span>
                      </div>

                      {/* Dropdown Actions */}

                      <div className="p-2">
                        {/* Normal User */}

                        {user.role === "USER" && (
                          <>
                            <NavLink
                              to="/account"
                              onClick={closeMenus}
                              role="menuitem"
                              className="
                                flex rounded-xl
                                px-3 py-2.5
                                text-sm font-semibold
                                text-[#344054]
                                hover:bg-[#F5F8F7]
                              "
                            >
                              My Account
                            </NavLink>

                            <NavLink
                              to="/account/notifications"
                              onClick={closeMenus}
                              role="menuitem"
                              className="
                                flex rounded-xl
                                px-3 py-2.5
                                text-sm font-semibold
                                text-[#344054]
                                hover:bg-[#F5F8F7]
                              "
                            >
                              Notifications
                              {unreadCount > 0
                                ? ` (${
                                    unreadCount > 9
                                      ? "9+"
                                      : unreadCount
                                  })`
                                : ""}
                            </NavLink>
                          </>
                        )}

                        {/* Team Owner */}

                        {user.role ===
                          "TEAM_OWNER" && (
                          <NavLink
                            to="/team"
                            onClick={closeMenus}
                            role="menuitem"
                            className="
                              flex rounded-xl
                              px-3 py-2.5
                              text-sm font-semibold
                              text-[#344054]
                              hover:bg-[#F5F8F7]
                            "
                          >
                            Team Portal
                          </NavLink>
                        )}

                        {/* Club Owner */}

                        {FEATURES.CLUBS_ENABLED && user.role ===
                          "CLUB_OWNER" && (
                          <NavLink
                            to="/club"
                            onClick={closeMenus}
                            role="menuitem"
                            className="
                              flex rounded-xl
                              px-3 py-2.5
                              text-sm font-semibold
                              text-[#344054]
                              hover:bg-[#F5F8F7]
                            "
                          >
                            Club Portal
                          </NavLink>
                        )}

                        {/* Super Admin */}

                        {user.role ===
                          "SUPER_ADMIN" && (
                          <NavLink
                            to="/admin"
                            onClick={closeMenus}
                            role="menuitem"
                            className="
                              flex rounded-xl
                              px-3 py-2.5
                              text-sm font-semibold
                              text-[#344054]
                              hover:bg-[#F5F8F7]
                            "
                          >
                            Admin Portal
                          </NavLink>
                        )}

                        {/* Referee */}

                        {user.role ===
                          "REFEREE" && (
                          <>
                            <NavLink
                              to="/referee/dashboard"
                              onClick={closeMenus}
                              role="menuitem"
                              className="
                                flex rounded-xl
                                px-3 py-2.5
                                text-sm font-semibold
                                text-[#344054]
                                hover:bg-[#F5F8F7]
                              "
                            >
                              Referee Dashboard
                            </NavLink>

                            <NavLink
                              to="/referee/matches"
                              onClick={closeMenus}
                              role="menuitem"
                              className="
                                flex rounded-xl
                                px-3 py-2.5
                                text-sm font-semibold
                                text-[#344054]
                                hover:bg-[#F5F8F7]
                              "
                            >
                              My Matches
                            </NavLink>
                          </>
                        )}

                        {/* Logout */}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="
                            mt-1 flex w-full
                            rounded-xl px-3 py-2.5
                            text-sm font-semibold
                            text-[#B42318]
                            transition-colors
                            hover:bg-[#FEF3F2]
                          "
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* =========================
            MOBILE MENU BUTTON
        ========================== */}

        <button
          type="button"
          onClick={() =>
            setIsMenuOpen(
              (previous) => !previous
            )
          }
          aria-label={
            isMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          className="
            ml-auto flex h-10 w-10
            items-center justify-center
            rounded-full
            border border-[#DDE5E1]
            text-[#0B5D46]
            transition-colors
            hover:bg-[#F2F8F5]
            focus:outline-none
            focus:ring-2
            focus:ring-[#0B5D46]/20
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
                block h-[2px] w-full
                rounded-full bg-current
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
                block h-[2px] w-full
                rounded-full bg-current
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
                block h-[2px] w-full
                rounded-full bg-current
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

        {/* =========================
            MOBILE MENU
        ========================== */}

        <div
          className={`
            absolute left-4 right-4
            top-[calc(100%+10px)]
            overflow-hidden
            rounded-2xl
            border border-black/[0.05]
            bg-white
            shadow-[0_18px_50px_rgba(15,23,42,0.16)]
            transition-all duration-300
            lg:hidden
            ${
              isMenuOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-2 opacity-0"
            }
          `}
        >
          <div className="max-h-[calc(100vh-100px)] overflow-y-auto p-4">
            {/* Public Navigation */}

            <div className="flex flex-col">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      "flex items-center justify-between",
                      "rounded-xl px-4 py-3.5",
                      "text-sm font-semibold",
                      "transition-colors",

                      isActive
                        ? "bg-[#EEF7F3] text-[#0B5D46]"
                        : "text-[#344054] hover:bg-[#F7F9F8]",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* =========================
                MOBILE GUEST
            ========================== */}

            {!isAuthLoading &&
              !isAuthenticated && (
                <div className="mt-4 border-t border-[#EEF0F2] pt-4">
                  <NavLink
                    to="/login"
                    onClick={closeMobileMenu}
                    className="
                      flex min-h-[48px] w-full
                      items-center justify-center gap-2
                      rounded-full
                      bg-[#0B5D46]
                      px-5
                      text-sm font-semibold
                      text-white
                      transition-colors
                      hover:bg-[#084B39]
                    "
                  >
                    <UserIcon />
                    Login
                  </NavLink>
                </div>
              )}

            {/* =========================
                MOBILE AUTHENTICATED USER
            ========================== */}

            {!isAuthLoading &&
              isAuthenticated &&
              user && (
                <div className="mt-4 border-t border-[#EEF0F2] pt-4">
                  <div className="rounded-2xl bg-[#F7F9F8] p-4">
                    {/* User Identity */}

                    <div className="flex items-center gap-3">
                      <Avatar
                        user={user}
                        className="
                          h-11 w-11 shrink-0
                          rounded-full text-sm
                        "
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#18202C]">
                          {user.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-[#697386]">
                          {user.email}
                        </p>

                        <p className="mt-1 text-[11px] font-semibold text-[#0B5D46]">
                          {formatRole(user.role)}
                        </p>
                      </div>
                    </div>

                    {/* Normal User */}

                    {user.role === "USER" && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <NavLink
                          onClick={closeMobileMenu}
                          to="/account"
                          className="
                            rounded-xl
                            border border-[#DDE5E1]
                            bg-white p-2.5
                            text-center text-xs
                            font-bold text-[#0B5D46]
                          "
                        >
                          My Account
                        </NavLink>

                        <NavLink
                          onClick={closeMobileMenu}
                          to="/account/notifications"
                          aria-label={
                            unreadCount
                              ? `${
                                  unreadCount > 9
                                    ? "9+"
                                    : unreadCount
                                } unread notifications`
                              : "Notifications"
                          }
                          className="
                            relative rounded-xl
                            border border-[#DDE5E1]
                            bg-white p-2.5
                            text-center text-xs
                            font-bold text-[#0B5D46]
                          "
                        >
                          Notifications

                          {unreadCount > 0 && (
                            <span
                              className="
                                ml-1 rounded-full
                                bg-[#C93B32]
                                px-1.5 py-0.5
                                text-[10px] text-white
                              "
                            >
                              {unreadCount > 9
                                ? "9+"
                                : unreadCount}
                            </span>
                          )}
                        </NavLink>
                      </div>
                    )}

                    {/* Team Owner */}

                    {user.role ===
                      "TEAM_OWNER" && (
                      <NavLink
                        onClick={closeMobileMenu}
                        to="/team"
                        className="
                          mt-4 block rounded-xl
                          border border-[#DDE5E1]
                          bg-white p-2.5
                          text-center text-xs
                          font-bold text-[#0B5D46]
                        "
                      >
                        Team Portal
                      </NavLink>
                    )}

                    {/* Club Owner */}

                    {FEATURES.CLUBS_ENABLED && user.role ===
                      "CLUB_OWNER" && (
                      <NavLink
                        onClick={closeMobileMenu}
                        to="/club"
                        className="
                          mt-4 block rounded-xl
                          border border-[#DDE5E1]
                          bg-white p-2.5
                          text-center text-xs
                          font-bold text-[#0B5D46]
                        "
                      >
                        Club Portal
                      </NavLink>
                    )}

                    {/* Super Admin */}

                    {user.role ===
                      "SUPER_ADMIN" && (
                      <NavLink
                        onClick={closeMobileMenu}
                        to="/admin"
                        className="
                          mt-4 block rounded-xl
                          border border-[#DDE5E1]
                          bg-white p-2.5
                          text-center text-xs
                          font-bold text-[#0B5D46]
                        "
                      >
                        Admin Portal
                      </NavLink>
                    )}

                    {/* Referee */}

                    {user.role ===
                      "REFEREE" && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <NavLink
                          onClick={closeMobileMenu}
                          to="/referee/dashboard"
                          className="
                            rounded-xl
                            border border-[#DDE5E1]
                            bg-white p-2.5
                            text-center text-xs
                            font-bold text-[#0B5D46]
                          "
                        >
                          Dashboard
                        </NavLink>

                        <NavLink
                          onClick={closeMobileMenu}
                          to="/referee/matches"
                          className="
                            rounded-xl
                            border border-[#DDE5E1]
                            bg-white p-2.5
                            text-center text-xs
                            font-bold text-[#0B5D46]
                          "
                        >
                          My Matches
                        </NavLink>
                      </div>
                    )}

                    {/* Logout */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        mt-3 w-full
                        rounded-xl
                        border border-[#F4C7C3]
                        bg-white
                        px-4 py-2.5
                        text-sm font-semibold
                        text-[#B42318]
                        transition-colors
                        hover:bg-[#FEF3F2]
                      "
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
