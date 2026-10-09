import { useState } from "react";
import { CalendarDays, MapPin, Trophy, X } from "lucide-react";
import { Link } from "react-router-dom";

import { completedSeasonGalleryImages } from "../../constants/seasonImages";
import { getSeasonTeamLogo } from "../../utils/seasonTeamLogo";
import SeasonDetailsNavigation from "./SeasonDetailsNavigation";
import {
  SeasonFixtures,
  SeasonStandings,
  SeasonTeams,
  SeasonVenues,
} from "./SeasonOverview";
import CompletedSeasonHero from "./CompletedSeasonHero";

const date = (value) => new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));

const ChampionCard = ({ champion }) => (
  <section className="relative min-h-[178px] overflow-hidden rounded-md bg-[#102022] text-white" style={{ backgroundImage: `linear-gradient(90deg,rgba(7,21,26,.9),rgba(7,21,26,.36)),url(${completedSeasonGalleryImages[0]})`, backgroundSize: "cover", backgroundPosition: "center" }}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_24%,rgba(244,194,79,.3),transparent_28%)]" />
    <div className="relative flex h-full min-h-[178px] flex-col items-center justify-center px-5 text-center">
      {champion ? <><Trophy size={23} className="text-[#f0c452]" /><p className="mt-2 text-[10px] font-extrabold tracking-[.14em] text-[#f0c452]">CHAMPION</p><Link to={`/teams/${champion.team_id}`} className="mt-2"><img src={getSeasonTeamLogo(champion.team)} alt="" className="mx-auto h-12 w-12 object-contain" /><h2 className="mt-1 text-xl font-extrabold tracking-[-.03em] text-white">{champion.team?.name}</h2></Link></> : <><Trophy size={28} className="text-[#f0c452]/75" /><p className="mt-3 text-sm font-extrabold">Champion not recorded</p><p className="mt-1 text-[10px] text-white/70">Finalized champion data is unavailable.</p></>}
    </div>
  </section>
);

const ClosingMatch = ({ match }) => (
  <section className="overflow-hidden rounded-md border border-[#e0e9e5] bg-white shadow-[0_3px_13px_rgba(18,48,41,.045)]"><div className="grid min-h-[178px] sm:grid-cols-[minmax(0,1fr)_145px]">{!match ? <div className="p-4"><h2 className="text-[12px] font-extrabold text-[#182940]">Season-closing Match</h2><p className="mt-5 rounded border border-dashed border-[#dce6e2] bg-[#fbfdfc] p-3 text-[10px] text-[#758397]">No completed season-closing match is available.</p></div> : <div className="p-4"><h2 className="text-[12px] font-extrabold text-[#182940]">Season-closing Match</h2><p className="mt-1 flex items-center gap-1 text-[9px] text-[#748397]"><CalendarDays size={11} />{date(match.match_date)}</p><div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center"><Link to={`/teams/${match.home_team_id}`} className="min-w-0"><img src={getSeasonTeamLogo(match.home_team)} alt="" className="mx-auto h-7 w-7 object-contain" /><span className="mt-1 block truncate text-[9px] font-bold text-[#26384e]">{match.home_team?.name}</span></Link><div><p className="text-xl font-extrabold text-[#17283f]">{match.home_score} - {match.away_score}</p><span className="text-[8px] font-extrabold text-[#10965f]">FT</span></div><Link to={`/teams/${match.away_team_id}`} className="min-w-0"><img src={getSeasonTeamLogo(match.away_team)} alt="" className="mx-auto h-7 w-7 object-contain" /><span className="mt-1 block truncate text-[9px] font-bold text-[#26384e]">{match.away_team?.name}</span></Link></div><p className="mt-3 flex items-center justify-center gap-1 text-[9px] text-[#738297]"><MapPin size={10} />{match.venue?.name || "Venue not listed"}</p><Link to={`/matches/${match.match_id}`} className="mt-3 flex items-center justify-center gap-1 rounded bg-[#172f58] py-1.5 text-[9px] font-extrabold text-white hover:bg-[#0d2246]">Match Details</Link></div>}<div className="hidden bg-[#dce8e7] sm:block" style={{ backgroundImage: `url(${completedSeasonGalleryImages[2]})`, backgroundSize: "cover", backgroundPosition: "center" }} /></div></section>
);

const PlayerLeaderboard = ({ scorers, appearances }) => {
  const [mode, setMode] = useState("scorers");
  const players = mode === "appearances" ? appearances : scorers;

  return <section className="rounded-md border border-[#e0e9e5] bg-white p-3 shadow-[0_3px_13px_rgba(18,48,41,.045)]"><h2 className="text-[12px] font-extrabold text-[#182940]">Top Players</h2><div className="mt-3 grid grid-cols-3 gap-1"><button type="button" onClick={() => setMode("scorers")} className={`rounded border px-1 py-1.5 text-[8px] font-bold ${mode === "scorers" ? "border-[#15a268] bg-[#edf9f2] text-[#087b4b]" : "border-transparent text-[#718095]"}`}>Top Scorers</button><button type="button" disabled title="Assists are not recorded in the current data model." className="cursor-not-allowed rounded px-1 py-1.5 text-[8px] font-bold text-[#a2aebb]">Top Assists</button><button type="button" onClick={() => setMode("appearances")} className={`rounded border px-1 py-1.5 text-[8px] font-bold ${mode === "appearances" ? "border-[#15a268] bg-[#edf9f2] text-[#087b4b]" : "border-transparent text-[#718095]"}`}>Appearances</button></div>{!players.length ? <p className="mt-4 rounded border border-dashed border-[#dce6e2] bg-[#fbfdfc] p-3 text-[10px] text-[#758397]">No completed-match player data is available.</p> : <ol className="mt-3 space-y-2.5">{players.map((player, index) => <li key={`${mode}-${player.player_id}-${player.team_id}`} className="grid grid-cols-[16px_25px_minmax(0,1fr)_auto] items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#f1c95e] text-[8px] font-extrabold text-[#4b3500]">{index + 1}</span>{player.profile_photo ? <img src={player.profile_photo} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e5f1eb] text-[9px] font-extrabold text-[#10965f]">{player.name?.slice(0, 1)}</span>}<Link to={`/players/${player.player_id}`} className="min-w-0"><strong className="block truncate text-[9px] text-[#26384e] hover:text-[#10965f]">{player.name}</strong><span className="block truncate text-[8px] text-[#7e8c9e]">{player.team_name}</span></Link><span className="text-right text-[9px] font-extrabold text-[#172a42]">{mode === "appearances" ? `${player.appearances} apps` : `${player.goals} goals`}</span></li>)}</ol>}</section>;
};

const SeasonGallery = ({ galleryRef }) => {
  const [open, setOpen] = useState(false);
  return <section ref={galleryRef} className="rounded-md border border-[#e0e9e5] bg-white p-3 shadow-[0_3px_13px_rgba(18,48,41,.045)]"><div className="flex items-center justify-between gap-3"><h2 className="text-[12px] font-extrabold text-[#182940]">Season Gallery</h2><button type="button" onClick={() => setOpen(true)} className="text-[9px] font-bold text-[#10965f] hover:underline">View All Photos</button></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{completedSeasonGalleryImages.map((image, index) => <button key={image} type="button" onClick={() => setOpen(true)} className="h-[72px] min-w-[118px] overflow-hidden rounded border border-[#e2eae7] sm:flex-1"><img src={image} alt={`Temporary season gallery placeholder ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div><p className="mt-2 text-[8px] text-[#8995a4]">Temporary decorative placeholders; official season photos are not available yet.</p>{open && <div role="dialog" aria-modal="true" aria-label="Season gallery" className="fixed inset-0 z-[70] grid place-items-center bg-[#061522]/80 p-5"><div className="relative max-h-[88vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-4"><button type="button" onClick={() => setOpen(false)} aria-label="Close gallery" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#10243a] text-white"><X size={16} /></button><h3 className="text-sm font-extrabold text-[#182940]">Season Gallery</h3><p className="mt-1 text-[10px] text-[#718095]">Temporary decorative placeholders.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{completedSeasonGalleryImages.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`Temporary season gallery placeholder ${index + 1}`} className="aspect-video w-full rounded-lg object-cover" />)}</div></div></div>}</section>;
};

const CompletedSeasonDetails = ({ season, metrics, champion, closingMatch, standings, competition, scorers, appearances, teams, venues, fixtures, activeSection, onChangeSection }) => {
  const galleryRef = { current: null };
  const scrollToGallery = () => document.getElementById("season-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const overview = <><div className="grid gap-3 lg:grid-cols-[.92fr_1.28fr]"><ChampionCard champion={champion} /><ClosingMatch match={closingMatch} /></div><div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(280px,.9fr)]"><SeasonStandings title="Final Standings" standings={standings} competition={competition} compact /><PlayerLeaderboard scorers={scorers} appearances={appearances} /></div><div id="season-gallery" className="mt-3"><SeasonGallery galleryRef={galleryRef} /></div></>;
  const sectionContent = { overview, standings: <SeasonStandings title="Final Standings" standings={standings} competition={competition} />, fixtures: <SeasonFixtures matches={fixtures} />, teams: <SeasonTeams teams={teams} seasonName={season.name} compact />, players: <PlayerLeaderboard scorers={scorers} appearances={appearances} />, venues: <SeasonVenues venues={venues} /> }[activeSection];

  return <main className="min-h-screen bg-[#f5f9f8] pb-12 pt-[76px] text-[#13223a]"><CompletedSeasonHero season={season} metrics={metrics} champion={champion} /><div className="relative z-10 mx-auto -mt-3 w-full max-w-[1200px] px-5 sm:px-7 lg:px-8"><SeasonDetailsNavigation activeSection={activeSection} onChange={onChangeSection} onHighlights={scrollToGallery} /><div className="mt-4">{sectionContent}</div></div></main>;
};

export default CompletedSeasonDetails;
