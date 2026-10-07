import { useMemo, useState } from "react";

import SquadFilters from "./SquadFilters";
import SquadPlayerCard from "./SquadPlayerCard";

/* =========================================================
   HELPERS
========================================================= */

const getPlayer = (teamPlayer) => {
  return teamPlayer?.player || teamPlayer?.Player || teamPlayer || {};
};

const getPlayerName = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    player?.full_name ||
    player?.fullName ||
    player?.name ||
    teamPlayer?.player_name ||
    ""
  );
};

const getJerseyNumber = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    teamPlayer?.jersey_number ??
    teamPlayer?.jerseyNumber ??
    player?.jersey_number ??
    player?.jerseyNumber ??
    ""
  );
};

const getNationality = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    player?.nationality ||
    teamPlayer?.nationality ||
    "Pakistan"
  );
};

const getStatus = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return String(
    teamPlayer?.status ||
      player?.status ||
      "ACTIVE"
  ).toUpperCase();
};

const getPosition = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return String(
    teamPlayer?.position ||
      player?.position ||
      ""
  )
    .trim()
    .toUpperCase();
};

const normalizePosition = (position) => {
  const value = String(position || "")
    .trim()
    .toUpperCase();

  if (["GOALKEEPER", "GK"].includes(value)) {
    return "GK";
  }

  if (
    [
      "DEFENDER",
      "DF",
      "CB",
      "LB",
      "RB",
      "LWB",
      "RWB",
    ].includes(value)
  ) {
    return "DF";
  }

  if (
    [
      "MIDFIELDER",
      "MF",
      "CM",
      "CDM",
      "CAM",
      "DM",
      "AM",
      "LM",
      "RM",
    ].includes(value)
  ) {
    return "MF";
  }

  if (
    [
      "FORWARD",
      "FW",
      "ST",
      "CF",
      "LW",
      "RW",
    ].includes(value)
  ) {
    return "FW";
  }

  return "OTHER";
};

/* =========================================================
   CATEGORY BUTTON
========================================================= */

const CategoryButton = ({
  active,
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
        h-8
        cursor-pointer
        items-center
        justify-center
        gap-1
        whitespace-nowrap
        rounded-full
        border
        px-3.5
        text-[10px]
        font-semibold
        transition-all
        duration-200
        sm:text-[11px]

        ${
          active
            ? `
              border-[#e5ad31]
              bg-[#e5ad31]
              text-white
              shadow-[0_3px_9px_rgba(229,173,49,0.20)]
            `
            : `
              border-[#e1e8e5]
              bg-white
              text-[#65758b]
              hover:border-[#cbd9d3]
              hover:bg-[#f8faf9]
              hover:text-[#07182d]
            `
        }
      `}
    >
      {label}

      <span
        className={
          active
            ? "text-white/85"
            : "text-[#9aa5b3]"
        }
      >
        ({count})
      </span>
    </button>
  );
};

/* =========================================================
   TEAM SQUAD
========================================================= */

const TeamSquad = ({ squadState }) => {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
  const [nationality, setNationality] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [season, setSeason] = useState("2026");

  const squad =
    squadState?.status === "success"
      ? squadState.data || []
      : [];

  /* =======================================================
     COUNTS
  ======================================================== */

  const counts = useMemo(() => {
    return squad.reduce(
      (result, teamPlayer) => {
        const playerPosition = normalizePosition(
          getPosition(teamPlayer)
        );

        result.ALL += 1;

        if (playerPosition === "GK") {
          result.GK += 1;
        }

        if (playerPosition === "DF") {
          result.DF += 1;
        }

        if (playerPosition === "MF") {
          result.MF += 1;
        }

        if (playerPosition === "FW") {
          result.FW += 1;
        }

        return result;
      },
      {
        ALL: 0,
        GK: 0,
        DF: 0,
        MF: 0,
        FW: 0,
      }
    );
  }, [squad]);

  /* =======================================================
     NATIONALITIES
  ======================================================== */

  const nationalities = useMemo(() => {
    return [
      ...new Set(
        squad
          .map((teamPlayer) =>
            getNationality(teamPlayer)
          )
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [squad]);

  /* =======================================================
     FILTERED PLAYERS
  ======================================================== */

  const filteredPlayers = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return squad.filter((teamPlayer) => {
      const playerName =
        getPlayerName(teamPlayer).toLowerCase();

      const jerseyNumber = String(
        getJerseyNumber(teamPlayer)
      ).toLowerCase();

      const playerPosition = normalizePosition(
        getPosition(teamPlayer)
      );

      const playerNationality =
        getNationality(teamPlayer);

      const playerStatus =
        getStatus(teamPlayer);

      /* SEARCH */

      const matchesSearch =
        !searchValue ||
        playerName.includes(searchValue) ||
        jerseyNumber.includes(searchValue);

      /* POSITION */

      const matchesPosition =
        position === "ALL" ||
        playerPosition === position;

      /* NATIONALITY */

      const matchesNationality =
        nationality === "ALL" ||
        playerNationality === nationality;

      /* STATUS */

      const matchesStatus =
        status === "ALL" ||
        playerStatus === status;

      return (
        matchesSearch &&
        matchesPosition &&
        matchesNationality &&
        matchesStatus
      );
    });
  }, [
    squad,
    search,
    position,
    nationality,
    status,
  ]);

  /* =======================================================
     LOADING
  ======================================================== */

  if (squadState?.status === "loading") {
    return (
      <section className="px-1 py-2">
        <div
          className="
            flex
            min-h-[280px]
            items-center
            justify-center
            rounded-xl
            border
            border-[#e1e8e5]
            bg-white
            text-[13px]
            font-medium
            text-[#718096]
          "
        >
          Loading squad…
        </div>
      </section>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (squadState?.status === "error") {
    return (
      <section className="px-1 py-2">
        <div
          className="
            flex
            min-h-[280px]
            items-center
            justify-center
            rounded-xl
            border
            border-[#ead7d4]
            bg-white
            px-5
            text-center
            text-[13px]
            font-medium
            text-[#b4534b]
          "
        >
          Squad information is unavailable right now.
        </div>
      </section>
    );
  }

  /* =======================================================
     PAGE
  ======================================================== */

  return (
    <section className="w-full">
      {/* FILTERS */}

      <SquadFilters
        search={search}
        onSearchChange={setSearch}
        position={position}
        onPositionChange={setPosition}
        nationality={nationality}
        onNationalityChange={setNationality}
        status={status}
        onStatusChange={setStatus}
        season={season}
        onSeasonChange={setSeason}
        nationalities={nationalities}
        totalPlayers={squad.length}
      />

      {/* =================================================
          POSITION PILLS
      ================================================== */}

      <div
        className="
          mt-3
          flex
          flex-wrap
          items-center
          gap-2
        "
      >
        <CategoryButton
          label="All"
          count={counts.ALL}
          active={position === "ALL"}
          onClick={() => setPosition("ALL")}
        />

        <CategoryButton
          label="Goalkeepers"
          count={counts.GK}
          active={position === "GK"}
          onClick={() => setPosition("GK")}
        />

        <CategoryButton
          label="Defenders"
          count={counts.DF}
          active={position === "DF"}
          onClick={() => setPosition("DF")}
        />

        <CategoryButton
          label="Midfielders"
          count={counts.MF}
          active={position === "MF"}
          onClick={() => setPosition("MF")}
        />

        <CategoryButton
          label="Forwards"
          count={counts.FW}
          active={position === "FW"}
          onClick={() => setPosition("FW")}
        />
      </div>

      {/* =================================================
          EMPTY SQUAD
      ================================================== */}

      {squad.length === 0 && (
        <div
          className="
            mt-5
            flex
            min-h-[250px]
            items-center
            justify-center
            rounded-xl
            border
            border-dashed
            border-[#d9e3df]
            bg-[#fafcfb]
            px-5
            text-center
            text-[13px]
            text-[#718096]
          "
        >
          No players have been added to this squad yet.
        </div>
      )}

      {/* =================================================
          NO FILTER RESULTS
      ================================================== */}

      {squad.length > 0 &&
        filteredPlayers.length === 0 && (
          <div
            className="
              mt-5
              flex
              min-h-[220px]
              flex-col
              items-center
              justify-center
              rounded-xl
              border
              border-dashed
              border-[#d9e3df]
              bg-[#fafcfb]
              px-5
              text-center
            "
          >
            <h3
              className="
                text-[15px]
                font-bold
                text-[#07182d]
              "
            >
              No players found
            </h3>

            <p
              className="
                mt-1.5
                text-[12px]
                text-[#718096]
              "
            >
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPosition("ALL");
                setNationality("ALL");
                setStatus("ALL");
              }}
              className="
                mt-4
                cursor-pointer
                rounded-lg
                bg-[#078052]
                px-4
                py-2
                text-[11px]
                font-semibold
                text-white
                transition-colors
                hover:bg-[#056d46]
              "
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* =================================================
          PLAYER GRID
      ================================================== */}

      {filteredPlayers.length > 0 && (
        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            xl:grid-cols-6
          "
        >
          {filteredPlayers.map(
            (teamPlayer, index) => (
              <SquadPlayerCard
                key={
                  teamPlayer?.team_player_id ||
                  teamPlayer?.player_id ||
                  teamPlayer?.player?.player_id ||
                  index
                }
                teamPlayer={teamPlayer}
              />
            )
          )}
        </div>
      )}
    </section>
  );
};

export default TeamSquad;