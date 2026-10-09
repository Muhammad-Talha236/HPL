import { Activity } from "lucide-react";

import MatchDetailsScoreboard from "./MatchDetailsScoreboard";
import MatchInformation from "./MatchInformation";
import MatchLineups from "./MatchLineups";
import MatchStatistics from "./MatchStatistics";
import MatchTimeline from "./MatchTimeline";

const StandardMatchDetails = ({ detail }) => {
  const hasEvents = detail.events?.all?.length > 0;
  const hasPlayers = detail.squads?.home?.total || detail.squads?.away?.total;

  return (
    <>
      <MatchDetailsScoreboard detail={detail} />
      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          {hasEvents && <article className="rounded-lg border border-[#e0e8e6] bg-white p-3"><h2 className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#1c2b43]"><Activity size={14} /> Match Timeline</h2><div className="mt-3"><MatchTimeline events={detail.events.all} /></div></article>}
          {hasPlayers && <div className="grid gap-3 md:grid-cols-2"><MatchLineups squads={detail.squads} homeTeam={detail.home_team} awayTeam={detail.away_team} /></div>}
        </div>
        <MatchInformation detail={detail} />
      </section>
      {detail.match?.status === "COMPLETED" && <MatchStatistics detail={detail} />}
    </>
  );
};

export default StandardMatchDetails;
