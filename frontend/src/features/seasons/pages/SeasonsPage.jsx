import { useEffect, useMemo, useState } from "react";

import FeaturedSeason from "../components/FeaturedSeason";
import SeasonCard from "../components/SeasonCard";
import SeasonsHero from "../components/SeasonsHero";
import SeasonsToolbar from "../components/SeasonsToolbar";
import { getSeasons } from "../services/seasonService";

const SeasonsPage = () => {
  const [state, setState] = useState({ data: [], status: "loading" });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    let isCurrent = true;

    getSeasons()
      .then((seasons) => {
        if (isCurrent) setState({ data: seasons, status: "success" });
      })
      .catch(() => {
        if (isCurrent) setState({ data: [], status: "error" });
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const activeSeason = state.data.find((season) => season.status === "ACTIVE");
  const visibleSeasons = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = state.data.filter((season) => !query || season.name.toLowerCase().includes(query));

    return [...filtered].sort((first, second) => {
      const firstDate = new Date(first.start_date).getTime() || 0;
      const secondDate = new Date(second.start_date).getTime() || 0;
      return sort === "latest" ? secondDate - firstDate : firstDate - secondDate;
    });
  }, [search, sort, state.data]);

  return (
    <main className="min-h-screen bg-[#f5f9f8] pb-14 pt-[76px] text-[#13223a]">
      <SeasonsHero />
      <div className="relative z-10 mx-auto -mt-[82px] w-full max-w-[1200px] px-5 sm:px-7 lg:px-8">
        {state.status === "loading" && <div className="h-[265px] animate-pulse rounded-lg border border-[#dfe9e4] bg-white shadow-[0_10px_30px_rgba(20,48,43,.07)]" />}
        {state.status === "error" && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">Seasons are unavailable right now. Please try again later.</div>}
        {state.status === "success" && <FeaturedSeason season={activeSeason} />}
      </div>

      {state.status === "success" && (
        <section className="mx-auto mt-10 w-full max-w-[1200px] px-5 sm:px-7 lg:px-8">
          <SeasonsToolbar search={search} sort={sort} onSearchChange={setSearch} onSortChange={setSort} />
          {!visibleSeasons.length ? (
            <div className="mt-5 rounded-lg border border-[#dfe9e4] bg-white p-6 text-sm text-[#66768a]">{state.data.length ? "No seasons match your search." : "No seasons are available yet."}</div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleSeasons.map((season) => <SeasonCard key={season.season_id} season={season} />)}
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default SeasonsPage;
