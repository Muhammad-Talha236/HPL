import {
  useEffect,
  useMemo,
  useState,
} from "react";

import MatchHeader from "./MatchHeader";
import MatchList from "./MatchList";
import MatchTabs from "./MatchTabs";

/* =========================================================
   CONFIG
========================================================= */

const MATCHES_PER_PAGE = 7;

/* =========================================================
   HELPERS
========================================================= */

const getStatus = (match) =>
  String(
    match?.status || ""
  ).toUpperCase();

const getHomeTeam = (match) =>
  match?.home_team ||
  match?.homeTeam ||
  {};

const getTeamId = (team) =>
  team?.team_id ||
  team?.id ||
  null;

const getCompetition = (match) =>
  match?.competition || {};

const getCompetitionId = (
  match
) => {
  const competition =
    getCompetition(match);

  return (
    match?.competition_id ||
    competition?.competition_id ||
    competition?.id ||
    null
  );
};

const getCompetitionName = (
  match
) => {
  const competition =
    getCompetition(match);

  return (
    competition?.name ||
    "Competition"
  );
};

const getSeason = (match) =>
  match?.season || {};

const getSeasonId = (match) => {
  const season =
    getSeason(match);

  return (
    match?.season_id ||
    season?.season_id ||
    season?.id ||
    null
  );
};

const getSeasonName = (match) => {
  const season =
    getSeason(match);

  return (
    season?.name ||
    null
  );
};

const getMatchTimestamp = (
  match
) => {
  if (!match?.match_date) {
    return 0;
  }

  const timestamp =
    new Date(
      match.match_date
    ).getTime();

  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;
};

/* =========================================================
   RESULT
========================================================= */

const getMatchResult = (
  match,
  currentTeamId
) => {
  const homeTeam =
    getHomeTeam(match);

  const isHome =
    String(
      getTeamId(homeTeam)
    ) ===
    String(currentTeamId);

  const homeScore =
    Number(
      match?.home_score ?? 0
    );

  const awayScore =
    Number(
      match?.away_score ?? 0
    );

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
   TEAM MATCHES
========================================================= */

const TeamMatches = ({
  team,
  matchesState,
}) => {
  const [
    activeMatchTab,
    setActiveMatchTab,
  ] = useState("upcoming");

  const [
    season,
    setSeason,
  ] = useState("ALL");

  const [
    competition,
    setCompetition,
  ] = useState("ALL");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const teamId =
    team?.team_id ||
    team?.id;

  /* =======================================================
     RAW MATCHES
  ======================================================= */

  const matches =
    matchesState?.status ===
    "success"
      ? matchesState.data || []
      : [];

  /* =======================================================
     SEASONS
  ======================================================= */

  const seasons =
    useMemo(() => {
      const map =
        new Map();

      matches.forEach(
        (match) => {
          const id =
            getSeasonId(match);

          const name =
            getSeasonName(match);

          if (!id || !name) {
            return;
          }

          map.set(
            String(id),
            {
              id: String(id),
              name,
            }
          );
        }
      );

      return Array.from(
        map.values()
      );
    }, [matches]);

  /* =======================================================
     COMPETITIONS
  ======================================================= */

  const competitions =
    useMemo(() => {
      const map =
        new Map();

      matches.forEach(
        (match) => {
          const id =
            getCompetitionId(
              match
            );

          if (!id) {
            return;
          }

          map.set(
            String(id),
            {
              id: String(id),

              name:
                getCompetitionName(
                  match
                ),
            }
          );
        }
      );

      return Array.from(
        map.values()
      );
    }, [matches]);

  /* =======================================================
     FILTER BY SEASON + COMPETITION
  ======================================================= */

  const filteredMatches =
    useMemo(() => {
      return matches.filter(
        (match) => {
          const seasonMatches =
            season === "ALL" ||
            String(
              getSeasonId(match)
            ) === season;

          const competitionMatches =
            competition === "ALL" ||
            String(
              getCompetitionId(match)
            ) === competition;

          return (
            seasonMatches &&
            competitionMatches
          );
        }
      );
    }, [
      matches,
      season,
      competition,
    ]);

  /* =======================================================
     MATCH TYPES
  ======================================================= */

  const liveMatches =
    useMemo(() => {
      return filteredMatches
        .filter(
          (match) =>
            getStatus(match) ===
            "LIVE"
        )
        .sort(
          (a, b) =>
            getMatchTimestamp(a) -
            getMatchTimestamp(b)
        );
    }, [filteredMatches]);

  const upcomingMatches =
    useMemo(() => {
      return filteredMatches
        .filter((match) =>
          [
            "SCHEDULED",
            "UPCOMING",
          ].includes(
            getStatus(match)
          )
        )
        .sort(
          (a, b) =>
            getMatchTimestamp(a) -
            getMatchTimestamp(b)
        );
    }, [filteredMatches]);

  const recentMatches =
    useMemo(() => {
      return filteredMatches
        .filter(
          (match) =>
            getStatus(match) ===
            "COMPLETED"
        )
        .sort(
          (a, b) =>
            getMatchTimestamp(b) -
            getMatchTimestamp(a)
        );
    }, [filteredMatches]);

  const allMatches =
    useMemo(() => {
      return [...filteredMatches].sort(
        (a, b) =>
          getMatchTimestamp(b) -
          getMatchTimestamp(a)
      );
    }, [filteredMatches]);

  /* =======================================================
     CURRENT TAB MATCHES
  ======================================================= */

  const selectedMatches =
    useMemo(() => {
      switch (activeMatchTab) {
        case "live":
          return liveMatches;

        case "recent":
          return recentMatches;

        case "all":
          return allMatches;

        default:
          return upcomingMatches;
      }
    }, [
      activeMatchTab,
      liveMatches,
      upcomingMatches,
      recentMatches,
      allMatches,
    ]);

  /* =======================================================
     STATS

     Stats use COMPLETED matches only.
  ======================================================= */

  const stats =
    useMemo(() => {
      const completed =
        filteredMatches.filter(
          (match) =>
            getStatus(match) ===
            "COMPLETED"
        );

      return completed.reduce(
        (
          result,
          match
        ) => {
          const homeTeam =
            getHomeTeam(match);

          const isHome =
            String(
              getTeamId(
                homeTeam
              )
            ) ===
            String(teamId);

          const homeScore =
            Number(
              match?.home_score ?? 0
            );

          const awayScore =
            Number(
              match?.away_score ?? 0
            );

          const goalsFor =
            isHome
              ? homeScore
              : awayScore;

          const goalsAgainst =
            isHome
              ? awayScore
              : homeScore;

          const matchResult =
            getMatchResult(
              match,
              teamId
            );

          result.played += 1;

          result.goalsFor +=
            goalsFor;

          result.goalsAgainst +=
            goalsAgainst;

          if (
            matchResult === "WIN"
          ) {
            result.wins += 1;
          }

          if (
            matchResult === "DRAW"
          ) {
            result.draws += 1;
          }

          if (
            matchResult === "LOSS"
          ) {
            result.losses += 1;
          }

          return result;
        },
        {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        }
      );
    }, [
      filteredMatches,
      teamId,
    ]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        selectedMatches.length /
          MATCHES_PER_PAGE
      )
    );

  const paginatedMatches =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        MATCHES_PER_PAGE;

      const end =
        start +
        MATCHES_PER_PAGE;

      return selectedMatches.slice(
        start,
        end
      );
    }, [
      selectedMatches,
      currentPage,
    ]);

  /* =======================================================
     RESET PAGINATION

     Tab/filter changes always return to page 1.
  ======================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeMatchTab,
    season,
    competition,
  ]);

  /* =======================================================
     PAGE SAFETY
  ======================================================= */

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  /* =======================================================
     LIVE TAB SAFETY

     If currently live tab selected and match stops being
     live, automatically return to Upcoming.
  ======================================================= */

  useEffect(() => {
    if (
      activeMatchTab ===
        "live" &&
      liveMatches.length === 0
    ) {
      setActiveMatchTab(
        "upcoming"
      );
    }
  }, [
    activeMatchTab,
    liveMatches.length,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    matchesState?.status ===
    "loading"
  ) {
    return (
      <section
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-5
          pb-16
          pt-7
          sm:px-7
          lg:px-10
        "
      >
        <div
          className="
            grid
            min-h-[300px]
            place-items-center
            rounded-xl
            border
            border-[#e1e8e5]
            bg-white
            text-[13px]
            font-medium
            text-[#718096]
          "
        >
          Loading matches…
        </div>
      </section>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    matchesState?.status ===
    "error"
  ) {
    return (
      <section
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-5
          pb-16
          pt-7
          sm:px-7
          lg:px-10
        "
      >
        <div
          className="
            grid
            min-h-[300px]
            place-items-center
            rounded-xl
            border
            border-[#ead8d5]
            bg-white
            px-6
            text-center
            text-[13px]
            font-medium
            text-[#b4534b]
          "
        >
          Match information is unavailable right now.
        </div>
      </section>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[1500px]
        px-5
        pb-16
        pt-5
        sm:px-7
        lg:px-10
      "
    >
      {/* ===============================================
          HEADER

          Filters are now at the TOP.
      ================================================ */}

      <MatchHeader
        season={season}
        onSeasonChange={
          setSeason
        }
        competition={
          competition
        }
        onCompetitionChange={
          setCompetition
        }
        seasons={seasons}
        competitions={
          competitions
        }
        stats={stats}
      />

      {/* ===============================================
          MATCH TABS
      ================================================ */}

      <MatchTabs
        activeTab={
          activeMatchTab
        }
        onChange={
          setActiveMatchTab
        }
        liveCount={
          liveMatches.length
        }
        upcomingCount={
          upcomingMatches.length
        }
        recentCount={
          recentMatches.length
        }
        allCount={
          allMatches.length
        }
      />

      {/* ===============================================
          MATCH LIST
      ================================================ */}

      <MatchList
        matches={
          paginatedMatches
        }
        currentTeamId={
          teamId
        }
        activeTab={
          activeMatchTab
        }
        currentPage={
          currentPage
        }
        totalPages={
          totalPages
        }
        totalItems={
          selectedMatches.length
        }
        pageSize={
          MATCHES_PER_PAGE
        }
        onPageChange={
          setCurrentPage
        }
      />
    </section>
  );
};

export default TeamMatches;