import { ArrowDownUp, CircleDot, Square } from "lucide-react";
import { Link } from "react-router-dom";

import { getEventLabel, getEventTime } from "../utils/matchFormatters";

const eventStyle = {
  GOAL: { className: "bg-[#eaf8f1] text-[#087d50]", icon: CircleDot },
  YELLOW_CARD: { className: "bg-[#fff5d8] text-[#b67900]", icon: Square },
  RED_CARD: { className: "bg-[#fee9eb] text-[#cf3544]", icon: Square },
  SUBSTITUTION: { className: "bg-[#eaf0fb] text-[#356cb2]", icon: ArrowDownUp },
};

const MatchTimeline = ({ events = [] }) => {
  if (!events.length) return <p className="rounded-md border border-dashed border-[#dce6e2] p-4 text-center text-[9px] text-[#738297]">No match events recorded yet.</p>;

  return (
    <div className="relative space-y-3 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-[#d7e5df]">
      {events.map((event) => {
        const style = eventStyle[event.event_type] || { className: "bg-[#eef2f4] text-[#637489]", icon: CircleDot };
        const Icon = style.icon;

        return (
          <article key={event.event_id} className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-2.5">
            <span className={`z-10 grid h-9 w-9 place-items-center rounded-full text-[9px] font-extrabold ${style.className}`}>{getEventTime(event)}</span>
            <div className="min-w-0 py-1">
              <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-[#26364d]"><Icon size={11} />{getEventLabel(event)}</span><span className="truncate text-[8px] text-[#738297]">{event.team?.name}</span></div>
              <p className="mt-1 text-[9px] text-[#526278]"><Link to={`/players/${event.player_id}`} className="font-bold hover:text-[#087d50]">{event.player?.name || "Player"}</Link>{event.event_type === "SUBSTITUTION" && event.related_player && <> <span className="text-[#95a1af]">for</span> <Link to={`/players/${event.related_player_id}`} className="font-bold hover:text-[#087d50]">{event.related_player.name}</Link></>}</p>
              {event.description && <p className="mt-1 text-[8px] leading-3 text-[#76869a]">{event.description}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default MatchTimeline;
