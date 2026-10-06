import { useRef } from "react";

const moments = [
  {
    id: 1,
    title: "Match Day in Hunza",
    image: "/images/moments/moment-1.jpg",
    isNew: true,
  },
  {
    id: 2,
    title: "The Beautiful Game",
    image: "/images/moments/moment-2.jpg",
    isNew: true,
  },
  {
    id: 3,
    title: "Football Across the Valley",
    image: "/images/moments/moment-3.jpg",
    isNew: true,
  },
  {
    id: 4,
    title: "Passion on the Pitch",
    image: "/images/moments/moment-4.jpg",
    isNew: false,
  },
  {
    id: 5,
    title: "Hunza Football Moments",
    image: "/images/moments/moment-5.jpg",
    isNew: false,
  },
  {
    id: 6,
    title: "Game Day",
    image: "/images/moments/moment-6.jpg",
    isNew: false,
  },
];

const ArrowLeft = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-5 w-5"
  >
    <path
      d="m15 18-6-6 6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRight = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="h-5 w-5"
  >
    <path
      d="m9 18 6-6-6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HPLMoments = () => {
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;

    const amount = sliderRef.current.clientWidth * 0.75;

    sliderRef.current.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="hpl-moments"
      className="
        scroll-mt-24
        overflow-hidden
        bg-white
        px-5 py-10
        text-[#101828]
        sm:px-6 sm:py-12
        lg:px-8
      "
    >
      <div className="mx-auto max-w-[1320px]">
        {/* Heading */}
        <div
          className="
            mb-6 flex
            items-end justify-between
            gap-5
          "
        >
          <div>
            <h2
              className="
                text-2xl font-extrabold
                tracking-[-0.03em]
                text-[#101828]
                sm:text-3xl
              "
            >
              HPL{" "}
              <span className="text-[#087554]">
                Moments
              </span>
            </h2>

            <p className="mt-1 text-sm text-[#7A8580]">
              Memorable moments from football across Hunza.
            </p>
          </div>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollSlider("previous")}
              aria-label="Previous moments"
              className="
                grid h-11 w-11 place-items-center
                rounded-full
                border border-[#DDE4E0]
                bg-white
                text-[#69756F]
                transition
                hover:border-[#BFD2C8]
                hover:bg-[#F6F9F7]
                hover:text-[#087554]
                focus:outline-none
                focus:ring-2
                focus:ring-[#087554]/20
              "
            >
              <ArrowLeft />
            </button>

            <button
              type="button"
              onClick={() => scrollSlider("next")}
              aria-label="Next moments"
              className="
                grid h-11 w-11 place-items-center
                rounded-full
                bg-[#087554]
                text-white
                shadow-[0_5px_16px_rgba(8,117,84,0.18)]
                transition
                hover:bg-[#066448]
                focus:outline-none
                focus:ring-2
                focus:ring-[#087554]/25
              "
            >
              <ArrowRight />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={sliderRef}
          className="
            flex snap-x snap-mandatory
            gap-4
            overflow-x-auto
            pb-2
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {moments.map((moment) => (
            <article
              key={moment.id}
              className="
                group relative
                h-[360px]
                min-w-[82%]
                snap-start
                overflow-hidden
                rounded-[16px]
                bg-[#E8EEEB]
                sm:h-[390px]
                sm:min-w-[280px]
                lg:h-[420px]
                lg:min-w-[290px]
                xl:min-w-[300px]
              "
            >
              <img
                src={moment.image}
                alt={moment.title}
                className="
                  h-full w-full
                  object-cover
                  transition-transform
                  duration-500
                  group-hover:scale-[1.035]
                "
              />

              {/* Image gradient */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-t
                  from-black/80
                  via-black/10
                  to-transparent
                "
              />

              {/* NEW badge */}
              {moment.isNew && (
                <span
                  className="
                    absolute right-4 top-4
                    rounded-full
                    bg-white
                    px-3 py-1
                    text-[10px]
                    font-extrabold
                    uppercase
                    tracking-wide
                    text-[#101828]
                    shadow-sm
                  "
                >
                  New
                </span>
              )}

              {/* Bottom content */}
              <div
                className="
                  absolute inset-x-0 bottom-0
                  p-5
                  sm:p-6
                "
              >
                <p
                  className="
                    text-base font-bold
                    leading-snug text-white
                  "
                >
                  {moment.title}
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    font-bold uppercase
                    tracking-[0.14em]
                    text-white/60
                  "
                >
                  Hunza Premier League
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Mobile navigation */}
        <div className="mt-4 flex justify-end gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => scrollSlider("previous")}
            aria-label="Previous moments"
            className="
              grid h-10 w-10 place-items-center
              rounded-full
              border border-[#DDE4E0]
              bg-white
              text-[#69756F]
            "
          >
            <ArrowLeft />
          </button>

          <button
            type="button"
            onClick={() => scrollSlider("next")}
            aria-label="Next moments"
            className="
              grid h-10 w-10 place-items-center
              rounded-full
              bg-[#087554]
              text-white
            "
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HPLMoments;