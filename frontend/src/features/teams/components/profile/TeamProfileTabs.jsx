import {
  BarChart3,
  CalendarDays,
  Images,
  Shield,
  UserRoundCog,
  Users,
} from "lucide-react";

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: Shield,
  },
  {
    id: "squad",
    label: "Squad",
    icon: Users,
  },
  {
    id: "staff",
    label: "Staff",
    icon: UserRoundCog,
  },
  {
    id: "matches",
    label: "Matches",
    icon: CalendarDays,
  },
  {
    id: "statistics",
    label: "Statistics",
    icon: BarChart3,
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: Images,
  },
];

const TeamProfileTabs = ({
  activeTab,
  onChange,
}) => {
  return (
    <div
      className="
        relative
        z-30
        mx-auto
        -mt-[18px]
        w-full
        max-w-[1500px]
        px-5
        sm:px-7
        lg:px-10
      "
    >
      {/* ===================================================
          COMPACT TAB BAR
      ==================================================== */}

      <div
        className="
          inline-flex
          max-w-full
          items-center
          overflow-x-auto
          rounded-[14px]
          border
          border-white/10
          bg-[#061d29]/95
          p-[5px]
          shadow-[0_10px_28px_rgba(4,24,35,0.20)]
          backdrop-blur-md

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
          "
        >
          {tabs.map(
            ({
              id,
              label,
              icon: Icon,
            }) => {
              const active =
                activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onChange(id)
                  }
                  className={`
                    inline-flex
                    h-[42px]
                    cursor-pointer
                    items-center
                    justify-center
                    gap-2
                    rounded-[9px]
                    px-4
                    text-[11px]
                    font-semibold
                    transition-all
                    duration-200

                    sm:px-5

                    ${
                      active
                        ? `
                          bg-[#efb83f]
                          text-[#07182d]
                          shadow-[0_4px_12px_rgba(229,169,47,0.30)]
                        `
                        : `
                          text-white/80
                          hover:bg-white/[0.07]
                          hover:text-white
                        `
                    }
                  `}
                >
                  <Icon
                    size={14}
                    strokeWidth={
                      active ? 2.2 : 1.8
                    }
                    className="shrink-0"
                  />

                  <span>
                    {label}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamProfileTabs;