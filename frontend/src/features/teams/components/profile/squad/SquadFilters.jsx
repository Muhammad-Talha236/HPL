import {
  CalendarDays,
  ChevronDown,
  Search,
} from "lucide-react";

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
          h-10
          w-full
          cursor-pointer
          appearance-none
          rounded-lg
          border
          border-[#dfe7e3]
          bg-white
          pl-3
          pr-9
          text-[11px]
          font-semibold
          text-[#314158]
          outline-none
          transition-all
          hover:border-[#c9d8d1]
          focus:border-[#078052]
          focus:ring-2
          focus:ring-[#078052]/10
          sm:text-[12px]
        "
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

const SquadFilters = ({
  search,
  onSearchChange,

  position,
  onPositionChange,

  nationality,
  onNationalityChange,

  status,
  onStatusChange,

  season,
  onSeasonChange,

  nationalities = [],
  totalPlayers = 0,
}) => {
  return (
    <div>
      {/* =================================================
          TITLE + SEASON
      ================================================== */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <h1
            className="
              text-[22px]
              font-bold
              tracking-[-0.03em]
              text-[#07182d]
              sm:text-[24px]
              lg:text-[26px]
            "
          >
            Squad
          </h1>

          <span
            className="
              mt-2
              block
              h-[2px]
              w-9
              bg-[#e5a329]
            "
          />
        </div>

        {/* SEASON */}

        <div
          className="
            relative
            w-full
            sm:w-[150px]
          "
        >
          <CalendarDays
            size={14}
            strokeWidth={1.8}
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              z-10
              -translate-y-1/2
              text-[#65758b]
            "
          />

          <select
            value={season}
            onChange={(event) =>
              onSeasonChange(event.target.value)
            }
            aria-label="Select season"
            className="
              h-10
              w-full
              cursor-pointer
              appearance-none
              rounded-lg
              border
              border-[#dfe7e3]
              bg-white
              pl-9
              pr-8
              text-[11px]
              font-semibold
              text-[#314158]
              outline-none
              transition-all
              hover:border-[#c9d8d1]
              focus:border-[#078052]
              focus:ring-2
              focus:ring-[#078052]/10
              sm:text-[12px]
            "
          >
            <option value="2026">
              Season 2026
            </option>

            <option value="2025">
              Season 2025
            </option>
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
      </div>

      {/* =================================================
          MAIN FILTER ROW
      ================================================== */}

      <div
        className="
          mt-4
          grid
          gap-3
          lg:grid-cols-[minmax(240px,1.5fr)_minmax(135px,.7fr)_minmax(150px,.8fr)_minmax(135px,.7fr)_auto]
          lg:items-center
        "
      >
        {/* SEARCH */}

        <div className="relative min-w-0">
          <Search
            size={15}
            strokeWidth={1.8}
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[#718096]
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search players by name or number..."
            className="
              h-10
              w-full
              rounded-lg
              border
              border-[#dfe7e3]
              bg-white
              pl-9
              pr-3
              text-[11px]
              font-medium
              text-[#26364d]
              outline-none
              transition-all
              placeholder:text-[#96a1b1]
              hover:border-[#c9d8d1]
              focus:border-[#078052]
              focus:ring-2
              focus:ring-[#078052]/10
              sm:text-[12px]
            "
          />
        </div>

        {/* POSITION */}

        <FilterSelect
          value={position}
          onChange={onPositionChange}
          ariaLabel="Filter by position"
        >
          <option value="ALL">
            All Positions
          </option>

          <option value="GK">
            Goalkeepers
          </option>

          <option value="DF">
            Defenders
          </option>

          <option value="MF">
            Midfielders
          </option>

          <option value="FW">
            Forwards
          </option>
        </FilterSelect>

        {/* NATIONALITY */}

        <FilterSelect
          value={nationality}
          onChange={onNationalityChange}
          ariaLabel="Filter by nationality"
        >
          <option value="ALL">
            All Nationalities
          </option>

          {nationalities.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </FilterSelect>

        {/* STATUS */}

        <FilterSelect
          value={status}
          onChange={onStatusChange}
          ariaLabel="Filter by player status"
        >
          <option value="ALL">
            All Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </FilterSelect>

        {/* TOTAL */}

        <div
          className="
            flex
            min-h-10
            items-center
            justify-start
            whitespace-nowrap
            text-[11px]
            text-[#66758a]
            lg:justify-end
            sm:text-[12px]
          "
        >
          Total Players:
          <strong className="ml-1 text-[#07182d]">
            {totalPlayers}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default SquadFilters;