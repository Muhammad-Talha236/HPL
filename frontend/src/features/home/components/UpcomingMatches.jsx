import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import PreviewState from "./PreviewState";
import { formatMatchTime } from "../utils/homeFormatters";

/*
|--------------------------------------------------------------------------
| CARD BACKGROUND IMAGES
|--------------------------------------------------------------------------
|
| Put your images here:
|
| frontend/public/images/matches/match-card-1.jpg
| frontend/public/images/matches/match-card-2.jpg
| frontend/public/images/matches/match-card-3.jpg
| frontend/public/images/matches/match-card-4.jpg
|
*/

const MATCH_BACKGROUNDS = [
  "/images/matches/match-card-1.jpg",
  "/images/matches/match-card-2.jpg",
  "/images/matches/match-card-3.jpg",
  "/images/matches/match-card-4.jpg",
];

/* =========================================================
   ICONS
========================================================= */

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-4 w-4 shrink-0 text-[#0B7A59]"
  >
    <path
      d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />

    <circle
      cx="12"
      cy="10"
      r="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const ArrowRightIcon = () => (
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

const ChevronLeft = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path
      d="m12 5-5 5 5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="h-4 w-4"
  >
    <path
      d="m8 5 5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* =========================================================
   DATE
========================================================= */

const getDateParts = (matchDate) => {
  if (!matchDate) {
    return {
      day: "--",
      monthYear: "",
      weekday: "",
    };
  }

  const date = new Date(matchDate);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      monthYear: "",
      weekday: "",
    };
  }

  return {
    day: String(date.getDate()).padStart(2, "0"),

    monthYear: date
      .toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      .toUpperCase(),

    weekday: date
      .toLocaleDateString("en-US", {
        weekday: "short",
      })
      .toUpperCase(),
  };
};

/* =========================================================
   TEAM LOGO
========================================================= */

const TeamLogo = ({ team }) => {
  if (team?.logo) {
    return (
      <img
        src={team.logo}
        alt={`${team.name || "Team"} logo`}
        className="
          h-[52px] w-[52px]
          object-contain
        "
      />
    );
  }

  return (
    <div
      className="
        grid h-[52px] w-[52px]
        place-items-center
        rounded-full
        bg-[#EEF5F1]
        text-sm font-black
        text-[#08634B]
      "
      aria-hidden="true"
    >
      {team?.name?.charAt(0)?.toUpperCase() || "T"}
    </div>
  );
};

/* =========================================================
   COMPETITION BADGE
========================================================= */

const CompetitionBadge = ({ match }) => {
  const competitionName =
    match.competition?.name || "Competition";

  return (
    <span
      title={competitionName}
      className="
        max-w-[155px]
        truncate
        rounded-full
        bg-[#F9E4F5]
        px-3 py-1.5
        text-[9px]
        font-bold
        text-[#B12B8C]
      "
    >
      {competitionName}
    </span>
  );
};

/* =========================================================
   MATCH CARD
========================================================= */

const UpcomingMatchCard = ({ match, index }) => {
  const date = getDateParts(match.match_date);

  const venueText = [
    match.venue?.name,
    match.venue?.city,
  ]
    .filter(Boolean)
    .join(", ");

  const backgroundImage =
    MATCH_BACKGROUNDS[
      index % MATCH_BACKGROUNDS.length
    ];

  return (
    <Link
      to={`/matches/${match.match_id}`}
      className="
        group
        block
        min-w-[260px]
        snap-start
        overflow-hidden
        rounded-[14px]
        border border-[#E0E6E3]
        bg-white
        shadow-[0_10px_30px_rgba(15,23,42,0.06)]
        transition-all
        duration-300

        hover:-translate-y-1
        hover:border-[#CADBD3]
        hover:shadow-[0_18px_40px_rgba(15,23,42,0.11)]

        focus:outline-none
        focus:ring-2
        focus:ring-[#16805E]/25

        sm:min-w-[290px]

        lg:min-w-0
        lg:w-[calc((100%-48px)/4)]
        lg:flex-[0_0_calc((100%-48px)/4)]
      "
    >
      {/* ===================================================
          IMAGE HEADER
      =================================================== */}

      <div
        className="
          relative
          h-[112px]
          overflow-hidden
          bg-[#082E27]
        "
      >
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="
            absolute inset-0
            h-full w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-105
          "
        />

        {/* Overlay */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-r
            from-[#031F1A]/90
            via-[#082E27]/55
            to-black/15
          "
        />

        {/* DATE */}
        <div
          className="
            absolute
            left-4 top-3
            z-10
            text-white
          "
        >
          <p
            className="
              text-[28px]
              font-black
              leading-none
              tracking-[-0.04em]
            "
          >
            {date.day}
          </p>

          <p
            className="
              mt-1.5
              text-[8px]
              font-extrabold
              tracking-[0.04em]
            "
          >
            {date.monthYear}
          </p>

          <p
            className="
              mt-1
              text-[8px]
              font-bold
              tracking-[0.08em]
              text-white/90
            "
          >
            {date.weekday}
          </p>
        </div>

        {/* COMPETITION */}
        <div
          className="
            absolute
            right-3 top-3
            z-10
          "
        >
          <CompetitionBadge match={match} />
        </div>
      </div>

      {/* ===================================================
          MATCH DETAILS
      =================================================== */}

      <div className="px-4 pb-4 pt-4">
        <div
          className="
            grid
            grid-cols-[1fr_72px_1fr]
            items-start
            gap-2
          "
        >
          {/* HOME */}
          <div
            className="
              flex min-w-0
              flex-col
              items-center
              text-center
            "
          >
            <TeamLogo team={match.home_team} />

            <p
              className="
                mt-2
                line-clamp-2
                min-h-[32px]
                text-[11px]
                font-extrabold
                leading-4
                text-[#101828]
              "
            >
              {match.home_team?.name || "Home Team"}
            </p>
          </div>

          {/* TIME */}
          <div
            className="
              flex
              min-h-[88px]
              flex-col
              items-center
              justify-center
            "
          >
            <p
              className="
                whitespace-nowrap
                text-[12px]
                font-black
                text-[#101828]
              "
            >
              {formatMatchTime(match.start_time)}
            </p>

            <span
              className="
                mt-2
                text-[9px]
                font-bold
                uppercase
                text-[#A1AAB5]
              "
            >
              VS
            </span>
          </div>

          {/* AWAY */}
          <div
            className="
              flex min-w-0
              flex-col
              items-center
              text-center
            "
          >
            <TeamLogo team={match.away_team} />

            <p
              className="
                mt-2
                line-clamp-2
                min-h-[32px]
                text-[11px]
                font-extrabold
                leading-4
                text-[#101828]
              "
            >
              {match.away_team?.name || "Away Team"}
            </p>
          </div>
        </div>

        {/* VENUE */}

        <div
          className="
            mt-3
            flex
            items-center
            gap-2
            border-t
            border-[#EDEFEF]
            pt-3
            text-[10px]
            font-medium
            text-[#68756F]
          "
        >
          <LocationIcon />

          <span className="truncate">
            {venueText || "Venue to be confirmed"}
          </span>
        </div>
      </div>
    </Link>
  );
};

/* =========================================================
   UPCOMING MATCHES
========================================================= */

const UpcomingMatches = ({ section }) => {
  const sliderRef = useRef(null);

  const [scrollPosition, setScrollPosition] =
    useState(0);

  if (
    section.status !== "success" ||
    section.data.length === 0
  ) {
    return (
      <PreviewState
        status={section.status}
        emptyMessage="No upcoming matches scheduled."
        errorMessage="Upcoming fixtures are unavailable right now."
      />
    );
  }

  /*
   * For now we intentionally show maximum 7 matches.
   */
  const matches = section.data.slice(0, 7);

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;

    const container = sliderRef.current;

    const firstCard =
      container.firstElementChild;

    if (!firstCard) return;

    const cardWidth =
      firstCard.getBoundingClientRect().width;

    const gap = 16;

    const amount = cardWidth + gap;

    container.scrollBy({
      left:
        direction === "next"
          ? amount
          : -amount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;

    setScrollPosition(
      sliderRef.current.scrollLeft
    );
  };

  const canGoPrevious =
    scrollPosition > 10;

  return (
    <div>
      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* HEADING */}

        <div>
          <h2
            className="
              text-xl
              font-extrabold
              tracking-[-0.02em]
              text-[#101828]

              sm:text-2xl
            "
          >
            Upcoming Matches
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-[#7A8580]
            "
          >
            Stay updated with upcoming fixtures
            across all tournaments.
          </p>
        </div>

        {/* ACTIONS */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <Link
            to="/matches"
            className="
              inline-flex
              min-h-[40px]
              items-center
              justify-center
              gap-2
              rounded-full
              border
              border-[#DCE3DF]
              bg-white
              px-5
              text-[11px]
              font-extrabold
              text-[#18201D]
              shadow-[0_4px_12px_rgba(15,23,42,0.06)]
              transition-all

              hover:border-[#BBD2C8]
              hover:text-[#08664D]

              focus:outline-none
              focus:ring-2
              focus:ring-[#16805E]/25
            "
          >
            View All Matches

            <ArrowRightIcon />
          </Link>

          {/* PREVIOUS */}

          <button
            type="button"
            onClick={() =>
              scrollSlider("previous")
            }
            disabled={!canGoPrevious}
            aria-label="Previous upcoming matches"
            className="
              grid
              h-[40px] w-[40px]
              place-items-center
              rounded-full
              border
              border-[#DCE3DF]
              bg-white
              text-[#748079]
              transition-all

              hover:border-[#0B7658]
              hover:text-[#0B7658]

              disabled:cursor-not-allowed
              disabled:opacity-40

              focus:outline-none
              focus:ring-2
              focus:ring-[#16805E]/25
            "
          >
            <ChevronLeft />
          </button>

          {/* NEXT */}

          <button
            type="button"
            onClick={() =>
              scrollSlider("next")
            }
            aria-label="Next upcoming matches"
            className="
              grid
              h-[40px] w-[40px]
              place-items-center
              rounded-full
              bg-[#07664C]
              text-white
              shadow-[0_7px_18px_rgba(7,102,76,0.20)]
              transition-all

              hover:bg-[#05543F]

              focus:outline-none
              focus:ring-2
              focus:ring-[#16805E]/30
            "
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* ===================================================
          MATCH SLIDER
      =================================================== */}

      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="
          flex
          snap-x
          snap-mandatory
          gap-4
          overflow-x-auto
          scroll-smooth
          pb-3

          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {matches.map((match, index) => (
          <UpcomingMatchCard
            key={match.match_id}
            match={match}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingMatches;