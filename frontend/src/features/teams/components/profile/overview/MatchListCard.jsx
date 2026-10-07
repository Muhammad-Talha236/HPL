import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Trophy,
} from "lucide-react";

import logo from "../../../../../assets/logo.png";

/* =========================================================
   HELPERS
========================================================= */

const getMatchDateValue = (match) => {
  return (
    match?.match_date ||
    match?.matchDate ||
    match?.scheduled_at ||
    match?.scheduledAt ||
    null
  );
};

const formatDate = (value) => {
  if (!value) {
    return {
      day: "--",
      month: "TBA",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "TBA",
    };
  }

  return {
    day: String(date.getDate()).padStart(2, "0"),

    month: date
      .toLocaleDateString("en-GB", {
        month: "short",
      })
      .toUpperCase(),
  };
};

const formatTime = (match) => {
  const value =
    match?.start_time ||
    match?.startTime ||
    getMatchDateValue(match);

  if (!value) return "TBA";

  if (
    typeof value === "string" &&
    /^\d{2}:\d{2}/.test(value)
  ) {
    const [hours, minutes] = value.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getTeam = (match, side) => {
  if (side === "home") {
    return (
      match?.home_team ||
      match?.homeTeam ||
      match?.home_team_data ||
      {}
    );
  }

  return (
    match?.away_team ||
    match?.awayTeam ||
    match?.away_team_data ||
    {}
  );
};

const getVenue = (match) => {
  return (
    match?.venue?.name ||
    match?.Venue?.name ||
    match?.venue_name ||
    "Venue TBA"
  );
};

const getResult = (match, currentTeamId) => {
  const homeScore = Number(match?.home_score ?? 0);
  const awayScore = Number(match?.away_score ?? 0);

  if (homeScore === awayScore) {
    return "DRAW";
  }

  const homeTeamId =
    match?.home_team_id ??
    match?.homeTeamId ??
    getTeam(match, "home")?.team_id;

  const currentIsHome =
    String(homeTeamId) === String(currentTeamId);

  const currentScore = currentIsHome
    ? homeScore
    : awayScore;

  const opponentScore = currentIsHome
    ? awayScore
    : homeScore;

  return currentScore > opponentScore ? "WIN" : "LOSS";
};

const resultStyles = {
  WIN: "bg-[#dcf5e9] text-[#078052]",
  DRAW: "bg-[#eef1f5] text-[#64748b]",
  LOSS: "bg-[#fde9e7] text-[#d34d43]",
};

/* =========================================================
   TEAM LOGO
========================================================= */

const MatchTeamLogo = ({ team }) => {
  return (
    <img
      src={team?.logo || logo}
      alt={team?.name || "Team"}
      className="
        h-[30px]
        w-[30px]
        shrink-0
        object-contain
        sm:h-[32px]
        sm:w-[32px]
      "
      onError={(event) => {
        event.currentTarget.src = logo;
      }}
    />
  );
};

/* =========================================================
   MATCH ROW
========================================================= */

const MatchRow = ({
  match,
  currentTeamId,
  type,
}) => {
  const homeTeam = getTeam(match, "home");
  const awayTeam = getTeam(match, "away");

  const date = formatDate(getMatchDateValue(match));
  const venue = getVenue(match);

  const result =
    type === "recent"
      ? getResult(match, currentTeamId)
      : null;

  return (
    <article
      className="
        grid
        grid-cols-[52px_minmax(0,1fr)]
        gap-3
        border-b
        border-[#e8eeeb]
        py-3.5
        last:border-b-0
        sm:grid-cols-[56px_minmax(0,1fr)]
        sm:gap-4
        xl:py-4
      "
    >
      {/* DATE */}
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          border-r
          border-[#e4ebe7]
          pr-3
          text-center
        "
      >
        <span
          className="
            text-[19px]
            font-bold
            leading-none
            tracking-[-0.03em]
            text-[#07182d]
            sm:text-[20px]
          "
        >
          {date.day}
        </span>

        <span
          className="
            mt-1.5
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-[#8794a7]
            sm:text-[10px]
          "
        >
          {date.month}
        </span>
      </div>

      {/* MATCH */}
      <div className="min-w-0">
        <div
          className="
            grid
            min-w-0
            grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
            items-center
            gap-2
            sm:gap-3
          "
        >
          {/* HOME */}
          <div
            className="
              flex
              min-w-0
              items-center
              gap-2
            "
          >
            <MatchTeamLogo team={homeTeam} />

            <span
              title={homeTeam?.name}
              className="
                min-w-0
                truncate
                text-[13px]
                font-semibold
                text-[#14243c]
                sm:text-[14px]
              "
            >
              {homeTeam?.name || "Home Team"}
            </span>
          </div>

          {/* SCORE / VS */}
          <div className="shrink-0 px-1 text-center">
            {type === "recent" ? (
              <span
                className="
                  whitespace-nowrap
                  text-[15px]
                  font-bold
                  text-[#07182d]
                  sm:text-[16px]
                "
              >
                {match?.home_score ?? 0}
                {" - "}
                {match?.away_score ?? 0}
              </span>
            ) : (
              <span
                className="
                  text-[11px]
                  font-semibold
                  uppercase
                  text-[#8a96a8]
                  sm:text-[12px]
                "
              >
                VS
              </span>
            )}
          </div>

          {/* AWAY */}
          <div
            className="
              flex
              min-w-0
              items-center
              justify-end
              gap-2
            "
          >
            <span
              title={awayTeam?.name}
              className="
                min-w-0
                truncate
                text-right
                text-[13px]
                font-semibold
                text-[#14243c]
                sm:text-[14px]
              "
            >
              {awayTeam?.name || "Away Team"}
            </span>

            <MatchTeamLogo team={awayTeam} />
          </div>
        </div>

        {/* META */}
        <div
          className="
            mt-2
            flex
            min-w-0
            flex-wrap
            items-center
            justify-between
            gap-2
          "
        >
          <div
            className="
              flex
              min-w-0
              flex-wrap
              items-center
              gap-x-3
              gap-y-1
              text-[11px]
              text-[#7b8aa0]
              sm:text-[12px]
            "
          >
            <span
              className="
                inline-flex
                min-w-0
                items-center
                gap-1.5
              "
            >
              <MapPin
                size={13}
                strokeWidth={1.8}
                className="shrink-0"
              />

              <span className="truncate">
                {venue}
              </span>
            </span>

            {type === "upcoming" && (
              <span
                className="
                  inline-flex
                  shrink-0
                  items-center
                  gap-1.5
                "
              >
                <Clock3
                  size={13}
                  strokeWidth={1.8}
                />

                {formatTime(match)}
              </span>
            )}
          </div>

          {type === "recent" && (
            <span
              className={`
                shrink-0
                rounded-full
                px-3
                py-1
                text-[9px]
                font-semibold
                sm:text-[10px]
                ${resultStyles[result]}
              `}
            >
              {result}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

/* =========================================================
   EMPTY
========================================================= */

const EmptyMatches = ({ type }) => {
  return (
    <div
      className="
        flex
        min-h-[140px]
        flex-col
        items-center
        justify-center
        px-5
        text-center
      "
    >
      {type === "recent" ? (
        <Trophy
          size={30}
          strokeWidth={1.5}
          className="text-[#a3aea9]"
        />
      ) : (
        <CalendarDays
          size={30}
          strokeWidth={1.5}
          className="text-[#a3aea9]"
        />
      )}

      <p
        className="
          mt-3
          text-[12px]
          text-[#718096]
          sm:text-[13px]
        "
      >
        {type === "recent"
          ? "No completed matches available yet."
          : "No upcoming matches scheduled yet."}
      </p>
    </div>
  );
};

/* =========================================================
   CARD
========================================================= */

const MatchListCard = ({
  title,
  state,
  currentTeamId,
  type = "recent",
  onViewAll,
}) => {
  const matches =
    state?.status === "success"
      ? state.data.slice(0, 3)
      : [];

  return (
    <section
      className="
        overflow-hidden
        rounded-xl
        border
        border-[#dde6e2]
        bg-white
        px-5
        py-4
        shadow-[0_4px_16px_rgba(15,23,42,0.035)]
        sm:px-6
        sm:py-5
      "
    >
      {/* HEADER */}
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <h2
            className="
              text-[18px]
              font-bold
              tracking-[-0.025em]
              text-[#07182d]
              sm:text-[19px]
              lg:text-[20px]
            "
          >
            {title}
          </h2>

          <span
            className="
              mt-2
              block
              h-[2px]
              w-9
              bg-[#e5a329]
            "
          />
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="
              group/view
              mt-0.5
              inline-flex
              cursor-pointer
              items-center
              gap-1.5
              rounded-md
              px-2
              py-1.5
              text-[11px]
              font-semibold
              text-[#078052]
              transition-all
              duration-200
              hover:bg-[#edf8f4]
              hover:text-[#055f3e]
              focus:outline-none
              focus:ring-2
              focus:ring-[#078052]/20
              sm:text-[12px]
            "
          >
            View All

            <ArrowRight
              size={14}
              strokeWidth={1.8}
              className="
                transition-transform
                duration-200
                group-hover/view:translate-x-1
              "
            />
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div className="mt-2">
        {state?.status === "loading" && (
          <div
            className="
              flex
              min-h-[140px]
              items-center
              justify-center
              text-[12px]
              text-[#718096]
            "
          >
            Loading matches…
          </div>
        )}

        {state?.status === "error" && (
          <div
            className="
              flex
              min-h-[140px]
              items-center
              justify-center
              px-5
              text-center
              text-[12px]
              text-[#b4534b]
            "
          >
            Match information is unavailable right now.
          </div>
        )}

        {state?.status === "success" &&
          matches.length === 0 && (
            <EmptyMatches type={type} />
          )}

        {state?.status === "success" &&
          matches.length > 0 &&
          matches.map((match) => (
            <MatchRow
              key={match.match_id}
              match={match}
              currentTeamId={currentTeamId}
              type={type}
            />
          ))}
      </div>
    </section>
  );
};

export default MatchListCard;