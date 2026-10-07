import {
  ChevronDown,
  Handshake,
  ShieldX,
  Trophy,
  CircleDot,
} from "lucide-react";

/* =========================================================
   FILTER SELECT
========================================================= */

const FilterSelect = ({
  value,
  onChange,
  children,
  ariaLabel,
}) => {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="
          h-[44px]
          w-full
          cursor-pointer
          appearance-none
          rounded-lg
          border
          border-[#dfe7e3]
          bg-white
          pl-4
          pr-9
          text-[12px]
          font-semibold
          text-[#25364d]
          outline-none
          transition-all
          hover:border-[#c8d6d0]
          focus:border-[#078052]
          focus:ring-2
          focus:ring-[#078052]/10
        "
      >
        {children}
      </select>

      <ChevronDown
        size={15}
        strokeWidth={1.8}
        className="
          pointer-events-none
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          text-[#718096]
        "
      />
    </div>
  );
};

/* =========================================================
   STAT ITEM
========================================================= */

const StatItem = ({
  icon: Icon,
  value,
  label,
  iconClassName,
}) => {
  return (
    <div
      className="
        flex
        min-w-0
        flex-1
        items-center
        justify-center
        gap-2
        px-2
      "
    >
      <Icon
        size={20}
        strokeWidth={2}
        className={`shrink-0 ${iconClassName}`}
      />

      <div className="min-w-0">
        <strong
          className="
            block
            text-[15px]
            font-extrabold
            leading-none
            text-[#07182d]
          "
        >
          {value}
        </strong>

        <span
          className="
            mt-1
            block
            whitespace-nowrap
            text-[9px]
            font-medium
            leading-none
            text-[#8491a1]
          "
        >
          {label}
        </span>
      </div>
    </div>
  );
};

/* =========================================================
   GOAL STAT
========================================================= */

const GoalStat = ({
  value,
  label,
}) => {
  return (
    <div
      className="
        flex
        min-w-0
        flex-1
        items-center
        justify-center
        gap-2
        px-2
      "
    >
      <CircleDot
        size={20}
        strokeWidth={2}
        className="shrink-0 text-[#52647e]"
      />

      <div className="min-w-0">
        <strong
          className="
            block
            text-[15px]
            font-extrabold
            leading-none
            text-[#07182d]
          "
        >
          {value}
        </strong>

        <span
          className="
            mt-1
            block
            whitespace-nowrap
            text-[9px]
            font-medium
            leading-none
            text-[#8491a1]
          "
        >
          {label}
        </span>
      </div>
    </div>
  );
};

/* =========================================================
   DIVIDER
========================================================= */

const Divider = () => {
  return (
    <div
      className="
        hidden
        h-8
        w-px
        shrink-0
        bg-[#e3eae7]
        2xl:block
      "
    />
  );
};

/* =========================================================
   MATCH FILTERS
========================================================= */

const MatchFilters = ({
  season,
  onSeasonChange,

  competition,
  onCompetitionChange,

  seasons = [],
  competitions = [],

  stats,
}) => {
  return (
    <div className="w-full min-w-0">
      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-5

          2xl:flex-row
          2xl:items-center
          2xl:gap-5
        "
      >
        {/* =================================================
            TITLE + DESCRIPTION
        ================================================== */}

        <div
          className="
            flex
            min-w-0
            shrink-0
            items-center
            gap-5
            2xl:w-[390px]
          "
        >
          {/* TITLE */}

          <div className="shrink-0">
            <h1
              className="
                text-[28px]
                font-extrabold
                leading-none
                tracking-[-0.04em]
                text-[#07182d]
                lg:text-[30px]
                xl:text-[32px]
              "
            >
              Matches
            </h1>

            <span
              className="
                mt-3
                block
                h-[2px]
                w-[64px]
                bg-[#e5a329]
              "
            />
          </div>

          {/* DESCRIPTION */}

          <p
            className="
              max-w-[225px]
              text-[10px]
              font-medium
              leading-[16px]
              text-[#718096]
              xl:text-[11px]
              xl:leading-[17px]
            "
          >
            Follow upcoming fixtures and recent results
            across all competitions.
          </p>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div
          className="
            flex
            min-w-0
            flex-1
            flex-col
            gap-3

            lg:flex-row
            lg:items-center
          "
        >
          {/* ===============================================
              FILTERS
          ================================================ */}

          <div
            className="
              grid
              w-full
              shrink-0
              grid-cols-1
              gap-2.5
              sm:grid-cols-2
              lg:w-[370px]
              xl:w-[390px]
            "
          >
            <FilterSelect
              value={season}
              onChange={onSeasonChange}
              ariaLabel="Filter by season"
            >
              <option value="ALL">
                All Seasons
              </option>

              {seasons.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={competition}
              onChange={onCompetitionChange}
              ariaLabel="Filter by competition"
            >
              <option value="ALL">
                All Competitions
              </option>

              {competitions.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </FilterSelect>
          </div>

          {/* ===============================================
              STATS
          ================================================ */}

          <div
            className="
              grid
              min-h-[64px]
              min-w-0
              flex-1
              grid-cols-3
              items-center
              gap-y-4
              rounded-xl
              border
              border-[#e1e8e5]
              bg-white
              px-2
              py-3
              shadow-[0_3px_12px_rgba(15,23,42,0.03)]

              sm:grid-cols-6
              lg:flex
              lg:min-h-[64px]
              lg:py-0
            "
          >
            <StatItem
              icon={Trophy}
              value={stats.played}
              label="Played"
              iconClassName="text-[#65758b]"
            />

            <Divider />

            <StatItem
              icon={Trophy}
              value={stats.wins}
              label="Wins"
              iconClassName="text-[#078052]"
            />

            <Divider />

            <StatItem
              icon={Handshake}
              value={stats.draws}
              label="Draws"
              iconClassName="text-[#e5a329]"
            />

            <Divider />

            <StatItem
              icon={ShieldX}
              value={stats.losses}
              label="Losses"
              iconClassName="text-[#e34d4d]"
            />

            <Divider />

            <GoalStat
              value={stats.goalsFor}
              label="Goals For"
            />

            <Divider />

            <GoalStat
              value={stats.goalsAgainst}
              label="Goals Against"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchFilters;