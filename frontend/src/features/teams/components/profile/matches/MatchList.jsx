import {
  CalendarDays,
  Radio,
} from "lucide-react";

import MatchPagination from "./MatchPagination";
import TeamMatchCard from "./TeamMatchCard";

/* =========================================================
   TAB DETAILS
========================================================= */

const getListDetails = (
  activeTab
) => {
  switch (activeTab) {
    case "live":
      return {
        title: "Live Matches",
        icon: Radio,
        iconClassName:
          "text-[#df4242]",
      };

    case "recent":
      return {
        title: "Recent Results",
        icon: CalendarDays,
        iconClassName:
          "text-[#078052]",
      };

    case "all":
      return {
        title: "All Matches",
        icon: CalendarDays,
        iconClassName:
          "text-[#078052]",
      };

    default:
      return {
        title: "Upcoming Matches",
        icon: CalendarDays,
        iconClassName:
          "text-[#078052]",
      };
  }
};

/* =========================================================
   MATCH LIST
========================================================= */

const MatchList = ({
  matches,
  currentTeamId,
  activeTab,

  currentPage,
  totalPages,
  totalItems,
  pageSize,

  onPageChange,
}) => {
  const details =
    getListDetails(activeTab);

  const Icon =
    details.icon;

  return (
    <section
      className="
        mt-4
        overflow-hidden
        rounded-xl
        border
        border-[#e1e8e5]
        bg-white
        shadow-[0_3px_14px_rgba(15,23,42,0.035)]
      "
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <div
        className="
          flex
          min-h-[54px]
          items-center
          justify-between
          gap-4
          border-b
          border-[#edf1ef]
          px-4
          lg:px-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2.5
          "
        >
          <Icon
            size={17}
            strokeWidth={2}
            className={
              details.iconClassName
            }
          />

          <h2
            className="
              text-[15px]
              font-bold
              text-[#07182d]
              lg:text-[16px]
              xl:text-[17px]
            "
          >
            {details.title}
          </h2>

          {activeTab === "live" && (
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-[#fde9e9]
                px-2
                py-1
                text-[8px]
                font-extrabold
                uppercase
                tracking-[0.07em]
                text-[#df4242]
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  animate-pulse
                  rounded-full
                  bg-[#df4242]
                "
              />

              Live
            </span>
          )}
        </div>

        <span
          className="
            text-[10px]
            font-semibold
            text-[#8491a1]
            xl:text-[11px]
          "
        >
          {totalItems}{" "}
          {totalItems === 1
            ? "Match"
            : "Matches"}
        </span>
      </div>

      {/* =================================================
          EMPTY
      ================================================== */}

      {matches.length === 0 && (
        <div
          className="
            grid
            min-h-[230px]
            place-items-center
            px-5
            text-center
          "
        >
          <div>
            <CalendarDays
              size={30}
              strokeWidth={1.5}
              className="
                mx-auto
                text-[#a4b0aa]
              "
            />

            <h3
              className="
                mt-3
                text-[14px]
                font-bold
                text-[#07182d]
              "
            >
              No matches found
            </h3>

            <p
              className="
                mt-1.5
                text-[11px]
                text-[#7c8999]
              "
            >
              There are no matches available in this section.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          MATCHES
      ================================================== */}

      {matches.length > 0 && (
        <>
          <div>
            {matches.map(
              (match, index) => (
                <TeamMatchCard
                  key={
                    match?.match_id ||
                    match?.id ||
                    index
                  }
                  match={match}
                  currentTeamId={
                    currentTeamId
                  }
                />
              )
            )}
          </div>

          <MatchPagination
            currentPage={
              currentPage
            }
            totalPages={
              totalPages
            }
            totalItems={
              totalItems
            }
            pageSize={
              pageSize
            }
            onPageChange={
              onPageChange
            }
          />
        </>
      )}
    </section>
  );
};

export default MatchList;