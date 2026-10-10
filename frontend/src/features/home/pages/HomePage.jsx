import { Link } from "react-router-dom";

import useAuth from "../../../hooks/useAuth";
import useHomeData from "../hooks/useHomeData";
import LiveMatchCard from "../components/LiveMatchCard";
import HeroSlider from "../components/HeroSlider";
import NewsPreview from "../components/NewsPreview";
import PreviewState from "../components/PreviewState";
import ResultCard from "../components/ResultCard";
import UpcomingMatches from "../components/UpcomingMatches";
import HPLMoments from "../components/HPLMoments";
import FeaturedCompetition from "../components/FeaturedCompetition";
import AboutHPLSection from "../components/AboutHPLSection";
const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const sections = useHomeData();

  return (
    <>
      <HeroSlider
        liveMatch={sections.liveMatch.data}
        liveStatus={sections.liveMatch.status}
        upcomingMatch={sections.upcoming.data[0]}
      />
   {/* LIVE MATCH — centered exactly on Hero/White boundary */}
{sections.liveMatch.status === "loading" ||
sections.liveMatch.data ? (
  <section
    className="
      relative z-30
      h-0
      px-5
      sm:px-6
      lg:px-8
    "
  >
    <div
      className="
        absolute
        left-1/2
        top-0
        w-full
        -translate-x-1/2
        -translate-y-1/2
        px-5
        sm:px-6
        lg:px-8
      "
    >
      <LiveMatchCard
        match={sections.liveMatch.data}
        status={sections.liveMatch.status}
      />
    </div>
  </section>
) : null}
      <main className="bg-white text-[#101828]">
        <AboutHPLSection
          statistics={sections.statistics}
          hasLiveMatch={sections.liveMatch.status === "loading" || Boolean(sections.liveMatch.data)}
        />

        <HPLMoments />

        <section
  id="upcoming-matches"
 className="
  scroll-mt-24
  bg-[#F8FAF9]
  px-5
  pb-10
  pt-10
  text-[#101828]
  sm:px-6
  sm:pb-12
  sm:pt-12
  lg:px-8
"
>
  <div className="mx-auto max-w-[1320px]">
   
    <UpcomingMatches section={sections.upcoming} />
  </div>
</section>

<section
  id="recent-results"
  className="
    scroll-mt-24
    bg-white
    px-5
    py-10
    text-[#101828]
    sm:px-6
    lg:px-8
  "
>
  <div className="mx-auto max-w-[1320px]">
    {/* Header */}
    <div
      className="
        mb-6 flex flex-col gap-4
        sm:flex-row
        sm:items-end
        sm:justify-between
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
          Recent{" "}
          <span className="text-[#087554]">
            Results
          </span>
        </h2>

        <p className="mt-1 text-sm text-[#7A8580]">
          Latest match results from across all tournaments.
        </p>
      </div>

      <Link
        to="/matches"
        className="
          inline-flex w-fit
          items-center justify-center
          gap-3
          rounded-full
          border border-[#DFE5E2]
          bg-white
          px-5 py-2.5
          text-xs font-bold
          text-[#17211D]
          shadow-[0_3px_12px_rgba(15,23,42,0.04)]
          transition-all
          hover:border-[#BFD0C8]
          hover:bg-[#F8FAF9]
          focus:outline-none
          focus:ring-2
          focus:ring-[#087554]/15
        "
      >
        View All Results

        <span className="text-base text-[#087554]">
          →
        </span>
      </Link>
    </div>

    {/* Results */}
    {sections.results.status !== "success" ||
    sections.results.data.length === 0 ? (
      <PreviewState
        status={sections.results.status}
        emptyMessage="No recent results available."
        errorMessage="Recent results are unavailable right now."
      />
    ) : (
      <div className="space-y-2.5">
        {sections.results.data.slice(0, 4).map((match, index) => (
          <ResultCard
            key={match.match_id}
            match={match}
            index={index}
          />
        ))}
      </div>
    )}
  </div>
</section>
        
    <section
  id="featured-competition"
  className="
    scroll-mt-24
    bg-[#F8FAF9]
    px-5 py-10
    text-[#101828]
    sm:px-6 sm:py-12
    lg:px-8
  "
>
  <div className="mx-auto max-w-[1280px]">
    <div className="mb-6">
      <h2
        className="
          text-xl font-extrabold
          tracking-[-0.02em]
          text-[#101828]
          sm:text-2xl
        "
      >
        Featured Competition
      </h2>

      <p className="mt-1 text-sm text-[#7A8580]">
        Explore the competition currently shaping the HPL season.
      </p>
    </div>

    <FeaturedCompetition section={sections.competition} />
  </div>
</section>

       <section
  id="latest-news"
  className="
    scroll-mt-24
    bg-[#F8FAF9]
    px-5
    py-10
    text-[#101828]
    sm:px-6
    sm:py-12
    lg:px-8
  "
>
  <div className="mx-auto max-w-[1320px]">
    <NewsPreview section={sections.news} />
  </div>
</section>


      </main>
    </>
  );
};

export default HomePage;

