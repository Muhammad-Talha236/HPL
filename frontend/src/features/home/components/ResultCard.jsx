import { Link } from "react-router-dom";

import { formatMatchDate } from "../utils/homeFormatters";

/* ---------------- Icons ---------------- */

const TrophyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-5 w-5 shrink-0 text-[#F5B51B]"
  >
    <path
      d="M8 4h8v4c0 3-1.8 5-4 5s-4-2-4-5V4Z"
      fill="currentColor"
    />
    <path
      d="M8 6H5v1c0 2.2 1.3 3.7 3.4 4M16 6h3v1c0 2.2-1.3 3.7-3.4 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M12 13v4M9 20h6M10 17h4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-4 w-4 shrink-0 text-[#16805E]"
  >
    <path
      d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <circle
      cx="12"
      cy="10"
      r="2"
      stroke="currentColor"
      strokeWidth="1.7"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path
      d="M4 10h11M11 6l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------------- Team Logo ---------------- */

const TeamLogo = ({ team }) => {
  if (team?.logo) {
    return (
      <img
        src={team.logo}
        alt={`${team.name || "Team"} logo`}
        className="
          h-10 w-10 shrink-0
          object-contain
          sm:h-11 sm:w-11
        "
      />
    );
  }

  return (
    <div
      className="
        grid h-10 w-10 shrink-0
        place-items-center
        rounded-full
        bg-[#EEF5F1]
        text-sm font-extrabold
        text-[#086247]
        sm:h-11 sm:w-11
      "
      aria-hidden="true"
    >
      {team?.name?.charAt(0)?.toUpperCase() || "T"}
    </div>
  );
};

/* ---------------- Helpers ---------------- */

const getDateParts = (dateValue) => {
  if (!dateValue) {
    return {
      day: "--",
      month: "---",
      year: "",
      weekday: "",
    };
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "---",
      year: "",
      weekday: "",
    };
  }

  return {
    day: new Intl.DateTimeFormat("en", {
      day: "2-digit",
    }).format(date),

    month: new Intl.DateTimeFormat("en", {
      month: "short",
    })
      .format(date)
      .toUpperCase(),

    year: new Intl.DateTimeFormat("en", {
      year: "numeric",
    }).format(date),

    weekday: new Intl.DateTimeFormat("en", {
      weekday: "short",
    })
      .format(date)
      .toUpperCase(),
  };
};

/* ---------------- Result Card ---------------- */

const ResultCard = ({ match, index = 0 }) => {
  const date = getDateParts(match.match_date);

  const venueText = [match.venue?.name, match.venue?.city]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      to={`/matches/${match.match_id}`}
      className="
        group grid min-h-[82px]
        overflow-hidden
        rounded-[14px]
        border border-[#E5EAE7]
        bg-white
        transition-all duration-200

        hover:border-[#CAD8D1]
        hover:shadow-[0_8px_25px_rgba(15,23,42,0.06)]

        focus:outline-none
        focus:ring-2
        focus:ring-[#16805E]/20

        lg:grid-cols-[92px_175px_minmax(190px,1fr)_105px_minmax(190px,1fr)_110px_minmax(190px,1fr)_135px]
        lg:items-center
      "
    >
      {/* Date */}
      <div
        className={`
          flex items-center gap-3
          px-4 py-3
          lg:h-full
          lg:flex-col
          lg:items-start
          lg:justify-center
          lg:gap-0
          lg:px-5

          ${
            index === 0
              ? "bg-[#0D1E32] text-white"
              : "bg-[#F3F6F8] text-[#142033]"
          }
        `}
      >
        <span className="text-2xl font-extrabold leading-none">
          {date.day}
        </span>

        <div className="flex gap-1 lg:mt-1 lg:block">
          <span className="text-[9px] font-bold">
            {date.month}
          </span>

          <span className="text-[9px] font-bold">
            {date.year}
          </span>
        </div>

        <span
          className={`
            ml-auto text-[9px] font-semibold
            lg:ml-0 lg:mt-1

            ${
              index === 0
                ? "text-white/65"
                : "text-[#667085]"
            }
          `}
        >
          {date.weekday}
        </span>
      </div>

      {/* Competition */}
      <div
        className="
          flex min-w-0 items-center
          gap-3 border-b border-[#EEF1EF]
          px-4 py-3
          lg:border-b-0
          lg:border-r
        "
      >
        <TrophyIcon />

        <p
          className="
            line-clamp-2
            text-[11px] font-semibold
            leading-4 text-[#344054]
          "
        >
          {match.competition?.name || "HPL"}
        </p>
      </div>

      {/* Home Team */}
      <div
        className="
          flex min-w-0 items-center
          gap-3 px-4 py-3
        "
      >
        <TeamLogo team={match.home_team} />

        <p
          className="
            truncate
            text-sm font-bold
            text-[#17211D]
          "
        >
          {match.home_team?.name || "Home Team"}
        </p>
      </div>

      {/* Score */}
      <div
        className="
          flex items-center justify-center
          gap-2 px-3 py-3
        "
      >
        <span
          className="
            grid min-w-[36px]
            place-items-center
            rounded-md
            bg-[#F0F3F6]
            px-2 py-1.5
            text-xl font-extrabold
            text-[#162237]
          "
        >
          {match.home_score ?? 0}
        </span>

        <span className="font-bold text-[#667085]">
          -
        </span>

        <span
          className="
            grid min-w-[36px]
            place-items-center
            rounded-md
            bg-[#F0F3F6]
            px-2 py-1.5
            text-xl font-extrabold
            text-[#162237]
          "
        >
          {match.away_score ?? 0}
        </span>
      </div>

      {/* Away Team */}
      <div
        className="
          flex min-w-0 items-center
          gap-3
          border-b border-[#EEF1EF]
          px-4 py-3
          lg:border-b-0
          lg:border-r
        "
      >
        <TeamLogo team={match.away_team} />

        <p
          className="
            truncate
            text-sm font-bold
            text-[#17211D]
          "
        >
          {match.away_team?.name || "Away Team"}
        </p>
      </div>

      {/* Status */}
      <div
        className="
          flex items-center justify-center
          px-4 py-3
        "
      >
        <span
          className="
            rounded-full
            bg-[#EAF7F1]
            px-4 py-1.5
            text-[10px] font-bold
            text-[#087554]
          "
        >
          Full Time
        </span>
      </div>

      {/* Venue */}
      <div
        className="
          flex min-w-0 items-center
          gap-2
          border-b border-[#EEF1EF]
          px-4 py-3
          lg:border-b-0
          lg:border-l
        "
      >
        <LocationIcon />

        <span
          className="
            truncate
            text-[11px]
            text-[#7A8580]
          "
        >
          {venueText || "Venue to be confirmed"}
        </span>
      </div>

      {/* Details */}
      <div
        className="
          flex items-center
          justify-between
          px-4 py-3
          lg:justify-end
          lg:gap-3
        "
      >
        <span
          className="
            text-[11px] font-bold
            text-[#17211D]
          "
        >
          Match Details
        </span>

        <span
          className="
            text-[#087554]
            transition-transform duration-200
            group-hover:translate-x-1
          "
        >
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
};

export default ResultCard;