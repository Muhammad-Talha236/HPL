import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PreviewState from "./PreviewState";
import { formatMatchDate } from "../utils/homeFormatters";

const SLIDES = [
  "/images/competition/hunza-football-1.jpg",
  "/images/competition/hunza-football-2.jpg",
  "/images/competition/hunza-football-3.jpg",
];

const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="m15 18-6-6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="m9 18 6-6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle
      cx="9"
      cy="8"
      r="3"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M16 11a3 3 0 0 1 0 6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="M8 4h8v4a4 4 0 0 1-8 0V4Z"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 12v4M9 20h6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M7 3v4M17 3v4M3 10h18"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

const ShirtIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path
      d="m8 4-5 3 2 4 3-1v10h8V10l3 1 2-4-5-3a5 5 0 0 1-8 0Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const StatItem = ({ icon, value, label }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div
      className="
        grid h-9 w-9 shrink-0 place-items-center
        rounded-full bg-[#F1F6F3]
        text-[#718078]
      "
    >
      {icon}
    </div>

    <div className="min-w-0">
      <p className="truncate text-sm font-extrabold text-[#101828]">
        {value || "—"}
      </p>

      <p className="text-[10px] text-[#7A8580]">
        {label}
      </p>
    </div>
  </div>
);

const FeaturedCompetition = ({ section }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SLIDES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  if (section.status !== "success" || !section.data) {
    return (
      <PreviewState
        status={section.status}
        emptyMessage="No competition is available to feature yet."
        errorMessage="Competition details are unavailable right now."
      />
    );
  }

  const competition = section.data;

  const genderLabel =
    competition.gender === "WOMEN" ? "WOMEN'S" : "MEN'S";

  const seasonName =
    competition.season?.name || "HPL Season";

  const nextSlide = () => {
    setActiveSlide((current) => (current + 1) % SLIDES.length);
  };

  const previousSlide = () => {
    setActiveSlide(
      (current) => (current - 1 + SLIDES.length) % SLIDES.length
    );
  };

  return (
    <div
      className="
        grid gap-5
        lg:grid-cols-[1.08fr_0.92fr]
      "
    >
      {/* =====================================================
          LEFT — IMAGE SLIDER
      ===================================================== */}
      <div
        className="
          relative min-h-[330px]
          overflow-hidden rounded-[16px]
          bg-[#06392E]
          shadow-[0_8px_28px_rgba(15,23,42,0.10)]
          lg:min-h-[390px]
        "
      >
        {SLIDES.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            className={`
              absolute inset-0
              h-full w-full object-cover
              transition-opacity duration-700
              ${
                index === activeSlide
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          />
        ))}

        {/* image overlay */}
        <div
          className="
            absolute inset-0
            bg-[linear-gradient(180deg,rgba(1,20,16,0.04)_10%,rgba(1,20,16,0.12)_42%,rgba(1,27,22,0.90)_100%)]
          "
        />

        {/* previous */}
        <button
          type="button"
          onClick={previousSlide}
          aria-label="Previous image"
          className="
            absolute left-5 top-1/2 z-20
            grid h-10 w-10
            -translate-y-1/2
            place-items-center
            rounded-full
            bg-black/45 text-white
            backdrop-blur-sm
            transition
            hover:bg-black/65
          "
        >
          <ArrowLeft />
        </button>

        {/* next */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next image"
          className="
            absolute right-5 top-1/2 z-20
            grid h-10 w-10
            -translate-y-1/2
            place-items-center
            rounded-full
            bg-black/45 text-white
            backdrop-blur-sm
            transition
            hover:bg-black/65
          "
        >
          <ArrowRight />
        </button>

        {/* image content */}
        <div
          className="
            absolute bottom-0 left-0
            z-10 w-full
            p-7
          "
        >
          <span
            className="
              inline-flex rounded-full
              bg-white/90
              px-4 py-2
              text-[9px] font-extrabold
              tracking-[0.2em]
              text-[#116B50]
            "
          >
            HUNZA PREMIER LEAGUE
          </span>

          <h3
            className="
              mt-4 max-w-[500px]
              text-2xl font-black
              tracking-[-0.03em]
              text-white
              sm:text-[30px]
            "
          >
            {competition.name}
          </h3>

          <p className="mt-2 text-sm font-semibold text-white/80">
            {seasonName}
          </p>

          {competition.description && (
            <p
              className="
                mt-3 max-w-[500px]
                text-xs leading-5
                text-white/75
              "
            >
              {competition.description}
            </p>
          )}
        </div>

        {/* slider dots */}
        <div
          className="
            absolute bottom-5
            right-6 z-20
            flex items-center gap-2
          "
        >
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show image ${index + 1}`}
              className={`
                h-2 rounded-full
                transition-all duration-300
                ${
                  activeSlide === index
                    ? "w-6 bg-white"
                    : "w-2 bg-white/45 hover:bg-white/70"
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}
      <div className="flex flex-col gap-4">
        {/* MAIN DETAILS CARD */}
        <div
          className="
            flex-1 rounded-[16px]
            border border-[#E2E8E5]
            bg-white
            p-6
            shadow-[0_7px_24px_rgba(15,23,42,0.05)]
          "
        >
          {/* top */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="
                  text-[9px] font-extrabold
                  tracking-[0.2em]
                  text-[#087A55]
                "
              >
                {genderLabel}
              </p>

              <h3
                className="
                  mt-2 text-xl font-black
                  tracking-[-0.02em]
                  text-[#101828]
                  sm:text-2xl
                "
              >
                {competition.name}
              </h3>
            </div>

            <span
              className="
                inline-flex shrink-0
                items-center gap-2
                rounded-lg
                bg-[#EAF7F0]
                px-3 py-2
                text-[9px] font-extrabold
                tracking-[0.08em]
                text-[#128253]
              "
            >
              <span className="h-2 w-2 rounded-full bg-[#20B26B]" />

              {competition.status}
            </span>
          </div>

          {competition.description && (
            <p
              className="
                mt-3 text-xs
                leading-5 text-[#69756F]
              "
            >
              {competition.description}
            </p>
          )}

          {/* stats */}
          <div
            className="
              mt-5 grid gap-4
              border-y border-[#EDF1EF]
              py-4
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            <StatItem
              icon={<UsersIcon />}
              value={competition.max_teams}
              label="Max Teams"
            />

            <StatItem
              icon={<TrophyIcon />}
              value={competition.format}
              label="Format"
            />

            <StatItem
              icon={<CalendarIcon />}
              value={seasonName}
              label="Season"
            />

            <StatItem
              icon={<ShirtIcon />}
              value={competition.squad_size}
              label="Squad Size"
            />
          </div>

          {/* dates */}
          <div
            className="
              grid grid-cols-2 gap-6
              border-b border-[#EDF1EF]
              py-4
            "
          >
            <div>
              <p
                className="
                  text-[9px] font-bold
                  tracking-[0.14em]
                  text-[#98A2B3]
                "
              >
                STARTS
              </p>

              <p className="mt-1.5 text-xs font-bold text-[#17211D]">
                {formatMatchDate(
                  competition.competition_start_date
                )}
              </p>
            </div>

            <div>
              <p
                className="
                  text-[9px] font-bold
                  tracking-[0.14em]
                  text-[#98A2B3]
                "
              >
                ENDS
              </p>

              <p className="mt-1.5 text-xs font-bold text-[#17211D]">
                {formatMatchDate(
                  competition.competition_end_date
                )}
              </p>
            </div>
          </div>

          {/* bottom */}
          <div
            className="
              flex flex-col gap-4
              pt-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[9px] font-bold
                  tracking-[0.14em]
                  text-[#98A2B3]
                "
              >
                REGISTRATION
              </p>

              <p className="mt-1.5 text-xs font-semibold text-[#52615A]">
                {formatMatchDate(
                  competition.registration_start_date
                )}
                {" — "}
                {formatMatchDate(
                  competition.registration_end_date
                )}
              </p>
            </div>

            <Link
              to={`/competitions/${competition.competition_id}`}
              className="
                inline-flex items-center
                justify-center gap-3
                rounded-lg
                bg-[#087654]
                px-5 py-2.5
                text-xs font-extrabold
                text-white
                transition
                hover:bg-[#066347]
              "
            >
              View Competition
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* SECOND SEPARATE CARD */}
        <div
          className="
            flex items-center
            justify-between gap-4
            rounded-[16px]
            border border-[#E2E8E5]
            bg-white
            px-5 py-4
            shadow-[0_7px_24px_rgba(15,23,42,0.04)]
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                grid h-10 w-10
                place-items-center
                rounded-full
                bg-[#EAF8F1]
                text-[#07835B]
              "
            >
              <TrophyIcon />
            </div>

            <div>
              <p
                className="
                  text-[8px] font-extrabold
                  tracking-[0.18em]
                  text-[#07835B]
                "
              >
                FEATURED COMPETITION
              </p>

              <p className="mt-1 text-xs font-extrabold text-[#101828]">
                {seasonName}
              </p>
            </div>
          </div>

          <Link
            to={`/competitions/${competition.competition_id}`}
            className="
              flex shrink-0 items-center
              gap-2 text-[11px]
              font-bold text-[#087654]
              transition hover:text-[#054D38]
            "
          >
            Competition Details
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCompetition;