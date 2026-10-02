import { Link } from "react-router-dom";

import Logo from "../common/Logo";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "Teams", path: "/teams" },
  { label: "Competitions", path: "/competitions" },
  { label: "Matches", path: "/matches" },
  { label: "News", path: "/news" },
];

const legalLinks = [
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms & Conditions", path: "/terms" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#011427] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo className="text-3xl" />

            <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
              The official digital platform of the Hunza Premier League.
              Follow teams, competitions, fixtures, results, standings,
              and the latest league updates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white">
              QUICK LINKS
            </h2>

            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-white/60 transition-colors hover:text-[#FF553D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white">
              INFORMATION
            </h2>

            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-white/60 transition-colors hover:text-[#FF553D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} Hunza Premier League. All rights reserved.
          </p>

          <p>
            HPL Official Platform
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;