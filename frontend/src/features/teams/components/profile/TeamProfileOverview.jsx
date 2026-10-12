import AboutTeam from "./overview/AboutTeam";
import Achievements from "./overview/Achievements";
import ClubInformation from ".overview/ClubInformation";
import KeyPlayers from ".overview/KeyPlayers";
import MatchListCard from "./overview/MatchListCard";
import TeamKit from "./overview/TeamKit";

import TeamSquad from "./squad/TeamSquad";

/* =========================================================
   PLACEHOLDER TAB
========================================================= */

const TabPlaceholder = ({
  title,
  description,
  dashed = false,
}) => {
  return (
    <div
      className={`
        flex
        min-h-[300px]
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        bg-white
        px-6
        text-center

        ${
          dashed
            ? "border-dashed border-[#d9e3df]"
            : "border-[#e1e8e5]"
        }
      `}
    >
      <h2
        className="
          text-[18px]
          font-bold
          tracking-[-0.02em]
          text-[#07182d]
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-2
          max-w-[420px]
          text-[12px]
          leading-5
          text-[#718096]
        "
      >
        {description}
      </p>
    </div>
  );
};

/* =========================================================
   TEAM MAIN CONTENT
========================================================= */

export const TeamMainContent = ({
  team,
  teamId,
  squadState,
  resultsState,
  upcomingState,
  activeTab,
  setActiveTab,
}) => {
  /* =======================================================
     SQUAD
  ======================================================== */

  if (
    activeTab === "squad" ||
    activeTab === "players"
  ) {
    return (
      <TeamSquad
        team={team}
        squadState={squadState}
      />
    );
  }

  /* =======================================================
     STAFF
  ======================================================== */

  if (activeTab === "staff") {
    return (
      <TabPlaceholder
        title="Team Staff"
        description="Coaching staff and team management information will be available here."
      />
    );
  }

  /* =======================================================
     MATCHES
  ======================================================== */

  if (activeTab === "matches") {
    return (
      <div className="space-y-4">
        <MatchListCard
          title="Recent Matches"
          state={resultsState}
          currentTeamId={teamId}
          type="recent"
        />

        <MatchListCard
          title="Upcoming Matches"
          state={upcomingState}
          currentTeamId={teamId}
          type="upcoming"
        />
      </div>
    );
  }

  /* =======================================================
     STATISTICS
  ======================================================== */

  if (activeTab === "statistics") {
    return (
      <TabPlaceholder
        title="Team Statistics"
        description="Team performance and competition statistics will be available here."
      />
    );
  }

  /* =======================================================
     GALLERY
  ======================================================== */

  if (activeTab === "gallery") {
    return (
      <TabPlaceholder
        title="Team Gallery"
        description="Team photos and media will be available here."
        dashed
      />
    );
  }

  /* =======================================================
     OVERVIEW
  ======================================================== */

  return (
    <div className="w-full">
      {/* ===============================================
          TOP 3-COLUMN AREA
      ================================================ */}

      <div
        className="
          grid
          items-start
          gap-4
          xl:grid-cols-[290px_minmax(0,1fr)_260px]
        "
      >
        {/* LEFT */}
        <div className="min-w-0">
          <ClubInformation team={team} />
        </div>

        {/* CENTER */}
        <div className="min-w-0 space-y-4">
          <AboutTeam team={team} />

          <KeyPlayers
            squadState={squadState}
            onViewAll={() =>
              setActiveTab("squad")
            }
          />
        </div>

        {/* RIGHT */}
        <div className="min-w-0 space-y-4">
          <TeamKit team={team} />

          <Achievements
            achievements={
              team?.achievements || []
            }
          />
        </div>
      </div>

      {/* ===============================================
          MATCHES - 50 / 50
      ================================================ */}

      <div
        className="
          mt-4
          grid
          items-start
          gap-4
          lg:grid-cols-2
        "
      >
        <div className="min-w-0">
          <MatchListCard
            title="Recent Matches"
            state={resultsState}
            currentTeamId={teamId}
            type="recent"
            onViewAll={() =>
              setActiveTab("matches")
            }
          />
        </div>

        <div className="min-w-0">
          <MatchListCard
            title="Upcoming Matches"
            state={upcomingState}
            currentTeamId={teamId}
            type="upcoming"
            onViewAll={() =>
              setActiveTab("matches")
            }
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   KEY STATS
========================================================= */

export const KeyStats = ({
  squadCount = 0,
  resultsCount = 0,
}) => {
  const stats = [
    {
      label: "Players",
      value: squadCount,
    },
    {
      label: "Matches",
      value: resultsCount,
    },
  ];

  return (
    <section
      className="
        rounded-xl
        border
        border-[#e1e8e5]
        bg-white
        p-5
        shadow-[0_4px_16px_rgba(15,23,42,0.035)]
      "
    >
      <h2
        className="
          text-[18px]
          font-bold
          tracking-[-0.02em]
          text-[#07182d]
        "
      >
        Key Stats
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

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-3
        "
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="
              rounded-lg
              bg-[#f6f9f8]
              px-3
              py-3
              text-center
            "
          >
            <strong
              className="
                block
                text-[20px]
                font-bold
                text-[#07182d]
              "
            >
              {stat.value}
            </strong>

            <span
              className="
                mt-0.5
                block
                text-[10px]
                font-medium
                text-[#718096]
              "
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

/* =========================================================
   TEAM KIT CARD
========================================================= */

export const TeamKitCard = ({ team }) => {
  return <TeamKit team={team} />;
};

/* =========================================================
   MATCHES CARD

   Kept for compatibility with your TeamDetailsPage imports.
========================================================= */

export const MatchesCard = ({
  title,
  state,
  currentTeamId,
  type,
  onViewAll,
}) => {
  return (
    <MatchListCard
      title={title}
      state={state}
      currentTeamId={currentTeamId}
      type={
        type === "result"
          ? "recent"
          : type
      }
      onViewAll={onViewAll}
    />
  );
};

/* =========================================================
   ACHIEVEMENTS CARD

   Kept for compatibility with your TeamDetailsPage imports.
========================================================= */

export const AchievementsCard = ({
  achievements = [],
}) => {
  return (
    <Achievements
      achievements={achievements}
    />
  );
};

export default TeamMainContent;