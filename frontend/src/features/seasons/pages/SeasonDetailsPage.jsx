import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SeasonStatusBadge from "../components/SeasonStatusBadge";
import {
  getSeasonById,
  getSeasonCompetitions,
} from "../services/seasonService";
import { formatSeasonRange } from "../utils/seasonFormatters";

const SeasonDetailsPage = () => {
  const { seasonId } = useParams();
  const [seasonState, setSeasonState] = useState({
    data: null,
    status: "loading",
  });
  const [competitionsState, setCompetitionsState] = useState({
    data: [],
    status: "loading",
  });

  useEffect(() => {
    let isCurrent = true;

    const loadSeason = async () => {
      try {
        const season = await getSeasonById(seasonId);

        if (isCurrent) {
          setSeasonState({ data: season, status: "success" });
        }
      } catch (error) {
        if (isCurrent) {
          setSeasonState({
            data: null,
            status: error.response?.status === 404 ? "notFound" : "error",
          });
        }
      }

      try {
        const competitions = await getSeasonCompetitions(seasonId);

        if (isCurrent) {
          setCompetitionsState({ data: competitions, status: "success" });
        }
      } catch {
        if (isCurrent) {
          setCompetitionsState({ data: [], status: "error" });
        }
      }
    };

    loadSeason();

    return () => {
      isCurrent = false;
    };
  }, [seasonId]);

  if (seasonState.status === "loading") {
    return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10 text-sm text-white/55">Loading season details…</div></main>;
  }

  if (seasonState.status === "notFound" || seasonState.status === "error") {
    const message = seasonState.status === "notFound" ? "The requested season could not be found." : "Season details are unavailable right now.";
    return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10"><h1 className="text-2xl font-extrabold">Season unavailable</h1><p className="mt-3 text-sm text-white/60">{message}</p><Link to="/seasons" className="mt-6 inline-flex text-sm font-bold text-[#EEC058] hover:text-[#ffad9f]">← BACK TO SEASONS</Link></div></main>;
  }

  const season = seasonState.data;

  return (
    <main className="min-h-screen bg-[#011427] pb-20 pt-32 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <Link to="/seasons" className="text-xs font-bold tracking-wide text-[#EEC058] transition hover:text-[#ffad9f]">← ALL SEASONS</Link>
        <section className="mt-6 overflow-hidden rounded-xl border border-[#EEC058]/25 bg-[linear-gradient(135deg,#17334a,#0B1D2F)] p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[11px] font-bold tracking-[0.2em] text-[#EEC058]">HUNZA PREMIER LEAGUE SEASON</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{season.name}</h1><p className="mt-4 text-base font-medium text-white/70">{formatSeasonRange(season.start_date, season.end_date)}</p></div><SeasonStatusBadge status={season.status} /></div>
          {season.description && <p className="mt-7 max-w-3xl text-sm leading-7 text-white/65">{season.description}</p>}
        </section>

        <section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">SEASON OVERVIEW</p><h2 className="mt-3 text-2xl font-extrabold">Competitions</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" />
          {competitionsState.status === "loading" && <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-8 text-sm text-white/55">Loading season competitions…</div>}
          {competitionsState.status === "error" && <div role="alert" className="mt-7 rounded-xl border border-red-400/25 bg-red-400/10 px-6 py-8 text-sm text-red-100">Competition information is unavailable right now.</div>}
          {competitionsState.status === "success" && competitionsState.data.length === 0 && <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-8 text-sm text-white/55">No competitions have been added to this season yet.</div>}
          {competitionsState.status === "success" && competitionsState.data.length > 0 && <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{competitionsState.data.map((competition) => <article key={competition.competition_id} className="rounded-xl border border-white/10 bg-[#0B1D2F] p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-[#EEC058]">{competition.status}</p><h3 className="mt-3 text-lg font-bold text-white">{competition.name}</h3><p className="mt-2 text-sm text-white/55">{competition.format}</p><p className="mt-4 text-xs text-white/45">{competition.max_teams ? `${competition.max_teams} teams` : "Team count to be confirmed"}</p></article>)}</div>}
        </section>
      </div>
    </main>
  );
};

export default SeasonDetailsPage;
