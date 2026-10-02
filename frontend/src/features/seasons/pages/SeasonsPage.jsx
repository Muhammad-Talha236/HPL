import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SeasonCard from "../components/SeasonCard";
import SeasonSelector from "../components/SeasonSelector";
import { getSeasons } from "../services/seasonService";

const SeasonsPage = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({ data: [], status: "loading" });

  useEffect(() => {
    let isCurrent = true;

    const loadSeasons = async () => {
      try {
        const seasons = await getSeasons();

        if (isCurrent) {
          setState({ data: seasons, status: "success" });
        }
      } catch {
        if (isCurrent) {
          setState({ data: [], status: "error" });
        }
      }
    };

    loadSeasons();

    return () => {
      isCurrent = false;
    };
  }, []);

  const activeSeason = state.data.find(
    (season) => season.status === "ACTIVE"
  );
  const pastSeasons = state.data.filter(
    (season) => season.season_id !== activeSeason?.season_id
  );

  const handleSeasonChange = (event) => {
    navigate(`/seasons/${event.target.value}`);
  };

  return (
    <main className="min-h-screen bg-[#011427] pb-20 pt-32 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#EEC058]">
            HUNZA PREMIER LEAGUE
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            SEASONS
          </h1>
          <p className="mt-4 text-base leading-7 text-white/60">
            Explore HPL campaigns, their schedules and the competitions that shaped each season.
          </p>
        </header>

        {state.status === "loading" && (
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10 text-sm text-white/55">
            Loading HPL seasons…
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="mt-10 rounded-xl border border-red-400/25 bg-red-400/10 px-6 py-10 text-sm text-red-100">
            Seasons are unavailable right now. Please try again later.
          </div>
        )}

        {state.status === "success" && state.data.length === 0 && (
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10 text-sm text-white/55">
            No seasons are available yet.
          </div>
        )}

        {state.status === "success" && state.data.length > 0 && (
          <>
            <div className="mt-10">
              <SeasonSelector
                seasons={state.data}
                value={activeSeason?.season_id || state.data[0]?.season_id}
                onChange={handleSeasonChange}
              />
            </div>

            {activeSeason && (
              <section className="mt-12">
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">
                  CURRENT SEASON
                </p>
                <div className="mt-4 max-w-3xl">
                  <SeasonCard season={activeSeason} featured />
                </div>
              </section>
            )}

            {pastSeasons.length > 0 && (
              <section className="mt-16">
                <h2 className="text-2xl font-extrabold tracking-wide text-white">
                  {activeSeason ? "OTHER SEASONS" : "SEASONS"}
                </h2>
                <span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" />
                <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {pastSeasons.map((season) => (
                    <SeasonCard key={season.season_id} season={season} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default SeasonsPage;
