import { Shirt } from "lucide-react";

/* =========================================================
   SINGLE KIT
========================================================= */

const KitItem = ({
  label,
  type = "home",
}) => {
  const kitStyles = {
    home: {
      body: "bg-[#07182d]",
      accent: "bg-[#d79b28]",
    },

    away: {
      body: "bg-[#f3f4f6]",
      accent: "bg-[#d6d8dc]",
    },

    third: {
      body: "bg-[#123d31]",
      accent: "bg-[#285d4e]",
    },
  };

  const style =
    kitStyles[type] ||
    kitStyles.home;

  return (
    <div className="min-w-0 text-center">
      {/* =============================================
          KIT PREVIEW
      ============================================== */}

      <div
        className="
          relative
          mx-auto
          flex
          h-[78px]
          w-[68px]
          items-center
          justify-center
        "
      >
        <Shirt
          size={64}
          strokeWidth={1.15}
          className={
            type === "away"
              ? "fill-[#f3f4f6] text-[#cfd4da]"
              : type === "third"
                ? "fill-[#123d31] text-[#0d3026]"
                : "fill-[#07182d] text-[#07182d]"
          }
        />

        {/* Kit accent */}

        <span
          className={`
            absolute
            left-1/2
            top-[27px]
            h-[4px]
            w-[30px]
            -translate-x-1/2
            rotate-[-12deg]
            ${style.accent}
          `}
        />

        {/* Small crest */}

        <span
          className="
            absolute
            right-[16px]
            top-[23px]
            h-[6px]
            w-[6px]
            rounded-full
            bg-[#d7a12e]
          "
        />
      </div>

      <p className="mt-1 text-[10px] font-semibold text-[#24334a]">
        {label}
      </p>
    </div>
  );
};

/* =========================================================
   TEAM KIT
========================================================= */

const TeamKit = () => {
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
      {/* Heading */}

      <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[#07182d]">
        Team Kit
      </h2>

      <span className="mt-2 block h-[2px] w-7 bg-[#e4a42b]" />

      {/* Kits */}

      <div
        className="
          mt-3
          grid
          grid-cols-3
          items-end
          gap-2
        "
      >
        <KitItem
          label="Home"
          type="home"
        />

        <KitItem
          label="Away"
          type="away"
        />

        <KitItem
          label="Third"
          type="third"
        />
      </div>
    </section>
  );
};

export default TeamKit;