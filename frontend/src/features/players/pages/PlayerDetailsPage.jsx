import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PlayerImage from "../components/PlayerImage";
import PlayerStatusBadge from "../components/PlayerStatusBadge";
import PositionBadge from "../components/PositionBadge";
import { getPlayerById, getPlayerMemberships } from "../services/playerService";
import { formatPlayerDate, getCurrentMemberships, getPlayerAge } from "../utils/playerFormatters";

const MembershipCard = ({ membership, isCurrent }) => (
  <Link to={`/teams/${membership.team_id}`} className="block rounded-lg border border-white/10 bg-[#0B1D2F] p-4 transition hover:border-[#EEC058]/45 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[#FF553D]/60">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="truncate text-sm font-extrabold text-white">{membership.team?.name || "Team"}</p><p className="mt-1 text-xs text-white/50">{isCurrent ? "Current team association" : "Past team association"}</p></div>
      {membership.jersey_number !== null && membership.jersey_number !== undefined && <span className="shrink-0 text-lg font-extrabold text-[#EEC058]">#{membership.jersey_number}</span>}
    </div>
    <p className="mt-4 text-xs text-white/50">Joined {formatPlayerDate(membership.joined_at)}{membership.left_at ? ` · Left ${formatPlayerDate(membership.left_at)}` : ""}</p>
  </Link>
);

const PlayerDetailsPage = () => {
  const { playerId } = useParams();
  const [playerState, setPlayerState] = useState({ data: null, status: "loading" });
  const [membershipsState, setMembershipsState] = useState({ data: [], status: "loading" });

  useEffect(() => {
    let isCurrent = true;

    const loadPlayer = async () => {
      try {
        const player = await getPlayerById(playerId);
        if (isCurrent) setPlayerState({ data: player, status: "success" });
      } catch (error) {
        if (isCurrent) setPlayerState({ data: null, status: error.response?.status === 404 || error.response?.status === 400 ? "notFound" : "error" });
        return;
      }

      try {
        const memberships = await getPlayerMemberships(playerId);
        if (isCurrent) setMembershipsState({ data: memberships, status: "success" });
      } catch {
        if (isCurrent) setMembershipsState({ data: [], status: "error" });
      }
    };

    loadPlayer();
    return () => { isCurrent = false; };
  }, [playerId]);

  const currentMemberships = useMemo(() => getCurrentMemberships(membershipsState.data), [membershipsState.data]);
  const formerMemberships = useMemo(() => membershipsState.data.filter((membership) => membership.status !== "ACTIVE"), [membershipsState.data]);

  if (playerState.status === "loading") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">Loading player profile…</div></main>;
  if (playerState.status === "notFound" || playerState.status === "error") return <main className="min-h-screen bg-[#011427] px-5 pb-20 pt-32 text-white sm:px-6"><div className="mx-auto max-w-7xl rounded-xl border border-white/10 bg-white/[0.03] p-8"><h1 className="text-2xl font-extrabold">Player unavailable</h1><p className="mt-3 text-sm text-white/60">{playerState.status === "notFound" ? "The requested player could not be found." : "Player details are unavailable right now."}</p><Link to="/players" className="mt-6 inline-flex text-sm font-bold text-[#EEC058] hover:text-[#ffad9f]">← BACK TO PLAYERS</Link></div></main>;

  const player = playerState.data;
  const age = getPlayerAge(player.date_of_birth);
  const information = [["POSITION", player.position], ["GENDER", player.gender], ["NATIONALITY", player.nationality], ["AGE", age !== null ? `${age} years` : null]];

  return <main className="min-h-screen bg-[#011427] pb-20 pt-32 text-white"><div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8"><Link to="/players" className="text-xs font-bold tracking-wide text-[#EEC058] hover:text-[#ffad9f]">← ALL PLAYERS</Link><section className="mt-6 overflow-hidden rounded-xl border border-[#EEC058]/25 bg-[linear-gradient(125deg,#17334a,#0B1D2F_60%,#07192a)]"><div className="grid lg:grid-cols-[minmax(260px,0.75fr)_1.25fr]"><PlayerImage player={player} size="hero" className="min-h-[280px] lg:min-h-[360px]" /><div className="flex flex-col justify-center p-6 sm:p-10"><div className="flex flex-wrap items-center gap-2"><PositionBadge position={player.position} /><PlayerStatusBadge status={player.status} /></div><h1 className="mt-5 text-4xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">{player.name}</h1><p className="mt-3 text-sm text-white/60">Hunza Premier League player profile</p>{currentMemberships.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{currentMemberships.map((membership) => <Link key={membership.team_player_id} to={`/teams/${membership.team_id}`} className="rounded-full border border-[#EEC058]/40 px-3 py-2 text-xs font-bold text-[#EEC058] transition hover:bg-[#EEC058] hover:text-[#011427]">{membership.team?.name || "View team"}{membership.jersey_number !== null && membership.jersey_number !== undefined ? ` · #${membership.jersey_number}` : ""}</Link>)}</div>}</div></div></section><section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">PLAYER INFORMATION</p><h2 className="mt-3 text-2xl font-extrabold">Football profile</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" /><dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">{information.filter(([, value]) => value).map(([label, value]) => <div key={label} className="bg-[#0B1D2F] p-5"><dt className="text-[10px] font-bold tracking-[0.14em] text-white/45">{label}</dt><dd className="mt-2 text-sm font-semibold text-white">{value}</dd></div>)}</dl></section><section className="mt-16"><p className="text-[11px] font-bold tracking-[0.18em] text-[#EEC058]">TEAM ASSOCIATIONS</p><h2 className="mt-3 text-2xl font-extrabold">Current teams</h2><span className="mt-3 block h-1 w-16 rounded-full bg-[#FF553D]" />{membershipsState.status === "loading" && <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">Loading team associations…</div>}{membershipsState.status === "error" && <div role="alert" className="mt-7 rounded-xl border border-red-400/25 bg-red-400/10 p-6 text-sm text-red-100">Team associations are unavailable right now.</div>}{membershipsState.status === "success" && currentMemberships.length === 0 && <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/55">No active team association is listed for this player.</div>}{membershipsState.status === "success" && currentMemberships.length > 0 && <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{currentMemberships.map((membership) => <MembershipCard key={membership.team_player_id} membership={membership} isCurrent />)}</div>}{membershipsState.status === "success" && formerMemberships.length > 0 && <><h3 className="mt-10 text-lg font-extrabold">Past associations</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{formerMemberships.map((membership) => <MembershipCard key={membership.team_player_id} membership={membership} />)}</div></>}</section></div></main>;
};

export default PlayerDetailsPage;
