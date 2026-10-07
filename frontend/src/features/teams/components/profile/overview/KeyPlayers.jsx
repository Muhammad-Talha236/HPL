import { ArrowRight, UserRound } from "lucide-react";
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

  return teamPlayer?.position || player?.position || "PLAYER";
};

const getJerseyNumber = (teamPlayer, index) => {
  const player = getPlayer(teamPlayer);

  return (
    teamPlayer?.jersey_number ??
    teamPlayer?.jerseyNumber ??
    player?.jersey_number ??
    player?.jerseyNumber ??
    index + 1
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
  GK: "bg-[#7655e8] text-white",
  DF: "bg-[#ff7417] text-white",
  MF: "bg-[#258ee8] text-white",
  FW: "bg-[#dba72e] text-white",
  PL: "bg-[#718096] text-white",
};

/* =========================================================
   PLAYER CARD
========================================================= */

const KeyPlayerCard = ({ teamPlayer, index }) => {
  const navigate = useNavigate();

  const playerId = getPlayerId(teamPlayer);
  const playerName = getPlayerName(teamPlayer);
  const playerImage = getPlayerImage(teamPlayer);
  const position = getPosition(teamPlayer);
  const positionCode = normalizePosition(position);
  const jerseyNumber = getJerseyNumber(teamPlayer, index);

  const openPlayerProfile = () => {
    if (!playerId) return;

    navigate(`/players/${playerId}`);
  };

  const handleKeyDown = (event) => {
    if (!playerId) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPlayerProfile();
    }
  };

  return (
    <article
      onClick={openPlayerProfile}
      onKeyDown={handleKeyDown}
      role={playerId ? "link" : undefined}
      tabIndex={playerId ? 0 : -1}
      aria-label={
        playerId ? `Open ${playerName} profile` : undefined
      }
      className={`
        group
        min-w-0
        overflow-hidden
        rounded-lg
        border
        border-white/10
        bg-[#102f43]
        transition-all
        duration-200

        ${
          playerId
            ? `
              cursor-pointer
              hover:-translate-y-0.5
              hover:border-[#e4ad2e]/60
              hover:shadow-[0_8px_20px_rgba(0,0,0,0.20)]
              focus:outline-none
              focus:ring-2
              focus:ring-[#e4ad2e]
            `
            : "cursor-default"
        }
      `}
    >
      {/* PLAYER IMAGE AREA */}
      <div
        className="
          relative
          h-[112px]
          overflow-hidden
          bg-[linear-gradient(145deg,#183d53,#102d40)]
          sm:h-[118px]
          xl:h-[122px]
        "
      >
        {/* Jersey Number */}
        <span
          className="
            absolute
            left-3
            top-3
            z-10
            text-[19px]
            font-extrabold
            leading-none
            text-white
          "
        >
          {jerseyNumber}
        </span>

        {/* Position Badge */}
        <span
          className={`
            absolute
            right-3
            top-3
            z-10
            rounded-md
            px-2
            py-[4px]
            text-[9px]
            font-bold
            leading-none
            ${positionStyles[positionCode]}
          `}
        >
          {positionCode}
        </span>

        {/* Player Image */}
        {playerImage ? (
          <img
            src={playerImage}
            alt={playerName}
            className="
              h-full
              w-full
              object-contain
              object-bottom
              transition-transform
              duration-300
              group-hover:scale-[1.025]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              pt-3
            "
          >
            <div
              className="
                grid
                h-[68px]
                w-[68px]
                place-items-center
                rounded-full
                bg-white/10
                transition-colors
                group-hover:bg-white/[0.14]
              "
            >
              <UserRound
                size={34}
                strokeWidth={1.5}
                className="text-white/55"
              />
            </div>
          </div>
        )}
      </div>

      {/* PLAYER DETAILS */}
      <div
        className="
          border-t
          border-white/[0.05]
          bg-[#0c293c]
          px-3
          py-2.5
        "
      >
        <h3
          title={playerName}
          className="
            truncate
            text-[13px]
            font-bold
            leading-5
            text-white
            transition-colors
            group-hover:text-[#f1bc43]
          "
        >
          {playerName}
        </h3>

        <p
          title={position}
          className="
            mt-0.5
            truncate
            text-[9px]
            font-medium
            uppercase
            tracking-[0.04em]
            text-white/55
          "
        >
          🇵🇰 {position}
        </p>
      </div>
    </article>
  );
};

/* =========================================================
   KEY PLAYERS
========================================================= */

const KeyPlayers = ({ squadState, onViewAll }) => {
  /*
   * Overview par exactly 4 players.
   * Complete squad "View All Players" se open hogi.
   */
  const players =
    squadState?.status === "success"
      ? squadState.data.slice(0, 4)
      : [];

  return (
    <section
      className="
        overflow-hidden
        rounded-xl
        bg-[#061f30]
        px-5
        py-4
        shadow-[0_8px_24px_rgba(4,31,48,0.12)]
        sm:px-6
      "
    >
      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <div>
          <h2
            className="
              text-[18px]
              font-bold
              tracking-[-0.02em]
              text-white
              sm:text-[19px]
            "
          >
            Key Players
          </h2>

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

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="
              group/view
              inline-flex
              cursor-pointer
              items-center
              gap-1.5
              rounded-md
              px-2
              py-1.5
              text-[11px]
              font-semibold
              text-white/80
              transition-all
              duration-200
              hover:bg-white/[0.06]
              hover:text-[#f1bc43]
              focus:outline-none
              focus:ring-2
              focus:ring-[#e4ad2e]/70
              sm:text-[12px]
            "
          >
            View All Players

            <ArrowRight
              size={15}
              strokeWidth={1.8}
              className="
                transition-transform
                duration-200
                group-hover/view:translate-x-1
              "
            />
          </button>
        )}
      </div>

      {/* LOADING */}
      {squadState?.status === "loading" && (
        <div
          className="
            mt-3
            flex
            min-h-[140px]
            items-center
            justify-center
            text-[12px]
            text-white/55
          "
        >
          Loading players…
        </div>
      )}

      {/* ERROR */}
      {squadState?.status === "error" && (
        <div
          className="
            mt-3
            flex
            min-h-[140px]
            items-center
            justify-center
            text-[12px]
            text-red-200
          "
        >
          Squad information is unavailable.
        </div>
      )}

      {/* EMPTY */}
      {squadState?.status === "success" &&
        players.length === 0 && (
          <div
            className="
              mt-3
              flex
              min-h-[140px]
              items-center
              justify-center
              text-[12px]
              text-white/55
            "
          >
            No players are available yet.
          </div>
        )}

      {/* PLAYER GRID */}
      {squadState?.status === "success" &&
        players.length > 0 && (
          <div
            className="
              mt-3
              grid
              grid-cols-2
              gap-3
              md:grid-cols-4
            "
          >
            {players.map((teamPlayer, index) => (
              <KeyPlayerCard
                key={
                  teamPlayer?.team_player_id ||
                  teamPlayer?.player_id ||
                  getPlayerId(teamPlayer) ||
                  index
                }
                teamPlayer={teamPlayer}
                index={index}
              />
            ))}
          </div>
        )}
    </section>
  );
};

export default KeyPlayers;