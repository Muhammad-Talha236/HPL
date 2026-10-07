import {
  CalendarDays,
  Clock3,
  MapPin,
  Trophy,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import logo from "../../../../../assets/logo.png";

/* =========================================================
   HELPERS
========================================================= */

const getMatchId = (match) =>
  match?.match_id ||
  match?.id ||
  null;

const getHomeTeam = (match) =>
  match?.home_team ||
  match?.homeTeam ||
  {};

const getAwayTeam = (match) =>
  match?.away_team ||
  match?.awayTeam ||
  {};

const getTeamId = (team) =>
  team?.team_id ||
  team?.id ||
  null;

const getTeamName = (team) =>
  team?.name ||
  "Team";

const getTeamLogo = (team) =>
  team?.logo ||
  team?.logo_url ||
  team?.logoUrl ||
  null;

const getCompetition = (match) =>
  match?.competition || {};

const getVenue = (match) =>
  match?.venue || {};

const getStatus = (match) =>
  String(match?.status || "").toUpperCase();

/* =========================================================
   DATE
========================================================= */

const formatDate = (value) => {
  if (!value) {
    return {
      day: "--",
      month: "---",
      year: "",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      day: "--",
      month: "---",
      year: "",
    };
  }

  return {
    day: String(date.getDate()).padStart(2, "0"),

    month: date
      .toLocaleDateString("en-US", {
        month: "short",
      })
      .toUpperCase(),

    year: date.getFullYear(),
  };
};

/* =========================================================
   TIME
========================================================= */

const formatTime = (value) => {
  if (!value) return "";

  const raw = String(value);

  const timeMatch =
    raw.match(/(\d{2}):(\d{2})/);

  if (timeMatch) {
    const hours =
      Number(timeMatch[1]);

    const minutes =
      timeMatch[2];

    const period =
      hours >= 12
        ? "PM"
        : "AM";

    const displayHour =
      hours % 12 || 12;

    return `${displayHour}:${minutes} ${period}`;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return "";
};

/* =========================================================
   RESULT
========================================================= */

const getResult = (
  match,
  currentTeamId
) => {
  const homeTeam =
    getHomeTeam(match);

  const isHome =
    String(getTeamId(homeTeam)) ===
    String(currentTeamId);

  const homeScore =
    Number(match?.home_score ?? 0);

  const awayScore =
    Number(match?.away_score ?? 0);

  const teamScore =
    isHome
      ? homeScore
      : awayScore;

  const opponentScore =
    isHome
      ? awayScore
      : homeScore;

  if (teamScore > opponentScore) {
    return "WIN";
  }

  if (teamScore < opponentScore) {
    return "LOSS";
  }

  return "DRAW";
};

/* =========================================================
   LOGO
========================================================= */

const TeamLogo = ({ team }) => {
  const image =
    getTeamLogo(team);

  return (
    <div
      className="
        grid
        h-10
        w-10
        shrink-0
        place-items-center
        overflow-hidden
        rounded-full
        bg-[#f2f6f4]
        xl:h-11
        xl:w-11
      "
    >
      <img
        src={image || logo}
        alt={getTeamName(team)}
        className="
          h-[84%]
          w-[84%]
          object-contain
        "
        onError={(event) => {
          event.currentTarget.src = logo;
        }}
      />
    </div>
  );
};

/* =========================================================
   RESULT BADGE
========================================================= */

const ResultBadge = ({ result }) => {
  const styles = {
    WIN: "bg-[#ddf7e9] text-[#078052]",
    DRAW: "bg-[#e8eff8] text-[#55708f]",
    LOSS: "bg-[#fde6e6] text-[#e14545]",
  };

  return (
    <span
      className={`
        inline-flex
        min-w-[58px]
        items-center
        justify-center
        rounded-full
        px-3
        py-1.5
        text-[10px]
        font-bold
        xl:text-[11px]
        ${styles[result]}
      `}
    >
      {result === "WIN"
        ? "Win"
        : result === "LOSS"
        ? "Loss"
        : "Draw"}
    </span>
  );
};

/* =========================================================
   TEAM
========================================================= */

const TeamDisplay = ({
  team,
  side,
}) => {
  return (
    <div
      className={`
        flex
        min-w-0
        items-center
        gap-2.5

        ${
          side === "home"
            ? "justify-end"
            : "justify-start"
        }
      `}
    >
      {side === "away" && (
        <TeamLogo team={team} />
      )}

      <div
        className={`
          min-w-0

          ${
            side === "home"
              ? "text-right"
              : "text-left"
          }
        `}
      >
        <p
          title={getTeamName(team)}
          className="
            truncate
            text-[12px]
            font-bold
            text-[#07182d]
            xl:text-[13px]
            2xl:text-[14px]
          "
        >
          {getTeamName(team)}
        </p>

        <span
          className="
            mt-0.5
            block
            text-[8px]
            font-medium
            text-[#8b98a8]
            xl:text-[9px]
          "
        >
          {side === "home"
            ? "Home"
            : "Away"}
        </span>
      </div>

      {side === "home" && (
        <TeamLogo team={team} />
      )}
    </div>
  );
};

/* =========================================================
   TEAM MATCH CARD
========================================================= */

const TeamMatchCard = ({
  match,
  currentTeamId,
}) => {
  const navigate =
    useNavigate();

  const matchId =
    getMatchId(match);

  const homeTeam =
    getHomeTeam(match);

  const awayTeam =
    getAwayTeam(match);

  const competition =
    getCompetition(match);

  const venue =
    getVenue(match);

  const status =
    getStatus(match);

  const date =
    formatDate(match?.match_date);

  const time =
    formatTime(match?.start_time);

  const isLive =
    status === "LIVE";

  const isCompleted =
    status === "COMPLETED";

  const result =
    isCompleted
      ? getResult(
          match,
          currentTeamId
        )
      : null;

  const openMatch = () => {
    if (!matchId) return;

    navigate(
      `/matches/${matchId}`
    );
  };

  return (
    <article
      className="
        border-b
        border-[#edf1ef]
        bg-white
        px-4
        py-3.5
        last:border-b-0
        lg:px-5
        xl:py-4
      "
    >
      <div
        className="
          grid
          min-w-0
          items-center
          gap-3

          grid-cols-[48px_minmax(0,1fr)]

          md:grid-cols-[52px_minmax(280px,1.25fr)_minmax(170px,.75fr)]

          xl:grid-cols-[56px_minmax(350px,1.4fr)_minmax(220px,.8fr)_125px]
        "
      >
        {/* ===============================================
            DATE
        ================================================ */}

        <div className="text-left">
          <strong
            className="
              block
              text-[18px]
              font-extrabold
              leading-none
              tracking-[-0.03em]
              text-[#07182d]
              xl:text-[20px]
            "
          >
            {date.day}
          </strong>

          <span
            className="
              mt-1.5
              block
              text-[9px]
              font-semibold
              uppercase
              text-[#718096]
              xl:text-[10px]
            "
          >
            {date.month}
          </span>

          <span
            className="
              mt-1
              block
              text-[8px]
              text-[#9aa5b3]
              xl:text-[9px]
            "
          >
            {date.year}
          </span>
        </div>

        {/* ===============================================
            TEAMS
        ================================================ */}

        <div
          className="
            flex
            min-w-0
            items-center
            justify-center
            gap-3
            xl:gap-4
          "
        >
          <div className="min-w-0 flex-1">
            <TeamDisplay
              team={homeTeam}
              side="home"
            />
          </div>

          {/* SCORE / VS */}

          {isCompleted || isLive ? (
            <div className="shrink-0 text-center">
              <span
                className={`
                  inline-flex
                  min-w-[58px]
                  items-center
                  justify-center
                  rounded-md
                  px-2.5
                  py-1.5
                  text-[13px]
                  font-extrabold
                  xl:text-[14px]

                  ${
                    isLive
                      ? "bg-[#e7f8ef] text-[#078052]"
                      : "bg-[#eef5f2] text-[#07182d]"
                  }
                `}
              >
                {match?.home_score ?? 0}
                {" - "}
                {match?.away_score ?? 0}
              </span>

              {isLive && (
                <span
                  className="
                    mt-1
                    block
                    text-[8px]
                    font-extrabold
                    uppercase
                    tracking-[0.08em]
                    text-[#df4242]
                  "
                >
                  Live
                </span>
              )}
            </div>
          ) : (
            <span
              className="
                grid
                h-8
                w-8
                shrink-0
                place-items-center
                rounded-full
                bg-[#f2f6f8]
                text-[9px]
                font-bold
                text-[#708096]
                xl:h-9
                xl:w-9
                xl:text-[10px]
              "
            >
              VS
            </span>
          )}

          <div className="min-w-0 flex-1">
            <TeamDisplay
              team={awayTeam}
              side="away"
            />
          </div>
        </div>

        {/* ===============================================
            MATCH INFO
        ================================================ */}

        <div
          className="
            col-span-2
            min-w-0
            space-y-1.5
            text-[9px]
            font-medium
            text-[#66758a]

            md:col-span-1
            xl:text-[10px]
          "
        >
          {competition?.name && (
            <div
              className="
                flex
                min-w-0
                items-center
                gap-1.5
              "
            >
              <Trophy
                size={13}
                strokeWidth={1.8}
                className="
                  shrink-0
                  text-[#e5a329]
                "
              />

              <span className="truncate">
                {competition.name}
              </span>
            </div>
          )}

          {venue?.name && (
            <div
              className="
                flex
                min-w-0
                items-center
                gap-1.5
              "
            >
              <MapPin
                size={13}
                strokeWidth={1.8}
                className="
                  shrink-0
                  text-[#61748c]
                "
              />

              <span className="truncate">
                {venue.name}
              </span>
            </div>
          )}

          {time && !isCompleted && (
            <div
              className="
                flex
                items-center
                gap-1.5
              "
            >
              <Clock3
                size={13}
                strokeWidth={1.8}
              />

              <span>{time}</span>
            </div>
          )}

          {isCompleted && (
            <div
              className="
                flex
                items-center
                gap-1.5
              "
            >
              <CalendarDays
                size={13}
                strokeWidth={1.8}
              />

              <span>
                Full Time
              </span>
            </div>
          )}
        </div>

        {/* ===============================================
            ACTION / RESULT
        ================================================ */}

        <div
          className="
            col-span-2
            flex
            justify-end
            md:col-span-3
            xl:col-span-1
          "
        >
          {isCompleted ? (
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <ResultBadge
                result={result}
              />

              <button
                type="button"
                onClick={openMatch}
                disabled={!matchId}
                className="
                  hidden
                  h-9
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-[#dce5e1]
                  bg-white
                  px-3
                  text-[10px]
                  font-semibold
                  text-[#304158]
                  transition-all
                  hover:border-[#078052]
                  hover:text-[#078052]
                  2xl:inline-flex
                "
              >
                Details →
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openMatch}
              disabled={!matchId}
              className={`
                h-9
                min-w-[112px]
                rounded-lg
                border
                px-3
                text-[10px]
                font-semibold
                transition-all
                xl:text-[11px]

                ${
                  matchId
                    ? `
                      cursor-pointer
                      border-[#076b48]
                      bg-[#075f42]
                      text-white
                      hover:bg-[#078052]
                    `
                    : `
                      cursor-default
                      border-[#e0e7e4]
                      bg-[#f7f9f8]
                      text-[#9ca7b3]
                    `
                }
              `}
            >
              {isLive
                ? "View Live →"
                : "Match Details →"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default TeamMatchCard;