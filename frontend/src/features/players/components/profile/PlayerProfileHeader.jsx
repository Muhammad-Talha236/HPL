import {
  CalendarDays,
  Crown,
  Flag,
  Footprints,
  Ruler,
  Scale,
  Shield,
  Shirt,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import logo from "../../../../assets/logo.png";

/* =========================================================
   HELPERS
========================================================= */

const getPlayerName = (player) =>
  player?.full_name ||
  player?.fullName ||
  player?.name ||
  "Player";

const getPlayerImage = (player) =>
  player?.profile_image ||
  player?.profileImage ||
  player?.profile_picture ||
  player?.profilePicture ||
  player?.profile_photo ||
  player?.image ||
  player?.photo ||
  null;

const getJerseyNumber = (player) =>
  player?.jersey_number ??
  player?.jerseyNumber ??
  player?.team_player?.jersey_number ??
  player?.teamPlayer?.jersey_number ??
  null;

const getPosition = (player) =>
  player?.position ||
  player?.team_player?.position ||
  player?.teamPlayer?.position ||
  null;

const getNationality = (player) =>
  player?.nationality ||
  player?.country ||
  null;

const getDateOfBirth = (player) =>
  player?.date_of_birth ||
  player?.dateOfBirth ||
  player?.dob ||
  null;

const getHeight = (player) =>
  player?.height_cm ??
  player?.height ??
  null;

const getWeight = (player) =>
  player?.weight_kg ??
  player?.weight ??
  null;

const getPreferredFoot = (player) =>
  player?.preferred_foot ||
  player?.preferredFoot ||
  null;

const getBio = (player) =>
  player?.bio ||
  player?.description ||
  player?.about ||
  null;

const getCurrentTeam = (player) =>
  player?.current_team ||
  player?.currentTeam ||
  player?.team ||
  player?.Team ||
  player?.team_player?.team ||
  player?.teamPlayer?.team ||
  null;

const getTeamId = (team) =>
  team?.team_id ||
  team?.id ||
  null;

const getTeamName = (team) =>
  team?.name ||
  "Current Team";

const getTeamLogo = (team) =>
  team?.logo ||
  team?.logo_url ||
  team?.logoUrl ||
  null;

const isCaptain = (player) => {
  const value =
    player?.is_captain ??
    player?.isCaptain ??
    player?.team_player?.is_captain ??
    player?.teamPlayer?.isCaptain;

  return value === true;
};

/* =========================================================
   DATE
========================================================= */

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div
      className="
        flex
        min-h-[76px]
        min-w-0
        items-center
        gap-3
        border-r
        border-[#e8eeeb]
        px-4
        last:border-r-0
      "
    >
      <div
        className="
          grid
          h-9
          w-9
          shrink-0
          place-items-center
          rounded-lg
          bg-[#f2f7f5]
          text-[#07182d]
        "
      >
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-medium
            text-[#8591a1]
            xl:text-[10px]
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            truncate
            text-[11px]
            font-bold
            text-[#07182d]
            xl:text-[12px]
          "
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   PLAYER PROFILE HEADER
========================================================= */

const PlayerProfileHeader = ({
  player,
}) => {
  const playerName =
    getPlayerName(player);

  const playerImage =
    getPlayerImage(player);

  const jerseyNumber =
    getJerseyNumber(player);

  const position =
    getPosition(player);

  const nationality =
    getNationality(player);

  const dob =
    formatDate(
      getDateOfBirth(player)
    );

  const height =
    getHeight(player);

  const weight =
    getWeight(player);

  const preferredFoot =
    getPreferredFoot(player);

  const bio =
    getBio(player);

  const team =
    getCurrentTeam(player);

  const teamId =
    getTeamId(team);

  const teamName =
    getTeamName(team);

  const teamLogo =
    getTeamLogo(team);

  const captain =
    isCaptain(player);

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[#e1e8e5]
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.055)]
      "
    >
      <div
        className="
          grid
          min-h-[430px]
          lg:grid-cols-[330px_minmax(0,1fr)]
          xl:grid-cols-[360px_minmax(0,1fr)]
        "
      >
        {/* =================================================
            PLAYER IMAGE
        ================================================== */}

        <div
          className="
            relative
            min-h-[390px]
            overflow-hidden
            bg-[linear-gradient(145deg,#e9eeeb,#cfd9d4)]
            lg:min-h-full
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,.45),transparent_45%)]
            "
          />

          {jerseyNumber && (
            <span
              className="
                pointer-events-none
                absolute
                -bottom-5
                -right-2
                z-0
                text-[150px]
                font-black
                leading-none
                tracking-[-0.08em]
                text-white/20
              "
            >
              {jerseyNumber}
            </span>
          )}

          {playerImage ? (
            <img
              src={playerImage}
              alt={playerName}
              className="
                relative
                z-10
                h-full
                min-h-[390px]
                w-full
                object-cover
                object-top
              "
            />
          ) : (
            <div
              className="
                relative
                z-10
                flex
                h-full
                min-h-[390px]
                items-center
                justify-center
              "
            >
              <div
                className="
                  grid
                  h-28
                  w-28
                  place-items-center
                  rounded-full
                  bg-white/50
                "
              >
                <UserRound
                  size={58}
                  strokeWidth={1.2}
                  className="text-[#71877d]"
                />
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            PROFILE CONTENT
        ================================================== */}

        <div
          className="
            flex
            min-w-0
            flex-col
            p-5
            sm:p-6
            lg:p-7
          "
        >
          {/* ===============================================
              MAIN INFO
          ================================================ */}

          <div
            className="
              grid
              gap-5
              xl:grid-cols-[minmax(0,1fr)_190px]
            "
          >
            <div className="min-w-0">
              {/* NAME */}

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <h1
                  className="
                    text-[30px]
                    font-extrabold
                    leading-none
                    tracking-[-0.04em]
                    text-[#07182d]
                    sm:text-[34px]
                    xl:text-[38px]
                  "
                >
                  {playerName}
                </h1>

                {jerseyNumber && (
                  <span
                    className="
                      inline-flex
                      items-center
                      rounded-md
                      bg-[#efb83f]
                      px-3
                      py-1.5
                      text-[12px]
                      font-extrabold
                      text-[#07182d]
                    "
                  >
                    #{jerseyNumber}
                  </span>
                )}
              </div>

              {/* POSITION + COUNTRY */}

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-4
                "
              >
                {position && (
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[12px]
                      font-semibold
                      text-[#405069]
                    "
                  >
                    <span
                      className="
                        grid
                        h-7
                        w-7
                        place-items-center
                        rounded-md
                        bg-[#efb83f]
                        text-[#07182d]
                      "
                    >
                      <Shirt
                        size={14}
                        strokeWidth={2}
                      />
                    </span>

                    {position}
                  </div>
                )}

                {position &&
                  nationality && (
                    <span
                      className="
                        h-5
                        w-px
                        bg-[#e1e8e5]
                      "
                    />
                  )}

                {nationality && (
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-[12px]
                      font-semibold
                      text-[#405069]
                    "
                  >
                    <Flag
                      size={16}
                      strokeWidth={1.8}
                      className="text-[#078052]"
                    />

                    {nationality}
                  </div>
                )}
              </div>

              {/* CURRENT TEAM */}

              {team && (
                <div
                  className="
                    mt-7
                    inline-flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-[#e7edea]
                    bg-[#fbfcfc]
                    px-4
                    py-3
                  "
                >
                  <img
                    src={
                      teamLogo || logo
                    }
                    alt={teamName}
                    className="
                      h-12
                      w-12
                      object-contain
                    "
                    onError={(
                      event
                    ) => {
                      event.currentTarget.src =
                        logo;
                    }}
                  />

                  <div>
                    {teamId ? (
                      <Link
                        to={`/teams/${teamId}`}
                        className="
                          cursor-pointer
                          text-[14px]
                          font-bold
                          text-[#07182d]
                          transition-colors
                          hover:text-[#078052]
                        "
                      >
                        {teamName}
                      </Link>
                    ) : (
                      <p
                        className="
                          text-[14px]
                          font-bold
                          text-[#07182d]
                        "
                      >
                        {teamName}
                      </p>
                    )}

                    <p
                      className="
                        mt-0.5
                        text-[9px]
                        font-medium
                        text-[#8a96a5]
                      "
                    >
                      Current Team
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* =============================================
                RIGHT MINI CARDS
            ============================================== */}

            <div className="space-y-3">
              <div
                className="
                  rounded-xl
                  bg-[#f8faf9]
                  p-4
                "
              >
                <Shirt
                  size={20}
                  strokeWidth={1.8}
                  className="text-[#53647c]"
                />

                <strong
                  className="
                    mt-3
                    block
                    text-[22px]
                    font-extrabold
                    leading-none
                    text-[#07182d]
                  "
                >
                  {jerseyNumber ??
                    "—"}
                </strong>

                <span
                  className="
                    mt-1.5
                    block
                    text-[9px]
                    font-medium
                    text-[#8491a1]
                  "
                >
                  Jersey Number
                </span>
              </div>

              <div
                className="
                  rounded-xl
                  bg-[#f8faf9]
                  p-4
                "
              >
                <Crown
                  size={21}
                  strokeWidth={1.8}
                  className={
                    captain
                      ? "text-[#e5a329]"
                      : "text-[#8491a1]"
                  }
                />

                <strong
                  className="
                    mt-3
                    block
                    text-[13px]
                    font-bold
                    text-[#07182d]
                  "
                >
                  {captain
                    ? "Yes"
                    : "No"}
                </strong>

                <span
                  className="
                    mt-1
                    block
                    text-[9px]
                    font-medium
                    text-[#8491a1]
                  "
                >
                  Captain
                </span>
              </div>
            </div>
          </div>

          {/* ===============================================
              DETAILS
          ================================================ */}

          <div
            className="
              mt-6
              grid
              overflow-hidden
              rounded-xl
              border
              border-[#e7edea]
              bg-white
              sm:grid-cols-2
              xl:grid-cols-5
            "
          >
            <InfoItem
              icon={CalendarDays}
              label="Date of Birth"
              value={dob}
            />

            <InfoItem
              icon={Ruler}
              label="Height"
              value={
                height
                  ? `${height} cm`
                  : null
              }
            />

            <InfoItem
              icon={Scale}
              label="Weight"
              value={
                weight
                  ? `${weight} kg`
                  : null
              }
            />

            <InfoItem
              icon={Footprints}
              label="Preferred Foot"
              value={preferredFoot}
            />

            <InfoItem
              icon={Flag}
              label="Nationality"
              value={nationality}
            />
          </div>

          {/* ===============================================
              ABOUT
          ================================================ */}

          <div
            className="
              mt-5
              rounded-xl
              bg-[#f8faf9]
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2.5
              "
            >
              <UserRound
                size={18}
                strokeWidth={1.8}
                className="text-[#07182d]"
              />

              <h2
                className="
                  text-[16px]
                  font-bold
                  text-[#07182d]
                "
              >
                About
              </h2>
            </div>

            <p
              className="
                mt-3
                max-w-[900px]
                text-[11px]
                font-medium
                leading-[19px]
                text-[#65758b]
                xl:text-[12px]
              "
            >
              {bio ||
                "Player information has not been added yet."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlayerProfileHeader;