import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

/* =========================================================
   PROFILE COMPONENTS
========================================================= */

import TeamProfileHero from "../components/profile/TeamProfileHero";
import TeamProfileTabs from "../components/profile/TeamProfileTabs";
import TeamOverview from "../components/profile/TeamOverview";
import TeamSquad from "../components/profile/squad/TeamSquad";
import TeamMatches from "../components/profile/matches/TeamMatches";

/* =========================================================
   SERVICES
========================================================= */

import {
  getAllTeamMatches,
  getTeamById,
  getTeamRecentResults,
  getTeamSquad,
  getTeamUpcomingMatches,
} from "../services/teamService";

/* =========================================================
   PLACEHOLDER FOR PENDING TABS
========================================================= */

const PendingTab = ({
  title,
}) => {
  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[1500px]
        px-5
        pb-16
        pt-6
        sm:px-7
        lg:px-10
      "
    >
      <div
        className="
          min-h-[360px]
          rounded-lg
          border
          border-[#e1e8e5]
          bg-white
          p-6
          shadow-[0_3px_12px_rgba(15,23,42,0.035)]
        "
      >
        <h2
          className="
            text-[22px]
            font-extrabold
            tracking-[-0.03em]
            text-[#07182d]
          "
        >
          {title}
        </h2>

        <span
          className="
            mt-2
            block
            h-[2px]
            w-7
            bg-[#e4a42b]
          "
        />

        <div
          className="
            mt-6
            grid
            min-h-[250px]
            place-items-center
            rounded-lg
            border
            border-dashed
            border-[#dce5e1]
            bg-[#fafcfb]
            px-6
            text-center
          "
        >
          <p
            className="
              text-[13px]
              font-medium
              text-[#718096]
            "
          >
            {title} section will be implemented next.
          </p>
        </div>
      </div>
    </section>
  );
};

/* =========================================================
   TEAM DETAILS PAGE
========================================================= */

const TeamDetailsPage = () => {
  const { teamId } = useParams();

  /* =======================================================
     ACTIVE TAB
  ======================================================= */

  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");

  /* =======================================================
     TEAM STATE
  ======================================================= */

  const [
    teamState,
    setTeamState,
  ] = useState({
    data: null,
    status: "loading",
  });

  /* =======================================================
     SQUAD STATE
  ======================================================= */

  const [
    squadState,
    setSquadState,
  ] = useState({
    data: [],
    status: "loading",
  });

  /* =======================================================
     RECENT RESULTS STATE
  ======================================================= */

  const [
    resultsState,
    setResultsState,
  ] = useState({
    data: [],
    status: "loading",
  });

  /* =======================================================
     UPCOMING MATCHES STATE
  ======================================================= */

  const [
    upcomingState,
    setUpcomingState,
  ] = useState({
    data: [],
    status: "loading",
  });

  /* =======================================================
     ALL MATCHES STATE

     Used by full Matches tab:
     LIVE + SCHEDULED + COMPLETED
  ======================================================= */

  const [
    matchesState,
    setMatchesState,
  ] = useState({
    data: [],
    status: "loading",
  });

  /* =======================================================
     LOAD TEAM PROFILE
  ======================================================= */

  useEffect(() => {
    let isCurrent = true;

    const safeSetState = (
      setter,
      value
    ) => {
      if (isCurrent) {
        setter(value);
      }
    };

    const loadTeamProfile =
      async () => {
        /* -----------------------------------------------
           RESET
        ------------------------------------------------ */

        setActiveTab("overview");

        setTeamState({
          data: null,
          status: "loading",
        });

        setSquadState({
          data: [],
          status: "loading",
        });

        setResultsState({
          data: [],
          status: "loading",
        });

        setUpcomingState({
          data: [],
          status: "loading",
        });

        setMatchesState({
          data: [],
          status: "loading",
        });

        /* -----------------------------------------------
           LOAD MAIN TEAM
        ------------------------------------------------ */

        try {
          const team =
            await getTeamById(
              teamId
            );

          safeSetState(
            setTeamState,
            {
              data: team,
              status: "success",
            }
          );
        } catch (error) {
          safeSetState(
            setTeamState,
            {
              data: null,

              status:
                error?.response
                  ?.status === 404
                  ? "notFound"
                  : "error",
            }
          );

          return;
        }

        /* -----------------------------------------------
           LOAD RELATED DATA

           All requests run independently.
           One failed request will not break the others.
        ------------------------------------------------ */

        const [
          squadResult,
          recentResult,
          upcomingResult,
          allMatchesResult,
        ] =
          await Promise.allSettled(
            [
              getTeamSquad(
                teamId
              ),

              getTeamRecentResults(
                teamId
              ),

              getTeamUpcomingMatches(
                teamId
              ),

              getAllTeamMatches(
                teamId
              ),
            ]
          );

        /* -----------------------------------------------
           SQUAD
        ------------------------------------------------ */

        safeSetState(
          setSquadState,

          squadResult.status ===
            "fulfilled"
            ? {
                data:
                  squadResult.value ||
                  [],

                status:
                  "success",
              }
            : {
                data: [],
                status: "error",
              }
        );

        /* -----------------------------------------------
           RECENT RESULTS
        ------------------------------------------------ */

        safeSetState(
          setResultsState,

          recentResult.status ===
            "fulfilled"
            ? {
                data:
                  recentResult.value ||
                  [],

                status:
                  "success",
              }
            : {
                data: [],
                status: "error",
              }
        );

        /* -----------------------------------------------
           UPCOMING
        ------------------------------------------------ */

        safeSetState(
          setUpcomingState,

          upcomingResult.status ===
            "fulfilled"
            ? {
                data:
                  upcomingResult.value ||
                  [],

                status:
                  "success",
              }
            : {
                data: [],
                status: "error",
              }
        );

        /* -----------------------------------------------
           ALL MATCHES
        ------------------------------------------------ */

        safeSetState(
          setMatchesState,

          allMatchesResult.status ===
            "fulfilled"
            ? {
                data:
                  allMatchesResult.value ||
                  [],

                status:
                  "success",
              }
            : {
                data: [],
                status: "error",
              }
        );
      };

    loadTeamProfile();

    return () => {
      isCurrent = false;
    };
  }, [teamId]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const squadCount =
    useMemo(() => {
      if (
        squadState.status !==
        "success"
      ) {
        return 0;
      }

      return (
        squadState.data?.length ||
        0
      );
    }, [squadState]);

  /*
   * Hero ke liye actual total team matches.
   *
   * Agar all matches request fail ho jaye to
   * recent results count fallback hai.
   */
  const matchCount =
    useMemo(() => {
      if (
        matchesState.status ===
        "success"
      ) {
        return (
          matchesState.data
            ?.length || 0
        );
      }

      if (
        resultsState.status ===
        "success"
      ) {
        return (
          resultsState.data
            ?.length || 0
        );
      }

      return 0;
    }, [
      matchesState,
      resultsState,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    teamState.status ===
    "loading"
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-[#f5f8f7]
          pt-[76px]
        "
      >
        <div
          className="
            mx-auto
            max-w-[1500px]
            px-5
            py-16
            sm:px-7
            lg:px-10
          "
        >
          <div
            className="
              rounded-lg
              border
              border-[#e1e8e5]
              bg-white
              p-8
              text-[13px]
              font-medium
              text-[#718096]
            "
          >
            Loading team profile…
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (
    teamState.status ===
      "notFound" ||
    teamState.status ===
      "error"
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-[#f5f8f7]
          pt-[76px]
        "
      >
        <div
          className="
            mx-auto
            max-w-[1500px]
            px-5
            py-16
            sm:px-7
            lg:px-10
          "
        >
          <div
            className="
              rounded-lg
              border
              border-[#e1e8e5]
              bg-white
              p-8
            "
          >
            <h1
              className="
                text-[24px]
                font-extrabold
                text-[#07182d]
              "
            >
              Team unavailable
            </h1>

            <p
              className="
                mt-3
                text-[13px]
                text-[#718096]
              "
            >
              {teamState.status ===
              "notFound"
                ? "The requested team could not be found."
                : "Team details are unavailable right now."}
            </p>

            <Link
              to="/teams"
              className="
                mt-6
                inline-flex
                cursor-pointer
                text-[12px]
                font-bold
                text-[#078052]
                transition
                hover:text-[#055f3e]
              "
            >
              ← Back to Teams
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     TEAM
  ======================================================= */

  const team =
    teamState.data;

  /* =======================================================
     TAB CONTENT
  ======================================================= */

  const renderTabContent = () => {
    switch (activeTab) {
      /* -----------------------------------------------
         OVERVIEW
      ------------------------------------------------ */

      case "overview":
        return (
          <TeamOverview
            team={team}
            teamId={teamId}
            squadState={
              squadState
            }
            resultsState={
              resultsState
            }
            upcomingState={
              upcomingState
            }
            onOpenSquad={() =>
              setActiveTab(
                "squad"
              )
            }
            onOpenMatches={() =>
              setActiveTab(
                "matches"
              )
            }
          />
        );

      /* -----------------------------------------------
         SQUAD
      ------------------------------------------------ */

      case "squad":
        return (
          <section
            className="
              mx-auto
              w-full
              max-w-[1500px]
              px-5
              pb-16
              pt-6
              sm:px-7
              lg:px-10
            "
          >
            <TeamSquad
              team={team}
              squadState={
                squadState
              }
            />
          </section>
        );

      /* -----------------------------------------------
         STAFF
         Currently intentionally pending
      ------------------------------------------------ */

      case "staff":
        return (
          <PendingTab
            title="Staff"
          />
        );

      /* -----------------------------------------------
         MATCHES
      ------------------------------------------------ */

      case "matches":
        return (
          <TeamMatches
            team={team}
            matchesState={
              matchesState
            }
          />
        );

      /* -----------------------------------------------
         STATISTICS
      ------------------------------------------------ */

      case "statistics":
        return (
          <PendingTab
            title="Statistics"
          />
        );

      /* -----------------------------------------------
         GALLERY
      ------------------------------------------------ */

      case "gallery":
        return (
          <PendingTab
            title="Gallery"
          />
        );

      /* -----------------------------------------------
         DEFAULT
      ------------------------------------------------ */

      default:
        return (
          <TeamOverview
            team={team}
            teamId={teamId}
            squadState={
              squadState
            }
            resultsState={
              resultsState
            }
            upcomingState={
              upcomingState
            }
            onOpenSquad={() =>
              setActiveTab(
                "squad"
              )
            }
            onOpenMatches={() =>
              setActiveTab(
                "matches"
              )
            }
          />
        );
    }
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-[#f5f8f7]
        pt-[76px]
        text-[#07182d]
      "
    >
      {/* ===============================================
          HERO
      ================================================ */}

      <TeamProfileHero
        team={team}
        playerCount={
          squadCount
        }
        matchCount={
          matchCount
        }
      />

      {/* ===============================================
          SHARED TABS
      ================================================ */}

      <TeamProfileTabs
        activeTab={
          activeTab
        }
        onChange={
          setActiveTab
        }
      />

      {/* ===============================================
          ACTIVE TAB
      ================================================ */}

      {renderTabContent()}
    </main>
  );
};

export default TeamDetailsPage;