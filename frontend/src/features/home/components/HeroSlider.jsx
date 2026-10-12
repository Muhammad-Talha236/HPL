import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import heroImage from "../../../assets/hunza-football-hero.png";
import heroAlternateImage from "../../../assets/hunza-football-hero-alt.png";
import heroThirdImage from "../../../assets/hero.png";
import { FEATURES } from "../../../constants/features";

const heroSlides = [
  {
    image: heroImage,
    position: "object-center",
  },
  {
    image: heroAlternateImage,
    position: "object-center",
  },
  {
    image: heroThirdImage,
    position: "object-center",
  },
];

const ClubIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-9 w-9 text-[#76D68C]"
  >
    <path
      d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 19v-1.2A4.8 4.8 0 0 1 7.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V19M13 14.2a4.7 4.7 0 0 1 3-.9h.7a4.8 4.8 0 0 1 4.8 4.8V19"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-9 w-9 text-[#76D68C]"
  >
    <path
      d="M8 4h8v4a4 4 0 0 1-8 0V4Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v4M9 20h6M10 16h4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-9 w-9 text-[#76D68C]"
  >
    <circle
      cx="12"
      cy="7"
      r="3"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M5 20v-1.5A5.5 5.5 0 0 1 10.5 13h3a5.5 5.5 0 0 1 5.5 5.5V20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const PlayIcon = () => (
  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#0B5D46]">
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="ml-0.5 h-3 w-3"
    >
      <path d="M6.5 4.7a1 1 0 0 1 1.53-.85l7.1 4.45a1 1 0 0 1 0 1.7l-7.1 4.45a1 1 0 0 1-1.53-.85V4.7Z" />
    </svg>
  </span>
);

const ArrowIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    className="h-5 w-5"
  >
    <path
      d="M4 10h11M11 6l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HeroSlider = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveSlide(
        (current) => (current + 1) % heroSlides.length
      );
    }, 6500);

    return () => window.clearInterval(interval);
  }, []);

  const showSlide = (index) => {
    setActiveSlide(index);
  };

  return (
    <section
      className="
        relative isolate
        min-h-[760px]
        overflow-hidden
        bg-[#031B16]
        lg:min-h-[850px]
      "
    >
      {/* =========================
          BACKGROUND SLIDER
      ========================== */}

      {heroSlides.map((slide, index) => (
        <img
          key={slide.image}
          src={slide.image}
          alt=""
          aria-hidden="true"
          fetchPriority={index === 0 ? "high" : undefined}
          loading={index === 0 ? "eager" : "lazy"}
          className={`
            absolute inset-0
            h-full w-full
            object-cover
            ${slide.position}
            transition-all duration-[1200ms]
            motion-reduce:transition-none
            ${
              index === activeSlide
                ? "scale-100 opacity-100"
                : "scale-[1.035] opacity-0"
            }
          `}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Strong left readability gradient */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-[#001D17]/95
          via-[#002A20]/68
          to-[#001D17]/10
        "
      />

      {/* Bottom depth */}
      <div
        className="
          absolute inset-x-0 bottom-0
          h-[42%]
          bg-gradient-to-t
          from-[#001A14]/90
          via-[#001A14]/35
          to-transparent
        "
      />

      {/* Slight top overlay for navbar area */}
      <div
        className="
          absolute inset-x-0 top-0
          h-48
          bg-gradient-to-b
          from-black/25
          to-transparent
        "
      />

      {/* =========================
          HERO CONTENT
      ========================== */}

      <div
        className="
          relative z-10
          mx-auto flex
          min-h-[760px]
          max-w-[1500px]
          items-center
          px-5
          pb-24
          pt-40
          sm:px-8
          lg:min-h-[850px]
          lg:px-12
          lg:pb-28
          lg:pt-44
          xl:px-16
        "
      >
        <div className="w-full max-w-[760px]">
          {/* Eyebrow */}
          <p
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-[0.42em]
              text-white/80
              sm:text-xs
            "
          >
            Hunza Premier League
          </p>

          {/* Main heading */}
          <h1
  className="
    mt-5
    max-w-[700px]
    text-[42px]
    font-black
    leading-[1.02]
    tracking-[-0.04em]
    text-white
    sm:text-[50px]
    lg:text-[58px]
    xl:text-[64px]
  "
>
  Football

  <span className="mt-2 block">
    Beyond{" "}
    <span
      className="
        bg-gradient-to-r
        from-[#5CC978]
        to-[#92E59C]
        bg-clip-text
        text-transparent
      "
    >
      Boundaries
    </span>
  </span>
</h1>

          {/* Description */}
          <p
            className="
              mt-6
              max-w-[630px]
              text-base
              font-medium
              leading-7
              text-white/90
              sm:text-lg
              sm:leading-8
            "
          >
            Uniting talent, communities, and passion across Hunza
            and Gilgit through the power of football.
          </p>

          {/* =========================
              ACTION BUTTONS
          ========================== */}

          <div
            className="
              mt-8
              flex flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:gap-4
            "
          >
            <Link
              to="/competitions"
              className="
                inline-flex
                min-h-[56px]
                items-center
                justify-center
                gap-4
                rounded-full
                bg-[#36B963]
                px-7
                text-[15px]
                font-bold
                text-white
                shadow-[0_12px_30px_rgba(54,185,99,0.28)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[#2DA957]
                hover:shadow-[0_16px_34px_rgba(54,185,99,0.35)]
                focus:outline-none
                focus:ring-2
                focus:ring-[#74D88E]
                focus:ring-offset-2
                focus:ring-offset-[#05251D]
              "
            >
              Explore Tournaments
              <ArrowIcon />
            </Link>

            <Link
              to="/matches"
              className="
                inline-flex
                min-h-[56px]
                items-center
                justify-center
                gap-3
                rounded-full
                border border-white/80
                bg-black/10
                px-7
                text-[15px]
                font-bold
                text-white
                backdrop-blur-[2px]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-white
                hover:text-[#0B5D46]
                focus:outline-none
                focus:ring-2
                focus:ring-white
                focus:ring-offset-2
                focus:ring-offset-[#05251D]
              "
            >
              <PlayIcon />
              Watch Matches
            </Link>
          </div>

          {/* =========================
              STATS
          ========================== */}

          <div
            className="
              mt-14
              flex
              flex-wrap
              items-center
              gap-y-6
              sm:mt-16
            "
          >
            {FEATURES.CLUBS_ENABLED && <div className="flex min-w-[150px] items-center gap-3 pr-6">
              <ClubIcon />

              <div>
                <p className="text-2xl font-extrabold leading-none text-white">
                  20+
                </p>

                <p className="mt-1 text-sm text-white/80">
                  Clubs
                </p>
              </div>
            </div>}

            {FEATURES.CLUBS_ENABLED && <div
              className="
                hidden h-11 w-px
                bg-white/20
                sm:block
              "
            />}

            {/* Tournaments */}
            <div className="flex min-w-[180px] items-center gap-3 px-0 sm:px-7">
              <TrophyIcon />

              <div>
                <p className="text-2xl font-extrabold leading-none text-white">
                  5+
                </p>

                <p className="mt-1 text-sm text-white/80">
                  Tournaments
                </p>
              </div>
            </div>

            <div
              className="
                hidden h-11 w-px
                bg-white/20
                md:block
              "
            />

            {/* Players */}
            <div className="flex min-w-[170px] items-center gap-3 pl-0 md:pl-7">
              <PlayerIcon />

              <div>
                <p className="text-2xl font-extrabold leading-none text-white">
                  1000+
                </p>

                <p className="mt-1 text-sm text-white/80">
                  Players
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          SLIDER DOTS
      ========================== */}

      <div
        className="
          absolute
          bottom-8
          left-1/2
          z-20
          flex
          -translate-x-1/2
          items-center
          gap-2
        "
        aria-label="Hero image slider"
      >
        {heroSlides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => showSlide(index)}
            aria-label={`Show hero image ${index + 1}`}
            aria-current={
              index === activeSlide ? "true" : undefined
            }
            className={`
              h-2
              rounded-full
              transition-all
              duration-300
              focus:outline-none
              focus:ring-2
              focus:ring-white/70
              ${
                index === activeSlide
                  ? "w-8 bg-[#62CF7E]"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }
            `}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
