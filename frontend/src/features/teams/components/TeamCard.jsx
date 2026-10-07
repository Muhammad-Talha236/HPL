import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../../../assets/logo.png";
import { getTeamLocation } from "../utils/teamFormatters";

const TeamCard = ({ team }) => {
  const location =
    team.city ||
    getTeamLocation(team) ||
    "Hunza";

  return (
    <article
      className="
        group
        overflow-hidden
        rounded-xl
        border
        border-[#dfe8e4]
        bg-white
        shadow-[0_5px_18px_rgba(15,23,42,0.06)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_10px_28px_rgba(15,23,42,0.10)]
      "
    >
      {/* ================================
          IMAGE AREA
      ================================= */}
      <div className="relative h-[96px] overflow-visible bg-[#174e5c]">
        {/* Background mountains */}
        <div
          className="
            absolute
            inset-0
            overflow-hidden
            bg-[linear-gradient(180deg,#1d5865_0%,#164957_100%)]
          "
        >
          <div
            className="
              absolute
              bottom-0
              left-0
              h-[65px]
              w-[55%]
              bg-white/[0.10]
              [clip-path:polygon(0_100%,0_62%,18%_25%,37%_55%,58%_30%,100%_100%)]
            "
          />

          <div
            className="
              absolute
              bottom-0
              right-0
              h-[75px]
              w-[65%]
              bg-white/[0.11]
              [clip-path:polygon(0_100%,24%_55%,45%_78%,68%_12%,100%_100%)]
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-0
              h-[42px]
              w-full
              bg-[#0b3347]/60
              [clip-path:polygon(0_100%,0_70%,18%_28%,38%_78%,54%_45%,72%_78%,88%_35%,100%_70%,100%_100%)]
            "
          />
        </div>

        {/* HPL Logo */}
        <img
          src={logo}
          alt="HPL"
          className="
            absolute
            bottom-0
            left-1/2
            z-20
            h-[90px]
            w-[90px]
            -translate-x-1/2
            translate-y-[38%]
            object-contain
            drop-shadow-[0_5px_8px_rgba(0,0,0,0.18)]
            transition-transform
            duration-300
            group-hover:scale-105
          "
        />
      </div>

      {/* ================================
          CARD BODY
      ================================= */}
      <div className="px-3 pb-3 pt-[34px] text-center">
        {/* Team Name */}
        <h3
          className="
            truncate
            text-[15px]
            font-extrabold
            leading-5
            text-[#07182d]
          "
          title={team.name}
        >
          {team.name}
        </h3>

        {/* Location */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <MapPin
            size={13}
            strokeWidth={2}
            className="shrink-0 text-[#078052]"
          />

          <span
            className="
              truncate
              text-[12px]
              font-medium
              text-[#718096]
            "
            title={location}
          >
            {location}
          </span>
        </div>

        {/* View Team */}
        <Link
          to={`/teams/${team.team_id}`}
          className="
            mt-3
            flex
            h-[44px]
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-[#edf8f4]
            text-[12px]
            font-extrabold
            text-[#078052]
            transition-all
            duration-200
            hover:bg-[#078052]
            hover:text-white
          "
        >
          View Team

          <ArrowRight
            size={14}
            strokeWidth={2}
            className="
              transition-transform
              duration-200
              group-hover:translate-x-1
            "
          />
        </Link>
      </div>
    </article>
  );
};

export default TeamCard;