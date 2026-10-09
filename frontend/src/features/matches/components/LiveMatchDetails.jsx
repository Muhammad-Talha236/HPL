import { Activity } from "lucide-react";

import MatchDetailsScoreboard from "./MatchDetailsScoreboard";
import MatchInformation from "./MatchInformation";
import MatchLineups from "./MatchLineups";
import MatchStatistics from "./MatchStatistics";
import MatchTimeline from "./MatchTimeline";

const LiveMatchDetails = ({ detail }) => (
  <>
    <MatchDetailsScoreboard detail={detail} />
    <section className="mt-2 grid items-stretch gap-2 xl:grid-cols-[1.15fr_1fr_1fr_.95fr]" aria-label="Live match detail content">
      <article className="rounded-lg border border-[#e0e8e6] bg-white p-2.5 shadow-[0_3px_12px_rgba(15,23,42,.02)]"><h2 className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#1c2b43]"><Activity size={13} /> Match Timeline</h2><div className="mt-2"><MatchTimeline events={detail.events?.all} /></div></article>
      <MatchLineups squads={detail.squads} homeTeam={detail.home_team} awayTeam={detail.away_team} />
      <MatchInformation detail={detail} />
    </section>
    <MatchStatistics detail={detail} />
  </>
);

export default LiveMatchDetails;
