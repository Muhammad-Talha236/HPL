import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PlayerPreviewCard from "../components/PlayerPreviewCard";
import TeamLogo from "../components/TeamLogo";
import TeamMatchCard from "../components/TeamMatchCard";
import TeamStatusBadge from "../components/TeamStatusBadge";
import {
  getTeamById,
  getTeamRecentResults,
  getTeamSquad,
  getTeamUpcomingMatches,
} from "../services/teamService";
import { getTeamLocation } from "../utils/teamFormatters";

const SectionState = ({ status, empty, error, children }) => {
  if (status === "loading") return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">Loading…</div>;
  if (status === "error") return <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-6 text-sm text-red-100">{error}</div>;
  const content = Array.isArray(children)
    ? children
    : children?.props?.children;
  if (!content || content.length === 0) return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">{empty}</div>;
  return children;
};

const TeamDetailsPage = () => {
  const { teamId } = useParams();
  const [teamState, setTeamState] = useState({ data: null, status: "loading" });
  const [squadState, setSquadState] = useState({ data: [], status: "loading" });
  const [resultsState, setResultsState] = useState({ data: [], status: "loading" });
  const [upcomingState, setUpcomingState] = useState({ data: [], status: "loading" });

  useEffect(() => {
    let isCurrent = true;
    const setSection = (setter, result) => { if (isCurrent) setter(result); };
    const loadTeam = async () => {
      try { setSection(setTeamState, { data: await getTeamById(teamId), status: "success" }); } catch (error) { setSection(setTeamState, { data: null, status: error.response?.status === 404 ? "notFound" : "error" }); }
      const [squad, results, upcoming] = await Promise.allSettled([getTeamSquad(teamId), getTeamRecentResults(teamId), getTeamUpcomingMatches(teamId)]);
      setSection(setSquadState, squad.status === "fulfilled" ? { data: squad.value.slice(0, 6), status: "success" } : { data: [], status: "error" });
      setSection(setResultsState, results.status === "fulfilled" ? { data: results.value, status: "success" } : { data: [], status: "error" });
      setSection(setUpcomingState, upcoming.status === "fulfilled" ? { data: upcoming.value, status: "success" } : { data: [], status: "error" });
    };
    loadTeam();
    return () => { isCurrent = false; };
  }, [teamId]);

  if (teamState.status === "loading") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">Loading team profile…</div></main>;
  if (teamState.status === "notFound" || teamState.status === "error") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8"><h1 className="text-2xl font-extrabold">Team unavailable</h1><p className="mt-3 text-sm text-white/60">{teamState.status === "notFound" ? "The requested team could not be found." : "Team details are unavailable right now."}</p><Link to="/teams" className="mt-6 inline-flex text-sm font-bold text-[#EEC058] hover:text-[#ffad9f]">← BACK TO TEAMS</Link></div></main>;

  const team = teamState.data;
  const overview = [["CLUB", team.club?.name || "Not available"], ["LOCATION", getTeamLocation(team) || "Not available"], ["TEAM TYPE", team.team_type || "Not available"], ["HOME VENUE", team.home_venue?.name || "Not available"], ["GENDER", team.gender || "Not available"]];

  return <main className="min-h-screen bg-[#011427] pb-20 pt-32 text-white"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><Link to="/teams" className="text-xs font-bold tracking-wide text-[#EEC058] hover:text-[#ffad9f]">← ALL TEAMS</Link><section className="mt-6 rounded-xl border border-[#EEC058]/25 bg-[linear-gradient(135deg,#17334a,#0B1D2F)] p-6 sm:p-10"><div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"><TeamLogo logo={team.logo} name={team.name} size="lg" /><div><p className="text-[11px] font-bold tracking-[0.2em] text-[#EEC058]">HUNZA PREMIER LEAGUE TEAM</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{team.name}</h1><p className="mt-3 text-base text-white/65">{team.club?.name || "Club information unavailable"}</p><div className="mt-4"><TeamStatusBadge status={team.status} /></div></div></div></section><section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">TEAM OVERVIEW</p><h2 className="mt-3 text-2xl font-extrabold">About the team</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" />{team.description && <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65">{team.description}</p>}<dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">{overview.map(([label, value]) => <div key={label} className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-[0.14em] text-white/45">{label}</dt><dd className="mt-2 text-sm font-semibold text-white">{value}</dd></div>)}</dl></section><section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">SQUAD PREVIEW</p><h2 className="mt-3 text-2xl font-extrabold">Current squad</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7"><SectionState status={squadState.status} empty="No active squad members are available yet." error="Squad information is unavailable right now."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{squadState.data.map((teamPlayer) => <PlayerPreviewCard key={teamPlayer.team_player_id} teamPlayer={teamPlayer} />)}</div></SectionState></div></section><div className="mt-16 grid gap-12 lg:grid-cols-2"><section><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">RECENT RESULTS</p><h2 className="mt-3 text-2xl font-extrabold">Completed matches</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7 space-y-4"><SectionState status={resultsState.status} empty="No completed matches are available yet." error="Recent results are unavailable right now.">{resultsState.data.map((match) => <TeamMatchCard key={match.match_id} match={match} type="result" />)}</SectionState></div></section><section><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">UPCOMING FIXTURES</p><h2 className="mt-3 text-2xl font-extrabold">Next matches</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><div className="mt-7 space-y-4"><SectionState status={upcomingState.status} empty="No upcoming fixtures are scheduled." error="Upcoming fixtures are unavailable right now.">{upcomingState.data.map((match) => <TeamMatchCard key={match.match_id} match={match} type="upcoming" />)}</SectionState></div></section></div></div></main>;
};

export default TeamDetailsPage;
