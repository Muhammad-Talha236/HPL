import { useEffect, useState } from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import PlayerProfileHeader from "../components/profile/PlayerProfileHeader";
import PlayerCareerJourney from "../components/profile/PlayerCareerJourney";
import PlayerAchievements from "../components/profile/PlayerAchievements";
import PlayerPhotoGallery from "../components/profile/PlayerPhotoGallery";

import { getPlayerById } from "../services/playerService";

/* =========================================================
   PLAYER DETAILS PAGE
========================================================= */

const PlayerDetailsPage = () => {
  const { playerId } = useParams();

  /* =======================================================
     PLAYER STATE
  ======================================================= */

  const [playerState, setPlayerState] = useState({
    data: null,
    status: "loading",
  });

  /* =======================================================
     LOAD PLAYER
  ======================================================= */

  useEffect(() => {
    let active = true;

    const loadPlayer = async () => {
      setPlayerState({
        data: null,
        status: "loading",
      });

      try {
        const player = await getPlayerById(playerId);

        if (!active) return;

        if (!player) {
          setPlayerState({
            data: null,
            status: "notFound",
          });

          return;
        }

        setPlayerState({
          data: player,
          status: "success",
        });
      } catch (error) {
        if (!active) return;

        console.error("Failed to load player:", error);

        setPlayerState({
          data: null,
          status:
            error?.response?.status === 404
              ? "notFound"
              : "error",
        });
      }
    };

    loadPlayer();

    return () => {
      active = false;
    };
  }, [playerId]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (playerState.status === "loading") {
    return (
      <main className="min-h-screen bg-[#f5f8f7] pt-[76px]">
        <div
          className="
            mx-auto
            w-full
            max-w-[1500px]
            px-5
            py-10
            sm:px-7
            lg:px-10
          "
        >
          <div
            className="
              grid
              min-h-[430px]
              place-items-center
              rounded-2xl
              border
              border-[#e1e8e5]
              bg-white
              shadow-[0_6px_24px_rgba(15,23,42,0.04)]
            "
          >
            <div className="text-center">
              <div
                className="
                  mx-auto
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-[3px]
                  border-[#dfe8e4]
                  border-t-[#078052]
                "
              />

              <p
                className="
                  mt-4
                  text-[12px]
                  font-medium
                  text-[#718096]
                  sm:text-[13px]
                "
              >
                Loading player profile...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (
    playerState.status === "notFound" ||
    playerState.status === "error"
  ) {
    const isNotFound = playerState.status === "notFound";

    return (
      <main className="min-h-screen bg-[#f5f8f7] pt-[76px]">
        <div
          className="
            mx-auto
            w-full
            max-w-[1500px]
            px-5
            py-12
            sm:px-7
            lg:px-10
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-[#e1e8e5]
              bg-white
              p-8
              shadow-[0_6px_24px_rgba(15,23,42,0.04)]
            "
          >
            <h1
              className="
                text-[24px]
                font-extrabold
                tracking-[-0.03em]
                text-[#07182d]
                sm:text-[28px]
              "
            >
              Player unavailable
            </h1>

            <p
              className="
                mt-2
                max-w-[520px]
                text-[12px]
                leading-5
                text-[#718096]
                sm:text-[13px]
              "
            >
              {isNotFound
                ? "The requested player could not be found."
                : "Player information is unavailable right now. Please try again later."}
            </p>

            <Link
              to="/players"
              className="
                mt-6
                inline-flex
                cursor-pointer
                items-center
                rounded-lg
                bg-[#078052]
                px-4
                py-2.5
                text-[11px]
                font-bold
                text-white
                transition-colors
                hover:bg-[#056d46]
                sm:text-[12px]
              "
            >
              ← Back to Players
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PLAYER DATA
  ======================================================= */

  const player = playerState.data;

  const playerName =
    player?.name ||
    player?.full_name ||
    player?.fullName ||
    "Player";

  const career = Array.isArray(player?.career)
    ? player.career
    : [];

  const achievements = Array.isArray(player?.achievements)
    ? player.achievements
    : [];

  const gallery = Array.isArray(player?.gallery)
    ? player.gallery
    : [];

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-[#f5f8f7]
        pb-16
        pt-[76px]
        text-[#07182d]
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1500px]
          px-5
          pt-5
          sm:px-7
          sm:pt-6
          lg:px-10
        "
      >
        {/* =================================================
            BREADCRUMB
        ================================================== */}

        <nav
          aria-label="Breadcrumb"
          className="
            mb-4
            flex
            min-w-0
            items-center
            gap-2
            overflow-hidden
            text-[10px]
            font-medium
            text-[#718096]
            sm:text-[11px]
          "
        >
          <Link
            to="/"
            className="
              inline-flex
              shrink-0
              cursor-pointer
              items-center
              gap-1.5
              transition-colors
              duration-200
              hover:text-[#078052]
            "
          >
            <Home
              size={13}
              strokeWidth={1.8}
            />

            Home
          </Link>

          <ChevronRight
            size={12}
            strokeWidth={1.8}
            className="shrink-0 text-[#a0aab7]"
          />

          <Link
            to="/players"
            className="
              shrink-0
              cursor-pointer
              transition-colors
              duration-200
              hover:text-[#078052]
            "
          >
            Players
          </Link>

          <ChevronRight
            size={12}
            strokeWidth={1.8}
            className="shrink-0 text-[#a0aab7]"
          />

          <span
            className="
              truncate
              font-semibold
              text-[#25364d]
            "
          >
            {playerName}
          </span>
        </nav>

        {/* =================================================
            PLAYER PROFILE
        ================================================== */}

        <PlayerProfileHeader player={player} />

        {/* =================================================
            CAREER JOURNEY

            Backend already returns:
            player.career

            Component automatically hides if career is [].
        ================================================== */}

        <PlayerCareerJourney career={career} />

        {/* =================================================
            ACHIEVEMENTS

            Currently backend returns [].
            Component hides automatically.
        ================================================== */}

        <PlayerAchievements
          achievements={achievements}
        />

        {/* =================================================
            PHOTO GALLERY

            Currently backend returns [].
            Component hides automatically.
        ================================================== */}

        <PlayerPhotoGallery photos={gallery} />
      </div>
    </main>
  );
};

export default PlayerDetailsPage;