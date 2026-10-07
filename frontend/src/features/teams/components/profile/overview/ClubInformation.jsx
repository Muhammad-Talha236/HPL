import {
  CalendarDays,
  Circle,
  Globe,
  MapPin,
  Shield,
  Trophy,
} from "lucide-react";

import {
  formatTeamGender,
  getTeamLocation,
} from "../../../utils/teamFormatters";

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

const getFoundedYear = (team) => {
  return (
    team?.founded_year ||
    team?.founded ||
    team?.club?.founded_year ||
    "Not available"
  );
};

/* =========================================================
   INFORMATION ROW
========================================================= */

const InformationRow = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="grid grid-cols-[18px_92px_minmax(0,1fr)] items-start gap-2.5">
      <Icon
        size={15}
        strokeWidth={1.8}
        className="mt-[2px] shrink-0 text-[#64748b]"
      />

      <span className="text-[12px] font-medium leading-5 text-[#718096]">
        {label}
      </span>

      <span
        title={String(value)}
        className="min-w-0 break-words text-[12px] font-semibold leading-5 text-[#13233c]"
      >
        {value}
      </span>
    </div>
  );
};

/* =========================================================
   COLOR PREVIEW
========================================================= */

const TeamColors = () => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-3.5 w-3.5 rounded-full bg-[#07182d]" />

      <span className="h-3.5 w-3.5 rounded-full bg-[#e7a324]" />

      <span className="h-3.5 w-3.5 rounded-full border border-[#d9e0e6] bg-white" />
    </div>
  );
};

/* =========================================================
   CLUB INFORMATION
========================================================= */

const ClubInformation = ({ team }) => {
  const location =
    getTeamLocation(team) ||
    team?.city ||
    "Not available";

  const competition =
    team?.competition?.name ||
    team?.club?.name ||
    "Hunza Premier League";

  const stadium =
    team?.home_venue?.name ||
    team?.homeVenue?.name ||
    "Not available";

  const website =
    team?.website ||
    team?.club?.website ||
    null;

  const rows = [
    {
      icon: Shield,
      label: "Full Name",
      value: team?.name || "Not available",
    },
    {
      icon: Shield,
      label: "Gender",
      value:
        formatTeamGender(team?.gender) ||
        "Not available",
    },
    {
      icon: CalendarDays,
      label: "Founded",
      value: getFoundedYear(team),
    },
    {
      icon: MapPin,
      label: "Location",
      value: location,
    },
    {
      icon: Trophy,
      label: "Competition",
      value: competition,
    },
    {
      icon: Circle,
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
        h-full
        rounded-lg
        border
        border-[#e1e8e5]
        bg-white
        p-4
        shadow-[0_3px_12px_rgba(15,23,42,0.035)]
      "
    >
      {/* ================================================
          HEADING
      ================================================= */}

      <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[#07182d]">
        Club Information
      </h2>

      <span className="mt-2 block h-[2px] w-7 bg-[#e4a42b]" />

      {/* ================================================
          INFORMATION
      ================================================= */}

      <div className="mt-4 space-y-[10px]">
        {rows.map((row) => (
          <InformationRow
            key={row.label}
            {...row}
          />
        ))}

        {/* Team colors */}

        <div className="grid grid-cols-[18px_92px_minmax(0,1fr)] items-center gap-2.5">
          <Circle
            size={15}
            strokeWidth={1.8}
            className="text-[#64748b]"
          />

          <span className="text-[12px] font-medium leading-5 text-[#718096]">
            Colors
          </span>

          <TeamColors />
        </div>

        {/* Website */}

        <div className="grid grid-cols-[18px_92px_minmax(0,1fr)] items-start gap-2.5">
          <Globe
            size={15}
            strokeWidth={1.8}
            className="mt-[2px] text-[#64748b]"
          />

          <span className="text-[12px] font-medium leading-5 text-[#718096]">
            Website
          </span>

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="
                min-w-0
                truncate
                text-[12px]
                font-semibold
                leading-5
                text-[#078052]
                transition
                hover:underline
              "
            >
              {website}
            </a>
          ) : (
            <span className="text-[12px] font-semibold leading-5 text-[#13233c]">
              Not available
            </span>
          )}
        </div>
      </div>

      {/* ================================================
          SOCIAL MEDIA
      ================================================= */}

      <div className="mt-5 border-t border-[#edf1ef] pt-4">
        <h3 className="text-[13px] font-extrabold text-[#07182d]">
          Social Media
        </h3>

        <div className="mt-3 flex items-center gap-3">
          {/* Facebook */}

          <button
            type="button"
            aria-label="Facebook"
            className="
              grid
              h-8
              w-8
              place-items-center
              rounded-full
              bg-[#edf3f7]
              text-[13px]
              font-black
              text-[#4267B2]
              transition
              hover:-translate-y-0.5
            "
          >
            f
          </button>

          {/* Instagram */}

          <button
            type="button"
            aria-label="Instagram"
            className="
              grid
              h-8
              w-8
              place-items-center
              rounded-full
              bg-[#fff0f4]
              text-[11px]
              font-black
              text-[#E1306C]
              transition
              hover:-translate-y-0.5
            "
          >
            ◎
          </button>

          {/* X */}

          <button
            type="button"
            aria-label="X"
            className="
              grid
              h-8
              w-8
              place-items-center
              rounded-full
              bg-[#f1f3f5]
              text-[12px]
              font-bold
              text-black
              transition
              hover:-translate-y-0.5
            "
          >
            X
          </button>

          {/* YouTube */}

          <button
            type="button"
            aria-label="YouTube"
            className="
              grid
              h-8
              w-8
              place-items-center
              rounded-full
              bg-[#fff0f0]
              text-[10px]
              font-black
              text-[#ff0000]
              transition
              hover:-translate-y-0.5
            "
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClubInformation;