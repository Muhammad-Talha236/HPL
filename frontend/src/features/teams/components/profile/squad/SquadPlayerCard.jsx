import { UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   HELPERS
========================================================= */

const getPlayer = (teamPlayer) => {
  return teamPlayer?.player || teamPlayer?.Player || teamPlayer || {};
};

const getPlayerId = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    player?.player_id ||
    player?.id ||
    teamPlayer?.player_id ||
    teamPlayer?.playerId ||
    null
  );
};

const getPlayerName = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    player?.full_name ||
    player?.fullName ||
    player?.name ||
    teamPlayer?.player_name ||
    "Player"
  );
};

const getPlayerImage = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    player?.profile_image ||
    player?.profileImage ||
    player?.profile_picture ||
    player?.profilePicture ||
    player?.image ||
    player?.photo ||
    null
  );
};

const getPosition = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    teamPlayer?.position ||
    player?.position ||
    "PLAYER"
  );
};

const getJerseyNumber = (teamPlayer) => {
  const player = getPlayer(teamPlayer);

  return (
    teamPlayer?.jersey_number ??
    teamPlayer?.jerseyNumber ??
    player?.jersey_number ??
    player?.jerseyNumber ??
    "-"
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

/* =========================================================
   POSITION
========================================================= */

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

  return "PL";
};

const positionStyles = {
  GK: "bg-[#7c4dff] text-white",
  DF: "bg-[#ff6b18] text-white",
  MF: "bg-[#258ee8] text-white",
  FW: "bg-[#0aa55b] text-white",
  PL: "bg-[#64748b] text-white",
};

/* =========================================================
   COMPONENT
========================================================= */

const SquadPlayerCard = ({ teamPlayer }) => {
  const navigate = useNavigate();

  const playerId = getPlayerId(teamPlayer);
  const playerName = getPlayerName(teamPlayer);
  const playerImage = getPlayerImage(teamPlayer);
  const position = getPosition(teamPlayer);
  const positionCode = normalizePosition(position);
  const jerseyNumber = getJerseyNumber(teamPlayer);
  const nationality = getNationality(teamPlayer);

  const openPlayer = () => {
    if (!playerId) return;

    navigate(`/players/${playerId}`);
  };

  const handleKeyDown = (event) => {
    if (!playerId) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPlayer();
    }
  };

  return (
    <article
      onClick={openPlayer}
      onKeyDown={handleKeyDown}
      role={playerId ? "link" : undefined}
      tabIndex={playerId ? 0 : -1}
      aria-label={
        playerId
          ? `Open ${playerName} profile`
          : undefined
      }
      className={`
        group
        relative
        min-w-0
        overflow-hidden
        rounded-lg
        border
        border-[#e4ebe8]
        bg-white
        shadow-[0_3px_12px_rgba(15,23,42,0.035)]
        transition-all
        duration-200

        ${
          playerId
            ? `
              cursor-pointer
              hover:-translate-y-0.5
              hover:border-[#d8e3de]
              hover:shadow-[0_8px_22px_rgba(15,23,42,0.09)]
              focus:outline-none
              focus:ring-2
              focus:ring-[#078052]/30
            `
            : "cursor-default"
        }
      `}
    >
      {/* =================================================
          PLAYER VISUAL
      ================================================== */}

      <div
        className="
          relative
          h-[116px]
          overflow-hidden
          bg-[linear-gradient(145deg,#ffffff_0%,#f8faf9_55%,#f2f7f5_100%)]
          sm:h-[122px]
          xl:h-[128px]
        "
      >
        {/* Decorative shape */}

        <div
          className="
            pointer-events-none
            absolute
            -right-6
            -top-8
            h-24
            w-24
            rotate-12
            rounded-[28px]
            bg-[#e9b542]/[0.07]
          "
        />

        {/* Jersey */}

        <span
          className="
            absolute
            left-3
            top-3
            z-20
            text-[19px]
            font-extrabold
            leading-none
            tracking-[-0.04em]
            text-[#07182d]
          "
        >
          {jerseyNumber}
        </span>

        {/* Position */}

        <span
          className={`
            absolute
            right-2.5
            top-2.5
            z-20
            rounded
            px-2
            py-[4px]
            text-[8px]
            font-extrabold
            leading-none
            ${positionStyles[positionCode]}
          `}
        >
          {positionCode}
        </span>

        {/* Player */}

        {playerImage ? (
          <img
            src={playerImage}
            alt={playerName}
            className="
              absolute
              bottom-0
              left-1/2
              h-[108px]
              w-[90%]
              -translate-x-1/2
              object-contain
              object-bottom
              transition-transform
              duration-300
              group-hover:scale-[1.025]
              sm:h-[114px]
              xl:h-[120px]
            "
          />
        ) : (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              pt-4
            "
          >
            <div
              className="
                grid
                h-[66px]
                w-[66px]
                place-items-center
                rounded-full
                bg-[#e8f0ed]
                transition-colors
                group-hover:bg-[#deebe6]
              "
            >
              <UserRound
                size={32}
                strokeWidth={1.5}
                className="text-[#7b9189]"
              />
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          PLAYER INFO
      ================================================== */}

      <div className="border-t border-[#edf1ef] px-3 py-2.5">
        <h3
          title={playerName}
          className="
            truncate
            text-[12px]
            font-bold
            leading-[16px]
            text-[#07182d]
            transition-colors
            group-hover:text-[#078052]
            sm:text-[13px]
          "
        >
          {playerName}
        </h3>

        <div
          className="
            mt-1
            flex
            min-w-0
            items-center
            gap-1.5
          "
        >
          <span
            className="
              inline-flex
              h-[10px]
              w-[14px]
              shrink-0
              items-center
              justify-center
              rounded-[1px]
              bg-[#078052]
              text-[6px]
              leading-none
              text-white
            "
          >
            ★
          </span>

          <span
            title={nationality}
            className="
              truncate
              text-[9px]
              font-medium
              text-[#7d8b9d]
              sm:text-[10px]
            "
          >
            {nationality}
          </span>
        </div>
      </div>
    </article>
  );
};

export default SquadPlayerCard;