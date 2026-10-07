import {
  MapPin,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../../../../assets/logo.png";
import { getTeamLocation } from "../../utils/teamFormatters";

/* =========================================================
   HERO STAT
========================================================= */

const HeroStat = ({ icon: Icon, value, label }) => {
  return (
    <div className="flex min-w-[92px] items-center gap-2.5">
      <Icon
        size={27}
        strokeWidth={2.3}
        className="shrink-0 text-[#f4a91f]"
      />

      <div>
        <p className="text-[19px] font-extrabold leading-none text-white">
          {value}
        </p>

        <p className="mt-1 text-[9px] font-medium text-white/65">
          {label}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   TEAM PROFILE HERO
========================================================= */

const TeamProfileHero = ({
  team,
  playerCount = 0,
  matchCount = 0,
}) => {
  const location =
    getTeamLocation(team) ||
    team?.city ||
    "Hunza";

  const competition =
    team?.competition?.name ||
    team?.club?.name ||
    "Premier League";

  const founded =
    team?.founded_year ||
    team?.founded ||
    "—";

  return (
    <section
      className="
        relative
        h-[255px]
        overflow-hidden
        bg-[#061923]
        text-white
        sm:h-[265px]
        lg:h-[275px]
      "
    >
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0">

        {/* Base */}

        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(90deg,#071e2a_0%,#0a2835_48%,#05151e_100%)]
          "
        />

        {/* Back mountain */}

        <div
          className="
            absolute
            bottom-0
            left-0
            h-[72%]
            w-[70%]
            bg-[#123845]
            opacity-55
            [clip-path:polygon(0_100%,0_72%,8%_57%,16%_66%,26%_30%,35%_62%,45%_35%,55%_69%,66%_44%,77%_71%,87%_52%,100%_77%,100%_100%)]
          "
        />

        {/* Front mountain */}

        <div
          className="
            absolute
            bottom-0
            left-0
            h-[50%]
            w-[72%]
            bg-[#092d39]
            opacity-90
            [clip-path:polygon(0_100%,0_78%,11%_57%,21%_76%,33%_43%,46%_79%,58%_55%,71%_79%,84%_61%,100%_84%,100%_100%)]
          "
        />

        {/* Gold diagonal */}

        <div
          className="
            absolute
            -top-[130px]
            left-[58%]
            hidden
            h-[520px]
            w-[24px]
            rotate-[17deg]
            bg-[linear-gradient(180deg,#d39b2c,#8e641b)]
            opacity-70
            lg:block
          "
        />

        {/* Right dark treatment */}

        <div
          className="
            absolute
            right-0
            top-0
            hidden
            h-full
            w-[38%]
            bg-[radial-gradient(circle_at_45%_45%,rgba(255,255,255,0.07),transparent_60%)]
            lg:block
          "
        />

        <div className="absolute inset-0 bg-black/[0.08]" />
      </div>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          h-full
          w-full
          max-w-[1500px]
          px-5
          sm:px-7
          lg:px-10
        "
      >

        {/* ===================================================
            BREADCRUMB
        ==================================================== */}

        <div
          className="
            flex
            h-[42px]
            items-center
            gap-2
            text-[10px]
            font-medium
            text-white/65
          "
        >
          <Link
            to="/"
            className="transition hover:text-white"
          >
            Home
          </Link>

          <span className="text-white/35">
            ›
          </span>

          <Link
            to="/teams"
            className="transition hover:text-white"
          >
            Teams
          </Link>

          <span className="text-white/35">
            ›
          </span>

          <span className="text-white/90">
            {team?.name}
          </span>
        </div>

        {/* ===================================================
            HERO BODY
        ==================================================== */}

        <div className="relative flex h-[185px] items-center">

          {/* =================================================
              TEAM CREST
          ================================================== */}

          <div
            className="
              flex
              w-[150px]
              shrink-0
              items-center
              justify-center
              sm:w-[170px]
            "
          >
            <img
              src={team?.logo || logo}
              alt={`${team?.name || "Team"} logo`}
              className="
                h-[135px]
                w-[135px]
                object-contain
                drop-shadow-[0_10px_20px_rgba(0,0,0,0.40)]
                sm:h-[145px]
                sm:w-[145px]
              "
              onError={(event) => {
                event.currentTarget.src = logo;
              }}
            />
          </div>

          {/* =================================================
              TEAM INFORMATION
          ================================================== */}

          <div className="min-w-0 pl-2 sm:pl-4">

            {/* Team name */}

            <div className="flex items-start gap-2">

              <h1
                className="
                  text-[29px]
                  font-black
                  leading-[1]
                  tracking-[-0.035em]
                  text-white
                  sm:text-[34px]
                  lg:text-[38px]
                "
              >
                {team?.name}
              </h1>

              <span
                className="
                  -mt-3
                  text-[19px]
                  text-[#f2a91e]
                "
              >
                ★
              </span>

            </div>

            {/* Location */}

            <div
              className="
                mt-3
                flex
                flex-wrap
                items-center
                gap-x-3
                gap-y-2
                text-[11px]
                font-medium
                text-white/85
              "
            >

              <span className="inline-flex items-center gap-1.5">

                <MapPin
                  size={14}
                  strokeWidth={2.2}
                  className="text-[#f2a91e]"
                />

                {location}

              </span>

              <span className="h-3 w-px bg-white/25" />

              <span className="inline-flex items-center gap-1.5">

                <span
                  className="
                    grid
                    h-[14px]
                    w-[19px]
                    place-items-center
                    rounded-[1px]
                    bg-[#078052]
                    text-[7px]
                    text-white
                  "
                >
                  ★
                </span>

                Pakistan

              </span>

            </div>

            {/* Competition */}

            <span
              className="
                mt-3
                inline-flex
                rounded-full
                border
                border-white/10
                bg-white/10
                px-3
                py-[5px]
                text-[9px]
                font-semibold
                leading-none
                text-white
              "
            >
              {competition}
            </span>

            {/* Tagline */}

            <p
              className="
                mt-4
                font-serif
                text-[16px]
                italic
                leading-none
                text-white/90
              "
            >
              “More Than A Team”
            </p>

          </div>

          {/* =================================================
              HERO STATS
          ================================================== */}

          <div
            className="
              ml-auto
              mr-[130px]
              hidden
              items-center
              lg:flex
            "
          >

            <div className="flex items-center">

              <HeroStat
                icon={Users}
                value={playerCount}
                label="Players"
              />

              <span
                className="
                  mx-5
                  h-[35px]
                  w-px
                  bg-white/15
                "
              />

              <HeroStat
                icon={Trophy}
                value={matchCount}
                label="Matches"
              />

              <span
                className="
                  mx-5
                  h-[35px]
                  w-px
                  bg-white/15
                "
              />

              <HeroStat
                icon={Shield}
                value={founded}
                label="Founded"
              />

            </div>

          </div>

          {/* =================================================
              PRIDE / UNITY / HUNZA
          ================================================== */}

          <div
            className="
              absolute
              right-0
              top-1/2
              hidden
              -translate-y-1/2
              xl:block
            "
          >

            <div
              className="
                space-y-4
                text-right
                text-[8px]
                font-bold
                uppercase
                tracking-[0.42em]
                text-white/80
              "
            >
              <p>Pride</p>
              <p>Unity</p>
              <p>Hunza</p>
            </div>

            <span
              className="
                ml-auto
                mt-4
                block
                h-[2px]
                w-8
                bg-[#e4a32b]
              "
            />

          </div>

        </div>

      </div>
    </section>
  );
};

export default TeamProfileHero;