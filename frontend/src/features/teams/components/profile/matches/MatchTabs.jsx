import {
  CalendarDays,
  Clock3,
  ListFilter,
  Radio,
} from "lucide-react";

/* =========================================================
   NORMAL TAB
========================================================= */

const TabButton = ({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex
        h-[36px]
        cursor-pointer
        items-center
        justify-center
        gap-2
        whitespace-nowrap
        rounded-md
        border
        px-4
        text-[10px]
        font-semibold
        transition-all
        duration-200
        xl:h-[38px]
        xl:text-[11px]

        ${
          active
            ? `
              border-[#078052]
              bg-[#078052]
              text-white
              shadow-[0_3px_10px_rgba(7,128,82,0.18)]
            `
            : `
              border-transparent
              bg-transparent
              text-[#68778c]
              hover:bg-[#f2f7f5]
              hover:text-[#078052]
            `
        }
      `}
    >
      <Icon
        size={14}
        strokeWidth={1.9}
      />

      <span>
        {label}
      </span>

      {typeof count === "number" && (
        <span
          className={`
            grid
            min-w-[19px]
            place-items-center
            rounded-full
            px-1.5
            py-[2px]
            text-[8px]
            font-bold

            ${
              active
                ? "bg-white/15 text-white"
                : "bg-[#e9efec] text-[#718096]"
            }
          `}
        >
          {count}
        </span>
      )}
    </button>
  );
};

/* =========================================================
   LIVE TAB
========================================================= */

const LiveTab = ({
  active,
  count,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex
        h-[36px]
        cursor-pointer
        items-center
        justify-center
        gap-2
        whitespace-nowrap
        rounded-md
        border
        px-4
        text-[10px]
        font-semibold
        transition-all
        duration-200
        xl:h-[38px]
        xl:text-[11px]

        ${
          active
            ? `
              border-[#df4242]
              bg-[#df4242]
              text-white
              shadow-[0_3px_10px_rgba(223,66,66,0.18)]
            `
            : `
              border-transparent
              bg-transparent
              text-[#df4242]
              hover:bg-[#fff0f0]
            `
        }
      `}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="
            absolute
            inline-flex
            h-full
            w-full
            animate-ping
            rounded-full
            bg-current
            opacity-40
          "
        />

        <span
          className="
            relative
            inline-flex
            h-2
            w-2
            rounded-full
            bg-current
          "
        />
      </span>

      Live

      <span
        className={`
          grid
          min-w-[19px]
          place-items-center
          rounded-full
          px-1.5
          py-[2px]
          text-[8px]
          font-bold

          ${
            active
              ? "bg-white/15 text-white"
              : "bg-[#fde8e8] text-[#df4242]"
          }
        `}
      >
        {count}
      </span>
    </button>
  );
};

/* =========================================================
   MATCH TABS
========================================================= */

const MatchTabs = ({
  activeTab,
  onChange,

  upcomingCount = 0,
  recentCount = 0,
  allCount = 0,
  liveCount = 0,
}) => {
  return (
    <div
      className="
        mt-5
        flex
        w-full
        items-center
        overflow-x-auto
        border-b
        border-[#e2e9e6]
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      <div
        className="
          flex
          min-w-max
          items-center
          gap-1
          pb-2
        "
      >
        {/* ===============================================
            LIVE

            IMPORTANT:
            Actual live match ho tabhi tab render hoga.
        ================================================ */}

        {liveCount > 0 && (
          <LiveTab
            active={activeTab === "live"}
            count={liveCount}
            onClick={() =>
              onChange("live")
            }
          />
        )}

        {/* ===============================================
            UPCOMING
        ================================================ */}

        <TabButton
          active={activeTab === "upcoming"}
          icon={CalendarDays}
          label="Upcoming Matches"
          count={upcomingCount}
          onClick={() =>
            onChange("upcoming")
          }
        />

        {/* ===============================================
            RECENT
        ================================================ */}

        <TabButton
          active={activeTab === "recent"}
          icon={Clock3}
          label="Recent Results"
          count={recentCount}
          onClick={() =>
            onChange("recent")
          }
        />

        {/* ===============================================
            ALL
        ================================================ */}

        <TabButton
          active={activeTab === "all"}
          icon={ListFilter}
          label="All Matches"
          count={allCount}
          onClick={() =>
            onChange("all")
          }
        />
      </div>
    </div>
  );
};

export default MatchTabs;