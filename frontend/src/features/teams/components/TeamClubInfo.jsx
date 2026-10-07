import {
  CircleDot,
  Flag,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trophy,
} from "lucide-react";

import {
  formatTeamGender,
  getTeamLocation,
} from "../utils/teamFormatters";

/* =========================================================
   HELPERS
========================================================= */

const formatTeamType = (value) => {
  if (!value) return "Not available";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

/* =========================================================
   INFO ROW
========================================================= */

const InfoRow = ({ icon: Icon, label, value }) => {
  return (
    <div
      className="
        grid
        grid-cols-[20px_120px_minmax(0,1fr)]
        items-start
        gap-3
      "
    >
      {/* Icon */}
      <Icon
        size={17}
        strokeWidth={1.8}
        className="mt-[3px] shrink-0 text-[#65758e]"
      />

      {/* Label */}
      <span
        className="
          text-[14px]
          font-medium
          leading-6
          text-[#718096]
        "
      >
        {label}
      </span>

      {/* Value */}
      <span
        title={String(value)}
        className="
          min-w-0
          break-words
          text-[14px]
          font-semibold
          leading-6
          text-[#13233c]
        "
      >
        {value}
      </span>
    </div>
  );
};

/* =========================================================
   TEAM CLUB INFO
========================================================= */

const TeamClubInfo = ({ team }) => {
  const location =
    getTeamLocation(team) ||
    team?.city ||
    "Not available";

  const clubName =
    team?.club?.name ||
    "Hunza Premier League";

  const stadium =
    team?.home_venue?.name ||
    team?.homeVenue?.name ||
    "Not available";

  const rows = [
    {
      icon: Shield,
      label: "Full Name",
      value: team?.name || "Not available",
    },
    {
      icon: Flag,
      label: "Gender",
      value:
        formatTeamGender(team?.gender) ||
        "Not available",
    },
    {
      icon: MapPin,
      label: "Location",
      value: location,
    },
    {
      icon: Trophy,
      label: "Competition",
      value: clubName,
    },
    {
      icon: CircleDot,
      label: "Team Type",
      value: formatTeamType(team?.team_type),
    },
    {
      icon: MapPin,
      label: "Stadium",
      value: stadium,
    },
  ];

  return (
    <section
      className="
        h-fit
        rounded-xl
        border
        border-[#dfe6e3]
        bg-white
        px-6
        pb-6
        pt-5
        shadow-[0_5px_18px_rgba(15,23,42,0.045)]
      "
    >
      {/* =========================
          HEADING
      ========================== */}

      <h2
        className="
          text-[20px]
          font-extrabold
          tracking-[-0.02em]
          text-[#07182d]
        "
      >
        Club Info
      </h2>

      {/* =========================
          BASIC INFORMATION
      ========================== */}

      <div className="mt-5 space-y-[15px]">
        {rows.map((row) => (
          <InfoRow
            key={row.label}
            {...row}
          />
        ))}
      </div>

      {/* =========================
          OPTIONAL CONTACT DETAILS
      ========================== */}

      {(team?.contact_phone ||
        team?.contact_email) && (
        <div
          className="
            mt-5
            space-y-[15px]
            border-t
            border-[#edf1ef]
            pt-5
          "
        >
          {/* Phone */}

          {team?.contact_phone && (
            <div
              className="
                grid
                grid-cols-[20px_120px_minmax(0,1fr)]
                items-start
                gap-3
              "
            >
              <Phone
                size={17}
                strokeWidth={1.8}
                className="mt-[3px] shrink-0 text-[#65758e]"
              />

              <span
                className="
                  text-[14px]
                  font-medium
                  leading-6
                  text-[#718096]
                "
              >
                Contact
              </span>

              <a
                href={`tel:${team.contact_phone}`}
                className="
                  min-w-0
                  break-words
                  text-[14px]
                  font-semibold
                  leading-6
                  text-[#13233c]
                  transition-colors
                  hover:text-[#078052]
                "
              >
                {team.contact_phone}
              </a>
            </div>
          )}

          {/* Email */}

          {team?.contact_email && (
            <div
              className="
                grid
                grid-cols-[20px_120px_minmax(0,1fr)]
                items-start
                gap-3
              "
            >
              <Mail
                size={17}
                strokeWidth={1.8}
                className="mt-[3px] shrink-0 text-[#65758e]"
              />

              <span
                className="
                  text-[14px]
                  font-medium
                  leading-6
                  text-[#718096]
                "
              >
                Email
              </span>

              <a
                href={`mailto:${team.contact_email}`}
                className="
                  min-w-0
                  break-all
                  text-[14px]
                  font-semibold
                  leading-6
                  text-[#078052]
                  transition-colors
                  hover:text-[#055f3e]
                "
              >
                {team.contact_email}
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default TeamClubInfo;