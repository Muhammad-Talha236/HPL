import ClubInformation from "./overview/ClubInformation";
import AboutTeam from "./overview/AboutTeam";
import TeamKit from "./overview/TeamKit";
import KeyPlayers from "./overview/KeyPlayers";
import MatchListCard from "./overview/MatchListCard";
import Achievements from "./overview/Achievements";
import { FEATURES } from "../../../../constants/features";

const TeamOverview = ({
  team,
  teamId,
  squadState,
  resultsState,
  upcomingState,
  onOpenSquad,
  onOpenMatches,
}) => {
  const showClubInfo = FEATURES.CLUBS_ENABLED;

  return (
    <section
      className="
        mx-auto
        w-full
        max-w-[1500px]
        px-5
        pb-14
        pt-5
        sm:px-7
        lg:px-10
      "
    >
      {/* =====================================================
          MAIN OVERVIEW

          Desktop:
          Club Info | About + Key Players | Team Kit + Achievements
      ====================================================== */}

      <div
        className={`
          grid
          items-start
          gap-4
          ${showClubInfo ? "xl:grid-cols-[290px_minmax(0,1fr)_260px]" : "xl:grid-cols-[minmax(0,1fr)_260px]"}
        `}
      >
        {/* LEFT COLUMN */}

        {showClubInfo && <div className="min-w-0"><ClubInformation team={team} /></div>}

        {/* CENTER COLUMN */}

        <div className="min-w-0 space-y-4">
          <AboutTeam team={team} />

          <KeyPlayers
            squadState={squadState}
            onViewAll={onOpenSquad}
          />
        </div>

        {/* RIGHT COLUMN */}

        <div className="min-w-0 space-y-4">
          <TeamKit team={team} />

          <Achievements
            achievements={team?.achievements || []}
          />
        </div>
      </div>

      {/* =====================================================
          MATCHES

          Desktop:
          Recent Matches 50% | Upcoming Matches 50%

          IMPORTANT:
          items-start prevents the shorter card from stretching
          to the height of the taller card.
      ====================================================== */}

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
            onViewAll={onOpenMatches}
          />
        </div>

        <div className="min-w-0">
          <MatchListCard
            title="Upcoming Matches"
            state={upcomingState}
            currentTeamId={teamId}
            type="upcoming"
            onViewAll={onOpenMatches}
          />
        </div>
      </div>
    </section>
  );
};

export default TeamOverview;
