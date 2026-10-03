import { Link } from "react-router-dom";

import useAuth from "../../../hooks/useAuth";
import useHomeData from "../hooks/useHomeData";

import FeaturedCompetition from "../components/FeaturedCompetition";
import HeroSlider from "../components/HeroSlider";
import HighlightsPanel from "../components/HighlightsPanel";
import NewsPreview from "../components/NewsPreview";
import PreviewState from "../components/PreviewState";
import ResultCard from "../components/ResultCard";
import SectionHeader from "../components/SectionHeader";
import StandingsPreview from "../components/StandingsPreview";
import UpcomingMatches from "../components/UpcomingMatches";

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

      <main className="bg-[#011427] pb-20 text-white">
        <section id="recent-results" className="scroll-mt-24 border-y border-[#FF553D]/25 bg-[linear-gradient(180deg,#07192a_0%,#0b1d2f_64%,#9f402d_100%)] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <SectionHeader title="RECENT RESULTS" description="The latest final scores from across the league." />
            {sections.results.status !== "success" || sections.results.data.length === 0 ? <PreviewState status={sections.results.status} emptyMessage="No recent results available." errorMessage="Recent results are unavailable right now." /> : <div className="grid gap-5 md:grid-cols-3">{sections.results.data.map((match) => <ResultCard key={match.match_id} match={match} />)}</div>}
          </div>
        </section>

        <section id="upcoming-matches" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <SectionHeader title="UPCOMING MATCHES" description="Plan ahead with the next scheduled HPL fixtures." />
            <UpcomingMatches section={sections.upcoming} />
          </div>
        </section>

        <section id="featured-competition" className="scroll-mt-24 bg-[#07192a] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <SectionHeader title="FEATURED COMPETITION" description="The competition currently shaping the HPL season." />
            <FeaturedCompetition section={sections.competition} />
          </div>
        </section>

        <section id="league-standings" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <SectionHeader title="LEAGUE STANDINGS" description="A focused look at the leading teams in the featured competition." />
            <StandingsPreview section={sections.standings} competitionId={sections.competition.data?.competition_id} />
          </div>
        </section>

        <section id="hpl-highlights" className="scroll-mt-24 border-y border-[#FF553D]/30 bg-[linear-gradient(180deg,#d06a3c_0%,#81352e_32%,#0b1d2f_100%)] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <SectionHeader title="HPL HIGHLIGHTS" description="The official media space for league moments." />
            <HighlightsPanel />
          </div>
        </section>

        <section id="latest-news" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <SectionHeader title="LATEST NEWS" description="Recent announcements and stories from the league." />
            <NewsPreview section={sections.news} />
            <div className="mt-7"><Link to="/news" className="inline-flex rounded-md border border-[#EEC058]/60 px-4 py-2 text-xs font-extrabold tracking-wide text-[#EEC058] transition hover:bg-[#EEC058] hover:text-[#011427] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">VIEW ALL NEWS</Link></div>
          </div>
        </section>

        <section className="px-5 pb-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-xl border border-[#FF553D]/30 bg-[linear-gradient(120deg,#162f46,#0b1d2f)] px-6 py-10 sm:px-10 sm:py-12">
            <p className="text-xs font-bold tracking-[0.18em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p>
            <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">FOLLOW THE LEAGUE. FOLLOW THE ACTION.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">Explore fixtures, standings and the latest updates from the heart of Hunza football.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href="#upcoming-matches" className="inline-flex items-center justify-center rounded-md bg-[#FF553D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e94a35] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">EXPLORE FIXTURES</a>{isAuthenticated ? <a href="#league-standings" className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">VIEW STANDINGS</a> : <Link to="/signup" className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">JOIN THE LEAGUE</Link>}</div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;

