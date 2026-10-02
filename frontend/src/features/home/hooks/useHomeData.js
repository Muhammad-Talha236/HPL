import { useEffect, useState } from "react";

import {
  getCompetitions,
  getLatestNews,
  getLiveMatches,
  getRecentResults,
  getStandings,
  getUpcomingMatches,
} from "../services/homeService";

const loadingSection = { data: [], status: "loading" };

const getInitialState = () => ({
  liveMatch: { data: null, status: "loading" },
  results: loadingSection,
  upcoming: loadingSection,
  competition: { data: null, status: "loading" },
  standings: loadingSection,
  news: loadingSection,
});

const toSection = (result, transform = (data) => data) =>
  result.status === "fulfilled"
    ? { data: transform(result.value), status: "success" }
    : { data: [], status: "error" };

const selectFeaturedCompetition = (competitions) =>
  competitions.find((competition) => competition.status === "ACTIVE") ||
  competitions[0] ||
  null;

const useHomeData = () => {
  const [sections, setSections] = useState(getInitialState);

  useEffect(() => {
    let isCurrent = true;

    const loadHomeData = async () => {
      const [live, results, upcoming, competitions, news] =
        await Promise.allSettled([
          getLiveMatches(),
          getRecentResults(),
          getUpcomingMatches(),
          getCompetitions(),
          getLatestNews(),
        ]);

      if (!isCurrent) {
        return;
      }

      const featuredCompetition =
        competitions.status === "fulfilled"
          ? selectFeaturedCompetition(competitions.value)
          : null;

      setSections((previous) => ({
        ...previous,
        liveMatch:
          live.status === "fulfilled"
            ? { data: live.value[0] || null, status: "success" }
            : { data: null, status: "error" },
        results: toSection(results, (matches) =>
          [...matches].slice(-3).reverse()
        ),
        upcoming: toSection(upcoming),
        competition:
          competitions.status === "fulfilled"
            ? { data: featuredCompetition, status: "success" }
            : { data: null, status: "error" },
        news: toSection(news, (items) => items.slice(0, 3)),
      }));

      if (!featuredCompetition) {
        setSections((previous) => ({
          ...previous,
          standings: { data: [], status: "success" },
        }));
        return;
      }

      try {
        const standings = await getStandings(
          featuredCompetition.competition_id
        );

        if (isCurrent) {
          setSections((previous) => ({
            ...previous,
            standings: { data: standings.slice(0, 5), status: "success" },
          }));
        }
      } catch {
        if (isCurrent) {
          setSections((previous) => ({
            ...previous,
            standings: { data: [], status: "error" },
          }));
        }
      }
    };

    loadHomeData();

    return () => {
      isCurrent = false;
    };
  }, []);

  return sections;
};

export default useHomeData;
