import { Link } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import Logo from "../common/Logo";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "Competitions", path: "/competitions" },
  { label: "Seasons", path: "/seasons" },
  { label: "Teams", path: "/teams" },
  { label: "Players", path: "/players" },
  { label: "Matches", path: "/matches" },
  { label: "News", path: "/news" },
];

const userLinks = [
  { label: "Register Team", path: "/teams" },
  { label: "Find Clubs", path: "/clubs" },
  { label: "Browse Players", path: "/players" },
  { label: "View Fixtures", path: "/matches" },
  { label: "Latest News", path: "/news" },
  { label: "Team Rankings", path: "/rankings" },
];

const clubLinks = [
  { label: "Club Registration", path: "/clubs" },
  { label: "Team Registration", path: "/teams" },
  { label: "Competition Entry", path: "/competitions" },
  { label: "Player Management", path: "/players" },
  { label: "Referees", path: "/referees" },
  { label: "Referee Rankings", path: "/referees/rankings" },
];

const FooterHeading = ({ children }) => (
  <div>
    <h3 className="text-[14px] font-extrabold text-[#101828]">
      {children}
    </h3>

    <div className="mt-2 h-[2px] w-5 rounded-full bg-[#16805E]" />
  </div>
);

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="
        text-[12px] font-medium text-[#667085]
        transition-colors
        hover:text-[#087554]
      "
    >
      {children}
    </Link>
  </li>
);

const SocialButton = ({ children, label }) => (
  <button
    type="button"
    aria-label={label}
    className="
      grid h-8 w-8 place-items-center
      rounded-full bg-[#F1F4F6]
      text-[#152238]
      transition
      hover:bg-[#E5F3ED]
      hover:text-[#087554]
    "
  >
    {children}
  </button>
);

/*
 * lucide-react does not provide brand/social icons.
 * Keeping these small and dependency-free avoids another icon package.
 */
const SocialIcon = ({ type }) => {
  const icons = {
    facebook: "f",
    instagram: "◎",
    youtube: "▶",
    linkedin: "in",
  };

  return (
    <span
      className="
        flex h-4 w-4 items-center justify-center
        text-[11px] font-extrabold leading-none
      "
      aria-hidden="true"
    >
      {icons[type]}
    </span>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-[#101828]">
      {/* ==================================================
          NEWSLETTER
      ================================================== */}
      <div className="px-5 pt-6 sm:px-6 lg:px-8">
        <div
          className="
            relative mx-auto max-w-[1320px]
            overflow-hidden rounded-[12px]
            bg-[linear-gradient(105deg,#07382F_0%,#07543D_62%,#0A714E_100%)]
            px-7 py-5
            text-white
            shadow-[0_8px_25px_rgba(15,23,42,0.08)]
          "
        >
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
            <div
              className="
                absolute -right-10 -top-24
                h-[260px] w-[260px]
                rounded-full border border-white
              "
            />

            <div
              className="
                absolute right-[12%] -top-28
                h-[300px] w-[300px]
                rounded-full border border-white
              "
            />
          </div>

          <div
            className="
              relative z-10
              flex flex-col gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <div
                className="
                  hidden h-12 w-12 shrink-0
                  place-items-center
                  rounded-full bg-white/10
                  sm:grid
                "
              >
                <Mail className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <div>
                <p
                  className="
                    text-[9px] font-bold uppercase
                    tracking-[0.24em] text-white/70
                  "
                >
                  Stay Updated
                </p>

                <h2
                  className="
                    mt-1 text-[20px] font-extrabold
                    leading-tight tracking-[-0.02em]
                    sm:text-[22px]
                  "
                >
                  Get the{" "}
                  <span className="text-[#69DD8F]">
                    Latest
                  </span>{" "}
                  from Hunza Premier League
                </h2>

                <p className="mt-1 text-[12px] text-white/75">
                  News, match updates, announcements and more — straight
                  to your inbox.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="
                flex w-full max-w-[430px]
                overflow-hidden rounded-[7px]
                bg-white
              "
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                <Mail
                  className="h-4 w-4 shrink-0 text-[#087554]"
                  strokeWidth={1.8}
                />

                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="
                    min-w-0 flex-1
                    bg-transparent py-3
                    text-[12px] text-[#101828]
                    outline-none
                    placeholder:text-[#98A2B3]
                  "
                />
              </div>

              <button
                type="submit"
                className="
                  inline-flex items-center gap-2
                  border-l border-[#E7ECE9]
                  bg-[#087554]
                  px-5
                  text-[12px] font-bold text-white
                  transition hover:bg-[#066548]
                "
              >
                Subscribe
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ==================================================
          MAIN FOOTER
      ================================================== */}
      <div className="relative overflow-hidden px-5 sm:px-6 lg:px-8">
        {/* Mountain background */}
        <div
          className="
            pointer-events-none
            absolute bottom-0 left-0 right-0
            h-[95px]
            opacity-50
          "
        >
          <svg
            viewBox="0 0 1600 180"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="
                M0 180
                L0 130
                L90 80
                L150 120
                L240 45
                L330 130
                L430 75
                L520 140
                L640 55
                L750 130
                L850 85
                L960 145
                L1080 65
                L1180 130
                L1300 50
                L1400 120
                L1510 65
                L1600 120
                L1600 180
                Z
              "
              fill="#EEF4F1"
            />
          </svg>
        </div>

        <div
          className="
            relative z-10 mx-auto
            grid max-w-[1320px]
            gap-0 py-7
            md:grid-cols-2
            lg:grid-cols-[1.55fr_0.75fr_0.8fr_0.95fr_1.2fr]
          "
        >
          {/* BRAND */}
          <div className="pr-8">
            <div className="max-w-[220px]">
              <Logo />
            </div>

            <p
              className="
                mt-3 max-w-[285px]
                text-[11px] leading-[1.55]
                text-[#667085]
              "
            >
              Hunza Premier League is a platform to promote football
              across Hunza and Gilgit-Baltistan, uniting clubs, players
              and communities through the love of the game.
            </p>

            {/* Social */}
            <div className="mt-4 flex items-center gap-2">
              <SocialButton label="Facebook">
                <SocialIcon type="facebook" />
              </SocialButton>

              <SocialButton label="Instagram">
                <SocialIcon type="instagram" />
              </SocialButton>

              <SocialButton label="YouTube">
                <SocialIcon type="youtube" />
              </SocialButton>

              <SocialButton label="LinkedIn">
                <SocialIcon type="linkedin" />
              </SocialButton>
            </div>

            <div
              className="
                mt-4 flex items-center gap-2
                text-[7px] font-bold uppercase
                tracking-[0.18em] text-[#7C8D86]
              "
            >
              <span className="h-[1.5px] w-4 bg-[#087554]" />
              Football
              <span className="h-1 w-1 rounded-full bg-[#087554]" />
              Communities
              <span className="h-1 w-1 rounded-full bg-[#087554]" />
              Stronger Hunza
              <span className="h-[1.5px] w-4 bg-[#087554]" />
            </div>
          </div>

          {/* QUICK LINKS */}
          <div
            className="
              mt-7 border-l-0 border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0 lg:border-l
            "
          >
            <FooterHeading>Quick Links</FooterHeading>

            <ul className="mt-3 space-y-1.5">
              {quickLinks.map((item) => (
                <FooterLink key={item.path} to={item.path}>
                  {item.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* FOR USERS */}
          <div
            className="
              mt-7 border-l-0 border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0 lg:border-l
            "
          >
            <FooterHeading>For Users</FooterHeading>

            <ul className="mt-3 space-y-1.5">
              {userLinks.map((item) => (
                <FooterLink
                  key={`${item.path}-${item.label}`}
                  to={item.path}
                >
                  {item.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* CLUBS & TEAMS */}
          <div
            className="
              mt-7 border-l-0 border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0 lg:border-l
            "
          >
            <FooterHeading>
              For Clubs & Teams
            </FooterHeading>

            <ul className="mt-3 space-y-1.5">
              {clubLinks.map((item) => (
                <FooterLink
                  key={`${item.path}-${item.label}`}
                  to={item.path}
                >
                  {item.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div
            className="
              mt-7 border-l-0 border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0 lg:border-l
            "
          >
            <FooterHeading>Contact Info</FooterHeading>

            <div className="mt-4 space-y-4">
              {/* LOCATION */}
              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-8 w-8 shrink-0
                    place-items-center
                    rounded-[8px] bg-[#EDF6F1]
                    text-[#087554]
                  "
                >
                  <MapPin
                    className="h-4 w-4"
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#344054]">
                    Hunza, Gilgit-Baltistan
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#98A2B3]">
                    Pakistan
                  </p>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-8 w-8 shrink-0
                    place-items-center
                    rounded-[8px] bg-[#EDF6F1]
                    text-[#087554]
                  "
                >
                  <Mail
                    className="h-4 w-4"
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#344054]">
                    Contact HPL
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#98A2B3]">
                    Official contact details coming soon
                  </p>
                </div>
              </div>

              {/* PHONE */}
              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-8 w-8 shrink-0
                    place-items-center
                    rounded-[8px] bg-[#EDF6F1]
                    text-[#087554]
                  "
                >
                  <Phone
                    className="h-4 w-4"
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#344054]">
                    League Support
                  </p>

                  <p className="mt-0.5 text-[9px] text-[#98A2B3]">
                    Contact information coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          BOTTOM BAR
      ================================================== */}
      <div className="relative z-20 bg-[#071D31] px-5 sm:px-6 lg:px-8">
        <div
          className="
            mx-auto flex max-w-[1320px]
            flex-col gap-3 py-4
            text-[10px] text-white/55
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <p>
            © {currentYear} Hunza Premier League. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <span>Privacy Policy</span>

            <span className="h-3 w-px bg-white/20" />

            <span>Terms of Use</span>

            <span className="h-3 w-px bg-white/20" />

            <span>Cookie Policy</span>

            <span className="h-3 w-px bg-white/20" />

            <span>Sitemap</span>
          </div>

          <div
            className="
              hidden items-center gap-2
              border-l border-white/15
              pl-5
              text-[9px] text-white/60
              lg:flex
            "
          >
            <span className="font-bold text-white">
              HPL
            </span>

            <span>
              Proudly Football
              <br />
              Proudly Hunza
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;