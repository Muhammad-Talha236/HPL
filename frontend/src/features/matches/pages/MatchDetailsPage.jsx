import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import LiveMatchDetails from "../components/LiveMatchDetails";
import StandardMatchDetails from "../components/StandardMatchDetails";
import { getMatchById } from "../services/matchService";

const DetailsSkeleton = () => (
  <div className="animate-pulse"><div className="h-52 rounded-lg bg-[#19313c]" /><div className="mt-3 grid gap-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-72 rounded-lg bg-white" />)}</div></div>
);

const MatchDetailsPage = () => {
  const { matchId } = useParams();
  const validId = /^\d+$/.test(matchId || "");
  const [state, setState] = useState({ data: null, status: validId ? "loading" : "not-found" });
  const [reloadToken, setReloadToken] = useState(0);
  const isLive = state.data?.match?.status === "LIVE";

  useEffect(() => {
    if (!validId) return undefined;

    const controller = new AbortController();
    getMatchById(matchId, controller.signal)
      .then((data) => setState({ data, status: "success" }))
      .catch((error) => {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setState({ data: null, status: error.response?.status === 404 ? "not-found" : "error" });
        }
      });

    return () => controller.abort();
  }, [matchId, reloadToken, validId]);

  useEffect(() => {
    if (!validId || !isLive) return undefined;

    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      const controller = new AbortController();
      try {
        const data = await getMatchById(matchId, controller.signal);
        if (active) setState({ data, status: "success" });
      } catch {
        // Keep the last confirmed detail data visible during a transient poll failure.
      } finally {
        inFlight = false;
      }
    };

    const interval = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isLive, matchId, validId]);

  if (state.status === "loading") {
    return <main className="min-h-screen bg-[#f6f9f8] px-5 pb-12 pt-[76px] sm:px-7"><div className="mx-auto max-w-[1200px] pt-3"><DetailsSkeleton /></div></main>;
  }

  if (!validId || state.status === "not-found" || state.status === "error") {
    const missing = !validId || state.status === "not-found";
    return <main className="min-h-screen bg-[#f6f9f8] px-5 pb-12 pt-[100px] sm:px-7"><section className="mx-auto max-w-xl rounded-lg border border-[#e0e8e6] bg-white p-6 text-center"><h1 className="text-[20px] font-extrabold text-[#182842]">{missing ? "Match not found" : "Unable to load match"}</h1><p className="mt-2 text-[10px] text-[#708095]">{missing ? "This match may no longer be available." : "Please try again shortly."}</p>{!missing && <button type="button" onClick={() => setReloadToken((value) => value + 1)} className="mt-4 rounded bg-[#087d50] px-3 py-2 text-[9px] font-extrabold text-white">Try again</button>}<Link to="/matches" className="mt-4 block text-[10px] font-extrabold text-[#087d50]">Back to Matches</Link></section></main>;
  }

  const detail = state.data;
  const title = `${detail.home_team?.name || "Home Team"} vs ${detail.away_team?.name || "Away Team"}`;

  return (
    <main className="min-h-screen bg-[#f6f9f8] pb-8 pt-[76px] text-[#13223a]">
      <div className="mx-auto max-w-[1400px] px-4 pt-2 sm:px-6 lg:px-7">
        <nav aria-label="Breadcrumb" className="text-[9px] font-semibold text-[#526275]"><Link to="/" className="hover:text-[#087d50]">Home</Link><span className="mx-1.5 text-[#a2adba]">›</span><Link to="/matches" className="hover:text-[#087d50]">Matches</Link><span className="mx-1.5 text-[#a2adba]">›</span><span>{title}</span></nav>
        <div className="mt-1">{detail.match.status === "LIVE" ? <LiveMatchDetails detail={detail} /> : <StandardMatchDetails detail={detail} />}</div>
      </div>
    </main>
  );
};

export default MatchDetailsPage;
