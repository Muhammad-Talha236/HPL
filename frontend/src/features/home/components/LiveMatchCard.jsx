import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   LIVE TIMER
========================================================= */

const getElapsedMinutes = (startedAt) => {
  if (!startedAt) return 0;

  const start = new Date(startedAt).getTime();

  if (Number.isNaN(start)) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - start) / 60000)
  );
};

/* =========================================================
   ICONS
========================================================= */

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-[18px] w-[18px] shrink-0 text-[#11805F]"
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
          h-[58px] w-[58px]
          shrink-0 object-contain
          sm:h-[64px] sm:w-[64px]
        "
      />
    );
  }

  return (
    <div
      className="
        grid h-[58px] w-[58px]
        shrink-0 place-items-center
        rounded-full bg-[#EEF5F1]
        text-lg font-black text-[#09634B]
        sm:h-[64px] sm:w-[64px]
      "
      aria-hidden="true"
    >
      {team?.name?.charAt(0)?.toUpperCase() || "T"}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const LiveMatchCard = ({ match, status }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(() =>
    getElapsedMinutes(match?.started_at)
  );

  useEffect(() => {
    if (!match?.started_at || match?.status !== "LIVE") {
      return undefined;
    }

    const updateTimer = () => {
      setElapsedMinutes(getElapsedMinutes(match.started_at));
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 30000);

    return () => window.clearInterval(interval);
  }, [match?.started_at, match?.status]);

  const matchPeriod = useMemo(() => {
    if (elapsedMinutes <= 45) return "1st Half";
    if (elapsedMinutes <= 90) return "2nd Half";
    return "Extra Time";
  }, [elapsedMinutes]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (status === "loading") {
    return (
      <div
        className="
          mx-auto h-[185px]
          w-full max-w-[1180px]
          animate-pulse
          rounded-[18px]
          border border-[#E5EAE7]
          bg-white
          shadow-[0_18px_50px_rgba(15,23,42,0.10)]
        "
      />
    );
  }

  /*
   * Never display fake live match data.
   */
  if (!match || match.status !== "LIVE") {
    return null;
  }

  /* =======================================================
     DATA
  ======================================================= */

  const competitionName =
    match.competition?.name || "Hunza Premier League";

  const seasonName = match.season?.name;

  const venueText = [
    match.venue?.name,
    match.venue?.city,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className="
        relative mx-auto
        w-full max-w-[1180px]
        overflow-hidden
        rounded-[18px]
        border border-[#E3E9E6]
        bg-white
        shadow-[0_20px_55px_rgba(15,23,42,0.13)]
      "
    >
      {/* ===================================================
          SMALL GREEN TOP ACCENT
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute left-0 top-0
          h-[3px] w-full
          bg-[#14825F]
        "
      />

      {/* ===================================================
          MOBILE HEADER
      =================================================== */}

      <div
        className="
          flex items-center justify-between
          border-b border-[#EDF1EF]
          px-5 py-3
          lg:hidden
        "
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#E71928]" />

          <span className="text-sm font-extrabold text-[#111827]">
            Live Match
          </span>
        </div>

        <span
          className="
            rounded-full bg-[#E71928]
            px-3 py-1
            text-[10px] font-extrabold
            tracking-wide text-white
          "
        >
          LIVE
        </span>
      </div>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div
        className="
          grid
          lg:grid-cols-[260px_minmax(0,1fr)_235px]
        "
      >
        {/* =================================================
            LEFT — COMPETITION
        ================================================= */}

        <div
          className="
            relative hidden
            min-h-[178px]
            overflow-hidden
            border-r border-[#E8ECEA]
            lg:flex
            lg:flex-col
            lg:justify-center
            lg:px-7
          "
        >
          {/* Background decoration */}
          <div
            aria-hidden="true"
            className="
              absolute inset-0
              bg-gradient-to-br
              from-[#073C30]
              via-[#0B5B45]
              to-[#142E29]
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              -bottom-16 -right-10
              h-[180px] w-[180px]
              rounded-full
              border-[30px]
              border-white/5
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute
              -left-14 -top-14
              h-[150px] w-[150px]
              rounded-full
              bg-white/[0.04]
            "
          />

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-2">
              <span
                className="
                  h-2.5 w-2.5
                  animate-pulse
                  rounded-full
                  bg-[#FF3347]
                  shadow-[0_0_0_4px_rgba(255,51,71,0.15)]
                "
              />

              <span
                className="
                  text-[11px]
                  font-extrabold
                  uppercase
                  tracking-[0.12em]
                  text-white
                "
              >
                Live Match
              </span>
            </div>

            <p
              className="
                text-[18px]
                font-extrabold
                leading-snug
                text-white
              "
            >
              {competitionName}
            </p>

            {seasonName && (
              <p
                className="
                  mt-2 text-sm
                  font-medium
                  text-white/75
                "
              >
                {seasonName}
              </p>
            )}
          </div>
        </div>

        {/* =================================================
            CENTER — SCORE
        ================================================= */}

        <div
          className="
            flex min-w-0
            flex-col justify-center
            px-5 py-6
            sm:px-7
            lg:px-8
            lg:py-5
          "
        >
          {/* LIVE BADGE */}
          <div className="mb-3 hidden justify-center lg:flex">
            <span
              className="
                inline-flex items-center gap-1.5
                rounded-full
                bg-[#E71928]
                px-3 py-1
                text-[10px]
                font-extrabold
                uppercase
                tracking-wide
                text-white
              "
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />

              Live
            </span>
          </div>

          {/* TEAMS + SCORE */}
          <div
            className="
              grid items-center
              gap-4
              md:grid-cols-[1fr_auto_1fr]
            "
          >
            {/* HOME TEAM */}
            <div
              className="
                flex items-center
                justify-center gap-3
                md:justify-end
              "
            >
              <TeamLogo team={match.home_team} />

              <p
                className="
                  max-w-[150px]
                  text-right
                  text-sm font-extrabold
                  leading-tight
                  text-[#111827]
                  sm:text-base
                "
              >
                {match.home_team?.name || "Home Team"}
              </p>
            </div>

            {/* SCORE */}
            <div
              className="
                flex min-w-[130px]
                items-center
                justify-center
                gap-3
                text-[35px]
                font-black
                tracking-[-0.04em]
                text-[#080D12]
                sm:text-[42px]
              "
            >
              <span>{match.home_score ?? 0}</span>

              <span
                className="
                  text-[20px]
                  font-bold
                  text-[#111827]
                "
              >
                -
              </span>

              <span>{match.away_score ?? 0}</span>
            </div>

            {/* AWAY TEAM */}
            <div
              className="
                flex items-center
                justify-center gap-3
                md:justify-start
              "
            >
              <p
                className="
                  max-w-[150px]
                  text-left
                  text-sm font-extrabold
                  leading-tight
                  text-[#111827]
                  sm:text-base
                "
              >
                {match.away_team?.name || "Away Team"}
              </p>

              <TeamLogo team={match.away_team} />
            </div>
          </div>

          {/* PERIOD / TIMER */}
          <div
            className="
              mt-4 flex
              items-center
              justify-center
              gap-2
            "
          >
            <span
              className="
                rounded-md
                bg-[#F1F4F2]
                px-3 py-1
                text-[11px]
                font-bold
                text-[#34423C]
              "
            >
              {matchPeriod}
            </span>

            <span className="text-[#C1C7C4]">•</span>

            <span
              className="
                rounded-md
                bg-[#E9F8EF]
                px-3 py-1
                text-[12px]
                font-extrabold
                text-[#149555]
              "
            >
              {elapsedMinutes}'
            </span>
          </div>
        </div>

        {/* =================================================
            RIGHT — MATCH INFO
        ================================================= */}

        <div
          className="
            flex flex-col
            justify-center
            border-t border-[#E8ECEA]
            px-5 py-5
            sm:px-7
            lg:border-l
            lg:border-t-0
            lg:px-6
          "
        >
          {venueText && (
            <div
              className="
                flex items-start
                gap-3
                text-sm
                font-semibold
                leading-5
                text-[#34423C]
              "
            >
              <LocationIcon />

              <span>{venueText}</span>
            </div>
          )}

          <Link
            to={`/matches/${match.match_id}`}
            className="
              mt-5
              inline-flex
              min-h-[40px]
              items-center
              justify-center
              gap-2
              rounded-full
              border border-[#14825F]
              px-5
              text-xs
              font-extrabold
              text-[#0C664D]
              transition-all
              duration-200
              hover:bg-[#0C664D]
              hover:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-[#14825F]/25
            "
          >
            Match Details

            <ArrowIcon />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default LiveMatchCard;