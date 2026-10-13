import { Link } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import Logo from "../common/Logo";
import { FEATURES } from "../../constants/features";

/*
|--------------------------------------------------------------------------
| Footer Navigation
|--------------------------------------------------------------------------
| These are application routes, so keeping them in frontend config is correct.
*/

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
  ...(FEATURES.CLUBS_ENABLED ? [{ label: "Find Clubs", path: "/clubs" }] : []),
  { label: "Browse Players", path: "/players" },
  { label: "View Fixtures", path: "/matches" },
  { label: "Latest News", path: "/news" },
  { label: "Team Rankings", path: "/rankings" },
];

const teamLinks = [
  { label: "Competition Entry", path: "/competitions" },
  { label: "Player Management", path: "/players" },
  { label: "Referees", path: "/referees" },
  { label: "Referee Rankings", path: "/referees/rankings" },
];

/*
|--------------------------------------------------------------------------
| Reusable Components
|--------------------------------------------------------------------------
*/

const FooterHeading = ({ children }) => (
  <div>
    <h3 className="text-[15px] font-extrabold text-[#101828]">
      {children}
    </h3>

    <div className="mt-2.5 h-[2px] w-6 rounded-full bg-[#16805E]" />
  </div>
);

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="
        text-[13px]
        font-medium
        text-[#667085]
        transition-colors
        duration-200
        hover:text-[#087554]
        focus:outline-none
        focus:text-[#087554]
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
      grid h-9 w-9
      place-items-center
      rounded-full
      bg-[#F1F4F6]
      text-[#152238]
      transition-all
      duration-200
      hover:bg-[#E5F3ED]
      hover:text-[#087554]
      focus:outline-none
      focus:ring-2
      focus:ring-[#087554]/20
    "
  >
    {children}
  </button>
);

/*
 * lucide-react does not provide social-media brand icons.
 * These simple marks avoid adding another package.
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
        flex h-4 w-4
        items-center justify-center
        text-[11px]
        font-extrabold
        leading-none
      "
      aria-hidden="true"
    >
      {icons[type]}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Footer
|--------------------------------------------------------------------------
*/

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-[#101828]">
      {/* ================================================================
          NEWSLETTER
      ================================================================= */}

      <div className="bg-white px-5 pt-7 sm:px-6 lg:px-8">
        <div
          className="
            relative mx-auto
            max-w-[1320px]
            overflow-hidden
            rounded-[13px]
            text-white
            shadow-[0_10px_30px_rgba(15,23,42,0.10)]
          "
          style={{
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(3, 52, 42, 0.98) 0%,
                rgba(4, 74, 52, 0.94) 48%,
                rgba(5, 99, 60, 0.58) 100%
              ),
              url("/images/footer/newsletter-bg.jpg")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Subtle highlight */}
          <div
            className="
              pointer-events-none
              absolute inset-0
              bg-[linear-gradient(90deg,rgba(255,255,255,0.02),transparent_60%)]
            "
          />

          <div
            className="
              relative z-10
              flex flex-col
              gap-6
              px-7 py-6
              sm:px-9
              lg:flex-row
              lg:items-center
              lg:justify-between
              lg:px-10
            "
          >
            {/* LEFT */}
            <div className="flex min-w-0 items-center gap-5">
              <div
                className="
                  hidden h-14 w-14
                  shrink-0
                  place-items-center
                  rounded-full
                  bg-white/10
                  ring-1 ring-white/10
                  backdrop-blur-sm
                  sm:grid
                "
              >
                <Mail
                  className="h-6 w-6"
                  strokeWidth={1.7}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.24em]
                    text-white/75
                  "
                >
                  Stay Updated
                </p>

                <h2
                  className="
                    mt-1.5
                    max-w-[620px]
                    text-[22px]
                    font-extrabold
                    leading-[1.2]
                    tracking-[-0.025em]
                    sm:text-[25px]
                    lg:text-[27px]
                  "
                >
                  Get the{" "}
                  <span className="text-[#6EE69A]">
                    Latest
                  </span>{" "}
                  from Hunza Premier League
                </h2>

                <p
                  className="
                    mt-2
                    max-w-[590px]
                    text-[13px]
                    leading-5
                    text-white/78
                    sm:text-[14px]
                  "
                >
                  News, match updates, announcements and more —
                  straight to your inbox.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <form
              onSubmit={(event) => event.preventDefault()}
              className="
                flex w-full
                overflow-hidden
                rounded-[8px]
                bg-white
                shadow-[0_5px_18px_rgba(0,0,0,0.08)]
                lg:max-w-[475px]
              "
            >
              <div
                className="
                  flex min-w-0
                  flex-1
                  items-center
                  gap-3
                  px-4
                  sm:px-5
                "
              >
                <Mail
                  className="
                    h-[17px] w-[17px]
                    shrink-0
                    text-[#087554]
                  "
                  strokeWidth={1.8}
                />

                <input
                  type="email"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    py-[14px]
                    text-[13px]
                    text-[#101828]
                    outline-none
                    placeholder:text-[#98A2B3]
                    sm:text-[14px]
                  "
                />
              </div>

              <button
                type="submit"
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  border-l
                  border-[#E7ECE9]
                  bg-[#087554]
                  px-5
                  text-[13px]
                  font-bold
                  text-white
                  transition-colors
                  hover:bg-[#066548]
                  focus:outline-none
                  focus:bg-[#066548]
                  sm:px-6
                  sm:text-[14px]
                "
              >
                Subscribe

                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ================================================================
          MAIN FOOTER
      ================================================================= */}

      <div
        className="
          relative
          overflow-hidden
          bg-white
          px-5
          sm:px-6
          lg:px-8
        "
      >
        {/* ==============================================================
            REAL FOOTER BACKGROUND IMAGE
        =============================================================== */}

        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-bottom
            bg-no-repeat
          "
          style={{
            backgroundImage:
              'url("/images/footer/footer-bg.png")',
            backgroundSize: "100% auto",
            backgroundPosition: "center bottom",
          }}
        />

        {/*
          White gradient keeps text readable while allowing
          mountains/trees/football artwork to remain visible
          toward the bottom.
        */}
        <div
          className="
            pointer-events-none
            absolute inset-0
            bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,255,255,0.96)_32%,rgba(255,255,255,0.84)_65%,rgba(255,255,255,0.48)_100%)]
          "
        />

        <div
          className="
            relative z-10
            mx-auto
            grid
            max-w-[1320px]
            gap-0
            pb-[90px]
            pt-9
            md:grid-cols-2
            lg:grid-cols-[1.55fr_0.75fr_0.8fr_0.95fr_1.2fr]
            lg:pb-[105px]
          "
        >
          {/* ============================================================
              BRAND
          ============================================================ */}

          <div className="pr-8 lg:pr-10">
            <div className="max-w-[220px]">
              <Logo />
            </div>

            <p
              className="
                mt-4
                max-w-[305px]
                text-[13px]
                leading-[1.65]
                text-[#667085]
              "
            >
              Hunza Premier League is a platform to promote
              football across Hunza and Gilgit-Baltistan,
              uniting teams, players and communities through
              the love of the game.
            </p>

            {/* Social */}
            <div className="mt-5 flex items-center gap-2.5">
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

            {/* Tagline */}
            <div
              className="
                mt-5
                flex flex-wrap
                items-center
                gap-2
                text-[8px]
                font-bold
                uppercase
                tracking-[0.18em]
                text-[#7C8D86]
              "
            >
              <span className="h-[1.5px] w-4 bg-[#087554]" />

              <span>Football</span>

              <span className="h-1 w-1 rounded-full bg-[#087554]" />

              <span>Communities</span>

              <span className="h-1 w-1 rounded-full bg-[#087554]" />

              <span>Stronger Hunza</span>

              <span className="h-[1.5px] w-4 bg-[#087554]" />
            </div>
          </div>

          {/* ============================================================
              QUICK LINKS
          ============================================================ */}

          <div
            className="
              mt-8
              border-l-0
              border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0
              lg:border-l
            "
          >
            <FooterHeading>
              Quick Links
            </FooterHeading>

            <ul className="mt-4 space-y-2">
              {quickLinks.map((item) => (
                <FooterLink
                  key={`${item.path}-${item.label}`}
                  to={item.path}
                >
                  {item.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* ============================================================
              FOR USERS
          ============================================================ */}

          <div
            className="
              mt-8
              border-l-0
              border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0
              lg:border-l
            "
          >
            <FooterHeading>
              For Users
            </FooterHeading>

            <ul className="mt-4 space-y-2">
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

          {/* ============================================================
              TEAMS
          ============================================================ */}

          <div
            className="
              mt-8
              border-l-0
              border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0
              lg:border-l
            "
          >
            <FooterHeading>
              For Teams
            </FooterHeading>

            <ul className="mt-4 space-y-2">
              {teamLinks.map((item) => (
                <FooterLink
                  key={`${item.path}-${item.label}`}
                  to={item.path}
                >
                  {item.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* ============================================================
              CONTACT
          ============================================================ */}

          <div
            className="
              mt-8
              border-l-0
              border-[#E6EBE8]
              px-0
              md:px-7
              lg:mt-0
              lg:border-l
            "
          >
            <FooterHeading>
              Contact Info
            </FooterHeading>

            <div className="mt-5 space-y-5">
              {/* LOCATION */}

              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-9 w-9
                    shrink-0
                    place-items-center
                    rounded-[8px]
                    bg-[#EDF6F1]
                    text-[#087554]
                  "
                >
                  <MapPin
                    className="h-[17px] w-[17px]"
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#344054]">
                    Hunza, Gilgit-Baltistan
                  </p>

                  <p className="mt-1 text-[10px] text-[#98A2B3]">
                    Pakistan
                  </p>
                </div>
              </div>

              {/* EMAIL */}

              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-9 w-9
                    shrink-0
                    place-items-center
                    rounded-[8px]
                    bg-[#EDF6F1]
                    text-[#087554]
                  "
                >
                  <Mail
                    className="h-[17px] w-[17px]"
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#344054]">
                    Contact HPL
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      leading-4
                      text-[#98A2B3]
                    "
                  >
                    Official contact details coming soon
                  </p>
                </div>
              </div>

              {/* PHONE */}

              <div className="flex items-start gap-3">
                <div
                  className="
                    grid h-9 w-9
                    shrink-0
                    place-items-center
                    rounded-[8px]
                    bg-[#EDF6F1]
                    text-[#087554]
                  "
                >
                  <Phone
                    className="h-[17px] w-[17px]"
                    strokeWidth={1.7}
                  />
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#344054]">
                    League Support
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      leading-4
                      text-[#98A2B3]
                    "
                  >
                    Contact information coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          BOTTOM BAR
      ================================================================= */}

      <div
        className="
          relative z-20
          bg-[#071D31]
          px-5
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1320px]
            flex-col
            gap-4
            py-[17px]
            text-[10px]
            text-white/60
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
              hidden
              items-center
              gap-3
              border-l
              border-white/15
              pl-5
              text-[9px]
              text-white/60
              lg:flex
            "
          >
            <span className="font-extrabold text-white">
              HPL
            </span>

            <span className="leading-4">
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
