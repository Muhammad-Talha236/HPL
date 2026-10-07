import {
  Award,
  Medal,
  Trophy,
} from "lucide-react";

/* =========================================================
   ACHIEVEMENT ITEM
========================================================= */

const AchievementItem = ({
  achievement,
}) => {
  const title =
    achievement?.title ||
    achievement?.name ||
    "Achievement";

  const year =
    achievement?.year ||
    achievement?.season ||
    null;

  const description =
    achievement?.description ||
    null;

  return (
    <div
      className="
        flex
        items-start
        gap-3
        rounded-md
        border
        border-[#edf1ef]
        bg-[#fafcfb]
        p-3
      "
    >
      {/* Trophy */}

      <div
        className="
          grid
          h-9
          w-9
          shrink-0
          place-items-center
          rounded-full
          bg-[#fff5dc]
          text-[#c98d20]
        "
      >
        <Trophy
          size={17}
          strokeWidth={1.8}
        />
      </div>

      {/* Information */}

      <div className="min-w-0">
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <h3
            className="
              text-[11px]
              font-extrabold
              text-[#07182d]
            "
          >
            {title}
          </h3>

          {year && (
            <span
              className="
                rounded-full
                bg-[#edf7f3]
                px-2
                py-0.5
                text-[8px]
                font-bold
                text-[#078052]
              "
            >
              {year}
            </span>
          )}
        </div>

        {description && (
          <p
            className="
              mt-1
              text-[9px]
              leading-4
              text-[#7a8799]
            "
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyAchievements = () => {
  return (
    <div
      className="
        flex
        min-h-[160px]
        flex-col
        items-center
        justify-center
        rounded-md
        bg-[#fafcfb]
        px-5
        text-center
      "
    >
      {/* Icon group */}

      <div className="relative">
        <div
          className="
            grid
            h-[54px]
            w-[54px]
            place-items-center
            rounded-full
            bg-[#fff5dc]
          "
        >
          <Trophy
            size={27}
            strokeWidth={1.7}
            className="text-[#c88e21]"
          />
        </div>

        <div
          className="
            absolute
            -right-2
            -top-1
            grid
            h-6
            w-6
            place-items-center
            rounded-full
            border-2
            border-white
            bg-[#078052]
          "
        >
          <Medal
            size={11}
            className="text-white"
          />
        </div>
      </div>

      <h3
        className="
          mt-3
          text-[11px]
          font-extrabold
          text-[#33425a]
        "
      >
        Building Our Legacy
      </h3>

      <p
        className="
          mt-1.5
          max-w-[190px]
          text-[9px]
          leading-4
          text-[#8490a2]
        "
      >
        Team achievements and titles
        will appear here as they are
        recorded.
      </p>
    </div>
  );
};

/* =========================================================
   ACHIEVEMENTS
========================================================= */

const Achievements = ({
  achievements = [],
}) => {
  const safeAchievements =
    Array.isArray(achievements)
      ? achievements
      : [];

  return (
    <section
      className="
        h-full
        rounded-lg
        border
        border-[#e1e8e5]
        bg-white
        p-4
        shadow-[0_3px_12px_rgba(15,23,42,0.035)]
      "
    >
      {/* =============================================
          HEADER
      ============================================== */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <h2
            className="
              text-[16px]
              font-extrabold
              tracking-[-0.02em]
              text-[#07182d]
            "
          >
            Achievements
          </h2>

          <span
            className="
              mt-2
              block
              h-[2px]
              w-7
              bg-[#e4a42b]
            "
          />
        </div>

        <Award
          size={18}
          strokeWidth={1.7}
          className="text-[#c9952d]"
        />
      </div>

      {/* =============================================
          ACHIEVEMENTS LIST
      ============================================== */}

      <div className="mt-3">
        {safeAchievements.length >
        0 ? (
          <div className="space-y-2">
            {safeAchievements
              .slice(0, 3)
              .map(
                (
                  achievement,
                  index
                ) => (
                  <AchievementItem
                    key={
                      achievement
                        ?.achievement_id ||
                      achievement?.id ||
                      `${achievement?.title}-${index}`
                    }
                    achievement={
                      achievement
                    }
                  />
                )
              )}
          </div>
        ) : (
          <EmptyAchievements />
        )}
      </div>
    </section>
  );
};

export default Achievements;