import { Activity, Shield } from "lucide-react";
import { Link } from "react-router-dom";

/* =========================================================
   PLAYER CAREER JOURNEY

   Expected backend structure:

   career: [
     {
       season: {
         season_id,
         name
       },
       team: {
         team_id,
         name,
         logo
       },
       competition: {
         competition_id,
         name
       },
       matches_played,
       goals,
       assists
     }
   ]
========================================================= */

const PlayerCareerJourney = ({ career = [] }) => {
  if (!Array.isArray(career) || career.length === 0) {
    return (
      <section className="mt-5 rounded-xl border border-[#e1e8e5] bg-white shadow-[0_3px_14px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5 border-b border-[#edf1ef] px-5 py-4 sm:px-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff7e6] text-[#e5a329]">
            <Activity size={17} strokeWidth={1.9} />
          </div>
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#07182d] sm:text-[17px]">Career Journey</h2>
            <p className="mt-0.5 text-[9px] font-medium text-[#8a96a5] sm:text-[10px]">Competition history and match performance</p>
          </div>
        </div>
        <p className="px-5 py-8 text-center text-[12px] font-medium text-[#718096] sm:px-6">No career records available yet.</p>
      </section>
    );
  }

  return (
    <section
      className="
        mt-5
        overflow-hidden
        rounded-xl
        border
        border-[#e1e8e5]
        bg-white
        shadow-[0_3px_14px_rgba(15,23,42,0.03)]
      "
    >
      {/* ===================================================
          HEADER
      ==================================================== */}

      <div
        className="
          flex
          items-center
          gap-2.5
          border-b
          border-[#edf1ef]
          px-5
          py-4
          sm:px-6
        "
      >
        <div
          className="
            grid
            h-8
            w-8
            place-items-center
            rounded-lg
            bg-[#fff7e6]
            text-[#e5a329]
          "
        >
          <Activity
            size={17}
            strokeWidth={1.9}
          />
        </div>

        <div>
          <h2
            className="
              text-[16px]
              font-bold
              tracking-[-0.02em]
              text-[#07182d]
              sm:text-[17px]
            "
          >
            Career Journey
          </h2>

          <p
            className="
              mt-0.5
              text-[9px]
              font-medium
              text-[#8a96a5]
              sm:text-[10px]
            "
          >
            Competition history and match performance
          </p>
        </div>
      </div>

      {/* ===================================================
          DESKTOP TABLE
      ==================================================== */}

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[720px] px-5 pb-4 pt-3 sm:px-6">
          {/* TABLE HEADER */}

          <div
            className="
              grid
              grid-cols-[170px_minmax(190px,1fr)_minmax(180px,1fr)_80px_70px_70px]
              items-center
              rounded-lg
              bg-[#f7f9f8]
              px-4
              py-3
              text-[9px]
              font-bold
              uppercase
              tracking-[0.04em]
              text-[#8793a2]
            "
          >
            <span>Season</span>

            <span>Team</span>

            <span>Competition</span>

            <span className="text-center">
              MP
            </span>

            <span className="text-center">
              G
            </span>

            <span className="text-center">
              A
            </span>
          </div>

          {/* =================================================
              CAREER ROWS
          ================================================== */}

          <div className="relative">
            {/* TIMELINE LINE */}

            <div
              className="
                absolute
                bottom-[31px]
                left-[19px]
                top-[31px]
                w-[2px]
                bg-[#f0d58c]
              "
            />

            {career.map((item, index) => {
              const season =
                item?.season?.name || "—";

              const team =
                item?.team || null;

              const competition =
                item?.competition || null;

              const matchesPlayed =
                item?.matches_played ?? 0;

              const goals =
                item?.goals ?? 0;

              /*
               * Assists are not currently supported
               * by our database schema.
               *
               * Backend returns null.
               */
              const assists =
                item?.assists ?? "—";

              return (
                <div
                  key={
                    `${item?.season?.season_id || "season"}-${
                      item?.competition?.competition_id ||
                      "competition"
                    }-${item?.team?.team_id || index}`
                  }
                  className="
                    relative
                    grid
                    min-h-[70px]
                    grid-cols-[170px_minmax(190px,1fr)_minmax(180px,1fr)_80px_70px_70px]
                    items-center
                    border-b
                    border-[#edf1ef]
                    px-4
                    text-[11px]
                    last:border-b-0
                  "
                >
                  {/* =========================================
                      TIMELINE DOT
                  ========================================== */}

                  <span
                    className="
                      absolute
                      left-[14px]
                      top-1/2
                      z-10
                      h-[12px]
                      w-[12px]
                      -translate-y-1/2
                      rounded-full
                      border-[3px]
                      border-white
                      bg-[#efb83f]
                      shadow-[0_0_0_1px_rgba(229,163,41,0.25)]
                    "
                  />

                  {/* =========================================
                      SEASON
                  ========================================== */}

                  <div className="pl-7">
                    <span
                      className="
                        font-bold
                        text-[#25364d]
                      "
                    >
                      {season}
                    </span>
                  </div>

                  {/* =========================================
                      TEAM
                  ========================================== */}

                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2.5
                    "
                  >
                    <div
                      className="
                        grid
                        h-9
                        w-9
                        shrink-0
                        place-items-center
                        overflow-hidden
                        rounded-lg
                        border
                        border-[#e7ecea]
                        bg-[#f8faf9]
                      "
                    >
                      {team?.logo ? (
                        <img
                          src={team.logo}
                          alt={team?.name || "Team"}
                          className="
                            h-full
                            w-full
                            object-contain
                            p-1
                          "
                        />
                      ) : (
                        <Shield
                          size={17}
                          strokeWidth={1.6}
                          className="text-[#9aa5b2]"
                        />
                      )}
                    </div>

                    {team?.team_id ? (
                      <Link
                        to={`/teams/${team.team_id}`}
                        className="
                          truncate
                          cursor-pointer
                          font-semibold
                          text-[#25364d]
                          transition-colors
                          hover:text-[#078052]
                        "
                      >
                        {team?.name || "Team"}
                      </Link>
                    ) : (
                      <span
                        className="
                          truncate
                          font-semibold
                          text-[#25364d]
                        "
                      >
                        {team?.name || "—"}
                      </span>
                    )}
                  </div>

                  {/* =========================================
                      COMPETITION
                  ========================================== */}

                  <div className="min-w-0">
                    <span
                      className="
                        block
                        truncate
                        font-medium
                        text-[#59697e]
                      "
                    >
                      {competition?.name || "—"}
                    </span>
                  </div>

                  {/* =========================================
                      MATCHES PLAYED
                  ========================================== */}

                  <div className="text-center">
                    <span
                      className="
                        inline-flex
                        min-w-[28px]
                        justify-center
                        font-bold
                        text-[#25364d]
                      "
                    >
                      {matchesPlayed}
                    </span>
                  </div>

                  {/* =========================================
                      GOALS
                  ========================================== */}

                  <div className="text-center">
                    <span
                      className="
                        inline-flex
                        min-w-[28px]
                        justify-center
                        font-bold
                        text-[#078052]
                      "
                    >
                      {goals}
                    </span>
                  </div>

                  {/* =========================================
                      ASSISTS
                  ========================================== */}

                  <div className="text-center">
                    <span
                      className="
                        inline-flex
                        min-w-[28px]
                        justify-center
                        font-semibold
                        text-[#8793a2]
                      "
                    >
                      {assists}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================
          MOBILE VERSION
      ==================================================== */}

      <div
        className="
          space-y-3
          p-4
          md:hidden
        "
      >
        {career.map((item, index) => {
          const team =
            item?.team || null;

          const competition =
            item?.competition || null;

          return (
            <article
              key={
                `${item?.season?.season_id || "season"}-${
                  item?.competition?.competition_id ||
                  "competition"
                }-${item?.team?.team_id || index}`
              }
              className="
                rounded-xl
                border
                border-[#e5ebe8]
                bg-[#fbfcfc]
                p-4
              "
            >
              {/* TOP */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      grid
                      h-10
                      w-10
                      shrink-0
                      place-items-center
                      overflow-hidden
                      rounded-lg
                      border
                      border-[#e5ebe8]
                      bg-white
                    "
                  >
                    {team?.logo ? (
                      <img
                        src={team.logo}
                        alt={team?.name || "Team"}
                        className="
                          h-full
                          w-full
                          object-contain
                          p-1
                        "
                      />
                    ) : (
                      <Shield
                        size={18}
                        strokeWidth={1.6}
                        className="text-[#9aa5b2]"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    {team?.team_id ? (
                      <Link
                        to={`/teams/${team.team_id}`}
                        className="
                          block
                          truncate
                          text-[12px]
                          font-bold
                          text-[#07182d]
                          hover:text-[#078052]
                        "
                      >
                        {team?.name || "Team"}
                      </Link>
                    ) : (
                      <p
                        className="
                          truncate
                          text-[12px]
                          font-bold
                          text-[#07182d]
                        "
                      >
                        {team?.name || "—"}
                      </p>
                    )}

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[9px]
                        font-medium
                        text-[#8793a2]
                      "
                    >
                      {competition?.name ||
                        "Competition unavailable"}
                    </p>
                  </div>
                </div>

                <span
                  className="
                    shrink-0
                    rounded-md
                    bg-[#fff7e6]
                    px-2.5
                    py-1.5
                    text-[9px]
                    font-bold
                    text-[#b67b0d]
                  "
                >
                  {item?.season?.name || "—"}
                </span>
              </div>

              {/* STATS */}

              <div
                className="
                  mt-4
                  grid
                  grid-cols-3
                  overflow-hidden
                  rounded-lg
                  border
                  border-[#e7ecea]
                  bg-white
                "
              >
                <div
                  className="
                    border-r
                    border-[#e7ecea]
                    px-2
                    py-2.5
                    text-center
                  "
                >
                  <strong
                    className="
                      block
                      text-[13px]
                      text-[#07182d]
                    "
                  >
                    {item?.matches_played ?? 0}
                  </strong>

                  <span
                    className="
                      mt-0.5
                      block
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[#8a96a5]
                    "
                  >
                    Matches
                  </span>
                </div>

                <div
                  className="
                    border-r
                    border-[#e7ecea]
                    px-2
                    py-2.5
                    text-center
                  "
                >
                  <strong
                    className="
                      block
                      text-[13px]
                      text-[#078052]
                    "
                  >
                    {item?.goals ?? 0}
                  </strong>

                  <span
                    className="
                      mt-0.5
                      block
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[#8a96a5]
                    "
                  >
                    Goals
                  </span>
                </div>

                <div
                  className="
                    px-2
                    py-2.5
                    text-center
                  "
                >
                  <strong
                    className="
                      block
                      text-[13px]
                      text-[#718096]
                    "
                  >
                    {item?.assists ?? "—"}
                  </strong>

                  <span
                    className="
                      mt-0.5
                      block
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[#8a96a5]
                    "
                  >
                    Assists
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerCareerJourney;
