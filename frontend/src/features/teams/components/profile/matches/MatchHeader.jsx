import {
  ChevronDown,
  CircleDot,
  Handshake,
  ShieldX,
  Trophy,
} from "lucide-react";

/* =========================================================
   FILTER SELECT
========================================================= */

const FilterSelect = ({
  value,
  onChange,
  children,
  ariaLabel,
  icon: Icon,
}) => {
  return (
    <div className="relative min-w-0">
      {Icon && (
        <Icon
          size={14}
          strokeWidth={1.9}
          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-[#53647c]
          "
        />
      )}

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className={`
          h-[38px]
          w-full
          cursor-pointer
          appearance-none
          rounded-lg
          border
          border-[#dfe7e3]
          bg-white
          pr-9
          text-[11px]
          font-semibold
          text-[#25364d]
          outline-none
          transition-all
          hover:border-[#c7d6cf]
          focus:border-[#078052]
          focus:ring-2
          focus:ring-[#078052]/10
          xl:h-[40px]
          xl:text-[12px]

          ${
            Icon
              ? "pl-9"
              : "pl-3.5"
          }
        `}
      >
        {children}
      </select>

      <ChevronDown
        size={14}
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
        min-w-[76px]
        flex-1
        items-center
        justify-center
        gap-2
        px-2
      "
    >
      <Icon
        size={18}
        strokeWidth={2}
        className={`shrink-0 ${iconClassName}`}
      />

      <div className="min-w-0">
        <strong
          className="
            block
            text-[14px]
            font-extrabold
            leading-none
            text-[#07182d]
            xl:text-[15px]
          "
        >
          {value}
        </strong>

        <span
          className="
            mt-1
            block
            whitespace-nowrap
            text-[8px]
            font-medium
            leading-none
            text-[#8491a1]
            xl:text-[9px]
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
    <span
      className="
        hidden
        h-8
        w-px
        shrink-0
        bg-[#e5ebe8]
        sm:block
      "
    />
  );
};

/* =========================================================
   MATCH HEADER
========================================================= */

const MatchHeader = ({
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
      {/* =================================================
          TOP FILTER ROW
      ================================================== */}

      <div
        className="
          flex
          w-full
          justify-end
        "
      >
        <div
          className="
            grid
            w-full
            grid-cols-1
            gap-2
            sm:w-auto
            sm:grid-cols-2
          "
        >
          <div className="sm:w-[170px]">
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
          </div>

          <div className="sm:w-[190px]">
            <FilterSelect
              value={competition}
              onChange={onCompetitionChange}
              ariaLabel="Filter by competition"
              icon={Trophy}
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
        </div>
      </div>

      {/* =================================================
          TITLE + STATS ROW
      ================================================== */}

      <div
        className="
          mt-4
          flex
          min-w-0
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        {/* ===============================================
            TITLE
        ================================================ */}

        <div
          className="
            flex
            min-w-0
            items-start
            gap-5
          "
        >
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
                mt-2.5
                block
                h-[2px]
                w-[58px]
                bg-[#e5a329]
              "
            />
          </div>

          <p
            className="
              max-w-[280px]
              pt-0.5
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

        {/* ===============================================
            STATISTICS
        ================================================ */}

        <div
          className="
            grid
            w-full
            grid-cols-3
            items-center
            gap-y-3
            rounded-lg
            border
            border-[#e3eae7]
            bg-white
            px-2
            py-3
            shadow-[0_2px_10px_rgba(15,23,42,0.025)]

            sm:grid-cols-6
            lg:w-auto
            lg:min-w-[560px]
            lg:flex
            lg:py-2.5
            xl:min-w-[610px]
          "
        >
          <StatItem
            icon={Trophy}
            value={stats?.played ?? 0}
            label="Played"
            iconClassName="text-[#53647c]"
          />

          <Divider />

          <StatItem
            icon={Trophy}
            value={stats?.wins ?? 0}
            label="Wins"
            iconClassName="text-[#078052]"
          />

          <Divider />

          <StatItem
            icon={Handshake}
            value={stats?.draws ?? 0}
            label="Draws"
            iconClassName="text-[#e5a329]"
          />

          <Divider />

          <StatItem
            icon={ShieldX}
            value={stats?.losses ?? 0}
            label="Losses"
            iconClassName="text-[#e84d4d]"
          />

          <Divider />

          <StatItem
            icon={CircleDot}
            value={stats?.goalsFor ?? 0}
            label="Goals For"
            iconClassName="text-[#52647e]"
          />

          <Divider />

          <StatItem
            icon={CircleDot}
            value={stats?.goalsAgainst ?? 0}
            label="Goals Against"
            iconClassName="text-[#52647e]"
          />
        </div>
      </div>
    </div>
  );
};

export default MatchHeader;