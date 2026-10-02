import { useEffect, useMemo, useState } from "react";

import PlayerCard from "../components/PlayerCard";
import PlayerCardSkeleton from "../components/PlayerCardSkeleton";
import { getPlayerDirectoryData } from "../services/playerService";
import { getCurrentMemberships, groupMembershipsByPlayer } from "../utils/playerFormatters";

const PlayersPage = () => {
  const [directoryState, setDirectoryState] = useState({
    players: [],
    memberships: [],
    status: "loading",
  });
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");

  const loadDirectory = async (showLoading = true) => {
    if (showLoading) {
      setDirectoryState((previous) => ({ ...previous, status: "loading" }));
    }

    try {
      const data = await getPlayerDirectoryData();
      setDirectoryState({ ...data, status: "success" });
    } catch {
      setDirectoryState({ players: [], memberships: [], status: "error" });
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadInitialDirectory = async () => {
      try {
        const data = await getPlayerDirectoryData();
        if (isCurrent) setDirectoryState({ ...data, status: "success" });
      } catch {
        if (isCurrent) {
          setDirectoryState({ players: [], memberships: [], status: "error" });
        }
      }
    };

    loadInitialDirectory();
    return () => {
      isCurrent = false;
    };
  }, []);

  const membershipsByPlayer = useMemo(
    () => groupMembershipsByPlayer(directoryState.memberships),
    [directoryState.memberships]
  );

  const teamOptions = useMemo(() => {
    const teams = new Map();
    directoryState.memberships.forEach((membership) => {
      if (membership.team?.name) teams.set(membership.team_id, membership.team.name);
    });
    return [...teams.entries()].sort(([, first], [, second]) => first.localeCompare(second));
  }, [directoryState.memberships]);

  const positionOptions = useMemo(
    () => [...new Set(directoryState.players.map((player) => player.position).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second)),
    [directoryState.players]
  );

  const visiblePlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return directoryState.players.filter((player) => {
      const currentMemberships = getCurrentMemberships(membershipsByPlayer[player.player_id]);
      const matchesSearch = !normalizedSearch || player.name.toLowerCase().includes(normalizedSearch);
      const matchesTeam = !selectedTeam || currentMemberships.some((membership) => String(membership.team_id) === selectedTeam);
      const matchesPosition = !selectedPosition || player.position === selectedPosition;
      return matchesSearch && matchesTeam && matchesPosition;
    });
  }, [directoryState.players, membershipsByPlayer, search, selectedPosition, selectedTeam]);

  return (
    <main className="min-h-screen bg-[#011427] pb-20 pt-20 text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#07192a,#10283d_55%,#011427)]">
        <div className="mx-auto max-w-7xl px-5 py-11 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-[11px] font-bold tracking-[0.22em] text-[#EEC058]">HUNZA PREMIER LEAGUE</p>
          <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight text-[#ffad9f] sm:text-5xl">MEET THE PLAYERS</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Discover the footballers competing across the Hunza Premier League.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8" aria-labelledby="players-directory-heading">
        <h2 id="players-directory-heading" className="sr-only">Players directory</h2>
        <div className="flex flex-col gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-center">
          <label htmlFor="player-search" className="sr-only">Search players</label>
          <input
            id="player-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players"
            className="h-11 w-full rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30 lg:max-w-sm"
          />
          <label htmlFor="player-team" className="sr-only">Filter by team</label>
          <select id="player-team" value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)} className="h-11 rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30">
            <option value="">All teams</option>
            {teamOptions.map(([teamId, name]) => <option key={teamId} value={teamId}>{name}</option>)}
          </select>
          <label htmlFor="player-position" className="sr-only">Filter by position</label>
          <select id="player-position" value={selectedPosition} onChange={(event) => setSelectedPosition(event.target.value)} className="h-11 rounded-md border border-white/15 bg-[#0B1D2F] px-3 text-sm text-white outline-none transition focus:border-[#FF553D] focus:ring-2 focus:ring-[#FF553D]/30">
            <option value="">All positions</option>
            {positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}
          </select>
          <p className="text-xs font-bold tracking-[0.14em] text-white/50 lg:ml-auto">
            {directoryState.status === "success" ? `${visiblePlayers.length} PLAYERS` : "PLAYERS"}
          </p>
        </div>

        {directoryState.status === "loading" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => <PlayerCardSkeleton key={index} />)}
          </div>
        )}

        {directoryState.status === "error" && (
          <div role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-6">
            <p className="text-sm text-red-100">Unable to load players right now.</p>
            <button type="button" onClick={() => loadDirectory()} className="mt-4 rounded-md border border-red-200/30 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-200/10 focus:outline-none focus:ring-2 focus:ring-[#FF553D]/50">TRY AGAIN</button>
          </div>
        )}

        {directoryState.status === "success" && visiblePlayers.length === 0 && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-8 text-sm text-white/55">
            {search || selectedTeam || selectedPosition ? "No players match these filters." : "No players are available yet."}
          </div>
        )}

        {directoryState.status === "success" && visiblePlayers.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visiblePlayers.map((player) => <PlayerCard key={player.player_id} player={player} memberships={membershipsByPlayer[player.player_id]} />)}
          </div>
        )}
      </section>
    </main>
  );
};

export default PlayersPage;
