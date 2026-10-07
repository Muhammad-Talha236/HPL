import {
  BarChart3,
  Medal,
  Users,
} from "lucide-react";

/* =========================================================
   FEATURE ITEM
========================================================= */

const FeatureItem = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="
          grid
          h-9
          w-9
          shrink-0
          place-items-center
          rounded-full
          bg-[#b6812b]
          text-white
        "
      >
        <Icon size={17} strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <h4 className="text-[11px] font-extrabold text-[#07182d]">
          {title}
        </h4>

        <p className="mt-0.5 text-[9px] leading-4 text-[#7a8799]">
          {description}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   ABOUT TEAM
========================================================= */

const AboutTeam = ({ team }) => {
  const description =
    team?.description ||
    `${team?.name || "This team"} represents the footballing community of Hunza and competes with passion, discipline, and commitment in the Hunza Premier League.`;

  return (
    <section
      className="
        rounded-lg
        border
        border-[#e1e8e5]
        bg-white
        p-4
        shadow-[0_3px_12px_rgba(15,23,42,0.035)]
      "
    >
      {/* ================================================
          HEADING
      ================================================= */}

      <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[#07182d]">
        About the Team
      </h2>

      <span className="mt-2 block h-[2px] w-7 bg-[#e4a42b]" />

      {/* ================================================
          DESCRIPTION + QUOTE
      ================================================= */}

      <div
        className="
          mt-3
          grid
          gap-4
          lg:grid-cols-[minmax(0,1.45fr)_minmax(190px,0.75fr)]
        "
      >
        {/* Description */}

        <div className="min-w-0">
          <p className="text-[11px] leading-[1.7] text-[#64748b]">
            {description}
          </p>
        </div>

        {/* Quote */}

        <div
          className="
            relative
            min-h-[100px]
            rounded-md
            bg-[#f5f8f7]
            px-5
            pb-4
            pt-7
          "
        >
          <span
            className="
              absolute
              left-4
              top-1
              font-serif
              text-[38px]
              font-black
              leading-none
              text-[#8291a7]
            "
          >
            “
          </span>

          <p
            className="
              text-center
              text-[11px]
              italic
              leading-5
              text-[#53617a]
            "
          >
            United by passion,
            <br />
            stronger in every match.
          </p>

          <p
            className="
              mt-2
              text-right
              text-[9px]
              font-semibold
              text-[#758297]
            "
          >
            — {team?.name}
          </p>
        </div>
      </div>

      {/* ================================================
          VALUES
      ================================================= */}

      <div
        className="
          mt-4
          grid
          gap-4
          border-t
          border-[#edf1ef]
          pt-4
          sm:grid-cols-3
        "
      >
        <FeatureItem
          icon={Users}
          title="Community"
          description="Building local talent"
        />

        <FeatureItem
          icon={BarChart3}
          title="Development"
          description="Youth programs"
        />

        <FeatureItem
          icon={Medal}
          title="Excellence"
          description="Competing at highest level"
        />
      </div>
    </section>
  );
};

export default AboutTeam;