import {
  Award,
  Crown,
  Medal,
  Star,
  Trophy,
} from "lucide-react";

const iconMap = {
  trophy: Trophy,
  award: Award,
  medal: Medal,
  star: Star,
  captain: Crown,
};

const getTitle = (item) =>
  item?.title ||
  item?.name ||
  item?.achievement_name ||
  "Achievement";

const getCompetition = (item) =>
  item?.competition?.name ||
  item?.competition_name ||
  item?.Competition?.name ||
  null;

const getYear = (item) =>
  item?.year ||
  item?.season?.name ||
  item?.season_name ||
  null;

const getType = (item) => {
  const value = String(
    item?.type ||
      item?.achievement_type ||
      ""
  ).toLowerCase();

  if (value.includes("captain")) {
    return "captain";
  }

  if (value.includes("top")) {
    return "trophy";
  }

  if (value.includes("team")) {
    return "star";
  }

  if (
    value.includes("champion") ||
    value.includes("winner")
  ) {
    return "award";
  }

  return "medal";
};

const PlayerAchievements = ({
  achievements = [],
}) => {
  if (!achievements.length) {
    return null;
  }

  return (
    <section
      className="
        mt-5
        rounded-xl
        border
        border-[#e1e8e5]
        bg-white
        p-5
        shadow-[0_3px_14px_rgba(15,23,42,0.03)]
      "
    >
      {/* HEADER */}

      <div className="flex items-center gap-2.5">
        <Trophy
          size={18}
          strokeWidth={1.8}
          className="text-[#07182d]"
        />

        <h2 className="text-[16px] font-bold text-[#07182d] xl:text-[17px]">
          Achievements
        </h2>
      </div>

      {/* CARDS */}

      <div
        className="
          mt-4
          grid
          gap-3
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {achievements.map((item, index) => {
          const Icon =
            iconMap[getType(item)] ||
            Medal;

          return (
            <article
              key={
                item?.achievement_id ||
                item?.id ||
                index
              }
              className="
                flex
                min-h-[100px]
                items-center
                gap-4
                rounded-xl
                border
                border-[#e5ebe8]
                bg-white
                px-4
                py-3.5
                transition-all
                duration-200
                hover:border-[#e3c878]
                hover:shadow-[0_7px_18px_rgba(15,23,42,0.06)]
              "
            >
              <div
                className="
                  grid
                  h-11
                  w-11
                  shrink-0
                  place-items-center
                  rounded-xl
                  bg-[#fff8e8]
                  text-[#e5a329]
                "
              >
                <Icon
                  size={23}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                {getCompetition(item) && (
                  <p
                    className="
                      truncate
                      text-[9px]
                      font-medium
                      text-[#8491a1]
                      xl:text-[10px]
                    "
                  >
                    {getCompetition(item)}
                  </p>
                )}

                <h3
                  className="
                    mt-0.5
                    line-clamp-2
                    text-[12px]
                    font-bold
                    leading-[17px]
                    text-[#07182d]
                    xl:text-[13px]
                  "
                >
                  {getTitle(item)}
                </h3>

                {getYear(item) && (
                  <p
                    className="
                      mt-1
                      text-[9px]
                      font-semibold
                      text-[#718096]
                      xl:text-[10px]
                    "
                  >
                    {getYear(item)}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerAchievements;