import { useEffect, useState } from "react";

import heroImage from "../../../assets/hunza-football-hero.png";
import heroAlternateImage from "../../../assets/hunza-football-hero-alt.png";

import LiveMatchCard from "./LiveMatchCard";

const heroSlides = [
  {
    description:
      "Football from the heart of Hunza. Follow every fixture, result and defining league moment.",
    image: heroImage,
    title: "HIGH-ALTITUDE\nINTENSITY",
  },
  {
    description:
      "The mountains set the stage. The league brings the action to every supporter.",
    image: heroAlternateImage,
    title: "THE LEAGUE\nAT ITS PEAK",
  },
];

const HeroSlider = ({ liveMatch, liveStatus, upcomingMatch }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const changeSlide = (direction) => {
    setActiveSlide((current) =>
      (current + direction + heroSlides.length) % heroSlides.length
    );
  };

  return (
    <section className="relative isolate min-h-[720px] overflow-hidden bg-[#011427]">
      {heroSlides.map((slide, index) => (
        <img
          key={slide.title}
          src={slide.image}
          alt="Football in the Hunza mountain landscape"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 motion-reduce:transition-none ${
            index === activeSlide ? "opacity-100" : "opacity-0"
          }`}
          fetchPriority={index === 0 ? "high" : undefined}
          loading={index === 0 ? "eager" : "lazy"}
          aria-hidden={index !== activeSlide}
        />
      ))}
      <div className="absolute inset-0 bg-[#011427]/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#011427]/95 via-[#011427]/60 to-[#011427]/15" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#011427] to-transparent" />

      <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-5 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="inline-flex rounded-full border border-[#ffad9f]/35 bg-[#011427]/70 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-[#ffad9f]">
            HUNZA PREMIER LEAGUE
          </p>
          <h1 className="mt-5 whitespace-pre-line text-4xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {heroSlides[activeSlide].title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/75 sm:text-lg">
            {heroSlides[activeSlide].description}
          </p>

          <LiveMatchCard
            match={liveMatch}
            upcomingMatch={upcomingMatch}
            status={liveStatus}
          />
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        <button
          type="button"
          onClick={() => changeSlide(-1)}
          aria-label="Show previous hero slide"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-[#011427]/70 text-lg text-white transition hover:border-white hover:bg-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]"
        >
          ‹
        </button>
        <div className="flex gap-2" aria-label="Hero slides">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              onClick={() => setActiveSlide(index)}
              className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#FF553D] ${
                index === activeSlide ? "w-7 bg-[#FF553D]" : "w-2.5 bg-white/55 hover:bg-white"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => changeSlide(1)}
          aria-label="Show next hero slide"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-[#011427]/70 text-lg text-white transition hover:border-white hover:bg-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default HeroSlider;
